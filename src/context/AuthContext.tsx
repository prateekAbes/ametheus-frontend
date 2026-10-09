import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { useAuth, useUser } from '@clerk/react'
import { setAuthTokenGetter, setAuthUserEmailGetter, resolveMediaUrl } from '../services/apiClient'
import { syncUser, getCurrentUserProfile, UserProfile } from '../services/auth'

export type CanonicalRole = 'PLAYER' | 'ORGANIZER' | 'SUPER_ADMIN'

/**
 * Normalizes role across backend MongoDB documents, Clerk metadata, and session tokens.
 * Handles case variations, underscores, and legacy aliases.
 */
export function normalizeRole(rawRole: any, email?: string): CanonicalRole {
  const cleanEmail = (email || '').trim().toLowerCase()
  if (cleanEmail === 'admin@ametheus.gg' || cleanEmail === 'pk.4081988@gmail.com') {
    return 'SUPER_ADMIN'
  }
  if (!rawRole) return 'PLAYER'

  const r = String(rawRole).trim().toLowerCase().replace(/[\s\-_]/g, '')
  if (r === 'superadmin' || r === 'admin' || r === 'root') {
    return 'SUPER_ADMIN'
  }
  if (
    r === 'organizer' ||
    r === 'tournamentadmin' ||
    r === 'matcharbiter' ||
    r === 'communitymoderator' ||
    r === 'moderator'
  ) {
    return 'ORGANIZER'
  }
  return 'PLAYER'
}

interface AuthContextValue {
  profile: UserProfile | null
  role: CanonicalRole
  displayName: string
  avatarUrl: string
  isLoading: boolean
  isSignedIn: boolean
  isPlayer: boolean
  isOrganizer: boolean
  isSuperAdmin: boolean
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  profile: null,
  role: 'PLAYER',
  displayName: 'Contender',
  avatarUrl: '',
  isLoading: true,
  isSignedIn: false,
  isPlayer: false,
  isOrganizer: false,
  isSuperAdmin: false,
  refreshProfile: async () => {},
})

