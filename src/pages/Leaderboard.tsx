import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { Container } from '../components/ui'
import { useAuthContext } from '../context/AuthContext'
import {
  getLeaderboardEntries,
  getLeaderboardDisqualifications,
  LeaderboardEntry,
} from '../services/leaderboard'
import { getGames, Game } from '../services/games'
import { LeaderboardPodium } from '../components/leaderboard/LeaderboardPodium'
import { LeaderboardTable } from '../components/leaderboard/LeaderboardTable'
import { LeaderboardSkeleton } from '../components/leaderboard/LeaderboardSkeleton'
import { LeaderboardEmptyState } from '../components/leaderboard/LeaderboardEmptyState'
import { LeaderboardErrorState } from '../components/leaderboard/LeaderboardErrorState'

const METRIC_TABS = [
  { id: 'overall', label: 'Overall Standing' },
  { id: 'win_rate', label: 'Highest Win Rate' },
  { id: 'wins', label: 'Most Match Wins' },
  { id: 'spending', label: 'Highest Spending' },
] as const

type MetricId = (typeof METRIC_TABS)[number]['id']

const PLATFORM_OPTIONS = [
  { id: 'all', label: 'All Platforms' },
  { id: 'pc', label: 'PC Competitive' },
  { id: 'mobile', label: 'Mobile Competitive' },
] as const

type PlatformId = (typeof PLATFORM_OPTIONS)[number]['id']

