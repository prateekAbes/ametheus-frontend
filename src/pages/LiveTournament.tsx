import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router'
import { Container, Hud, Dot, Chips, EmptyState } from '../components/ui'
import {
  getTournaments,
  getTournamentBySlug,
  normalizeTournament,
  Tournament,
} from '../services/tournaments'
import { LiveTournamentCard } from '../components/live-tournament/LiveTournamentCard'
import { LiveTournamentDetail } from '../components/live-tournament/LiveTournamentDetail'
import type {
  LiveTournamentItem,
  CompetitionFormat,
  ParticipantFormat,
  TournamentLifecycle,
} from '../components/live-tournament/types'

const STATUS_FILTERS = ['ALL', 'LIVE', 'SCHEDULED', 'COMPLETED'] as const
type StatusFilter = (typeof STATUS_FILTERS)[number]

const GAME_FILTERS = ['All Games', 'BGMI', 'Valorant', 'Free Fire', 'COD Mobile', 'CS2'] as const

/** Normalizes a raw backend tournament into a fully typed LiveTournamentItem */
function toLiveTournamentItem(t: Tournament): LiveTournamentItem {
  const norm = normalizeTournament(t)

  // Competition format: strictly BATTLE_ROYALE or KNOCKOUT
  const fmtLower = (norm.format || (t as any).match_structure || (t as any).tournament_type || '').toLowerCase()
  const competitionFormat: CompetitionFormat =
    fmtLower.includes('battle') || fmtLower.includes('royale') || fmtLower.includes('br')
      ? 'BATTLE_ROYALE'
      : 'KNOCKOUT'

  // Participant format: strictly SOLO or TEAM
  const participantFormat: ParticipantFormat =
    norm.isSolo || (norm.participationMode || '').toUpperCase() === 'SOLO'
      ? 'SOLO'
      : 'TEAM'

  // Lifecycle status: strictly LIVE, SCHEDULED, or COMPLETED
  const stUpper = (norm.status || '').toUpperCase()
  let lifecycleStatus: TournamentLifecycle = 'SCHEDULED'
  if (['LIVE', 'ONGOING', 'IN_PROGRESS'].includes(stUpper)) {
    lifecycleStatus = 'LIVE'
  } else if (['COMPLETED', 'CONCLUDED'].includes(stUpper)) {
    lifecycleStatus = 'COMPLETED'
  } else {
    lifecycleStatus = 'SCHEDULED'
  }

  const streamUrl =
    t.stream_url ||
    t.live_stream_url ||
    (t as any).streamUrl ||
    (t as any).liveStreamUrl ||
    null

  return {
    ...norm,
    competitionFormat,
    participantFormat,
    lifecycleStatus,
    streamUrl,
  }
}

