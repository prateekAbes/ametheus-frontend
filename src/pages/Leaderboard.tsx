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

  // 4. Pagination state: player rankings displayed in groups of 10
  const [page, setPage] = useState<number>(1)

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

  // Pagination & Search logic:
  // - First group displays ranks 1–10 (top 3 on podium + ranks 4–10 in the list)
  // - Next group displays ranks 11–20 (ranks 11–20 in the list)
  // - Next group displays ranks 21–30 (ranks 21–30 in the list)
  // - When searching, search results across all contenders are displayed 10 per page
  const isSearching = Boolean(q.trim())

  const searchResults = useMemo(() => {
    const remaining = players.slice(3)
    if (!isSearching) return remaining
    const query = q.toLowerCase().trim()
    return remaining.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        (p.tag && p.tag.toLowerCase().includes(query))
    )
  }, [players, isSearching, q])

  // Reset page when search or metric changes
  useEffect(() => {
    setPage(1)
  }, [q, metric])

  // Total pages calculation
  const totalPages = useMemo(() => {
    if (isSearching) {
      return Math.max(1, Math.ceil(searchResults.length / 10))
    }
    if (players.length <= 10) {
      return 1
    }
    return 1 + Math.ceil((players.length - 10) / 10)
  }, [isSearching, searchResults.length, players.length])

  // Current page items for the Challengers Ladder list
  const paginatedList = useMemo(() => {
    if (isSearching) {
      const start = (page - 1) * 10
      return searchResults.slice(start, start + 10)
    }
    if (page === 1) {
      // First group: Ranks 1–10 (Podium displays 1–3, so Ladder list displays ranks 4–10)
      return players.slice(3, 10)
    }
    // Subsequent groups of 10:
    // Page 2: ranks 11–20 -> index 10 to 20
    // Page 3: ranks 21–30 -> index 20 to 30
    const start = 10 + (page - 2) * 10
    return players.slice(start, start + 10)
  }, [isSearching, searchResults, page, players])

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === page) return
    setPage(newPage)
    const ladderEl = document.getElementById('challengers-ladder')
    if (ladderEl) {
      ladderEl.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const activeMetricConfig = METRICS.find((m) => m.id === metric) || METRICS[0]

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden text-ink"
      style={{ backgroundColor: '#05060A' }}
    >
      {/* ============================================================== */}
      {/* 1. AMBIENT BACKGROUND CONTAINER (FIRST CHILD OF WRAPPER)       */}
      {/* ============================================================== */}
      <div className="absolute inset-0 pointer-events-none select-none" aria-hidden="true">
        {/* Layer One — Soft Ambient Color Glows (5 radial-gradients) */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: [
              'radial-gradient(ellipse 55% 650px at 85% 6%, rgba(30, 80, 170, 0.34) 0%, transparent 70%)',
              'radial-gradient(ellipse 50% 650px at 8% 30%, rgba(60, 50, 170, 0.22) 0%, transparent 70%)',
              'radial-gradient(ellipse 55% 650px at 92% 58%, rgba(24, 70, 150, 0.24) 0%, transparent 70%)',
              'radial-gradient(ellipse 50% 600px at 10% 92%, rgba(30, 80, 170, 0.22) 0%, transparent 70%)',
              'radial-gradient(ellipse 60% 550px at 50% 98%, rgba(62, 242, 255, 0.09) 0%, transparent 70%)',
            ].join(', '),
          }}
        />

        {/* Layer Two — Fine CSS Starfield (5-dot radial-gradient tiled pattern with vertical fade mask) */}
        <div
          className="absolute inset-0 opacity-70 pointer-events-none"
          style={{
            backgroundImage: [
              'radial-gradient(circle 1.2px at 65px 42px, rgba(220, 235, 255, 0.85) 0%, transparent 100%)',
              'radial-gradient(circle 1.5px at 215px 110px, rgba(210, 225, 255, 0.70) 0%, transparent 100%)',
              'radial-gradient(circle 1.0px at 370px 75px, rgba(230, 240, 255, 0.60) 0%, transparent 100%)',
              'radial-gradient(circle 1.6px at 140px 220px, rgba(205, 230, 255, 0.90) 0%, transparent 100%)',
              'radial-gradient(circle 1.1px at 320px 250px, rgba(215, 235, 255, 0.50) 0%, transparent 100%)',
            ].join(', '),
            backgroundSize: '430px 290px',
            backgroundRepeat: 'repeat',
            maskImage: 'linear-gradient(to bottom, transparent, #000 12%, #000 88%, transparent)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent, #000 12%, #000 88%, transparent)',
          }}
        />
      </div>

      {/* ============================================================== */}
      {/* 2. LEADERBOARD CONTENT IN SEPARATE RELATIVE Z-10 WRAPPER       */}
      {/* ============================================================== */}
      <main className="relative z-10 w-full pb-24">
        {/* Page Header: Exact match to Matches & Tournaments layout, top spacing, and left container alignment */}
        <section className="relative mx-auto w-full max-w-[1600px] px-5 pt-36 md:px-10 pb-14 md:pb-20">
          <h1 className="reveal-chars font-display text-[clamp(3.5rem,12vw,12rem)] font-black uppercase leading-[0.8] tracking-tight text-white text-balance break-words">
            LEADERBOARD
          </h1>
          <p className="mt-6 max-w-xl text-lg text-ink/75">
            Top competitive rankings and player performance across tournament circuits.
          </p>
        </section>

        <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-6 md:pt-14">
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
                    {paginatedList.map((p) => (
                      <li
                        key={p.id || `player-${p.rank}-${p.name}`}
                        className={`grid grid-cols-[2rem_2.5rem_1fr_auto] items-center gap-3 py-3.5 transition-colors hover:bg-white/[0.025] md:gap-5 ${
                          metric === 'overall'
                            ? 'md:grid-cols-[2.5rem_2.75rem_1fr_6rem_6rem_7rem]'
                            : 'md:grid-cols-[2.5rem_2.75rem_1fr_7rem]'
                        }`}
                      >
                        <span className="font-display text-2xl font-bold tabular-nums text-dim">
                          {String(p.rank).padStart(2, '0')}
                        </span>
                        {p.isCurrentUser ? (
                          <Link to="/profile" title="View your profile">
                            <Avatar
                              p={p}
                              className="w-10 text-sm md:w-11 md:text-base transition-transform hover:scale-105"
                            />
                          </Link>
                        ) : (
                          <Avatar p={p} className="w-10 text-sm md:w-11 md:text-base" />
                        )}
                        <div className="min-w-0 truncate font-display text-lg font-bold uppercase tracking-wide text-white">
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
                  {paginatedList.length === 0 && (
                    <li className="py-12 text-center text-sm text-dim">
                      {q ? `No players found matching "${q}".` : 'No challengers ranked yet.'}
                    </li>
                  )}
                </ul>

                {/* Compact Pagination Controls: Groups of 10 */}
                {totalPages > 1 && (
                  <nav
                    aria-label="Leaderboard pagination"
                    className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t border-white/[0.07] pt-4 font-mono text-xs"
                  >
                    <div className="text-dim text-[11px]">
                      {isSearching ? (
                        <>
                          Showing{' '}
                          <span className="text-white font-bold">
                            {searchResults.length === 0 ? 0 : (page - 1) * 10 + 1}–
                            {Math.min(page * 10, searchResults.length)}
                          </span>{' '}
                          of {searchResults.length} matching contenders
                        </>
                      ) : page === 1 ? (
                        <>
                          Showing ranks{' '}
                          <span className="text-white font-bold">
                            01–{String(Math.min(10, players.length)).padStart(2, '0')}
                          </span>{' '}
                          of {players.length} contenders (Group 1)
                        </>
                      ) : (
                        <>
                          Showing ranks{' '}
                          <span className="text-white font-bold">
                            {String(10 + (page - 2) * 10 + 1).padStart(2, '0')}–
                            {String(Math.min(10 + (page - 1) * 10, players.length)).padStart(2, '0')}
                          </span>{' '}
                          of {players.length} contenders (Group {page})
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page === 1}
                        aria-label="Previous page"
                        className={`px-3 py-1.5 uppercase font-bold text-[10px] tracking-wider rounded-sm border transition-colors cursor-pointer ${
                          page === 1
                            ? 'border-white/5 text-white/20 cursor-not-allowed bg-transparent'
                            : 'border-white/10 bg-surface/70 text-white hover:border-cyan hover:text-cyan'
                        }`}
                      >
                        ← Prev
                      </button>

                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => {
                          if (totalPages > 7) {
                            if (num !== 1 && num !== totalPages && Math.abs(num - page) > 1) {
                              if (num === 2 || num === totalPages - 1) {
                                return (
                                  <span key={num} className="px-1 text-dim font-mono text-xs">
                                    …
                                  </span>
                                )
                              }
                              return null
                            }
                          }
                          const active = num === page
                          return (
                            <button
                              key={num}
                              type="button"
                              onClick={() => handlePageChange(num)}
                              aria-current={active ? 'page' : undefined}
                              className={`size-7 text-[11px] font-bold font-mono rounded-sm transition-colors cursor-pointer ${
                                active
                                  ? 'border border-cyan bg-cyan/15 text-cyan'
                                  : 'border border-white/10 bg-surface/50 text-dim hover:border-white/30 hover:text-white'
                              }`}
                            >
                              {num}
                            </button>
                          )
                        })}
                      </div>

                      <button
                        type="button"
                        onClick={() => handlePageChange(page + 1)}
                        disabled={page === totalPages}
                        aria-label="Next page"
                        className={`px-3 py-1.5 uppercase font-bold text-[10px] tracking-wider rounded-sm border transition-colors cursor-pointer ${
                          page === totalPages
                            ? 'border-white/5 text-white/20 cursor-not-allowed bg-transparent'
                            : 'border-white/10 bg-surface/70 text-white hover:border-cyan hover:text-cyan'
                        }`}
                      >
                        Next →
                      </button>
                    </div>
                  </nav>
                )}
              </div>
            </section>
          </>
        )}
        </div>
      </main>
    </div>
  )
}
