import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router'
import { useAuthContext } from '../context/AuthContext'
import {
  getLeaderboardEntries,
  getLeaderboardDisqualifications,
  isEntryCurrentUser,
  isEntryDisqualified,
  LeaderboardEntry,
  LeaderboardPlayer,
  METRICS,
  MetricId,
  showPlayerMetricValue,
} from '../services/leaderboard'
import { Avatar } from '../components/leaderboard/Avatar'
import { PodiumSlot, Mono } from '../components/leaderboard/PodiumSlot'
import { LeaderboardSkeleton } from '../components/leaderboard/LeaderboardSkeleton'
import { LeaderboardEmptyState } from '../components/leaderboard/LeaderboardEmptyState'
import { LeaderboardErrorState } from '../components/leaderboard/LeaderboardErrorState'
import { LeaderboardParticleBackground } from '../components/leaderboard/LeaderboardParticleBackground'
import { resolveMediaUrl } from '../services/apiClient'

export default function Leaderboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { profile } = useAuthContext()

  // 1. Metric state synchronized with URL query parameter
  const initialMetric = (searchParams.get('metric') as MetricId) || 'overall'
  const [metric, setMetric] = useState<MetricId>(
    METRICS.some((m) => m.id === initialMetric) ? initialMetric : 'overall'
  )

  // 2. Search query state
  const [q, setQ] = useState('')

  // 3. Data fetching states
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [disqualifiedIds, setDisqualifiedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<boolean>(false)

  // 4. Pagination for Challengers Ladder (Ranks 4+)
  const [page, setPage] = useState<number>(1)
  const pageSize = 15

  // Fetch disqualifications once on mount
  useEffect(() => {
    let isMounted = true
    getLeaderboardDisqualifications()
      .then((dqs) => {
        if (isMounted) {
          const ids = new Set<string>()
          for (const d of dqs) {
            if (d.entity_id) ids.add(d.entity_id.toLowerCase())
            if (d.entity_name) ids.add(d.entity_name.toLowerCase())
          }
          setDisqualifiedIds(ids)
        }
      })
      .catch(() => {
        // Disqualifications endpoint may require organizer role; ignore if unauthenticated
      })
    return () => {
      isMounted = false
    }
  }, [])

  // Sync metric state to URL query parameter
  useEffect(() => {
    const params = new URLSearchParams()
    if (metric !== 'overall') {
      params.set('metric', metric)
    }
    setSearchParams(params, { replace: true })
  }, [metric, setSearchParams])

  // Fetch authoritative leaderboard entries from backend
  const fetchLeaderboardData = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const data = await getLeaderboardEntries({
        metric,
        limit: 100,
      })
      setEntries(data || [])
    } catch (err) {
      console.error('[Leaderboard] Error fetching standings:', err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [metric])

  useEffect(() => {
    fetchLeaderboardData()
  }, [fetchLeaderboardData])

  // Reset filters handler
  const handleResetFilters = () => {
    setMetric('overall')
    setQ('')
    setPage(1)
  }

  // Transform raw backend entries into LeaderboardPlayer presentation models
  const players: LeaderboardPlayer[] = useMemo(() => {
    return entries.map((entry, index) => {
      const rawName =
        entry.name &&
        !entry.name.toLowerCase().startsWith('player_') &&
        !entry.name.toLowerCase().startsWith('user_')
          ? entry.name
          : entry.captain
          ? entry.captain.replace('@', '')
          : entry.name || 'Contender'
      const displayName = rawName.trim()

      // Derive clean 2-letter uppercase initials
      const parts = displayName.split(/[\s_-]+/).filter(Boolean)
      let initials = ''
      if (parts.length >= 2) {
        initials = (parts[0][0] + parts[1][0]).toUpperCase()
      } else if (displayName.length >= 2) {
        initials = displayName.slice(0, 2).toUpperCase()
      } else {
        initials = (displayName[0] || 'C').toUpperCase()
      }

      // Deterministic tone for avatar background (20..32)
      let hash = 0
      for (let i = 0; i < displayName.length; i++) {
        hash = (hash << 5) - hash + displayName.charCodeAt(i)
        hash |= 0
      }
      const tone = 20 + (Math.abs(hash) % 13)

      const matches = entry.matches_played || (entry.wins + entry.losses) || 0
      const wins = entry.wins || 0
      const winRate =
        typeof entry.win_rate === 'number' && !isNaN(entry.win_rate)
          ? entry.win_rate
          : matches > 0
          ? Math.round((wins / matches) * 100)
          : 0

      const isCurrentUser = isEntryCurrentUser(entry, profile?.id, profile?.username)
      const isDisqualified = isEntryDisqualified(entry, disqualifiedIds)
      const avatarUrl = resolveMediaUrl(entry.avatar_url || entry.logo_url)

      return {
        id: entry.id,
        name: displayName,
        rawName,
        initials,
        tone,
        wins,
        matches,
        winRate,
        points: entry.rating || 1500,
        spent: entry.spending || 0,
        avatarUrl,
        rank: entry.rank || index + 1,
        isCurrentUser,
        isDisqualified,
        tag: entry.tag,
      }
    })
  }, [entries, profile?.id, profile?.username, disqualifiedIds])

  // Top 3 for the podium
  const top = useMemo(() => players.slice(0, 3), [players])

  // Remaining contenders (rank 4+) filtered by search query
  const filteredRest = useMemo(() => {
    const remaining = players.slice(3)
    if (!q.trim()) return remaining
    const query = q.toLowerCase().trim()
    return remaining.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        (p.tag && p.tag.toLowerCase().includes(query))
    )
  }, [players, q])

  // Reset page when search changes
  useEffect(() => {
    setPage(1)
  }, [q])

  // Paginated contenders for ladder
  const totalLadderPages = Math.ceil(filteredRest.length / pageSize) || 1
  const paginatedRest = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredRest.slice(start, start + pageSize)
  }, [filteredRest, page, pageSize])

  const activeMetricConfig = METRICS.find((m) => m.id === metric) || METRICS[0]

  return (
    <div className="relative min-h-[calc(100vh-72px)] w-full mt-16 md:mt-[72px] overflow-hidden bg-void text-ink">
      {/* ============================================================== */}
      {/* ATMOSPHERIC RADIAL GLOW LAYERS FROM LEADERBOARD UI DESIGN      */}
      {/* ============================================================== */}
      <div
        className="pointer-events-none absolute inset-0 select-none"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 80% 5%, rgba(24,66,140,0.3) 0%, rgba(14,40,92,0.12) 35%, rgba(5,6,10,0) 100%), radial-gradient(ellipse 45% 35% at 5% 60%, rgba(18,50,110,0.14) 0%, rgba(5,6,10,0) 100%), radial-gradient(ellipse 60% 30% at 60% 100%, rgba(20,56,120,0.16) 0%, rgba(5,6,10,0) 100%)',
        }}
      />

      {/* Existing WebGL 3D starry particle background sits behind this layer, unchanged */}
      <LeaderboardParticleBackground />

      {/* ============================================================== */}
      {/* MAIN LEADERBOARD CONTAINER                                     */}
      {/* ============================================================== */}
      <main className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 pb-24">
        {/* Page Header */}
        <section className="pb-14 pt-10 sm:pt-14">
          <h1 className="font-display text-[clamp(3.5rem,11vw,9rem)] font-black uppercase leading-[0.8] tracking-tight text-white">
            Leaderboard
          </h1>
          <p className="mt-5 max-w-xl text-base text-ink/75 sm:text-lg">
            Authoritative player standings and competitive rankings across sanctioned tournament circuits.
          </p>
        </section>

        {loading ? (
          <LeaderboardSkeleton />
        ) : error ? (
          <LeaderboardErrorState onRetry={fetchLeaderboardData} />
        ) : players.length === 0 ? (
          <LeaderboardEmptyState
            hasFilters={metric !== 'overall'}
            onResetFilters={handleResetFilters}
          />
        ) : (
          <>
            {/* Top-3 Podium (1st in center, 2nd left, 3rd right) */}
            <section className="mx-auto grid max-w-4xl items-end gap-12 md:grid-cols-[1fr_1.25fr_1fr] md:gap-0">
              <PodiumSlot p={top[0]} m={metric} order="order-1 md:order-2" />
              <PodiumSlot p={top[1]} m={metric} order="order-2 md:order-1" />
              <PodiumSlot p={top[2]} m={metric} order="order-3 md:order-3" />
            </section>

            {/* Divider */}
            <div className="mx-auto my-16 max-w-6xl border-b border-white/10" />

            {/* Bottom Section: Metric Selector Aside + Challengers Ladder */}
            <section className="grid gap-8 lg:grid-cols-[180px_1fr] lg:gap-14">
              {/* Left Sidebar Metric Selector */}
              <aside>
                <Mono className="mb-3 block">Rank by</Mono>
                <div className="flex gap-6 overflow-x-auto lg:flex-col lg:gap-1">
                  {METRICS.map((x) => {
                    const on = x.id === metric
                    return (
                      <button
                        key={x.id}
                        type="button"
                        onClick={() => setMetric(x.id)}
                        aria-pressed={on}
                        className={`flex items-center gap-3 whitespace-nowrap py-1.5 text-left text-sm transition-colors cursor-pointer ${
                          on ? 'text-white' : 'text-dim hover:text-white'
                        }`}
                      >
                        <span className={`h-px transition-all ${on ? 'w-5 bg-cyan' : 'w-2 bg-white/25'}`} />
                        {x.label}
                      </button>
                    )
                  })}
                </div>
              </aside>

              {/* Challengers Ladder & Search */}
              <div id="challengers-ladder" className="scroll-mt-20">
                <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-baseline gap-4">
                    <h2 className="font-display text-xl font-bold uppercase tracking-wide text-white">
                      Challengers Ladder
                    </h2>
                    <Mono className="normal-case tracking-normal">
                      {players.length} contenders ranked
                    </Mono>
                  </div>
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search players"
                    aria-label="Search players"
                    className="w-full rounded-sm border border-white/10 bg-[#0c121d]/90 px-3.5 py-2 font-mono text-xs outline-none transition placeholder:text-dim focus:border-white/30 sm:w-56"
                  />
                </div>

                <ul className="divide-y divide-white/[0.07] border-t border-white/[0.07]">
                  {paginatedRest.map((p) => (
                    <li
                      key={p.id || `player-${p.rank}-${p.name}`}
                      className={`grid grid-cols-[2rem_3rem_1fr_auto] items-center gap-4 py-4 transition-colors hover:bg-white/[0.025] md:gap-6 ${
                        metric === 'overall'
                          ? 'md:grid-cols-[3rem_3.5rem_1fr_6rem_6rem_7rem]'
                          : 'md:grid-cols-[3rem_3.5rem_1fr_7rem]'
                      }`}
                    >
                      <span className="font-display text-2xl font-bold tabular-nums text-dim">
                        {String(p.rank).padStart(2, '0')}
                      </span>
                      {p.isCurrentUser ? (
                        <Link to="/profile" title="View your profile">
                          <Avatar p={p} className="w-12 text-lg md:w-14 md:text-xl transition-transform hover:scale-105" />
                        </Link>
                      ) : (
                        <Avatar p={p} className="w-12 text-lg md:w-14 md:text-xl" />
                      )}
                      <div className="min-w-0 truncate font-display text-xl font-bold uppercase tracking-wide text-white">
                        {p.isCurrentUser ? (
                          <Link to="/profile" className="hover:text-cyan transition-colors">
                            {p.name}
                          </Link>
                        ) : (
                          p.name
                        )}
                        {p.tag && (
                          <span className="ml-2 font-mono text-[11px] text-white/40 tracking-normal font-normal">
                            [{p.tag}]
                          </span>
                        )}
                        {p.isCurrentUser && (
                          <span className="ml-2 px-1.5 py-0.5 font-mono text-[8px] uppercase font-bold bg-white text-black rounded-xs">
                            YOU
                          </span>
                        )}
                        {p.isDisqualified && (
                          <span className="ml-2 px-1 py-0.5 font-mono text-[8px] uppercase font-bold bg-rose-900/60 text-rose-300 border border-rose-500/40">
                            DQ
                          </span>
                        )}
                      </div>
                      {metric === 'overall' && (
                        <>
                          <div className="hidden text-right md:block">
                            <div className="font-mono text-sm font-bold tabular-nums">{p.wins}</div>
                            <Mono>Wins</Mono>
                          </div>
                          <div className="hidden text-right md:block">
                            <div className="font-mono text-sm font-bold tabular-nums">{p.winRate}%</div>
                            <Mono>Win Rate</Mono>
                          </div>
                        </>
                      )}
                      <div className="text-right">
                        <div className="font-display text-3xl font-extrabold leading-none tabular-nums text-white">
                          {showPlayerMetricValue(p, metric)}
                        </div>
                        <Mono>{activeMetricConfig.unit}</Mono>
                      </div>
                    </li>
                  ))}
                  {filteredRest.length === 0 && (
                    <li className="py-12 text-center text-sm text-dim">
                      {q ? `No players found matching "${q}".` : 'No challengers ranked yet.'}
                    </li>
                  )}
                </ul>

                {/* Pagination Controls */}
                {totalLadderPages > 1 && (
                  <div className="flex items-center justify-between border-t border-white/[0.07] pt-4 font-mono text-xs">
                    <span className="text-dim text-[11px]">
                      Showing {(page - 1) * pageSize + 1}-
                      {Math.min(page * pageSize, filteredRest.length)} of {filteredRest.length} challengers
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (page > 1) {
                            setPage(page - 1)
                            document.getElementById('challengers-ladder')?.scrollIntoView({ behavior: 'smooth' })
                          }
                        }}
                        disabled={page === 1}
                        className={`px-3 py-1 uppercase font-bold text-[10px] rounded-sm border transition-colors cursor-pointer ${
                          page === 1
                            ? 'border-white/5 text-white/20 cursor-not-allowed'
                            : 'border-white/10 text-white hover:border-white/30 hover:bg-white/5'
                        }`}
                      >
                        Prev
                      </button>

                      <span className="px-2 text-dim text-[10px]">
                        {page} / {totalLadderPages}
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          if (page < totalLadderPages) {
                            setPage(page + 1)
                            document.getElementById('challengers-ladder')?.scrollIntoView({ behavior: 'smooth' })
                          }
                        }}
                        disabled={page === totalLadderPages}
                        className={`px-3 py-1 uppercase font-bold text-[10px] rounded-sm border transition-colors cursor-pointer ${
                          page === totalLadderPages
                            ? 'border-white/5 text-white/20 cursor-not-allowed'
                            : 'border-white/10 text-white hover:border-white/30 hover:bg-white/5'
                        }`}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}
