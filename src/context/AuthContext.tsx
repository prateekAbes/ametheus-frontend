import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { useAuth, useUser } from '@clerk/clerk-react'
import { setAuthTokenGetter } from '../services/apiClient'
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

  // Centralized token getter for API requests
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

  const loadProfile = useCallback(async () => {
    // Wait until Clerk auth state is fully resolved
    if (!isAuthLoaded || !isUserLoaded) return

    // 1. Not signed in with Clerk: check for dev/test mock or clear
    if (!clerkSignedIn || !user) {
      try {
        const devMock = localStorage.getItem('ametheus_dev_mock_user')
        if (devMock) {
          const parsed = JSON.parse(devMock)
          if (parsed && (parsed.role || parsed.email)) {
            const normalized = normalizeRole(parsed.role, parsed.email)
            parsed.role = normalized
            setProfile(parsed)
            setIsLoading(false)
            return
          }
        }
      } catch {}

      setProfile(null)
      setIsLoading(false)
      return
    }

    const storageKey = `ametheus_user_profile_${user.id}`
    const userEmail =
      user.primaryEmailAddress?.emailAddress || `${user.id}@ametheus.gg`
    const username =
      user.username || user.firstName?.toLowerCase() || user.id.slice(0, 10)
    const displayName = user.fullName || username
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
          setProfile(parsed)
        }
      }
    } catch {
      // Ignore cache read failures
    }

    // 3. Authoritative sync with backend MongoDB
    try {
      const token = await getToken()
      if (token) {
        const synced = await syncUser({
          clerk_user_id: user.id,
          email: userEmail,
          username,
          display_name: displayName,
          avatar_url: avatarUrl,
        })

        if (synced && synced.id) {
          const canonical = normalizeRole(synced.role || metadataRole, userEmail)
          const finalProfile: UserProfile = {
            ...synced,
            role: canonical as any,
          }
          setProfile(finalProfile)
          try {
            localStorage.setItem(storageKey, JSON.stringify(finalProfile))
          } catch {}
          setIsLoading(false)
          return
        }
      }
    } catch (syncErr) {
      // Fallback: try fetching /auth/me
      try {
        const me = await getCurrentUserProfile()
        if (me && me.id) {
          const canonical = normalizeRole(me.role || metadataRole, userEmail)
          const finalProfile: UserProfile = {
            ...me,
            role: canonical as any,
          }
          setProfile(finalProfile)
          try {
            localStorage.setItem(storageKey, JSON.stringify(finalProfile))
          } catch {}
          setIsLoading(false)
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
    setIsLoading(false)
  }, [isAuthLoaded, isUserLoaded, clerkSignedIn, user, getToken])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  const refreshProfile = useCallback(async () => {
    await loadProfile()
  }, [loadProfile])

  const effectiveRole: CanonicalRole = useMemo(() => {
    if (!profile) return 'PLAYER'
    return normalizeRole(profile.role, profile.email)
  }, [profile])

  const isSignedIn = !!clerkSignedIn || !!profile
  const isPlayer = isSignedIn
  const isOrganizer = effectiveRole === 'ORGANIZER' || effectiveRole === 'SUPER_ADMIN'
  const isSuperAdmin = effectiveRole === 'SUPER_ADMIN'

  return (
    <AuthContext.Provider
      value={{
        profile,
        role: effectiveRole,
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
