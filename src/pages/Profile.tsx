import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router'
import { Container, Hud, Avatar, Crest, Badge, Brackets, Particles, EmptyState, Cta } from '../components/ui'
import { GAMES, gameBy, inr, AVATARS } from '../lib/data'
import { useAuthContext } from '../context/AuthContext'
import { resolveMediaUrl } from '../services/apiClient'
import { getMyTeams, type Team } from '../services/teams'
import { getMyRegistrations, type UserRegistrationItem } from '../services/tournaments'
import { getMatches, mapApiMatchToUiMatch } from '../services/matches'

const RANKS: Record<string, [string, number]> = {
  bgmi: ['Conqueror', 212],
  valorant: ['Immortal II', 88],
  'free-fire': ['Grandmaster', 140],
  codm: ['Legendary', 64],
}

type FeedFilter = 'ALL' | 'ACTIVE' | 'UPCOMING' | 'COMPLETED'

export default function Profile() {
  const { profile, role, displayName: authDisplayName, avatarUrl: authAvatarUrl, isSignedIn } = useAuthContext()
  const [teams, setTeams] = useState<Team[]>([])
  const [registrations, setRegistrations] = useState<UserRegistrationItem[]>([])
  const [matches, setMatches] = useState<any[]>([])
  const [isLoadingFeed, setIsLoadingFeed] = useState(true)
  const [feedFilter, setFeedFilter] = useState<FeedFilter>('ALL')

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
    ]).then(([teamsRes, regsRes, matchRes]) => {
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
      setIsLoadingFeed(false)
    })
  }, [isSignedIn, profile?.username])

  const username = authDisplayName || profile?.display_name || profile?.username || 'Player'
  const email = profile?.email || 'player@ametheus.gg'
  const balanceInr = profile?.inr_balance_paise ? profile.inr_balance_paise / 100 : 0
  const avatarUrl = authAvatarUrl || resolveMediaUrl(profile?.avatar_url) || AVATARS[0]

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

  return (
    <div className="bg-void pb-28">
      <section className="relative overflow-hidden pt-32">
        <div className="absolute inset-0 bg-gradient-to-t from-void via-void/80 to-void/40" />
        <Particles n={20} />
        <Container className="relative grid items-end gap-10 pb-16 md:grid-cols-[minmax(260px,380px)_1fr]">
          <div className="relative border border-white/15 bg-surface p-3">
            <Brackets color="border-cyan/70" />
            <img
              src={resolveMediaUrl(avatarUrl) || AVATARS[0]}
              alt={username}
              className="aspect-[4/5] w-full object-cover"
            />
            <div className="flex items-center justify-between p-3">
              <Hud>Player Card</Hud>
              <Badge
                s={role === 'SUPER_ADMIN' ? 'live' : role === 'ORGANIZER' ? 'active' : 'default'}
                label={role}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-3">
              <Hud className="text-cyan">◇ Esports identity</Hud>
              <span
                className={`font-mono text-[9px] uppercase tracking-[0.16em] px-2 py-0.5 border ${
                  role === 'SUPER_ADMIN'
                    ? 'border-magenta/40 bg-magenta/10 text-magenta'
                    : role === 'ORGANIZER'
                    ? 'border-cyan/40 bg-cyan/10 text-cyan'
                    : 'border-white/20 bg-white/5 text-dim'
                }`}
              >
                {role === 'SUPER_ADMIN' ? 'ROOT CONTENDER' : role}
              </span>
            </div>
            <h1 className="reveal mt-1 font-display text-[clamp(4.5rem,15vw,13rem)] font-black uppercase leading-[0.8]">
              {username}
            </h1>
            <div className="mt-8 grid grid-cols-2 gap-6 border-t border-white/10 pt-6 sm:grid-cols-4">
              {[
                ['Email', email],
                ['Account Role', role],
                ['Wallet Balance', inr(balanceInr)],
                ['Active Teams', String(teams.length)],
              ].map(([k, v]) => (
                <div key={k}>
                  <Hud>{k}</Hud>
                  <p className="mt-1 font-display text-lg font-black uppercase truncate">{v}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex gap-3">
              <Link
                to="/settings"
                className="border border-white/20 bg-surface px-4 py-2 font-mono text-xs uppercase tracking-wider text-ink hover:border-cyan hover:text-cyan transition-colors"
              >
                Edit Profile
              </Link>
              <Link
                to="/wallet"
                className="border border-cyan/40 bg-cyan/10 px-4 py-2 font-mono text-xs uppercase tracking-wider text-cyan hover:bg-cyan hover:text-void transition-colors"
              >
                Manage Wallet
              </Link>
            </div>
          </div>
        </Container>
      </section>

      <Container>
        <div className="grid grid-cols-2 gap-px border border-white/10 bg-white/10 md:grid-cols-4">
          {[
            ['Registered Teams', String(teams.length)],
            ['Wallet Funds', inr(balanceInr)],
            ['Registered Events', String(registrations.length)],
            ['Regional Division', 'India (IN)'],
          ].map(([k, v], i) => (
            <div key={k} className="bg-void p-6 md:p-8">
              <Hud>{k}</Hud>
              <p
                className={`mt-2 font-display text-[clamp(2.5rem,5vw,4.5rem)] font-black leading-none ${
                  i === 1 ? 'text-cyan' : ''
                }`}
              >
                {v}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-16 grid gap-12 lg:grid-cols-2">
          {/* LEFT: Game Roster & Teams */}
          <div>
            <Hud className="text-cyan">◇ Games & Competitions</Hud>
            <div className="mt-4 space-y-2">
              {GAMES.map((g) => (
                <div
                  key={g.slug}
                  className="flex items-center gap-4 border border-white/10 p-4"
                  style={{ borderLeft: `3px solid ${g.accent}` }}
                >
                  <span
                    className="w-28 font-display text-lg font-black tracking-[0.1em]"
                    style={{ color: g.accent }}
                  >
                    {g.short}
                  </span>
                  <span className="flex-1 font-display text-xl font-black uppercase">
                    {RANKS[g.slug]?.[0] || 'Ranked'}
                  </span>
                  <Hud>{g.squad}</Hud>
                </div>
              ))}
            </div>

            <Hud className="mt-12 block text-cyan">◇ Your Rosters</Hud>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {teams.length === 0 ? (
                <div className="col-span-2 border border-white/10 p-6 text-center text-dim text-sm">
                  No active teams.{' '}
                  <Link to="/teams/create" className="text-cyan hover:underline">
                    Create a team
                  </Link>{' '}
                  or{' '}
                  <Link to="/teams/join" className="text-violet hover:underline">
                    join one
                  </Link>
                  .
                </div>
              ) : (
                teams.map((team) => (
                  <Link
                    key={team.id || (team as any)._id}
                    to="/teams"
                    className="flex items-center gap-4 border border-white/10 p-4 hover:border-white/30"
                  >
                    <Crest name={team.name} size={44} />
                    <div>
                      <p className="font-display text-xl font-black uppercase">{team.name}</p>
                      <Hud>[{team.tag}] · {team.members?.length || 1} members</Hud>
                    </div>
                  </Link>
                ))
              )}
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
            {completedMatches.length === 0 ? (
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
    </div>
  )
}
