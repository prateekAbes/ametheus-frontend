import { useEffect, useState, useCallback, type ReactNode } from 'react'
import { useUser, useClerk } from '@clerk/react'
import { Container, Cta, Field, Hud, Panel, Toggle, Badge } from '../components/ui'
import { useAuthContext } from '../context/AuthContext'
import { updateUserProfile, deleteAccount } from '../services/auth'
import { resolveMediaUrl } from '../services/apiClient'
import { uploadMediaFile } from '../services/admin'
import { getAvailableCrests, type Crest } from '../services/crests'
import { applyAppearance, getSavedAppearance, THEME_PALETTES, ACCENT_PALETTES } from '../lib/appearance'
import DynamicImage from '../components/DynamicImage'

const SECTIONS = ['Account', 'Preferences', 'Privacy', 'Security'] as const

function Block({
  id,
  idx,
  title,
  children,
}: {
  id: string
  idx: string
  title: string
  children: ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-32 border-t border-white/10 py-12">
      <Hud className="text-cyan">{idx}</Hud>
      <h2 className="mt-2 font-display text-5xl font-black uppercase md:text-6xl">{title}</h2>
      <div className="mt-8 space-y-8">{children}</div>
    </section>
  )
}

function Row({ k, d, children }: { k: string; d?: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6 border-b border-white/5 pb-5">
      <div>
        <p className="font-semibold">{k}</p>
        {d && <p className="text-sm text-dim">{d}</p>}
      </div>
      {children}
    </div>
  )
}