export default function LiveTournament() {
  const params = useParams<{ id?: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  // Selected tournament ID from route param (/live-tournaments/:id) or query param (?id=...)
  const targetId = params.id || searchParams.get('id')

  const [tournaments, setTournaments] = useState<LiveTournamentItem[]>([])
  const [selectedTournament, setSelectedTournament] = useState<LiveTournamentItem | null>(null)
  const [loadingList, setLoadingList] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [errorDetail, setErrorDetail] = useState<string | null>(null)

  // Filters
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [gameFilter, setGameFilter] = useState<string>('All Games')
  const [searchQuery, setSearchQuery] = useState('')

  // 1. Fetch tournament listing
  useEffect(() => {
    let isMounted = true
    setLoadingList(true)

    getTournaments()
      .then((data) => {
        if (!isMounted) return
        const liveItems = (data || []).map(toLiveTournamentItem)
        setTournaments(liveItems)
      })
      .catch(() => {
        if (!isMounted) return
        setTournaments([])
      })
      .finally(() => {
        if (isMounted) setLoadingList(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  // 2. Fetch specific tournament details when targetId is present
  useEffect(() => {
    if (!targetId) {
      setSelectedTournament(null)
      setErrorDetail(null)
      return
    }

    let isMounted = true
    setLoadingDetail(true)
    setErrorDetail(null)

    getTournamentBySlug(targetId)
      .then((data) => {
        if (!isMounted) return
        if (data) {
          setSelectedTournament(toLiveTournamentItem(data))
        } else {
          setErrorDetail('Tournament not found or unverified.')
        }
      })
      .catch((err) => {
        if (!isMounted) return
        setErrorDetail(err?.message || 'Unable to load tournament live center.')
      })
      .finally(() => {
        if (isMounted) setLoadingDetail(false)
      })

    return () => {
      isMounted = false
    }
  }, [targetId])

  // Filtered tournament listing
  const filteredList = useMemo(() => {
    return tournaments.filter((item) => {
      // 1. Lifecycle filter
      if (statusFilter !== 'ALL' && item.lifecycleStatus !== statusFilter) {
        return false
      }

      // 2. Game filter
      if (gameFilter !== 'All Games') {
        const gameLower = (item.gameName || '').toLowerCase()
        const targetLower = gameFilter.toLowerCase()
        if (!gameLower.includes(targetLower)) return false
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const titleMatch = item.title.toLowerCase().includes(q)
        const gameMatch = (item.gameName || '').toLowerCase().includes(q)
        if (!titleMatch && !gameMatch) return false
      }

      return true
    })
  }, [tournaments, statusFilter, gameFilter, searchQuery])

  // Count metrics for quick filter badges
  const liveCount = useMemo(() => tournaments.filter((t) => t.lifecycleStatus === 'LIVE').length, [tournaments])
  const scheduledCount = useMemo(() => tournaments.filter((t) => t.lifecycleStatus === 'SCHEDULED').length, [tournaments])
  const completedCount = useMemo(() => tournaments.filter((t) => t.lifecycleStatus === 'COMPLETED').length, [tournaments])

  const handleSelectTournament = useCallback((item: LiveTournamentItem) => {
    navigate(`/live-tournaments/${item.slug || item.id}`)
  }, [navigate])

  const handleBackToList = useCallback(() => {
    navigate('/live-tournaments')
  }, [navigate])

  return (
    <div className="min-h-[calc(100vh-160px)] bg-void pt-28 pb-20">
      <Container>
        {/* ============================================================ */}
        {/* DETAIL VIEW: Dedicated Tournament View                      */}
        {/* ============================================================ */}
        {targetId ? (
          loadingDetail ? (
            <div className="border border-white/10 bg-surface/30 p-12 text-center space-y-4">
              <span className="size-3 rounded-full bg-cyan inline-block animate-ping" />
              <Hud className="text-cyan block">SYNCHRONIZING LIVE TOURNAMENT DATA...</Hud>
              <p className="font-mono text-xs text-dim">
                Fetching verified tournament progression, broadcast feeds, and official rosters.
              </p>
            </div>
          ) : errorDetail || !selectedTournament ? (
            <div className="border border-dashed border-warn/40 bg-void p-12 text-center space-y-4">
              <Hud className="text-warn">TOURNAMENT NOT FOUND</Hud>
              <h2 className="font-display text-2xl font-black uppercase text-ink">
                Tournament Data Unavailable
              </h2>
              <p className="font-mono text-xs text-dim max-w-md mx-auto">
                {errorDetail || 'The specified tournament could not be located in the official platform registry.'}
              </p>
              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleBackToList}
                  className="border border-white/20 bg-surface px-4 py-2 font-mono text-xs uppercase hover:border-cyan hover:text-cyan transition-colors"
                >
                  ← Return to Live Tournaments Listing
                </button>
              </div>
            </div>
          ) : (
            <LiveTournamentDetail
              tournament={selectedTournament}
              onBack={handleBackToList}
            />
          )
        ) : (
          /* ============================================================ */
          /* LISTING VIEW: Tournament Directory by Status                */
          /* ============================================================ */
          <div className="space-y-8">
            {/* Page Header Block */}
            <div className="border-b border-white/10 pb-8">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2.5">
                    {liveCount > 0 ? (
                      <>
                        <Dot c="bg-live" pulse />
                        <Hud className="text-live font-bold">{liveCount} TOURNAMENT{liveCount === 1 ? '' : 'S'} LIVE NOW</Hud>
                      </>
                    ) : (
                      <>
                        <Dot c="bg-cyan" />
                        <Hud className="text-cyan">COMPETITION HUB</Hud>
                      </>
                    )}
                  </div>
                  <h1 className="mt-2 font-display text-[clamp(2.5rem,5.5vw,4.5rem)] font-black uppercase leading-none text-ink">
                    Live Tournaments
                  </h1>
                  <p className="mt-2 text-xs sm:text-sm text-dim max-w-2xl font-mono leading-relaxed">
                    Official live esports hub: observe active Battle Royale lobbies, follow single-elimination knockout brackets, stream official broadcasts, and track verified results.
                  </p>
                </div>

                {/* Quick Status Count Strip */}
                <div className="flex flex-wrap gap-2 text-xs font-mono">
                  <div className="border border-live/30 bg-live/5 px-3 py-1.5 flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-live animate-pulse" />
                    <span className="text-live font-bold">{liveCount} Live</span>
                  </div>
                  <div className="border border-white/10 bg-white/5 px-3 py-1.5 text-dim">
                    <span>{scheduledCount} Scheduled</span>
                  </div>
                  <div className="border border-white/10 bg-white/5 px-3 py-1.5 text-dim">
                    <span>{completedCount} Completed</span>
                  </div>
                </div>
              </div>

              {/* Status Tabs Bar */}
              <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4">
                <div className="flex flex-wrap gap-1">
                  {STATUS_FILTERS.map((st) => {
                    const count =
                      st === 'ALL'
                        ? tournaments.length
                        : st === 'LIVE'
                        ? liveCount
                        : st === 'SCHEDULED'
                        ? scheduledCount
                        : completedCount

                    return (
                      <button
                        key={st}
                        onClick={() => setStatusFilter(st)}
                        className={`border px-4 py-2 font-mono text-xs uppercase tracking-wider transition-colors ${
                          statusFilter === st
                            ? 'border-cyan bg-cyan text-void font-bold'
                            : 'border-white/10 bg-surface/50 text-dim hover:text-ink hover:border-white/20'
                        }`}
                      >
                        {st} ({count})
                      </button>
                    )
                  })}
                </div>

                {/* Search Bar */}
                <div className="relative w-full sm:w-72">
                  <input
                    type="text"
                    placeholder="Search tournaments or games..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full border border-white/10 bg-surface px-3 py-2 font-mono text-xs text-ink placeholder:text-dim outline-none focus:border-cyan transition-colors"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-dim hover:text-ink font-mono"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Game Chips Filter */}
              <div className="mt-4 overflow-x-auto no-scrollbar">
                <Chips
                  items={GAME_FILTERS}
                  value={gameFilter}
                  onChange={(val) => setGameFilter(val)}
                />
              </div>
            </div>

            {/* Tournaments Grid */}
            {loadingList ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div
                    key={n}
                    className="h-72 border border-white/10 bg-surface/30 animate-pulse"
                  />
                ))}
              </div>
            ) : filteredList.length === 0 ? (
              <div className="border border-dashed border-white/15 bg-void p-12 text-center space-y-3">
                <Hud className="text-dim">NO TOURNAMENTS AVAILABLE</Hud>
                <h3 className="font-display text-2xl font-black uppercase text-ink">
                  {statusFilter === 'LIVE'
                    ? 'No Tournaments Currently Live'
                    : searchQuery
                    ? 'No Tournaments Match Your Search'
                    : 'No Tournaments in This Category'}
                </h3>
                <p className="font-mono text-xs text-dim max-w-md mx-auto">
                  {statusFilter === 'LIVE'
                    ? 'Check the Scheduled tab for upcoming tournaments or explore concluded events in the Completed tab.'
                    : 'Try selecting a different status filter or clearing your search term.'}
                </p>
                {(statusFilter !== 'ALL' || searchQuery || gameFilter !== 'All Games') && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setStatusFilter('ALL')
                        setGameFilter('All Games')
                        setSearchQuery('')
                      }}
                      className="border border-white/20 bg-surface px-4 py-2 font-mono text-xs uppercase hover:border-cyan hover:text-cyan transition-colors"
                    >
                      Reset Filters
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredList.map((item) => (
                  <LiveTournamentCard
                    key={item.id}
                    tournament={item}
                    onSelect={handleSelectTournament}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </Container>
    </div>
  )
}
