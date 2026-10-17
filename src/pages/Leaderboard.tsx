import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useSearchParams, Link } from 'react-router'
import { useAuthContext } from '../context/AuthContext'
import {
  getLeaderboardEntries,
  getLeaderboardDisqualifications,
  getLeaderboardStats,
  isEntryCurrentUser,
  isEntryDisqualified,
  LeaderboardEntry,
  LeaderboardPlayer,
  LeaderboardPlatformStats,
  METRICS,
  MetricId,
  showPlayerMetricValue,
  TimeRange,
  TIME_RANGES,
} from '../services/leaderboard'
import { Avatar } from '../components/leaderboard/Avatar'
import { PodiumSlot, Mono } from '../components/leaderboard/PodiumSlot'
import { ChallengersLadderSkeleton } from '../components/leaderboard/LeaderboardSkeleton'
import { LeaderboardEmptyState } from '../components/leaderboard/LeaderboardEmptyState'
import { LeaderboardErrorState } from '../components/leaderboard/LeaderboardErrorState'
import { PlatformStatsStrip } from '../components/leaderboard/PlatformStatsStrip'
import { RankingMetricsPanel } from '../components/leaderboard/RankingMetricsPanel'
import { resolveMediaUrl } from '../services/apiClient'

export default function Leaderboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { profile, role, isSuperAdmin } = useAuthContext()

  // 1. Metric and TimeRange states synchronized with URL query parameters
  const initialMetric = (searchParams.get('metric') as MetricId) || 'overall'
  const [metric, setMetric] = useState<MetricId>(
    METRICS.some((m) => m.id === initialMetric) ? initialMetric : 'overall'
  )

  const initialTimeRange = (searchParams.get('time_range') as TimeRange) || 'all_time'
  const [timeRange, setTimeRange] = useState<TimeRange>(
    TIME_RANGES.some((t) => t.id === initialTimeRange) ? initialTimeRange : 'all_time'
  )

  // 2. Search query state
  const [q, setQ] = useState('')

  // 3. Data fetching states
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [platformStats, setPlatformStats] = useState<LeaderboardPlatformStats | null>(null)
  const [disqualifiedIds, setDisqualifiedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<boolean>(false)
  const isFirstLoad = useRef<boolean>(true)

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

  // Sync metric and timeRange states to URL query parameter without resetting scroll position
  useEffect(() => {
    const params = new URLSearchParams()
    if (metric !== 'overall') {
      params.set('metric', metric)
    }
    if (timeRange !== 'all_time') {
      params.set('time_range', timeRange)
    }
    setSearchParams(params, { replace: true, preventScrollReset: true })
  }, [metric, timeRange, setSearchParams])

  // Fetch authoritative leaderboard entries and platform stats from backend
  const fetchLeaderboardData = useCallback(async () => {
    if (isFirstLoad.current) {
      setLoading(true)
    }
    setError(false)
    try {
      const [entriesData, statsData] = await Promise.all([
        getLeaderboardEntries({
          metric,
          time_range: timeRange,
          limit: 100,
        }),
        getLeaderboardStats(timeRange).catch((err) => {
          console.error('[Leaderboard] Error fetching platform stats:', err)
          return null
        }),
      ])
      setEntries(entriesData || [])
      if (statsData) {
        setPlatformStats(statsData)
      }
    } catch (err) {
      console.error('[Leaderboard] Error fetching standings:', err)
      setError(true)
    } finally {
      setLoading(false)
      isFirstLoad.current = false
    }
  }, [metric, timeRange])

  useEffect(() => {
    fetchLeaderboardData()
  }, [fetchLeaderboardData])

  // Reset filters handler
  const handleResetFilters = () => {
    setMetric('overall')
    setTimeRange('all_time')
    setQ('')
    setPage(1)
  }

  // Transform raw backend entries into LeaderboardPlayer presentation models
  const players: LeaderboardPlayer[] = useMemo(() => {
    // Helper to detect 1-3 letter abbreviations or placeholder IDs
    const isFragment = (val?: string | null) => {
      if (!val) return true
      const trimmed = val.trim()
      if (trimmed.length === 0) return true
      if (trimmed.length <= 3 && trimmed === trimmed.toUpperCase()) return true
      if (trimmed.toLowerCase().startsWith('player_') || trimmed.toLowerCase().startsWith('user_')) return true
      return false
    }

    // Helper to safeguard against any super admin appearing in client models
    const isSuperAdminAccount = (val?: string | null) => {
      if (!val) return false
      const s = val.toLowerCase().trim()
      return (
        s === 'admin@ametheus.gg' ||
        s === 'pk.4081988@gmail.com' ||
        s.includes('super_admin') ||
        s.includes('superadmin') ||
        s === 'admin' ||
        s === 'adhjahdj' ||
        s === 'fbjbjfha'
      )
    }

    return entries
      .filter(
        (entry) =>
          !isSuperAdminAccount(entry.captain) &&
          !isSuperAdminAccount(entry.display_name) &&
          !isSuperAdminAccount(entry.username) &&
          !isSuperAdminAccount(entry.name) &&
          !isSuperAdminAccount(entry.id) &&
          !(entry.status === 'DISBANDED' && (entry.matches_played || 0) === 0 && (entry.earnings || 0) === 0)
      )
      .map((entry, index) => {
        // Authoritative identity resolution: display_name -> username -> captain -> non-fragment name -> fallback
        let resolvedName = ''
        if (entry.display_name && !isFragment(entry.display_name)) {
          resolvedName = entry.display_name
        } else if (entry.username && !isFragment(entry.username)) {
          resolvedName = entry.username
        } else if (entry.name && !isFragment(entry.name)) {
          resolvedName = entry.name
        } else if (entry.captain && !isFragment(entry.captain.replace('@', ''))) {
          resolvedName = entry.captain.replace('@', '')
        } else if (entry.display_name) {
          resolvedName = entry.display_name
        } else if (entry.username) {
          resolvedName = entry.username
        } else if (entry.name) {
          resolvedName = entry.name
        } else {
          resolvedName = 'Contender'
        }

        const displayName = resolvedName.trim()

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
          rawName: displayName,
          displayName,
          username: entry.username,
          initials,
          tone,
          wins,
          matches,
          winRate,
          points: entry.rating || 1500,
          spent: entry.spending || 0,
          earnings: entry.earnings || 0,
          streak: entry.streak || 0,
          top3: entry.top3 || 0,
          avatarUrl,
          rank: entry.rank || index + 1,
          isCurrentUser,
          isDisqualified,
          tag: entry.tag,
        }
      })
  }, [entries, profile?.id, profile?.username, disqualifiedIds])

  // Deterministic dynamic sorting according to active metric
  const sortedPlayers = useMemo(() => {
    const list = [...players]
    switch (metric) {
      case 'win_rate':
        list.sort((a, b) => b.winRate - a.winRate || b.wins - a.wins || b.points - a.points)
        break
      case 'wins':
        list.sort((a, b) => b.wins - a.wins || b.winRate - a.winRate || b.points - a.points)
        break
      case 'streak':
        list.sort((a, b) => b.streak - a.streak || b.wins - a.wins || b.points - a.points)
        break
      case 'matches':
        list.sort((a, b) => b.matches - a.matches || b.wins - a.wins || b.points - a.points)
        break
      case 'earnings':
        list.sort((a, b) => b.earnings - a.earnings || b.wins - a.wins || b.points - a.points)
        break
      case 'spending':
        list.sort((a, b) => b.spent - a.spent || b.points - a.points || b.wins - a.wins)
        break
      case 'overall':
      default:
        list.sort((a, b) => b.points - a.points || b.wins - a.wins || b.winRate - a.winRate)
        break
    }
    return list.map((p, idx) => ({
      ...p,
      rank: idx + 1,
    }))
  }, [players, metric])

  // Top 3 for the podium
  const top = useMemo(() => sortedPlayers.slice(0, 3), [sortedPlayers])

  // Active metric config object
  const activeMetricConfig = METRICS.find((m) => m.id === metric) || METRICS[0]

  // Dynamic user position calculation for the YOUR POSITION card
  const userPosition = useMemo(() => {
    if (!profile) {
      return {
        rankText: '--',
        subText: 'Sign in to view your platform ranking',
      }
    }

    const cleanEmail = (profile.email || '').trim().toLowerCase()
    const isSuperAdminUser =
      isSuperAdmin ||
      role === 'SUPER_ADMIN' ||
      cleanEmail === 'admin@ametheus.gg' ||
      cleanEmail === 'pk.4081988@gmail.com' ||
      (profile as any).role === 'SUPER_ADMIN' ||
      (profile as any).role === 'super_admin'

    if (isSuperAdminUser) {
      return {
        rankText: '--',
        subText: 'Super Admin accounts are excluded from competitive rankings',
      }
    }

    const userPlayer = sortedPlayers.find((p) => p.isCurrentUser)
    if (!userPlayer) {
      return {
        rankText: '--',
        subText: 'Unranked in this category',
      }
    }

    const rank = userPlayer.rank
    const total = Math.max(sortedPlayers.length, 1)
    const percentile = Math.max(1, Math.round((rank / total) * 100))
    const statValueStr = showPlayerMetricValue(userPlayer, metric)
    const metricLabel = activeMetricConfig.unit

    return {
      rankText: `#${String(rank).padStart(2, '0')}`,
      subText: `${statValueStr} ${metricLabel} · Top ${percentile}%`,
    }
  }, [profile, role, isSuperAdmin, sortedPlayers, metric, activeMetricConfig.unit])

  // Platform statistics strip blocks
  const statBlocks = useMemo(() => {
    return [
      {
        label: 'Ranked Players',
        value: platformStats
          ? platformStats.ranked_players.toLocaleString()
          : loading
          ? '—'
          : sortedPlayers.length.toLocaleString(),
      },
      {
        label: 'Matches Played',
        value: platformStats
          ? platformStats.matches_played.toLocaleString()
          : loading
          ? '—'
          : '0',
      },
      {
        label: 'Prize Paid Out',
        value: platformStats
          ? platformStats.prize_paid_out
          : loading
          ? '—'
          : '₹0',
      },
      {
        label: 'Active Streaks',
        value: platformStats
          ? platformStats.active_streaks.toLocaleString()
          : loading
          ? '—'
          : '0',
      },
    ]
  }, [platformStats, sortedPlayers.length, loading])

  // Pagination & Search logic:
  // - First group displays ranks 1–10 (top 3 on podium + ranks 4–10 in the list)
  // - Next group displays ranks 11–20 (ranks 11–20 in the list)
  // - Next group displays ranks 21–30 (ranks 21–30 in the list)
  // - When searching, search results across all contenders are displayed 10 per page
  const isSearching = Boolean(q.trim())

  const searchResults = useMemo(() => {
    const remaining = sortedPlayers.slice(3)
    if (!isSearching) return remaining
    const query = q.toLowerCase().trim()
    return remaining.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        (p.tag && p.tag.toLowerCase().includes(query))
    )
  }, [sortedPlayers, isSearching, q])

  // Reset page when search or metric changes
  useEffect(() => {
    setPage(1)
  }, [q, metric])

  // Total pages calculation
  const totalPages = useMemo(() => {
    if (isSearching) {
      return Math.max(1, Math.ceil(searchResults.length / 10))
    }
    if (sortedPlayers.length <= 10) {
      return 1
    }
    return 1 + Math.ceil((sortedPlayers.length - 10) / 10)
  }, [isSearching, searchResults.length, sortedPlayers.length])

  // Current page items for the Challengers Ladder list
  const paginatedList = useMemo(() => {
    if (isSearching) {
      const start = (page - 1) * 10
      return searchResults.slice(start, start + 10)
    }
    if (page === 1) {
      // First group: Ranks 1–10 (Podium displays 1–3, so Ladder list displays ranks 4–10)
      return sortedPlayers.slice(3, 10)
    }
    // Subsequent groups of 10:
    // Page 2: ranks 11–20 -> index 10 to 20
    // Page 3: ranks 21–30 -> index 20 to 30
    const start = 10 + (page - 2) * 10
    return sortedPlayers.slice(start, start + 10)
  }, [isSearching, searchResults, page, sortedPlayers])

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === page) return
    setPage(newPage)
    const ladderEl = document.getElementById('challengers-ladder')
    if (ladderEl) {
      ladderEl.scrollIntoView({ behavior: 'smooth' })
    }
  }

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
        <section className="relative mx-auto w-full max-w-[1600px] px-5 pt-36 md:px-10 pb-8 md:pb-12">
          <h1 className="reveal-chars font-display text-[clamp(3.5rem,12vw,12rem)] font-black uppercase leading-[0.8] tracking-tight text-white text-balance break-words">
            LEADERBOARD
          </h1>
          <p className="mt-6 max-w-xl text-lg text-dim">
            Authoritative player standings and competitive rankings across sanctioned tournament circuits.
          </p>
        </section>

        {/* MAIN CONTENT CONTAINER: Aligned with page header at max-w-[1600px] px-5 md:px-10 */}
        <div className="relative mx-auto w-full max-w-[1600px] px-5 md:px-10 pb-16 space-y-8 md:space-y-10">
          {/* Horizontal Platform Statistics Strip (left edge frozen, right outer offset matches left outer offset) */}
          <div className="w-full">
            <PlatformStatsStrip stats={statBlocks} />
          </div>

          {/* Time-Range Filters (left-aligned with stats strip and header) */}
          <div className="flex items-center">
            <div className="inline-flex items-center rounded-sm border border-white/10 bg-[#0c121d]/90 p-1 font-mono text-xs sm:text-[13px]">
              {TIME_RANGES.map((t) => {
                const active = t.id === timeRange
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setTimeRange(t.id)
                      setPage(1)
                    }}
                    className={`px-3.5 sm:px-4 py-1.5 uppercase tracking-wider font-bold transition-colors cursor-pointer rounded-xs whitespace-nowrap ${
                      active
                        ? 'bg-cyan/15 text-cyan border border-cyan/40 shadow-xs'
                        : 'text-dim hover:text-white border border-transparent'
                    }`}
                  >
                    {t.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-12 md:space-y-16">
            {/* Centered Three-Player Podium (always visible, handles 0, 1, 2, or 3+ players) */}
            <section className="mx-auto grid max-w-4xl items-end gap-12 md:grid-cols-[1fr_1.25fr_1fr] md:gap-0">
              <PodiumSlot p={top[0]} m={metric} order="order-1 md:order-2" placeholderRank={1} />
              <PodiumSlot p={top[1]} m={metric} order="order-2 md:order-1" placeholderRank={2} />
              <PodiumSlot p={top[2]} m={metric} order="order-3 md:order-3" placeholderRank={3} />
            </section>

              {/* Full-width Divider spanning the restricted 1120px container */}
              <div className="w-full max-w-[1120px] border-b border-white/10" />

              {/* Lower Leaderboard: 2-Column Desktop Grid (Rank By on the LEFT) */}
              <div className="w-full max-w-[1120px] grid grid-cols-1 lg:grid-cols-[200px_minmax(0,1fr)] gap-10 lg:gap-16 items-start">
                {/* Left Column (Desktop): Ranking Metrics Panel + Your Position Card */}
                <RankingMetricsPanel
                  currentMetric={metric}
                  onSelectMetric={setMetric}
                  userPosition={userPosition}
                  className="hidden lg:flex sticky top-28"
                />

                {/* Mobile Metric Switcher & User Position Banner (lg:hidden) */}
                <div className="lg:hidden space-y-4 mb-2">
                  <div className="rounded-sm border border-white/10 bg-[#0c121d]/90 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-xs uppercase tracking-[0.18em] text-dim font-bold">
                        Rank by
                      </span>
                      <span className="font-mono text-[10px] text-cyan uppercase font-bold tracking-wider">
                        {activeMetricConfig.label}
                      </span>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                      {METRICS.map((x) => {
                        const on = x.id === metric
                        return (
                          <button
                            key={x.id}
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              setMetric(x.id)
                            }}
                            className={`px-3 py-1.5 rounded-xs font-mono text-xs whitespace-nowrap transition-colors cursor-pointer ${
                              on
                                ? 'border border-cyan bg-cyan/15 text-white font-bold'
                                : 'border border-white/10 bg-surface/50 text-dim hover:text-white'
                            }`}
                          >
                            {x.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-sm border border-white/10 bg-[#0d121c]/90 px-4 py-3">
                    <div>
                      <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim font-bold">
                        Your Position
                      </div>
                      <div className="mt-0.5 font-mono text-xs text-dim">
                        {userPosition.subText}
                      </div>
                    </div>
                    <div className="font-display text-3xl font-black text-cyan tabular-nums">
                      {userPosition.rankText}
                    </div>
                  </div>
                </div>

                {/* Right Column: Challenger Ladder, Skeleton, Error, or Empty State */}
                <div className="min-w-0 space-y-4">
                  {loading && entries.length === 0 ? (
                    <ChallengersLadderSkeleton />
                  ) : error ? (
                    <LeaderboardErrorState onRetry={fetchLeaderboardData} />
                  ) : sortedPlayers.length === 0 ? (
                    <LeaderboardEmptyState
                      hasFilters={metric !== 'overall' || timeRange !== 'all_time'}
                      onResetFilters={handleResetFilters}
                    />
                  ) : (
                    <section id="challengers-ladder" className="scroll-mt-20">
                    <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap items-baseline gap-2 sm:gap-3">
                        <h2 className="font-display text-xl font-bold uppercase tracking-wide text-white">
                          Challengers Ladder
                        </h2>
                        <span className="text-white/20">·</span>
                        <Mono className="uppercase text-cyan font-bold tracking-wider">
                          {TIME_RANGES.find((t) => t.id === timeRange)?.label || 'ALL TIME'}
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
                          className="flex items-center gap-3 md:gap-4 py-3.5 transition-colors hover:bg-white/[0.025]"
                        >
                          {/* 1. Rank */}
                          <span className="w-8 md:w-10 text-center font-display text-xl md:text-2xl font-bold tabular-nums text-dim shrink-0">
                            {String(p.rank).padStart(2, '0')}
                          </span>

                          {/* 2. Avatar */}
                          {p.isCurrentUser ? (
                            <Link to="/profile" title="View your profile" className="shrink-0">
                              <Avatar
                                p={p}
                                className="size-10 text-sm md:size-11 md:text-base transition-transform hover:scale-105"
                              />
                            </Link>
                          ) : (
                            <Avatar p={p} className="size-10 text-sm md:size-11 md:text-base" />
                          )}

                          {/* 3. Username / Display Name & Badges */}
                          <div className="min-w-0 flex-1 flex items-center gap-2 truncate">
                            <span className="font-display text-base md:text-lg font-bold uppercase tracking-wide text-white truncate">
                              {p.isCurrentUser ? (
                                <Link to="/profile" className="hover:text-cyan transition-colors">
                                  {p.name}
                                </Link>
                              ) : (
                                p.name
                              )}
                            </span>
                            {p.tag && (
                              <span className="shrink-0 font-mono text-[11px] text-white/40 tracking-normal font-normal">
                                [{p.tag}]
                              </span>
                            )}
                            {p.isCurrentUser && (
                              <span className="shrink-0 px-1.5 py-0.5 font-mono text-[8px] uppercase font-bold bg-white text-black rounded-xs">
                                YOU
                              </span>
                            )}
                            {p.isDisqualified && (
                              <span className="shrink-0 px-1 py-0.5 font-mono text-[8px] uppercase font-bold bg-rose-900/60 text-rose-300 border border-rose-500/40">
                                DQ
                              </span>
                            )}
                          </div>

                          {/* 4. Movement Indicator */}
                          <span
                            className="font-mono text-xs text-white/40 shrink-0 px-1"
                            title="Rank movement: stable"
                          >
                            —
                          </span>

                          {/* 5. Five Cyan Progression Dots */}
                          <div
                            className="hidden lg:flex items-center gap-1 shrink-0 px-2"
                            title={`Progression: ${p.winRate}% win rate`}
                          >
                            {[1, 2, 3, 4, 5].map((dotIndex) => {
                              const filled =
                                dotIndex <= Math.max(1, Math.round((p.winRate / 100) * 5))
                              return (
                                <span
                                  key={dotIndex}
                                  className={`size-1.5 rounded-full ${
                                    filled ? 'bg-cyan' : 'bg-white/10'
                                  }`}
                                />
                              )
                            })}
                          </div>

                          {/* 6. Wins */}
                          <div className="hidden sm:block w-14 md:w-16 text-right shrink-0">
                            <div className="font-mono text-sm font-bold tabular-nums text-white">
                              {p.wins}
                            </div>
                            <Mono>Wins</Mono>
                          </div>

                          {/* 7. Win Rate */}
                          <div className="hidden sm:block w-16 md:w-20 text-right shrink-0">
                            <div className="font-mono text-sm font-bold tabular-nums text-white">
                              {p.winRate}%
                            </div>
                            <Mono>Win Rate</Mono>
                          </div>

                          {/* 8. Rating + 9. Thin Cyan Bar Beneath */}
                          <div className="w-20 md:w-24 text-right shrink-0">
                            <div className="font-display text-2xl md:text-3xl font-extrabold leading-none tabular-nums text-white">
                              {showPlayerMetricValue(p, metric)}
                            </div>
                            <div className="mt-1 flex flex-col items-end">
                              <div className="h-0.5 w-full bg-cyan/60 rounded-full" />
                              <Mono className="mt-0.5 text-[9px]">{activeMetricConfig.unit}</Mono>
                            </div>
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
                  </section>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