export default function Settings() {
  const { profile, refreshProfile } = useAuthContext()
  const { user } = useUser()
  const clerk = useClerk()

  const [active, setActive] = useState<string>('Account')
  const [dirty, setDirty] = useState(false)
  const [saved, setSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  // 1. Account States
  const [username, setUsername] = useState(profile?.username || '')
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '')
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [avatarUploadError, setAvatarUploadError] = useState('')
  const [availableCrests, setAvailableCrests] = useState<Crest[]>([])

  // 2. Preferences States
  const DEFAULT_NOTIFICATIONS: Record<string, boolean> = {
    'Tournament updates': true,
    'Match reminders': true,
    'Team invites': true,
    'Wallet & payments': true,
    'Email notifications': true,
  }

  const NOTIFICATION_DESCRIPTIONS: Record<string, string> = {
    'Tournament updates': 'Brackets, tournament progress, and registration status updates.',
    'Match reminders': 'Upcoming match countdowns, opponent assignments, and lobby credentials.',
    'Team invites': 'Squad invitations, join requests, and team roster changes.',
    'Wallet & payments': 'UPI deposits, winnings credits, and withdrawal status.',
    'Email notifications': 'Send an email copy for important competition and wallet events.',
  }

  const savedApp = getSavedAppearance()
  const [theme, setTheme] = useState<string>(profile?.preferences?.appearance?.theme || savedApp.theme)
  const [accent, setAccent] = useState<string>(profile?.preferences?.appearance?.accent || savedApp.accent)
  const [notif, setNotif] = useState<Record<string, boolean>>(() => ({
    ...DEFAULT_NOTIFICATIONS,
    ...(profile?.preferences?.notifications || {}),
  }))

  // 3. Privacy States
  const [vis, setVis] = useState<string>(profile?.privacy_settings?.visibility || 'Public')
  const [usageAnalytics, setUsageAnalytics] = useState<boolean>(profile?.privacy_settings?.usage_analytics ?? true)
  const [showMatches, setShowMatches] = useState<boolean>(profile?.privacy_settings?.show_matches ?? true)
  const [showStats, setShowStats] = useState<boolean>(profile?.privacy_settings?.show_stats ?? true)

  // 4. Security States
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [isSendingVerify, setIsSendingVerify] = useState(false)
  const [emailVerifyMsg, setEmailVerifyMsg] = useState('')

  const [sessionsList, setSessionsList] = useState<any[]>([])
  const [sessionMsg, setSessionMsg] = useState<string>('')

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [alerts, setAlerts] = useState(profile?.preferences?.login_alerts ?? true)

  const isEmailVerified = user?.primaryEmailAddress?.verification?.status === 'verified'

  const touch = () => {
    setDirty(true)
    setSaved(false)
    setSaveMessage('')
  }

  // Load available crests from backend
  useEffect(() => {
    getAvailableCrests()
      .then((data) => setAvailableCrests(data))
      .catch((err) => console.warn('Failed to load available crests:', err))
  }, [])

  // Sync profile data into local form states
  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '')
      setDisplayName(profile.display_name || '')
      setAvatarUrl(profile.avatar_url || '')
      if (profile.preferences?.appearance?.theme) {
        setTheme(profile.preferences.appearance.theme)
      }
      if (profile.preferences?.appearance?.accent) {
        setAccent(profile.preferences.appearance.accent)
      }
      if (profile.preferences?.notifications) {
        setNotif({
          ...DEFAULT_NOTIFICATIONS,
          ...profile.preferences.notifications,
        })
      }
      if (profile.privacy_settings?.visibility) {
        setVis(profile.privacy_settings.visibility)
      }
      if (profile.privacy_settings?.usage_analytics !== undefined) {
        setUsageAnalytics(profile.privacy_settings.usage_analytics)
      }
      if (profile.privacy_settings?.show_matches !== undefined) {
        setShowMatches(profile.privacy_settings.show_matches)
      }
      if (profile.privacy_settings?.show_stats !== undefined) {
        setShowStats(profile.privacy_settings.show_stats)
      }
      if (profile.preferences?.login_alerts !== undefined) {
        setAlerts(profile.preferences.login_alerts)
      }
    }
  }, [profile])

  // Active Sessions
  const loadSessions = useCallback(async () => {
    if (!user) {
      setSessionsList([
        {
          id: 'current-session',
          isCurrent: true,
          lastActiveAt: new Date().toISOString(),
          latestActivity: { deviceType: 'Web Browser', browserName: 'Current Browser Client', ipAddress: '127.0.0.1' },
        },
      ])
      return
    }
    try {
      const activeSessions = await user.getSessions()
      setSessionsList(
        activeSessions.map((s: any) => ({
          id: s.id,
          isCurrent: s.id === clerk.session?.id,
          lastActiveAt: s.lastActiveAt,
          latestActivity: s.latestActivity,
        }))
      )
    } catch {
      setSessionsList([
        {
          id: 'current-session',
          isCurrent: true,
          lastActiveAt: new Date().toISOString(),
          latestActivity: { deviceType: 'Web Browser', browserName: 'Current Browser Client', ipAddress: '127.0.0.1' },
        },
      ])
    }
  }, [user, clerk.session?.id])

  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  // Intersection observer for sidebar navigation
  useEffect(() => {
    const obs = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-40% 0px -55% 0px' }
    )
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s)
      if (el) obs.observe(el)
    })
    return () => obs.disconnect()
  }, [])

  // Deep-linking: activate tab and scroll into view when tab or section parameter is present
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const tabParam = searchParams.get('tab') || searchParams.get('section')
    const hashParam = window.location.hash.replace('#', '')
    const target = (tabParam || hashParam || '').toLowerCase()

    const matched = SECTIONS.find((s) => s.toLowerCase() === target)
    if (matched) {
      setActive(matched)
      const el = document.getElementById(matched)
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 120)
      }
    }
  }, [])

  // ---------------- Handlers ----------------

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploadingAvatar(true)
    setAvatarUploadError('')
    try {
      const res = await uploadMediaFile(file)
      if (res && res.url) {
        setAvatarUrl(res.url)
        // Automatically persist custom avatar upload to database
        await updateUserProfile({ avatar_url: res.url })
        await refreshProfile()
        window.dispatchEvent(new CustomEvent('ametheus:profile_updated'))
        setSaveMessage('Profile picture uploaded and saved successfully.')
        setSaved(true)
        setTimeout(() => setSaveMessage(''), 4000)
      }
    } catch (err: any) {
      setAvatarUploadError(err.message || 'Failed to upload image.')
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleSelectCrest = async (crest: Crest) => {
    setAvatarUrl(crest.image_url)
    try {
      await updateUserProfile({ avatar_url: crest.image_url })
      await refreshProfile()
      window.dispatchEvent(new CustomEvent('ametheus:profile_updated'))
      setSaveMessage(`Player crest "${crest.name}" equipped and persisted.`)
      setSaved(true)
      setTimeout(() => setSaveMessage(''), 4000)
    } catch (err: any) {
      setSaveMessage(err.message || 'Failed to equip crest.')
    }
  }

  const handleThemeChange = async (newTheme: string) => {
    setTheme(newTheme)
    applyAppearance(newTheme, accent)
    try {
      await updateUserProfile({
        preferences: {
          ...profile?.preferences,
          appearance: { theme: newTheme, accent },
          notifications: notif,
          login_alerts: alerts,
        },
      })
      await refreshProfile()
    } catch {}
  }

  const handleAccentChange = async (newAccent: string) => {
    setAccent(newAccent)
    applyAppearance(theme, newAccent)
    try {
      await updateUserProfile({
        preferences: {
          ...profile?.preferences,
          appearance: { theme, accent: newAccent },
          notifications: notif,
          login_alerts: alerts,
        },
      })
      await refreshProfile()
    } catch {}
  }

  const handlePrivacyChange = async (field: string, val: any) => {
    const updated: Record<string, any> = {
      visibility: vis,
      usage_analytics: usageAnalytics,
      show_matches: showMatches,
      show_stats: showStats,
      [field]: val,
    }
    if (field === 'visibility') setVis(val)
    if (field === 'usage_analytics') setUsageAnalytics(val)
    if (field === 'show_matches') setShowMatches(val)
    if (field === 'show_stats') setShowStats(val)

    try {
      await updateUserProfile({
        privacy_settings: updated,
      })
      await refreshProfile()
      setSaveMessage('Privacy settings updated and saved.')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (err: any) {
      alert(err.message || 'Failed to update privacy settings.')
    }
  }

  const handleNotificationChange = async (key: string, val: boolean) => {
    const updated = { ...notif, [key]: val }
    setNotif(updated)
    try {
      await updateUserProfile({
        preferences: {
          ...profile?.preferences,
          appearance: { theme, accent },
          notifications: updated,
          login_alerts: alerts,
        },
      })
      await refreshProfile()
      setSaveMessage(`Notification preference "${key}" updated and persisted.`)
      setSaved(true)
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (err: any) {
      setSaveMessage(err.message || 'Failed to update notification preference.')
    }
  }

  const handleLoginAlertsChange = async (val: boolean) => {
    setAlerts(val)
    try {
      await updateUserProfile({
        preferences: {
          ...profile?.preferences,
          appearance: { theme, accent },
          notifications: notif,
          login_alerts: val,
        },
      })
      await refreshProfile()
      setSaveMessage(`Login alerts ${val ? 'enabled' : 'disabled'} and persisted.`)
      setSaved(true)
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (err: any) {
      setSaveMessage(err.message || 'Failed to update login alerts.')
    }
  }

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      setPasswordStatus({ type: 'error', text: 'New password must be at least 8 characters long.' })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', text: 'New password and confirmation do not match.' })
      return
    }
    setIsChangingPassword(true)
    setPasswordStatus(null)
    try {
      if (user) {
        if (user.passwordEnabled && !currentPassword) {
          setPasswordStatus({ type: 'error', text: 'Current password is required.' })
          setIsChangingPassword(false)
          return
        }
        await user.updatePassword({
          ...(user.passwordEnabled ? { currentPassword } : {}),
          newPassword,
          signOutOfOtherSessions: false,
        })
      }
      setPasswordStatus({ type: 'success', text: 'Password successfully updated on authentication server.' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      setPasswordStatus({ type: 'error', text: err.errors?.[0]?.message || err.message || 'Failed to update password.' })
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleSendEmailVerification = async () => {
    if (!user?.primaryEmailAddress) return
    setIsSendingVerify(true)
    setEmailVerifyMsg('')
    try {
      await user.primaryEmailAddress.prepareVerification({ strategy: 'email_code' })
      setEmailVerifyMsg('Verification email requested! Please check your inbox.')
    } catch (err: any) {
      setEmailVerifyMsg(err.errors?.[0]?.message || err.message || 'Failed to send verification email.')
    } finally {
      setIsSendingVerify(false)
    }
  }

  const handleRevokeSession = async (sessionId: string) => {
    try {
      if (user) {
        const sessions = await user.getSessions()
        const target = sessions.find((s: any) => s.id === sessionId)
        if (target) {
          await target.revoke()
        }
      }
      setSessionMsg('Session revoked successfully.')
      setTimeout(() => setSessionMsg(''), 3000)
      loadSessions()
    } catch (err: any) {
      alert(err.message || 'Failed to revoke session.')
    }
  }

  const handleRevokeOtherSessions = async () => {
    try {
      if (user) {
        const sessions = await user.getSessions()
        for (const s of sessions) {
          if (s.id !== clerk.session?.id) {
            await s.revoke()
          }
        }
      }
      setSessionMsg('All other sessions terminated successfully.')
      setTimeout(() => setSessionMsg(''), 3000)
      loadSessions()
    } catch (err: any) {
      alert(err.message || 'Failed to revoke other sessions.')
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== (profile?.username || 'confirm')) return
    setIsDeleting(true)
    setDeleteError('')
    try {
      const token = await clerk.session?.getToken()
      await deleteAccount(token)
      try {
        await clerk.signOut()
      } catch {
        // Ignored if session is already invalidated on server
      }
      localStorage.clear()
      sessionStorage.clear()
      window.location.href = '/'
    } catch (err: any) {
      const errorMsg =
        err?.data?.detail ||
        err?.data?.message ||
        err?.message ||
        err?.errors?.[0]?.message ||
        'Failed to delete account. Please try again.'
      setDeleteError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg))
      setIsDeleting(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveMessage('')
    try {
      const cleanNewUsername = username.trim() || undefined
      await updateUserProfile({
        username: cleanNewUsername,
        display_name: displayName.trim() || undefined,
        avatar_url: avatarUrl ? avatarUrl.trim() : undefined,
        preferences: {
          appearance: { theme, accent },
          notifications: notif,
          login_alerts: alerts,
        },
        privacy_settings: {
          visibility: vis,
          usage_analytics: usageAnalytics,
          show_matches: showMatches,
          show_stats: showStats,
        },
      })

      if (user && cleanNewUsername) {
        try {
          // Attempt updating Clerk dedicated username directly
          await user.update({
            username: cleanNewUsername,
            unsafeMetadata: {
              ...user.unsafeMetadata,
              username: cleanNewUsername,
              has_chosen_username: true,
            },
          })
        } catch (clerkSyncErr) {
          // If dedicated username update fails in Clerk (e.g. requires separate flow or restricted), fallback to metadata
          try {
            await user.update({
              unsafeMetadata: {
                ...user.unsafeMetadata,
                username: cleanNewUsername,
                has_chosen_username: true,
              },
            })
          } catch (metaErr) {
            console.warn('Failed to sync username to Clerk metadata:', metaErr)
          }
        }
      }

      await refreshProfile()
      window.dispatchEvent(new CustomEvent('ametheus:profile_updated'))
      setSaved(true)
      setDirty(false)
      setSaveMessage('All profile settings successfully updated and saved to server.')
      setTimeout(() => setSaveMessage(''), 4000)
    } catch (err: any) {
      setSaveMessage(err.message || 'Failed to update profile.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="bg-void pb-40 pt-32">
      <Container>
        <Hud className="text-cyan">◇ Control room</Hud>
        <h1 className="reveal mt-3 font-display text-[clamp(3.5rem,10vw,9rem)] font-black uppercase leading-[0.8]">
          Settings
        </h1>

        {saveMessage && (
          <div
            className={`mt-4 border p-4 font-mono text-xs ${
              saved ? 'border-ok/40 bg-ok/10 text-ok' : 'border-live/40 bg-live/10 text-live'
            }`}
          >
            {saveMessage}
          </div>
        )}

        <div className="mt-12 grid gap-10 lg:grid-cols-[220px_1fr]">
          <nav className="no-scrollbar sticky top-20 z-10 -mx-5 flex gap-1 overflow-x-auto bg-void/90 px-5 py-2 lg:top-32 lg:mx-0 lg:flex-col lg:self-start lg:bg-transparent lg:px-0">
            {SECTIONS.map((s, i) => (
              <a
                key={s}
                href={`#${s}`}
                className={`flex shrink-0 items-center gap-3 border-l-2 px-4 py-3 font-mono text-[11px] uppercase tracking-[0.2em] transition-colors ${
                  active === s
                    ? 'border-cyan text-ink'
                    : 'border-transparent text-dim hover:text-ink'
                }`}
              >
                <span className="text-cyan/60">0{i + 1}</span>
                {s}
              </a>
            ))}
          </nav>

          <div>
            {/* 01. ACCOUNT BLOCK */}
            <Block id="Account" idx="01" title="Account">
              <div className="grid gap-8 md:grid-cols-2">
                <Field
                  label="Username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value)
                    touch()
                  }}
                />
                <Field
                  label="Display Name"
                  value={displayName}
                  onChange={(e) => {
                    setDisplayName(e.target.value)
                    touch()
                  }}
                />
                <Field
                  label="Email (Read-only)"
                  type="email"
                  disabled
                  value={profile?.email || 'user@ametheus.gg'}
                />
                <Field
                  label="Role (System Verified)"
                  disabled
                  value={profile?.role || 'PLAYER'}
                />
              </div>

              {/* Profile Avatar & Player Crest Selector */}
              <Panel className="p-6">
                <div className="flex flex-col gap-6 md:flex-row md:items-start">
                  <div className="relative size-24 shrink-0 overflow-hidden rounded-full border-2 border-cyan/50 bg-surface shadow-md">
                    <DynamicImage
                      src={resolveMediaUrl(avatarUrl)}
                      alt="Avatar Preview"
                      className="size-full object-cover"
                    />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <Hud className="text-cyan">Profile Avatar & Player Crest</Hud>
                      <p className="mt-1 text-xs text-dim">
                        Upload your official competitive esports avatar or select from sanctioned operator crests. Changes persist directly to your account.
                      </p>
                    </div>

                    <div>
                      <label className="cursor-pointer border border-cyan bg-cyan/10 px-4 py-2 font-mono text-xs uppercase tracking-wider text-cyan hover:bg-cyan/20 transition-colors inline-block">
                        {isUploadingAvatar ? 'Uploading...' : '↑ Upload Custom Image'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={isUploadingAvatar}
                          onChange={handleAvatarFile}
                        />
                      </label>
                      {avatarUploadError && (
                        <p className="mt-2 font-mono text-xs text-live">{avatarUploadError}</p>
                      )}
                    </div>

                    {/* Sanctioned Crests Grid */}
                    <div className="pt-2 border-t border-white/10">
                      <p className="font-mono text-xs text-dim mb-3">Sanctioned Operator Crests:</p>
                      {availableCrests.length === 0 ? (
                        <p className="font-mono text-xs text-dim">Loading available crests...</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {availableCrests.map((c) => {
                            const isSelected = avatarUrl === c.image_url

                            return (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => handleSelectCrest(c)}
                                className={`text-left p-3 border transition-all flex items-center gap-3 cursor-pointer ${
                                  isSelected
                                    ? 'border-cyan bg-cyan/15 ring-1 ring-cyan shadow-[0_0_10px_rgba(62,242,255,0.25)]'
                                    : 'border-white/10 bg-surface/50 hover:border-white/30 hover:bg-surface'
                                }`}
                              >
                                <div className="size-10 shrink-0 rounded-full border border-white/20 bg-void flex items-center justify-center p-1 overflow-hidden">
                                  <img
                                    src={resolveMediaUrl(c.image_url)}
                                    alt={c.name}
                                    className="size-full object-contain"
                                  />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-1">
                                    <p className="font-display font-black uppercase text-xs text-ink truncate">
                                      {c.name}
                                    </p>
                                    {isSelected && (
                                      <span className="text-[9px] font-bold text-cyan uppercase shrink-0">
                                        ✓ Equipped
                                      </span>
                                    )}
                                  </div>
                                  {c.description && (
                                    <p className="font-sans text-[10px] text-dim line-clamp-1 mt-0.5">
                                      {c.description}
                                    </p>
                                  )}
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Panel>
            </Block>

            {/* 02. PREFERENCES BLOCK */}
            <Block id="Preferences" idx="02" title="Preferences">
              <div>
                <Hud>Notifications</Hud>
                <div className="mt-4 space-y-5">
                  {Object.entries(notif).map(([k, v]) => (
                    <Row key={k} k={k} d={NOTIFICATION_DESCRIPTIONS[k]}>
                      <Toggle
                        label={k}
                        on={v}
                        onChange={(x) => handleNotificationChange(k, x)}
                      />
                    </Row>
                  ))}
                </div>
              </div>

              <div>
                <Hud>Appearance Theme</Hud>
                <p className="mt-1 text-xs text-dim">
                  Select your client background theme palette. Applies instantly and persists across reloads.
                </p>
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.entries(THEME_PALETTES).map(([n, colors]) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => handleThemeChange(n)}
                      className={`border p-3 text-left transition-all cursor-pointer ${
                        theme === n
                          ? 'border-cyan bg-cyan/10 shadow-[0_0_12px_rgba(62,242,255,0.2)]'
                          : 'border-white/10 bg-surface/50 hover:border-white/30'
                      }`}
                    >
                      <span className="block h-14 border border-white/10" style={{ background: colors.void }}>
                        <span className="m-2 block h-1.5 w-1/2 bg-cyan/70" />
                      </span>
                      <span className="mt-2 block font-display text-sm font-black uppercase text-ink">{n}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Hud>Accent Color</Hud>
                <p className="mt-1 text-xs text-dim">
                  Choose your competitive esports UI highlights and accent shade.
                </p>
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {Object.entries(ACCENT_PALETTES).map(([name, data]) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => handleAccentChange(name)}
                      className={`border p-3 text-left transition-all cursor-pointer flex flex-col justify-between ${
                        accent === name
                          ? 'border-cyan bg-cyan/10 ring-1 ring-cyan'
                          : 'border-white/10 bg-surface/50 hover:border-white/30'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="size-4 rounded-full border border-white/20" style={{ background: data.hex }} />
                        <span className="font-mono text-xs font-bold text-ink">{name}</span>
                      </div>
                      <span className="mt-2 block font-mono text-[10px] text-dim">{data.hex}</span>
                    </button>
                  ))}
                </div>
              </div>
            </Block>

            {/* 03. PRIVACY BLOCK */}
            <Block id="Privacy" idx="03" title="Privacy">
              <div>
                <Hud>Profile Visibility</Hud>
                <p className="mt-1 text-xs text-dim">
                  Controls who can inspect your competitive player card, career summary, and team memberships.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {['Public', 'Teammates only', 'Private'].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => handlePrivacyChange('visibility', v)}
                      className={`border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors cursor-pointer ${
                        vis === v
                          ? 'border-cyan bg-cyan text-void font-bold'
                          : 'border-white/15 text-dim hover:text-ink'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <Row k="Usage analytics" d="Help us optimize server matchmaking, anti-cheat detection, and bracket generation.">
                <Toggle
                  label="Usage analytics"
                  on={usageAnalytics}
                  onChange={(x) => handlePrivacyChange('usage_analytics', x)}
                />
              </Row>

              <Row k="Public match history" d="Display completed tournament rounds and scores on your public player card.">
                <Toggle
                  label="Public match history"
                  on={showMatches}
                  onChange={(x) => handlePrivacyChange('show_matches', x)}
                />
              </Row>

              <Row k="Leaderboard rankings" d="Include your competitive stats in public tournament ranking boards.">
                <Toggle
                  label="Leaderboard rankings"
                  on={showStats}
                  onChange={(x) => handlePrivacyChange('show_stats', x)}
                />
              </Row>
            </Block>

            {/* 04. SECURITY BLOCK */}
            <Block id="Security" idx="04" title="Security">
              {/* 1. Password Management */}
              <Panel className="p-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <h3 className="font-display text-2xl font-black uppercase text-ink">Change Password</h3>
                    <p className="text-xs text-dim">Update your security credentials across all competitive client sessions.</p>
                  </div>
                  <Hud className="text-cyan">CREDENTIALS</Hud>
                </div>

                {passwordStatus && (
                  <div
                    className={`mt-4 border p-3 font-mono text-xs ${
                      passwordStatus.type === 'success'
                        ? 'border-ok/40 bg-ok/10 text-ok'
                        : 'border-live/40 bg-live/10 text-live'
                    }`}
                  >
                    {passwordStatus.text}
                  </div>
                )}

                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block font-mono text-[10px] uppercase text-dim">Current Password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="mt-1 w-full border border-white/15 bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-cyan"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[10px] uppercase text-dim">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 8 characters"
                      className="mt-1 w-full border border-white/15 bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-cyan"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[10px] uppercase text-dim">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="mt-1 w-full border border-white/15 bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-cyan"
                    />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                  <span className="text-[11px] text-dim font-mono">Requires current password authentication</span>
                  <button
                    onClick={handleUpdatePassword}
                    disabled={isChangingPassword || !newPassword}
                    className="border border-cyan/40 bg-cyan/10 px-4 py-2 font-mono text-xs uppercase text-cyan hover:bg-cyan/20 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {isChangingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </Panel>

              {/* 2. Active Sessions & Devices */}
              <Panel className="p-6">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <div>
                    <h3 className="font-display text-2xl font-black uppercase text-ink">Active Sessions</h3>
                    <p className="text-xs text-dim">Manage authorized devices and active authentication tokens.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={loadSessions}
                      className="border border-white/15 px-3 py-1 font-mono text-xs text-dim hover:text-ink transition-colors cursor-pointer"
                    >
                      Refresh
                    </button>
                    {sessionsList.length > 1 && (
                      <button
                        onClick={handleRevokeOtherSessions}
                        className="border border-live/40 bg-live/10 px-3 py-1 font-mono text-xs text-live hover:bg-live/20 transition-colors cursor-pointer"
                      >
                        Log out other devices
                      </button>
                    )}
                  </div>
                </div>

                {sessionMsg && (
                  <div className="mt-4 border border-ok/40 bg-ok/10 p-3 font-mono text-xs text-ok">
                    {sessionMsg}
                  </div>
                )}

                <div className="mt-4 space-y-3">
                  {sessionsList.length === 0 ? (
                    <div className="flex items-center justify-between border border-white/5 bg-surface/50 p-4">
                      <div>
                        <p className="font-semibold text-sm">Current Browser Session</p>
                        <p className="font-mono text-xs text-dim">Active now · This device</p>
                      </div>
                      <span className="border border-ok/40 bg-ok/10 px-2.5 py-1 font-mono text-[10px] text-ok uppercase">
                        Active
                      </span>
                    </div>
                  ) : (
                    sessionsList.map((s) => (
                      <div
                        key={s.id}
                        className="flex flex-wrap items-center justify-between gap-4 border border-white/5 bg-surface/50 p-4"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm">
                              {s.latestActivity?.deviceType || 'Web Browser'} ·{' '}
                              {s.latestActivity?.browserName || 'Desktop Client'}
                            </p>
                            {s.isCurrent && (
                              <span className="border border-cyan/40 bg-cyan/10 px-2 py-0.5 font-mono text-[9px] uppercase text-cyan">
                                This Device
                              </span>
                            )}
                          </div>
                          <p className="font-mono text-xs text-dim mt-1">
                            IP: {s.latestActivity?.ipAddress || 'Authorized Client'} · Last active:{' '}
                            {s.lastActiveAt ? new Date(s.lastActiveAt).toLocaleString() : 'Just now'}
                          </p>
                        </div>

                        {!s.isCurrent && (
                          <button
                            onClick={() => handleRevokeSession(s.id)}
                            className="border border-live/30 px-3 py-1.5 font-mono text-xs uppercase text-live/80 hover:bg-live/10 transition-colors cursor-pointer"
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </Panel>

              {/* 3. Verification & 2FA */}
              <div className="grid gap-6 md:grid-cols-2">
                <Panel className="p-6">
                  <Hud className="text-cyan">EMAIL SECURITY</Hud>
                  <h4 className="mt-2 font-display text-xl font-black uppercase">Email Verification</h4>
                  <p className="mt-1 text-xs text-dim">
                    Primary: <span className="font-mono text-ink">{profile?.email || 'user@ametheus.gg'}</span>
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span
                      className={`border px-2.5 py-1 font-mono text-[10px] uppercase ${
                        isEmailVerified ? 'border-ok/40 bg-ok/10 text-ok' : 'border-warn/40 bg-warn/10 text-warn'
                      }`}
                    >
                      {isEmailVerified ? '✓ Verified' : 'Unverified'}
                    </span>
                    {!isEmailVerified && user?.primaryEmailAddress && (
                      <button
                        onClick={handleSendEmailVerification}
                        disabled={isSendingVerify}
                        className="text-xs text-cyan underline font-mono hover:text-white disabled:opacity-50 cursor-pointer"
                      >
                        {isSendingVerify ? 'Sending...' : 'Resend Verification Email'}
                      </button>
                    )}
                  </div>
                  {emailVerifyMsg && (
                    <p className="mt-2 font-mono text-[11px] text-cyan">{emailVerifyMsg}</p>
                  )}
                </Panel>

                <Panel className="p-6">
                  <Hud className="text-cyan">TWO-FACTOR AUTHENTICATION</Hud>
                  <h4 className="mt-2 font-display text-xl font-black uppercase">Two-Step Verification (2FA)</h4>
                  <p className="mt-1 text-xs text-dim">Additional security layer requiring SMS or authenticator passkey.</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span
                      className={`border px-2.5 py-1 font-mono text-[10px] uppercase ${
                        user?.twoFactorEnabled ? 'border-ok/40 bg-ok/10 text-ok' : 'border-warn/40 bg-warn/10 text-warn'
                      }`}
                    >
                      {user?.twoFactorEnabled ? '✓ 2FA Active' : 'Disabled (Recommended)'}
                    </span>
                    <button
                      onClick={() => clerk.openUserProfile()}
                      className="border border-cyan/40 bg-cyan/10 px-3 py-1 font-mono text-xs uppercase text-cyan hover:bg-cyan/20 transition-colors cursor-pointer"
                    >
                      {user?.twoFactorEnabled ? 'Manage 2FA' : 'Enable 2FA'}
                    </button>
                  </div>
                </Panel>
              </div>

              {/* 4. Login Alerts */}
              <Row k="Login alerts" d="Email me when a new IP signs into my account.">
                <Toggle
                  label="Login alerts"
                  on={alerts}
                  onChange={handleLoginAlertsChange}
                />
              </Row>

              {/* 5. Danger Zone: Account Deletion */}
              <div className="border border-live/30 bg-live/[0.04] p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-live animate-pulse" />
                  <Hud className="text-live">DANGER ZONE</Hud>
                </div>
                <h4 className="font-display text-2xl font-black uppercase text-ink">Delete Account</h4>
                <p className="text-xs text-dim max-w-xl">
                  Permanently erase your AMETHEUS competitive identity, match history, and team affiliations. This action is irreversible.
                </p>

                {deleteError && (
                  <div className="border border-live/50 bg-live/10 p-3 font-mono text-xs text-live">
                    {deleteError}
                  </div>
                )}

                {showDeleteConfirm ? (
                  <div className="border border-live/40 bg-surface p-4 space-y-3">
                    <p className="font-mono text-xs text-live uppercase font-bold">
                      Type your username "{profile?.username || 'confirm'}" to proceed:
                    </p>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="Enter username"
                      className="w-full border border-live/40 bg-void px-3 py-2 text-sm text-ink outline-none focus:border-live"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleDeleteAccount}
                        disabled={isDeleting || deleteConfirmText !== (profile?.username || 'confirm')}
                        className="border border-live bg-live px-4 py-2 font-mono text-xs uppercase text-white hover:bg-live/90 disabled:opacity-40 transition-colors cursor-pointer"
                      >
                        {isDeleting ? 'Deleting...' : 'Permanently Delete Account'}
                      </button>
                      <button
                        onClick={() => {
                          setShowDeleteConfirm(false)
                          setDeleteConfirmText('')
                          setDeleteError('')
                        }}
                        className="border border-white/20 px-4 py-2 font-mono text-xs uppercase text-dim hover:text-ink transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="border border-live/40 bg-live/10 px-4 py-2 font-mono text-xs uppercase text-live hover:bg-live/20 transition-colors cursor-pointer"
                  >
                    Initiate Account Deletion
                  </button>
                )}
              </div>
            </Block>
          </div>
        </div>
      </Container>

      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-graphite/95 backdrop-blur transition-transform duration-300 ${
          dirty || saved ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <Container className="flex items-center justify-between gap-4 py-4">
          <Hud className={saved ? 'text-ok' : 'text-warn'}>
            {saved ? '◆ All changes saved to server' : '● Unsaved changes pending'}
          </Hud>
          <div className="flex gap-3">
            {!saved && (
              <Cta small ghost arrow={false} onClick={() => setDirty(false)}>
                Discard
              </Cta>
            )}
            <Cta small disabled={saved || isSaving} onClick={handleSave}>
              {isSaving ? 'Saving...' : 'Save Profile'}
            </Cta>
          </div>
        </Container>
      </div>
    </div>
  )
}