export function useAuthContext() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { getToken, isSignedIn: clerkSignedIn, isLoaded: isAuthLoaded } = useAuth()
  const { user, isLoaded: isUserLoaded } = useUser()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isSyncingRef = React.useRef(false)
  const syncedUserIdRef = React.useRef<string | null>(null)

  // Register getters synchronously on every render so child components that make API
  // calls on mount have immediate access to tokens without waiting for parent useEffect
  setAuthTokenGetter(async (options?: { skipCache?: boolean }) => {
    if (!clerkSignedIn) return null
    try {
      return await getToken(options)
    } catch {
      return null
    }
  })

  if (user?.primaryEmailAddress?.emailAddress) {
    setAuthUserEmailGetter(() => user.primaryEmailAddress?.emailAddress || null)
  } else {
    setAuthUserEmailGetter(null)
  }

  // Also maintain useEffect registrations for reactive updates
  useEffect(() => {
    setAuthTokenGetter(async (options?: { skipCache?: boolean }) => {
      if (!clerkSignedIn) return null
      try {
        return await getToken(options)
      } catch {
        return null
      }
    })
  }, [clerkSignedIn, getToken])

  useEffect(() => {
    if (user?.primaryEmailAddress?.emailAddress) {
      setAuthUserEmailGetter(() => user.primaryEmailAddress?.emailAddress || null)
    } else {
      setAuthUserEmailGetter(null)
    }
  }, [user?.primaryEmailAddress?.emailAddress])

  const loadProfile = useCallback(
    async (forceSync = false) => {
      // Wait until Clerk auth state is fully resolved
      if (!isAuthLoaded || !isUserLoaded) return

      // 1. Not signed in with Clerk: clear profile
      if (!clerkSignedIn || !user) {
        syncedUserIdRef.current = null
        isSyncingRef.current = false
        setProfile(null)
        setIsLoading(false)
        return
      }

      // If already synced this specific user and not forcing, skip duplicate network call
      if (syncedUserIdRef.current === user.id && !forceSync && profile) {
        setIsLoading(false)
        return
      }

      // If a sync is already in-flight and not forcing, skip duplicate call
      if (isSyncingRef.current && !forceSync) {
        return
      }

      isSyncingRef.current = true

      try {
        const storageKey = `ametheus_user_profile_${user.id}`
        const userEmail =
          user.primaryEmailAddress?.emailAddress ||
          user.emailAddresses?.[0]?.emailAddress ||
          `${user.id}@ametheus.gg`
        const clerkUsername = user.username?.trim() || ''
        const metadataUsername =
          ((user.unsafeMetadata as any)?.username as string)?.trim() ||
          ((user.publicMetadata as any)?.username as string)?.trim() ||
          ''
        // Canonical username resolution: prioritize dedicated Clerk username, then metadata username.
        // Under no circumstances fall back to firstName, email prefix, or user ID!
        const canonicalUsername = clerkUsername || metadataUsername || ''
        const hasChosenUsername =
          Boolean(clerkUsername) ||
          Boolean(metadataUsername) ||
          Boolean((user.unsafeMetadata as any)?.has_chosen_username) ||
          Boolean((user.publicMetadata as any)?.has_chosen_username)
        const username = canonicalUsername
        const displayName =
          user.fullName?.trim() ||
          canonicalUsername ||
          user.firstName?.trim() ||
          'Contender'
        const avatarUrl = user.imageUrl

        // Metadata-indicated role (if set on Clerk user)
        const metadataRole =
          (user.publicMetadata as any)?.role ||
          (user.unsafeMetadata as any)?.role ||
          undefined

        // 2. Initial warm cache read (optimistic display while verifying authoritatively)
        try {
          const cached = localStorage.getItem(storageKey)
          if (cached) {
            const parsed = JSON.parse(cached)
            if (
              parsed &&
              (parsed.id === user.id ||
                parsed.clerk_user_id === user.id ||
                parsed.email?.toLowerCase() === userEmail.toLowerCase())
            ) {
              parsed.role = normalizeRole(parsed.role || metadataRole, userEmail)
              if (clerkUsername && parsed.username !== clerkUsername) {
                parsed.username = clerkUsername
              }
              setProfile(parsed)
            }
          }
        } catch {
          // Ignore cache read failures
        }

        // Helper to prioritize elevated roles
        const pickHigherRole = (r1: CanonicalRole, r2: CanonicalRole): CanonicalRole => {
          if (r1 === 'SUPER_ADMIN' || r2 === 'SUPER_ADMIN') return 'SUPER_ADMIN'
          if (r1 === 'ORGANIZER' || r2 === 'ORGANIZER') return 'ORGANIZER'
          return 'PLAYER'
        }

        // 3. Authoritative sync with backend MongoDB
        try {
          const token = await getToken()
          if (token) {
            const synced = await syncUser(
              {
                clerk_user_id: user.id,
                email: userEmail,
                username,
                display_name: displayName,
                avatar_url: avatarUrl,
                has_chosen_username: hasChosenUsername,
              },
              token
            )

            if (synced && synced.id) {
              const metaCanonical = normalizeRole(metadataRole, userEmail)
              const backendCanonical = normalizeRole(synced.role, userEmail)
              const canonical = pickHigherRole(metaCanonical, backendCanonical)
              const cleanEmail =
                user.primaryEmailAddress?.emailAddress ||
                (synced.email && !synced.email.endsWith('@ametheus.gg') ? synced.email : userEmail)
              const finalProfile: UserProfile = {
                ...synced,
                email: cleanEmail,
                avatar_url: synced.avatar_url ? resolveMediaUrl(synced.avatar_url) : avatarUrl,
                role: canonical as any,
              }
              syncedUserIdRef.current = user.id
              setProfile(finalProfile)
              try {
                localStorage.setItem(storageKey, JSON.stringify(finalProfile))
              } catch {}
              return
            }
          }
        } catch (syncErr) {
          // Fallback: try fetching /auth/me with explicit token
          try {
            const token = await getToken()
            const me = await getCurrentUserProfile(token)
            if (me && me.id) {
              const metaCanonical = normalizeRole(metadataRole, userEmail)
              const backendCanonical = normalizeRole(me.role, userEmail)
              const canonical = pickHigherRole(metaCanonical, backendCanonical)
              const cleanEmail =
                user.primaryEmailAddress?.emailAddress ||
                (me.email && !me.email.endsWith('@ametheus.gg') ? me.email : userEmail)
              const finalProfile: UserProfile = {
                ...me,
                email: cleanEmail,
                avatar_url: me.avatar_url ? resolveMediaUrl(me.avatar_url) : avatarUrl,
                role: canonical as any,
              }
              syncedUserIdRef.current = user.id
              setProfile(finalProfile)
              try {
                localStorage.setItem(storageKey, JSON.stringify(finalProfile))
              } catch {}
              return
            }
          } catch {}
        }

        // 4. Offline / network fallback: construct authoritative fallback profile
        const fallbackCanonical = normalizeRole(metadataRole, userEmail)
        setProfile((prev) => {
          const base: UserProfile = prev || {
            id: user.id,
            clerk_user_id: user.id,
            email: userEmail,
            username,
            display_name: displayName,
            avatar_url: avatarUrl,
            role: fallbackCanonical as any,
            inr_balance: '0.00',
            inr_balance_paise: 0,
            inr_reserved_paise: 0,
          }
          return {
            ...base,
            role: fallbackCanonical as any,
          }
        })
        syncedUserIdRef.current = user.id
      } finally {
        isSyncingRef.current = false
        setIsLoading(false)
      }
    },
    [
      isAuthLoaded,
      isUserLoaded,
      clerkSignedIn,
      user?.id,
      user?.username,
      (user?.unsafeMetadata as any)?.username,
      user?.primaryEmailAddress?.emailAddress,
      getToken,
    ]
  )

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  useEffect(() => {
    const handleProfileUpdate = () => {
      loadProfile(true)
    }
    window.addEventListener('ametheus:profile_updated', handleProfileUpdate)
    return () => {
      window.removeEventListener('ametheus:profile_updated', handleProfileUpdate)
    }
  }, [loadProfile])

  const refreshProfile = useCallback(async () => {
    await loadProfile(true)
  }, [loadProfile])


  const effectiveRole: CanonicalRole = useMemo(() => {
    if (!profile) return 'PLAYER'
    return normalizeRole(profile.role, profile.email)
  }, [profile])

  const effectiveDisplayName = useMemo(() => {
    return (
      profile?.username ||
      profile?.display_name ||
      user?.username ||
      'Contender'
    )
  }, [profile?.username, profile?.display_name, user?.username])

  const effectiveAvatarUrl = useMemo(() => {
    return resolveMediaUrl(profile?.avatar_url || user?.imageUrl)
  }, [profile?.avatar_url, user?.imageUrl])

  const isSignedIn = !!clerkSignedIn || !!profile
  const isPlayer = isSignedIn
  const isOrganizer = effectiveRole === 'ORGANIZER' || effectiveRole === 'SUPER_ADMIN'
  const isSuperAdmin = effectiveRole === 'SUPER_ADMIN'

  return (
    <AuthContext.Provider
      value={{
        profile,
        role: effectiveRole,
        displayName: effectiveDisplayName,
        avatarUrl: effectiveAvatarUrl,
        isLoading,
        isSignedIn,
        isPlayer,
        isOrganizer,
        isSuperAdmin,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
