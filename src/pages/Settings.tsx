import { useEffect, useState, useCallback, type ReactNode } from 'react'
import { useUser, useClerk } from '@clerk/react'
import { Container, Cta, Field, Hud, Panel, Toggle, Badge } from '../components/ui'
import { useAuthContext } from '../context/AuthContext'
import { updateUserProfile } from '../services/auth'
import { resolveMediaUrl } from '../services/apiClient'
import { uploadMediaFile } from '../services/admin'
import DynamicImage from '../components/DynamicImage'
import { AVATARS, img } from '../lib/data'

const SECTIONS = ['Account', 'Preferences', 'Privacy', 'Security'] as const
const sel =
  'mt-2 w-full border-b border-white/15 bg-transparent py-3 text-lg text-ink outline-none focus:border-cyan [&>option]:bg-surface'

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

  // Security States & Handlers
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [sessionsList, setSessionsList] = useState<any[]>([])
  const [sessionMsg, setSessionMsg] = useState<string>('')

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

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
        await user.updatePassword({
          currentPassword,
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
      if (user) {
        await user.delete()
      }
      await clerk.signOut()
      window.location.href = '/login'
    } catch (err: any) {
      setDeleteError(err.errors?.[0]?.message || err.message || 'Failed to delete account.')
      setIsDeleting(false)
    }
  }

  const [active, setActive] = useState<string>('Account')
  const [dirty, setDirty] = useState(false)
  const [saved, setSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  // Form states initialized with live profile data
  const [username, setUsername] = useState(profile?.username || '')
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [riotId, setRiotId] = useState(profile?.riot_id || '')
  const [steamId, setSteamId] = useState(profile?.steam_id || '')
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '')
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [avatarUploadError, setAvatarUploadError] = useState('')

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '')
      setDisplayName(profile.display_name || '')
      setRiotId(profile.riot_id || '')
      setSteamId(profile.steam_id || '')
      setAvatarUrl(profile.avatar_url || '')
    }
  }, [profile])

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploadingAvatar(true)
    setAvatarUploadError('')
    try {
      const res = await uploadMediaFile(file)
      if (res && res.url) {
        setAvatarUrl(res.url)
        touch()
      }
    } catch (err: any) {
      setAvatarUploadError(err.message || 'Failed to upload image.')
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const [notif, setNotif] = useState<Record<string, boolean>>({
    'Tournament updates': true,
    'Match reminders': true,
    'Team invites': true,
    'Wallet & payments': true,
    Promotions: false,
  })
  const [theme, setTheme] = useState('Dark')
  const [vis, setVis] = useState('Public')
  const [data, setData] = useState({ analytics: true, personal: false })
  const [twofa, setTwofa] = useState(false)
  const [alerts, setAlerts] = useState(true)

  const touch = () => {
    setDirty(true)
    setSaved(false)
    setSaveMessage('')
  }

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

  const handleSave = async () => {
    setIsSaving(true)
    setSaveMessage('')
    try {
      await updateUserProfile({
        username: username.trim() || undefined,
        display_name: displayName.trim() || undefined,
        riot_id: riotId.trim() || undefined,
        steam_id: steamId.trim() || undefined,
        avatar_url: avatarUrl ? avatarUrl.trim() : undefined,
      })
      await refreshProfile()
      window.dispatchEvent(new CustomEvent('ametheus:profile_updated'))
      setSaved(true)
      setDirty(false)
      setSaveMessage('Profile changes successfully updated in backend.')
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

              <Panel className="p-6">
                <div className="flex flex-col gap-6 md:flex-row md:items-center">
                  <div className="relative size-24 shrink-0 overflow-hidden rounded-full border-2 border-cyan/40 bg-surface">
                    <DynamicImage
                      src={resolveMediaUrl(avatarUrl)}
                      alt="Avatar Preview"
                      className="size-full object-cover"
                    />
                  </div>
                  <div className="flex-1 space-y-3">
                    <Hud className="text-cyan">Profile Avatar & Player Crest</Hud>
                    <p className="text-xs text-dim">
                      Upload your official competitive esports avatar or select from sanctioned operator crests.
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="cursor-pointer border border-cyan bg-cyan/10 px-4 py-2 font-mono text-xs uppercase tracking-wider text-cyan hover:bg-cyan/20 transition-colors">
                        {isUploadingAvatar ? 'Uploading...' : 'Upload Image'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={isUploadingAvatar}
                          onChange={handleAvatarFile}
                        />
                      </label>
                      <span className="font-mono text-xs text-dim">or select crest:</span>
                      <div className="flex items-center gap-2">
                        {AVATARS.map((av) => {
                          const avUrl = img(av)
                          const isSelected = avatarUrl === av || avatarUrl === avUrl
                          return (
                            <button
                              key={av}
                              type="button"
                              onClick={() => {
                                setAvatarUrl(avUrl)
                                touch()
                              }}
                              className={`relative size-8 overflow-hidden rounded-full border transition-transform hover:scale-110 ${
                                isSelected ? 'border-cyan shadow-[0_0_8px_rgba(62,242,255,0.8)]' : 'border-white/20'
                              }`}
                            >
                              <img src={avUrl} alt="Preset avatar" className="size-full object-cover" />
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    {avatarUploadError && (
                      <p className="font-mono text-xs text-live">{avatarUploadError}</p>
                    )}
                  </div>
                </div>
              </Panel>

              <Panel className="p-6">
                <Hud>Game Identifiers</Hud>
                <div className="mt-4 grid gap-8 md:grid-cols-2">
                  <Field
                    label="Riot ID (Valorant)"
                    placeholder="e.g. Vyrus#IND"
                    value={riotId}
                    onChange={(e) => {
                      setRiotId(e.target.value)
                      touch()
                    }}
                  />
                  <Field
                    label="Steam ID (CS2 / Dota)"
                    placeholder="e.g. 76561198000000000"
                    value={steamId}
                    onChange={(e) => {
                      setSteamId(e.target.value)
                      touch()
                    }}
                  />
                </div>
              </Panel>
            </Block>

            <Block id="Preferences" idx="02" title="Preferences">
              <div>
                <Hud>Notifications</Hud>
                <div className="mt-4 space-y-5">
                  {Object.entries(notif).map(([k, v]) => (
                    <Row key={k} k={k}>
                      <Toggle
                        label={k}
                        on={v}
                        onChange={(x) => {
                          setNotif({ ...notif, [k]: x })
                          touch()
                        }}
                      />
                    </Row>
                  ))}
                </div>
              </div>
              <div>
                <Hud>Appearance</Hud>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[
                    ['Dark', '#0c0e15'],
                    ['Midnight', '#0b1030'],
                    ['OLED', '#000000'],
                  ].map(([n, c]) => (
                    <button
                      key={n}
                      onClick={() => {
                        setTheme(n)
                        touch()
                      }}
                      className={`border p-3 text-left transition-colors ${
                        theme === n
                          ? 'border-cyan'
                          : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      <span className="block h-16 border border-white/10" style={{ background: c }}>
                        <span className="m-2 block h-1.5 w-1/2 bg-cyan/70" />
                      </span>
                      <span className="mt-2 block font-display text-lg font-black uppercase">{n}</span>
                    </button>
                  ))}
                </div>
              </div>
            </Block>

            <Block id="Privacy" idx="03" title="Privacy">
              <div>
                <Hud>Profile Visibility</Hud>
                <div className="mt-4 flex flex-wrap gap-2">
                  {['Public', 'Teammates only', 'Private'].map((v) => (
                    <button
                      key={v}
                      onClick={() => {
                        setVis(v)
                        touch()
                      }}
                      className={`border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] ${
                        vis === v
                          ? 'border-cyan bg-cyan text-void'
                          : 'border-white/15 text-dim hover:text-ink'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <Row k="Usage analytics" d="Help us optimize server matchmaking and brackets.">
                <Toggle
                  label="Usage analytics"
                  on={data.analytics}
                  onChange={(x) => {
                    setData({ ...data, analytics: x })
                    touch()
                  }}
                />
              </Row>
            </Block>

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
                  <div className={`mt-4 border p-3 font-mono text-xs ${passwordStatus.type === 'success' ? 'border-ok/40 bg-ok/10 text-ok' : 'border-live/40 bg-live/10 text-live'}`}>
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
                    className="border border-cyan/40 bg-cyan/10 px-4 py-2 font-mono text-xs uppercase text-cyan hover:bg-cyan/20 disabled:opacity-50 transition-colors"
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
                      className="border border-white/15 px-3 py-1 font-mono text-xs text-dim hover:text-ink transition-colors"
                    >
                      Refresh
                    </button>
                    {sessionsList.length > 1 && (
                      <button
                        onClick={handleRevokeOtherSessions}
                        className="border border-live/40 bg-live/10 px-3 py-1 font-mono text-xs text-live hover:bg-live/20 transition-colors"
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
                      <span className="border border-ok/40 bg-ok/10 px-2.5 py-1 font-mono text-[10px] text-ok uppercase">Active</span>
                    </div>
                  ) : (
                    sessionsList.map((s) => (
                      <div key={s.id} className="flex flex-wrap items-center justify-between gap-4 border border-white/5 bg-surface/50 p-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm">
                              {s.latestActivity?.deviceType || 'Web Browser'} · {s.latestActivity?.browserName || 'Desktop Client'}
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
                            className="border border-live/30 px-3 py-1.5 font-mono text-xs uppercase text-live/80 hover:bg-live/10 transition-colors"
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
                    <span className="border border-ok/40 bg-ok/10 px-2.5 py-1 font-mono text-[10px] uppercase text-ok">
                      Verified
                    </span>
                    <span className="text-[10px] text-dim font-mono">Protected by Clerk Auth</span>
                  </div>
                </Panel>

                <Panel className="p-6">
                  <Hud className="text-cyan">TWO-FACTOR AUTHENTICATION</Hud>
                  <h4 className="mt-2 font-display text-xl font-black uppercase">Two-Step Verification (2FA)</h4>
                  <p className="mt-1 text-xs text-dim">Additional security layer requiring SMS or authenticator passkey.</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className={`border px-2.5 py-1 font-mono text-[10px] uppercase ${user?.twoFactorEnabled ? 'border-ok/40 bg-ok/10 text-ok' : 'border-warn/40 bg-warn/10 text-warn'}`}>
                      {user?.twoFactorEnabled ? '2FA Enabled' : 'Available via Clerk'}
                    </span>
                    <button
                      onClick={() => clerk.openUserProfile()}
                      className="text-xs text-cyan underline font-mono hover:text-white"
                    >
                      Manage 2FA
                    </button>
                  </div>
                </Panel>
              </div>

              {/* 4. Login Alerts (Preserved Existing Option) */}
              <Row k="Login alerts" d="Email me when a new IP signs into my account.">
                <Toggle
                  label="Login alerts"
                  on={alerts}
                  onChange={(x) => {
                    setAlerts(x)
                    touch()
                  }}
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
                        className="border border-live bg-live px-4 py-2 font-mono text-xs uppercase text-white hover:bg-live/90 disabled:opacity-40 transition-colors"
                      >
                        {isDeleting ? 'Deleting...' : 'Permanently Delete Account'}
                      </button>
                      <button
                        onClick={() => {
                          setShowDeleteConfirm(false)
                          setDeleteConfirmText('')
                          setDeleteError('')
                        }}
                        className="border border-white/20 px-4 py-2 font-mono text-xs uppercase text-dim hover:text-ink transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="border border-live/40 bg-live/10 px-4 py-2 font-mono text-xs uppercase text-live hover:bg-live/20 transition-colors"
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