export default function Leaderboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { profile } = useAuthContext()

  // URL state synchronization
  const initialMetric = (searchParams.get('metric') as MetricId) || 'overall'
  const initialPlatform = (searchParams.get('platform') as PlatformId) || 'all'
  const initialGame = searchParams.get('game') || 'all'
  const initialSearch = searchParams.get('q') || ''

  const [metric, setMetric] = useState<MetricId>(initialMetric)
  const [platform, setPlatform] = useState<PlatformId>(initialPlatform)
  const [selectedGame, setSelectedGame] = useState<string>(initialGame)
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch)
  const [activeSearch, setActiveSearch] = useState<string>(initialSearch)

  const [availableGames, setAvailableGames] = useState<Game[]>([])
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [disqualifiedIds, setDisqualifiedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<boolean>(false)

  // Ladder pagination state
  const [page, setPage] = useState<number>(1)
  const pageSize = 15

  // Fetch games catalog dynamically for discipline filters
  useEffect(() => {
    let isMounted = true
    getGames()
      .then((games) => {
        if (isMounted) {
          setAvailableGames(games)
        }
      })
      .catch((err) => {
        console.error('[Leaderboard] Failed to load disciplines:', err)
      })
    return () => {
      isMounted = false
    }
  }, [])

  // Fetch disqualifications once
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
        // Disqualifications endpoint may require organizer role; ignore if forbidden
      })
    return () => {
      isMounted = false
    }
  }, [])

  // Sync state to URL parameters
  useEffect(() => {
    const params = new URLSearchParams()
    if (metric !== 'overall') params.set('metric', metric)
    if (platform !== 'all') params.set('platform', platform)
    if (selectedGame !== 'all') params.set('game', selectedGame)
    if (activeSearch) params.set('q', activeSearch)
    setSearchParams(params, { replace: true })
  }, [metric, platform, selectedGame, activeSearch, setSearchParams])

  // Fetch leaderboard data based on active filters
  const fetchLeaderboardData = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const data = await getLeaderboardEntries({
        metric,
        platform: platform !== 'all' ? platform : undefined,
        game: selectedGame !== 'all' ? selectedGame : undefined,
        search: activeSearch || undefined,
        limit: 100,
      })
      setEntries(data || [])
    } catch (err) {
      console.error('[Leaderboard] Error retrieving standings:', err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [metric, platform, selectedGame, activeSearch])

  useEffect(() => {
    fetchLeaderboardData()
  }, [fetchLeaderboardData])

  // Reset all filters back to default
  const handleResetFilters = () => {
    setMetric('overall')
    setPlatform('all')
    setSelectedGame('all')
    setSearchQuery('')
    setActiveSearch('')
    setPage(1)
  }

  const hasActiveFilters =
    metric !== 'overall' || platform !== 'all' || selectedGame !== 'all' || !!activeSearch

  // Top 3 entries for the podium
  const topThree = useMemo(() => entries.slice(0, 3), [entries])

  // Ladder entries (rank 4 and below)
  const ladderEntries = useMemo(() => entries.slice(3), [entries])
  const totalLadderEntries = ladderEntries.length
  const totalPages = Math.ceil(totalLadderEntries / pageSize) || 1

  const paginatedLadderEntries = useMemo(() => {
    const start = (page - 1) * pageSize
    return ladderEntries.slice(start, start + pageSize)
  }, [ladderEntries, page, pageSize])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setActiveSearch(searchQuery.trim())
    setPage(1)
  }

  const handleSearchClear = () => {
    setSearchQuery('')
    setActiveSearch('')
    setPage(1)
  }

  return (
    <div
      className="relative min-h-[calc(100vh-72px)] w-full mt-16 md:mt-[72px] bg-[#05060A] text-[#F1F4FA] overflow-hidden"
      style={{ backgroundColor: '#05060A' }}
    >
      {/* ============================================================== */}
      {/* SUBTLE DARK-BLUE TINT CONCENTRATED TOWARD TOP-RIGHT CORNER     */}
      {/* ============================================================== */}
      <div
        className="pointer-events-none absolute top-0 right-0 w-[55vw] max-w-[700px] h-[500px] select-none"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(circle at 85% 15%, rgba(18, 52, 115, 0.22) 0%, rgba(10, 26, 60, 0.08) 50%, transparent 75%)',
        }}
      />

      <Container className="pt-8 pb-20 relative z-10">
        {/* ============================================================== */}
        {/* PAGE HEADING                                                   */}
        {/* ============================================================== */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2 font-mono text-[10px] uppercase tracking-widest text-[#25D9F2]">
            <span className="inline-block size-1.5 bg-[#25D9F2]" />
            Official Standings
          </div>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white">
            Leaderboard
          </h1>
          <p className="mt-1 font-mono text-xs sm:text-sm text-[#8995A8]">
            Authoritative rankings across sanctioned tournament circuits and competitive ladders
          </p>
        </div>

        {/* ============================================================== */}
        {/* METRIC SELECTION CONTROLS                                       */}
        {/* ============================================================== */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#101724]/90 border border-[#202B3B] rounded-sm backdrop-blur-sm">
            {METRIC_TABS.map((tab) => {
              const isActive = metric === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setMetric(tab.id)
                    setPage(1)
                  }}
                  className={`px-3.5 py-1.5 font-mono text-xs font-bold uppercase transition-all rounded-sm cursor-pointer ${
                    isActive
                      ? 'bg-[#25D9F2] text-[#05060A] shadow-[0_0_12px_rgba(37,217,242,0.3)]'
                      : 'text-[#8995A8] hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* ============================================================== */}
          {/* PLATFORM, DISCIPLINE & SEARCH CONTROLS                          */}
          {/* ============================================================== */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
            {/* Platform filter tabs */}
            <div className="flex items-center gap-1.5 p-0.5 bg-[#101724]/60 border border-[#202B3B] rounded-sm shrink-0">
              {PLATFORM_OPTIONS.map((p) => {
                const isActive = platform === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setPlatform(p.id)
                      setPage(1)
                    }}
                    className={`px-3 py-1 font-mono text-[11px] uppercase transition-colors rounded-sm cursor-pointer ${
                      isActive
                        ? 'bg-white/10 text-white font-bold border border-white/20'
                        : 'text-[#8995A8] hover:text-white'
                    }`}
                  >
                    {p.label}
                  </button>
                )
              })}
            </div>

            {/* Contender search input */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search contender or tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#101724]/80 border border-[#202B3B] px-3 py-1.5 pr-16 font-mono text-xs text-white placeholder:text-[#8995A8]/60 focus:border-[#25D9F2] focus:outline-none rounded-sm transition-colors"
              />
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleSearchClear}
                    title="Clear search"
                    className="p-1 text-[#8995A8] hover:text-white text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                )}
                <button
                  type="submit"
                  className="px-2 py-0.5 font-mono text-[10px] font-bold uppercase bg-[#25D9F2]/20 text-[#25D9F2] border border-[#25D9F2]/40 rounded-sm hover:bg-[#25D9F2]/30 cursor-pointer"
                >
                  Find
                </button>
              </div>
            </form>
          </div>

          {/* ============================================================== */}
          {/* DISCIPLINE / GAME FILTER CHIPS                                  */}
          {/* ============================================================== */}
          {availableGames.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              <button
                type="button"
                onClick={() => {
                  setSelectedGame('all')
                  setPage(1)
                }}
                className={`px-3 py-1 font-mono text-[11px] uppercase tracking-wider rounded-sm shrink-0 border cursor-pointer transition-colors ${
                  selectedGame === 'all'
                    ? 'border-[#25D9F2] bg-[#25D9F2]/10 text-[#25D9F2] font-bold'
                    : 'border-white/10 text-[#8995A8] hover:border-white/30 hover:text-white'
                }`}
              >
                All Disciplines
              </button>
              {availableGames.map((game) => (
                <button
                  key={game.slug}
                  type="button"
                  onClick={() => {
                    setSelectedGame(game.slug)
                    setPage(1)
                  }}
                  className={`px-3 py-1 font-mono text-[11px] uppercase tracking-wider rounded-sm shrink-0 border cursor-pointer transition-colors ${
                    selectedGame === game.slug
                      ? 'border-[#25D9F2] bg-[#25D9F2]/10 text-[#25D9F2] font-bold'
                      : 'border-white/10 text-[#8995A8] hover:border-white/30 hover:text-white'
                  }`}
                >
                  {game.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* LEADERBOARD CONTENT: LOADING / ERROR / EMPTY / STANDINGS       */}
        {/* ============================================================== */}
        {loading ? (
          <LeaderboardSkeleton />
        ) : error ? (
          <LeaderboardErrorState onRetry={fetchLeaderboardData} />
        ) : entries.length === 0 ? (
          <LeaderboardEmptyState
            hasFilters={hasActiveFilters}
            onResetFilters={handleResetFilters}
          />
        ) : (
          <div className="space-y-12">
            {/* 3-Player Reference-Inspired Podium */}
            <LeaderboardPodium
              topEntries={topThree}
              selectedCategory={metric}
              currentUserId={profile?.id}
              currentUsername={profile?.username}
              disqualifiedIds={disqualifiedIds}
            />

            {/* Ranked Contender Table (Ranks 4+) */}
            {ladderEntries.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#202B3B] pb-2">
                  <h2 className="font-display text-lg uppercase font-bold text-white tracking-wide">
                    Challengers Ladder
                  </h2>
                  <span className="font-mono text-xs text-[#8995A8]">
                    {entries.length} contenders ranked
                  </span>
                </div>

                <LeaderboardTable
                  entries={paginatedLadderEntries}
                  selectedCategory={metric}
                  currentPage={page}
                  totalPages={totalPages}
                  totalEntries={totalLadderEntries}
                  pageSize={pageSize}
                  onPageChange={setPage}
                  currentUserId={profile?.id}
                  currentUsername={profile?.username}
                  disqualifiedIds={disqualifiedIds}
                />
              </div>
            )}
          </div>
        )}
      </Container>
    </div>
  )
}
