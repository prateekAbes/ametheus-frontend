import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router'
import { Container, Hud, Avatar, Crest, Badge, Brackets, Particles, EmptyState, Cta, Modal } from '../components/ui'
import { GAMES, gameBy, inr, AVATARS, img } from '../lib/data'
import { useAuthContext } from '../context/AuthContext'
import { resolveMediaUrl } from '../services/apiClient'
import DynamicImage from '../components/DynamicImage'
import { getMyTeams, type Team } from '../services/teams'
import { getMyRegistrations, type UserRegistrationItem } from '../services/tournaments'
import { getMatches, mapApiMatchToUiMatch } from '../services/matches'
import { getAvailableCrests, type Crest as CrestType } from '../services/crests'
import { updateUserProfile } from '../services/auth'
import { uploadMediaFile } from '../services/admin'

import { getSupportTickets, formatTicketStatus, type SupportTicket } from '../services/support'

type FeedFilter = 'ALL' | 'ACTIVE' | 'UPCOMING' | 'COMPLETED'

export default function Profile() {
  const { profile, role, displayName: authDisplayName, avatarUrl: authAvatarUrl, googleAvatarUrl, isSignedIn, refreshProfile, updateLocalProfile } = useAuthContext()
  const [teams, setTeams] = useState<Team[]>([])
  const [registrations, setRegistrations] = useState<UserRegistrationItem[]>([])
  const [matches, setMatches] = useState<any[]>([])
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [isLoadingFeed, setIsLoadingFeed] = useState(true)
  const [feedFilter, setFeedFilter] = useState<FeedFilter>('ALL')

  // Player Crest & Avatar Customization States
  const [isCrestModalOpen, setIsCrestModalOpen] = useState(false)
  const [availableCrests, setAvailableCrests] = useState<CrestType[]>([])
  const [isUploadingCrest, setIsUploadingCrest] = useState(false)
  const [crestModalMsg, setCrestModalMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  useEffect(() => {
    if (!isSignedIn) {
      setIsLoadingFeed(false)
      return
    }

    setIsLoadingFeed(true)
    Promise.allSettled([
      getMyTeams(),
      getMyRegistrations(),
      getMatches(),
      getSupportTickets(),
    ]).then(([teamsRes, regsRes, matchRes, tixRes]) => {
      let teamNames: string[] = []
      if (teamsRes.status === 'fulfilled' && Array.isArray(teamsRes.value)) {
        setTeams(teamsRes.value)
        teamNames = teamsRes.value.map((t) => t.name)
      }
      if (profile?.username) teamNames.push(profile.username)

      if (regsRes.status === 'fulfilled' && Array.isArray(regsRes.value)) {
        setRegistrations(regsRes.value)
      }

      if (matchRes.status === 'fulfilled' && Array.isArray(matchRes.value)) {
        const mapped = matchRes.value.map(mapApiMatchToUiMatch)
        const userMatches = mapped.filter((m) =>
          teamNames.some(
            (tn) =>
              tn.toLowerCase() === m.a.toLowerCase() ||
              tn.toLowerCase() === m.b.toLowerCase()
          )
        )
        setMatches(userMatches)
      }

      if (tixRes.status === 'fulfilled' && Array.isArray(tixRes.value)) {
        setTickets(tixRes.value)
      }
      setIsLoadingFeed(false)
    })
  }, [isSignedIn, profile?.username])

  useEffect(() => {
    getAvailableCrests().then(setAvailableCrests).catch(() => {})
  }, [])

  const handleSelectCrest = async (crest: CrestType) => {
    setCrestModalMsg(null)
    try {
      const updated = await updateUserProfile({ avatar_url: crest.image_url, avatar_source: 'CREST' })
      if (updated) {
        updateLocalProfile(updated)
      } else {
        updateLocalProfile({ avatar_url: crest.image_url, avatar_source: 'CREST' })
      }
      await refreshProfile()
      window.dispatchEvent(new CustomEvent('ametheus:profile_updated'))
      setCrestModalMsg({ type: 'ok', text: `Crest '${crest.name}' successfully equipped and saved!` })
      setTimeout(() => setCrestModalMsg(null), 4000)
    } catch (err: any) {
      setCrestModalMsg({ type: 'err', text: err.message || 'Failed to equip crest.' })
    }
  }

  const handleEquipGooglePhoto = async () => {
    if (!googleAvatarUrl) return
    setCrestModalMsg(null)
    try {
      const updated = await updateUserProfile({ avatar_url: googleAvatarUrl, avatar_source: 'GOOGLE' })
      if (updated) {
        updateLocalProfile(updated)
      } else {
        updateLocalProfile({ avatar_url: googleAvatarUrl, avatar_source: 'GOOGLE' })
      }
      await refreshProfile()
      window.dispatchEvent(new CustomEvent('ametheus:profile_updated'))
      setCrestModalMsg({ type: 'ok', text: 'Google Profile Photo successfully equipped and saved!' })
      setTimeout(() => setCrestModalMsg(null), 4000)
    } catch (err: any) {
      setCrestModalMsg({ type: 'err', text: err.message || 'Failed to equip Google profile photo.' })
    }
  }

  const handleUploadAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploadingCrest(true)
    setCrestModalMsg(null)
    try {
      const res = await uploadMediaFile(file)
      if (res && res.url) {
        const updated = await updateUserProfile({ avatar_url: res.url, avatar_source: 'UPLOADED' })
        if (updated) {
          updateLocalProfile(updated)
        } else {
          updateLocalProfile({ avatar_url: res.url, avatar_source: 'UPLOADED' })
        }
        await refreshProfile()
        window.dispatchEvent(new CustomEvent('ametheus:profile_updated'))
        setCrestModalMsg({ type: 'ok', text: 'Custom avatar uploaded and saved to your account!' })
        setTimeout(() => setCrestModalMsg(null), 4000)
      }
    } catch (err: any) {
      setCrestModalMsg({ type: 'err', text: err.message || 'Failed to upload image.' })
    } finally {
      setIsUploadingCrest(false)
    }
  }

  const username = profile?.username || authDisplayName || profile?.display_name || 'Player'
  const email = profile?.email || 'player@ametheus.gg'
  const balanceInr = profile?.inr_balance_paise ? profile.inr_balance_paise / 100 : 0
  const rawAvatar = profile?.avatar_url || authAvatarUrl
  const avatarDisplay = rawAvatar ? resolveMediaUrl(rawAvatar) : img(AVATARS[0], 800)

  // Filter registrations by participation lifecycle
  const filteredFeed = useMemo(() => {
    return registrations.filter((r) => {
      const s = (r.tournament_status || '').toUpperCase()
      const isActive = s === 'LIVE' || s === 'ONGOING' || s === 'IN_PROGRESS'
      const isCompleted = s === 'COMPLETED' || s === 'FINISHED' || s === 'CONCLUDED'
      const isUpcoming =
        s === 'REGISTRATION_OPEN' ||
        s === 'REGISTRATION_CLOSED' ||
        s === 'UPCOMING' ||
        s === 'SCHEDULED'

      if (feedFilter === 'ACTIVE') return isActive
      if (feedFilter === 'UPCOMING') return isUpcoming
      if (feedFilter === 'COMPLETED') return isCompleted
      return true
    })
  }, [registrations, feedFilter])

  // Count metrics for feed badges
  const activeCount = registrations.filter((r) => {
    const s = (r.tournament_status || '').toUpperCase()
    return s === 'LIVE' || s === 'ONGOING' || s === 'IN_PROGRESS'
  }).length

  const upcomingCount = registrations.filter((r) => {
    const s = (r.tournament_status || '').toUpperCase()
    return (
      s === 'REGISTRATION_OPEN' ||
      s === 'REGISTRATION_CLOSED' ||
      s === 'UPCOMING' ||
      s === 'SCHEDULED'
    )
  }).length

  const completedCount = registrations.filter((r) => {
    const s = (r.tournament_status || '').toUpperCase()
    return s === 'COMPLETED' || s === 'FINISHED' || s === 'CONCLUDED'
  }).length

  const completedMatches = matches.filter((m) => m.status === 'completed' || m.score)

  // Past Tournaments participated in by user
  const pastTournaments = useMemo(() => {
    return registrations.filter((r) => {
      const s = (r.tournament_status || '').toUpperCase()
      return s === 'COMPLETED' || s === 'FINISHED' || s === 'CONCLUDED' || s === 'ARCHIVED'
    })
  }, [registrations])

  // Open support tickets for user
  const openTickets = useMemo(() => {
    return tickets.filter((t) => {
      const val = formatTicketStatus(t.status).value
      return val === 'OPEN' || val === 'IN_PROGRESS' || val === 'WAITING_FOR_USER'
    })
  }, [tickets])


  return (
    <div className="bg-void pb-28">
      <section className="relative overflow-hidden pt-32">
        <div className="absolute inset-0 bg-gradient-to-t from-void via-void/80 to-void/40" />
        {/* Subtle atmospheric crimson and amber ambient glow */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 size-[520px] rounded-full bg-rose-950/20 blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 size-[420px] rounded-full bg-amber-950/15 blur-[130px] pointer-events-none" />
        <Particles n={20} />

        <Container className="relative grid items-end gap-10 pb-14 md:grid-cols-[minmax(260px,360px)_1fr]">
          {/* PLAYER AVATAR CARD */}
          <div className="relative border border-white/10 bg-gradient-to-b from-[#121622]/95 via-[#0D101A]/95 to-[#080A10]/98 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl group/avatar-card">
            <Brackets color="border-rose-500/40" />
            <div className="relative overflow-hidden rounded-[2px] bg-[#05060A] border border-white/10 group-hover/avatar-card:border-rose-500/40 transition-colors duration-500 group">
              {/* Online / Match Ready Status Jewel */}
              <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#080A10]/90 border border-emerald-500/40 backdrop-blur-md shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#34d399]" />
                <span className="font-mono text-[9px] font-bold text-emerald-300 tracking-wider">ONLINE</span>
              </div>

              <DynamicImage
                src={avatarDisplay}
                alt={username}
                eager
                className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#080A10] via-transparent to-transparent opacity-90" />
              
              <button
                type="button"
                onClick={() => setIsCrestModalOpen(true)}
                className="absolute inset-x-3 bottom-3 border border-rose-500/40 bg-[#0B0E16]/90 py-2.5 font-mono text-[11px] font-bold uppercase tracking-wider text-rose-200 hover:bg-rose-600 hover:text-white hover:border-rose-500 transition-all cursor-pointer shadow-xl backdrop-blur-md flex items-center justify-center gap-1.5"
              >
                <span>✎ Change Crest / Avatar</span>
              </button>
            </div>

            <div className="mt-3.5 flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_#f43f5e]" />
                <Hud className="text-slate-300 font-bold tracking-widest text-[10px]">VERIFIED ATHLETE</Hud>
              </div>
              <Badge
                s={role === 'SUPER_ADMIN' ? 'live' : role === 'ORGANIZER' ? 'active' : 'default'}
                label={role === 'SUPER_ADMIN' ? 'SUPER ADMIN' : role}
              />
            </div>
          </div>

          {/* IDENTITY & KEY INFORMATION BLOCK */}
          <div className="flex flex-col justify-end">
            {/* Metadata & Identity Row */}
            <div className="flex flex-wrap items-center gap-2.5 mb-2.5">
              <Hud className="text-rose-400 font-bold tracking-widest">ESPORTS IDENTITY</Hud>
              <span
                className={`font-mono text-[9px] uppercase tracking-[0.18em] px-2.5 py-0.5 border ${
                  role === 'SUPER_ADMIN'
                    ? 'border-rose-500/40 bg-rose-500/10 text-rose-300 font-bold shadow-[0_0_10px_rgba(244,63,94,0.15)]'
                    : role === 'ORGANIZER'
                    ? 'border-cyan/40 bg-cyan/10 text-cyan font-bold'
                    : 'border-white/20 bg-white/5 text-slate-300 font-semibold'
                }`}
              >
                {role === 'SUPER_ADMIN' ? 'ROOT CONTENDER' : role}
              </span>

              {profile?.privacy_settings?.visibility && (
                <span className="font-mono text-[9px] uppercase tracking-[0.18em] px-2.5 py-0.5 border border-white/15 bg-white/5 text-slate-400">
                  VISIBILITY: {profile.privacy_settings.visibility}
                </span>
              )}
            </div>

            {/* Prominent Player Username */}
            <h1 className="reveal font-display text-4xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tight text-white leading-none drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
              {username}
            </h1>

            {/* Key Information Micro-Panels */}
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-3.5 hover:border-rose-500/30 transition-all rounded-[2px] shadow-sm">
                <Hud className="text-slate-400 tracking-[0.16em]">EMAIL IDENTITY</Hud>
                <p className="mt-1 font-mono text-xs font-semibold text-slate-200 truncate" title={email}>{email}</p>
              </div>
              <div className="border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-3.5 hover:border-rose-500/30 transition-all rounded-[2px] shadow-sm">
                <Hud className="text-slate-400 tracking-[0.16em]">ACCOUNT ROLE</Hud>
                <p className="mt-1 font-display text-base font-black uppercase text-rose-300 truncate">{role}</p>
              </div>
              <div className="border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-3.5 hover:border-amber-500/30 transition-all rounded-[2px] shadow-sm">
                <Hud className="text-slate-400 tracking-[0.16em]">AMETHEUS VAULT</Hud>
                <p className="mt-1 font-display text-base font-black uppercase text-amber-300 truncate">{inr(balanceInr)}</p>
              </div>
              <div className="border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-3.5 hover:border-rose-500/30 transition-all rounded-[2px] shadow-sm">
                <Hud className="text-slate-400 tracking-[0.16em]">ACTIVE TEAMS</Hud>
                <p className="mt-1 font-display text-base font-black uppercase text-white truncate">{teams.length} Squads</p>
              </div>
            </div>

            {/* Profile Action Buttons */}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setIsCrestModalOpen(true)}
                className="border border-rose-500/80 bg-gradient-to-r from-rose-600 via-rose-600 to-rose-700 px-5 py-2.5 font-display text-xs font-black uppercase tracking-wider text-white hover:from-rose-500 hover:to-rose-600 transition-all cursor-pointer shadow-[0_0_20px_rgba(225,29,72,0.3)] flex items-center gap-1.5"
              >
                <span>★ Select Crest / Avatar</span>
              </button>
              <Link
                to="/settings"
                className="border border-white/15 bg-white/[0.05] hover:bg-white/[0.09] hover:border-white/30 px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-slate-200 transition-all flex items-center gap-1.5"
              >
                Edit Profile
              </Link>
              <Link
                to="/wallet"
                className="border border-amber-500/40 bg-amber-500/10 hover:border-amber-400/60 hover:bg-amber-500/20 px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-amber-300 transition-all flex items-center gap-1.5"
              >
                Manage Wallet
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* METRICS & PERFORMANCE TELEMETRY SECTION */}
      <Container>
        <div className="grid grid-cols-2 gap-3.5 md:grid-cols-4">
          {[
            ['Registered Teams', String(teams.length), 'Active Squads'],
            ['Ametheus Vault', inr(balanceInr), 'Verified Balance'],
            ['Registered Events', String(registrations.length), 'Tournaments Played'],
            ['Regional Division', 'India (IN)', 'Official Server'],
          ].map(([k, v, sub], i) => (
            <div
              key={k}
              className="relative overflow-hidden border border-white/[0.09] bg-gradient-to-b from-[#111624]/90 via-[#0B0E16]/95 to-[#06080D]/98 p-5 md:p-6 shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-rose-500/40 group"
            >
              {/* Top Directional Edge Highlight Beam */}
              <div
                className={`h-[2px] w-8 group-hover:w-full transition-all duration-500 mb-3.5 ${
                  i === 1
                    ? 'bg-gradient-to-r from-amber-400 via-amber-300 to-amber-600'
                    : 'bg-gradient-to-r from-rose-500 via-rose-600 to-rose-800'
                }`}
              />
              <Hud className="text-slate-400 font-bold tracking-[0.2em]">{k}</Hud>
              <p
                className={`mt-2 font-display text-3xl sm:text-4xl lg:text-5xl font-black leading-none tabular-nums ${
                  i === 1 ? 'text-amber-300' : 'text-white'
                }`}
              >
                {v}
              </p>
              <div className="mt-2.5 flex items-center gap-1.5 font-mono text-[10px] uppercase text-slate-500 tracking-wider">
                <span
                  className={`size-1 rounded-full ${
                    i === 1 ? 'bg-amber-400' : 'bg-rose-500'
                  } opacity-75`}
                />
                <span>{sub}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 grid gap-12 lg:grid-cols-2">
          {/* LEFT: Past Tournaments & My Teams */}
          <div className="space-y-12">
            {/* PAST TOURNAMENTS (Career Participation & Results) */}
            <div>
              <div className="flex items-center justify-between">
                <Hud className="text-cyan">◇ Past Tournaments</Hud>
                <span className="font-mono text-[10px] uppercase text-dim tracking-wider">
                  {pastTournaments.length} Concluded
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {pastTournaments.length === 0 ? (
                  <div className="border border-white/10 bg-surface/30 p-6 text-center">
                    <p className="font-mono text-xs uppercase tracking-wider text-dim">
                      No concluded tournaments yet
                    </p>
                    <p className="mt-1 text-xs text-dim">
                      Your historical placements, prize distribution, and final match standings appear here once official platform tournaments conclude.
                    </p>
                    <div className="mt-4">
                      <Link
                        to="/tournaments"
                        className="inline-block border border-cyan/40 bg-cyan/10 px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-cyan hover:bg-cyan hover:text-void transition-colors"
                      >
                        Browse Tournaments
                      </Link>
                    </div>
                  </div>
                ) : (
                  pastTournaments.map((pt) => {
                    const g = gameBy(pt.game_slug || 'valorant')
                    const formattedDate = pt.starts_at
                      ? new Date(pt.starts_at).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'Concluded'

                    return (
                      <div
                        key={pt.registration_id}
                        className="border border-white/10 bg-surface/40 p-4 transition-all hover:border-cyan/40"
                        style={{ borderLeft: `3px solid ${g.accent}` }}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className="font-display text-xs font-black tracking-wider uppercase"
                              style={{ color: g.accent }}
                            >
                              {g.short}
                            </span>
                            <span className="text-white/20">·</span>
                            <Hud>{formattedDate}</Hud>
                          </div>
                          <Badge s="completed" label="CONCLUDED" />
                        </div>
                        <h4 className="mt-2 font-display text-xl font-black uppercase text-white">
                          {pt.tournament_title}
                        </h4>
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-dim border-t border-white/5 pt-2">
                          <span>
                            Squad:{' '}
                            <strong className="text-ink">
                              {pt.team_name ? `${pt.team_name} [${pt.team_tag || 'TEAM'}]` : 'Solo Contender'}
                            </strong>
                          </span>
                          <span className="text-cyan font-bold">
                            Prize: {inr(pt.prize_pool_inr)}
                          </span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* MY TEAMS */}
            <div>
              <div className="flex items-center justify-between">
                <Hud className="text-cyan">◇ My Teams</Hud>
                <div className="flex items-center gap-2">
                  <Link
                    to="/teams/create"
                    className="font-mono text-[10px] uppercase tracking-wider text-cyan hover:underline"
                  >
                    + Create Team
                  </Link>
                  <span className="text-white/20">·</span>
                  <Link
                    to="/teams/join"
                    className="font-mono text-[10px] uppercase tracking-wider text-violet hover:underline"
                  >
                    Join Team
                  </Link>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {teams.length === 0 ? (
                  <div className="col-span-2 border border-white/10 bg-surface/30 p-6 text-center text-dim text-sm">
                    No active team memberships.{' '}
                    <Link to="/teams/create" className="text-cyan hover:underline">
                      Create a team
                    </Link>{' '}
                    or{' '}
                    <Link to="/teams/join" className="text-violet hover:underline">
                      join one with an invite code
                    </Link>
                    .
                  </div>
                ) : (
                  teams.map((team) => (
                    <Link
                      key={team.id || (team as any)._id}
                      to="/teams"
                      className="group flex items-center gap-4 border border-white/10 bg-surface/40 p-4 transition-all hover:border-cyan/40 hover:bg-surface/70"
                    >
                      <Crest name={team.name} size={44} />
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-lg font-black uppercase text-white group-hover:text-cyan transition-colors truncate">
                          {team.name}
                        </p>
                        <Hud className="mt-0.5 block truncate">
                          [{team.tag}] · {team.members?.length || 1} members
                        </Hud>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Intelligent Authoritative Tournament Feed */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Hud className="text-cyan">◇ Tournament Feed</Hud>
              <div className="flex gap-1">
                {(
                  [
                    ['ALL', `All (${registrations.length})`],
                    ['ACTIVE', `Active (${activeCount})`],
                    ['UPCOMING', `Upcoming (${upcomingCount})`],
                    ['COMPLETED', `Played (${completedCount})`],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setFeedFilter(key as FeedFilter)}
                    className={`px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors border ${
                      feedFilter === key
                        ? 'border-cyan bg-cyan/10 text-cyan'
                        : 'border-white/10 text-dim hover:text-ink hover:bg-white/5'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              {isLoadingFeed ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((n) => (
                    <div
                      key={`skeleton-${n}`}
                      className="border border-white/10 bg-surface/50 p-4 space-y-2 animate-pulse"
                    >
                      <div className="h-3 w-24 bg-white/10" />
                      <div className="h-6 w-3/4 bg-white/10" />
                      <div className="h-3 w-1/2 bg-white/10" />
                    </div>
                  ))}
                </div>
              ) : filteredFeed.length === 0 ? (
                <EmptyState
                  code="00"
                  title={
                    feedFilter === 'ALL'
                      ? 'No tournament entries'
                      : `No ${feedFilter.toLowerCase()} tournaments`
                  }
                  body="Browse platform tournaments and register with your squad to participate."
                  cta="Browse Tournaments"
                  to="/tournaments"
                />
              ) : (
                <ol className="border-l border-white/10 space-y-1">
                  {filteredFeed.map((r) => {
                    const g = gameBy(r.game_slug || 'valorant')
                    const s = (r.tournament_status || '').toUpperCase()
                    const isActive = s === 'LIVE' || s === 'ONGOING' || s === 'IN_PROGRESS'
                    const isCompleted = s === 'COMPLETED' || s === 'FINISHED' || s === 'CONCLUDED'
                    const isCancelled = s === 'CANCELLED' || s === 'VOIDED'

                    const badgeVariant = isActive
                      ? 'live'
                      : isCompleted
                      ? 'completed'
                      : isCancelled
                      ? 'default'
                      : 'confirmed'

                    const badgeLabel = isActive
                      ? 'LIVE MATCH'
                      : isCompleted
                      ? 'COMPLETED'
                      : isCancelled
                      ? 'CANCELLED'
                      : 'REGISTERED'

                    const formattedDate = r.starts_at
                      ? new Date(r.starts_at).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                        })
                      : 'TBD'

                    return (
                      <li key={r.registration_id} className="relative pb-5 pl-6 group">
                        <span
                          className="absolute -left-[5px] top-2 size-2.5 rotate-45 transition-transform group-hover:scale-125"
                          style={{ background: g.accent }}
                        />
                        <Link
                          to={`/tournaments/${r.tournament_slug || r.tournament_id}`}
                          className="block border border-white/10 bg-surface/40 p-4 transition-all hover:bg-surface/80 hover:border-cyan/40"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span
                                className="font-display text-xs font-black tracking-wider"
                                style={{ color: g.accent }}
                              >
                                {g.short}
                              </span>
                              <span className="text-white/20">·</span>
                              <Hud>{formattedDate}</Hud>
                            </div>
                            <Badge s={badgeVariant} label={badgeLabel} />
                          </div>

                          <h4 className="mt-2 font-display text-2xl font-black uppercase group-hover:text-cyan transition-colors">
                            {r.tournament_title}
                          </h4>

                          <div className="mt-3 flex flex-wrap items-center justify-between gap-4 border-t border-white/5 pt-3 font-mono text-xs text-dim">
                            <span>
                              {r.team_name ? (
                                <strong className="text-ink">
                                  {r.team_name} [{r.team_tag || 'TEAM'}]
                                </strong>
                              ) : (
                                'Solo Contender'
                              )}
                            </span>
                            <span className="text-cyan font-bold">
                              Prize: {inr(r.prize_pool_inr)}
                            </span>
                          </div>
                        </Link>
                      </li>
                    )
                  })}
                </ol>
              )}
            </div>
          </div>
        </div>

        {/* MY OPEN TICKETS */}
        <div className="mt-16">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Hud className="text-cyan">◇ My Open Tickets</Hud>
              <span className="border border-white/20 bg-surface/50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ink">
                {openTickets.length} Active
              </span>
            </div>
            <Link
              to="/support"
              className="font-mono text-xs text-cyan hover:underline uppercase tracking-wider"
            >
              Support Helpdesk →
            </Link>
          </div>

          <div className="mt-4">
            {openTickets.length === 0 ? (
              <div className="border border-white/10 bg-surface/30 p-8 text-center">
                <p className="font-mono text-xs text-dim uppercase tracking-wider">
                  No open support tickets
                </p>
                <p className="mt-1 text-sm text-dim">
                  All payment reconciliations, bracket disputes, and account queries are resolved.
                </p>
                <div className="mt-4">
                  <Link
                    to="/support"
                    className="inline-block border border-cyan/40 bg-cyan/10 px-4 py-2 font-mono text-xs uppercase tracking-wider text-cyan hover:bg-cyan hover:text-void transition-colors"
                  >
                    Open New Support Ticket
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {openTickets.map((t) => {
                  const statusInfo = formatTicketStatus(t.status)
                  const isWaitingUser = statusInfo.value === 'WAITING_FOR_USER'
                  const tId = t.ticket_id || t.id.slice(0, 8)
                  const createdDate = t.created_at
                    ? new Date(t.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'Recent'
                  const lastActivity = t.last_message_at
                    ? new Date(t.last_message_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : createdDate

                  return (
                    <Link
                      key={t.id}
                      to="/support"
                      className="group border border-white/10 bg-surface/40 p-5 transition-all hover:border-cyan/40 hover:bg-surface/70 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs font-bold text-cyan">
                            #{tId}
                          </span>
                          <span
                            className={`border px-2 py-0.5 font-mono text-[9px] uppercase font-bold tracking-wider ${statusInfo.badgeClass}`}
                          >
                            {statusInfo.label}
                          </span>
                        </div>

                        <h4 className="mt-3 font-display text-lg font-black uppercase text-white group-hover:text-cyan transition-colors truncate">
                          {t.subject || t.category || 'Support Inquiry'}
                        </h4>

                        <div className="mt-2">
                          <span
                            className={`inline-block border px-2 py-0.5 font-mono text-[10px] uppercase font-bold tracking-wider ${
                              isWaitingUser
                                ? 'border-warn/60 bg-warn/15 text-warn'
                                : 'border-cyan/40 bg-cyan/10 text-cyan'
                            }`}
                          >
                            {isWaitingUser ? 'Waiting for Your Response' : 'Waiting for Support'}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 border-t border-white/5 pt-3 flex items-center justify-between font-mono text-[10px] text-dim">
                        <span>Created: {createdDate}</span>
                        <span>Activity: {lastActivity}</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM: Actual Match History */}
        <div className="mt-16">
          <div className="flex items-center justify-between">
            <Hud className="text-cyan">◇ Match Arena History</Hud>
            <Link
              to="/my/matches"
              className="font-mono text-xs text-cyan hover:underline uppercase tracking-wider"
            >
              View Full Match Log →
            </Link>
          </div>

          <div className="mt-4">
            {profile?.privacy_settings?.show_matches === false ? (
              <div className="border border-white/10 bg-surface/30 p-8 text-center">
                <p className="font-mono text-xs text-dim uppercase tracking-wider">
                  Public Match History Disabled
                </p>
                <p className="mt-1 text-sm text-dim">
                  Match arena history is currently set to private in your Privacy Settings.
                </p>
                <div className="mt-4">
                  <Link
                    to="/settings#Privacy"
                    className="inline-block border border-cyan/40 bg-cyan/10 px-4 py-2 font-mono text-xs uppercase tracking-wider text-cyan hover:bg-cyan hover:text-void transition-colors"
                  >
                    Adjust Privacy Settings →
                  </Link>
                </div>
              </div>
            ) : completedMatches.length === 0 ? (
              <div className="border border-white/10 bg-surface/30 p-8 text-center">
                <p className="font-mono text-xs text-dim uppercase tracking-wider">
                  No completed match scores recorded yet.
                </p>
                <p className="mt-1 text-sm text-dim">
                  Match arbitration scores appear here once official tournament matches conclude.
                </p>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-3">
                {completedMatches.slice(0, 6).map((m) => (
                  <Link
                    key={m.id}
                    to={`/matches/${m.id}`}
                    className="border border-white/10 p-5 transition-colors hover:bg-white/[0.03] hover:border-cyan/50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-display text-2xl font-black text-cyan">
                        {m.status ? m.status.toUpperCase() : 'COMPLETED'}
                      </span>
                      <Hud>{m.date || 'RECENT'}</Hud>
                    </div>
                    <p className="mt-3 font-display text-xl font-black uppercase">
                      {m.a} <span className="text-dim">vs</span> {m.b}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <Hud>{m.round || 'Tournament Match'}</Hud>
                      <span className="font-display text-2xl font-black tabular-nums">
                        {m.score ? `${m.score[0]} : ${m.score[1]}` : 'VS'}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </Container>

      {/* PLAYER CREST & AVATAR CUSTOMIZATION MODAL */}
      <Modal
        open={isCrestModalOpen}
        onClose={() => {
          setIsCrestModalOpen(false)
          setCrestModalMsg(null)
        }}
        title="Player Crest & Avatar"
        subtitle="Equip an official operator crest or upload your personal competitive esports avatar."
        maxWidth="max-w-2xl"
      >
        <div className="space-y-6 font-mono text-xs">
          {crestModalMsg && (
            <div
              className={`p-3 border text-xs font-bold ${
                crestModalMsg.type === 'ok'
                  ? 'border-ok/40 bg-ok/10 text-ok'
                  : 'border-live/40 bg-live/10 text-live'
              }`}
            >
              {crestModalMsg.text}
            </div>
          )}

          {/* Current Avatar Preview & Upload Action */}
          <div className="border border-white/10 bg-surface/40 p-4 flex flex-col sm:flex-row items-center gap-5">
            <div className="relative size-20 shrink-0 aspect-square overflow-hidden rounded-[2px] border-2 border-cyan/50 bg-surface">
              <DynamicImage
                src={avatarDisplay}
                alt="Current Avatar"
                className="size-full aspect-square object-cover object-center"
              />
            </div>
            <div className="flex-1 text-center sm:text-left space-y-2">
              <Hud className="text-cyan">Current Equipped Avatar</Hud>
              <p className="text-[11px] text-dim">
                Persisted to your account and visible on leaderboards, match lobbies, reviews, and team rosters.
              </p>
              <label className="inline-block cursor-pointer border border-cyan/40 bg-cyan/10 px-4 py-1.5 font-mono text-xs uppercase text-cyan hover:bg-cyan/20 transition-colors">
                {isUploadingCrest ? 'Uploading...' : '↑ Upload Custom Image'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={isUploadingCrest}
                  onChange={handleUploadAvatarFile}
                />
              </label>
            </div>
          </div>

          {/* Voluntary Google Profile Picture Option */}
          {googleAvatarUrl && (
            <div className="border border-white/10 bg-surface/40 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="size-14 shrink-0 aspect-square rounded-[2px] border border-white/20 bg-void overflow-hidden">
                  <img
                    src={googleAvatarUrl}
                    alt="Google Profile"
                    className="size-full aspect-square object-cover object-center"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-black uppercase text-sm text-ink">Google Profile Picture</span>
                    {(profile?.avatar_source === 'GOOGLE' || rawAvatar === googleAvatarUrl) && (
                      <span className="text-[10px] font-bold text-cyan uppercase tracking-wider">✓ Equipped</span>
                    )}
                  </div>
                  <p className="text-[11px] text-dim">
                    Voluntarily use your Google / Gmail account picture as your public esports avatar.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleEquipGooglePhoto}
                disabled={profile?.avatar_source === 'GOOGLE' || rawAvatar === googleAvatarUrl}
                className={`px-4 py-2 font-mono text-xs uppercase cursor-pointer border transition-colors shrink-0 ${
                  (profile?.avatar_source === 'GOOGLE' || rawAvatar === googleAvatarUrl)
                    ? 'border-cyan/40 bg-cyan/15 text-cyan cursor-default'
                    : 'border-white/20 hover:border-cyan text-ink hover:text-cyan bg-white/5'
                }`}
              >
                {(profile?.avatar_source === 'GOOGLE' || rawAvatar === googleAvatarUrl) ? 'Equipped' : 'Equip Google Photo'}
              </button>
            </div>
          )}

          {/* Sanctioned Operator Crests Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Hud className="text-cyan">Available Sanctioned Crests ({availableCrests.length})</Hud>
              <span className="text-[10px] text-dim">Click to equip instantly</span>
            </div>

            {availableCrests.length === 0 ? (
              <div className="p-8 border border-dashed border-white/10 text-center text-dim">
                Loading official crest catalog...
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                {availableCrests.map((c) => {
                  const isSelected =
                    rawAvatar === c.image_url ||
                    avatarDisplay === c.image_url

                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectCrest(c)}
                      className={`text-left p-3 border transition-all flex items-center gap-3.5 cursor-pointer ${
                        isSelected
                          ? 'border-cyan bg-cyan/15 ring-1 ring-cyan shadow-[0_0_12px_rgba(62,242,255,0.2)]'
                          : 'border-white/10 bg-surface/50 hover:border-white/30 hover:bg-surface'
                      }`}
                    >
                      <div className={`size-12 shrink-0 aspect-square rounded-[2px] border overflow-hidden flex items-center justify-center bg-void transition-colors ${
                        isSelected ? 'border-cyan ring-1 ring-cyan/60 shadow-[0_0_12px_rgba(62,242,255,0.3)]' : 'border-white/20'
                      }`}>
                        <img
                          src={resolveMediaUrl(c.image_url)}
                          alt={c.name}
                          className="size-full aspect-square object-cover object-center"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className="font-display font-black uppercase text-sm text-ink truncate">
                            {c.name}
                          </p>
                          {isSelected && (
                            <span className="text-[9px] font-bold text-cyan uppercase shrink-0">
                              ✓ Equipped
                            </span>
                          )}
                        </div>
                        {c.description && (
                          <p className="font-sans text-[11px] text-dim line-clamp-2 mt-0.5 leading-tight">
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

          <div className="pt-3 border-t border-white/10 flex justify-end">
            <button
              type="button"
              onClick={() => {
                setIsCrestModalOpen(false)
                setCrestModalMsg(null)
              }}
              className="border border-white/20 px-5 py-2 uppercase text-dim hover:text-ink cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
