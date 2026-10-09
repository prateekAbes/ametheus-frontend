import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router'
import { Container } from '../components/ui'
import {
  getLeaderboardEntries,
  getLeaderboardCategories,
  getLeaderboardDisqualifications,
  LeaderboardEntry,
  LeaderboardCategory,
  LeaderboardDisqualification,
} from '../services/leaderboard'
import { getGames, Game as ApiGame } from '../services/games'
import { GAMES } from '../lib/data'
import { useAuthContext } from '../context/AuthContext'

import { LeaderboardPodium } from '../components/leaderboard/LeaderboardPodium'
import { LeaderboardTable } from '../components/leaderboard/LeaderboardTable'
import { LeaderboardSkeleton } from '../components/leaderboard/LeaderboardSkeleton'
import { LeaderboardEmptyState } from '../components/leaderboard/LeaderboardEmptyState'
import { LeaderboardErrorState } from '../components/leaderboard/LeaderboardErrorState'

const PAGE_SIZE = 10

const METRIC_OPTIONS = [
  { id: 'overall', label: 'Overall Standings' },
  { id: 'win_rate', label: 'Highest Win Rate' },
  { id: 'wins', label: 'Most Match Wins' },
  { id: 'pc', label: 'PC Competitive' },
  { id: 'mobile', label: 'Mobile Competitive' },
]

export default function Leaderboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialGame = searchParams.get('game') || 'all'
  const initialCategory = searchParams.get('category') || 'overall'

  const { profile } = useAuthContext()

  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [disqualifications, setDisqualifications] = useState<LeaderboardDisqualification[]>([])
  const [categories, setCategories] = useState<LeaderboardCategory[]>([])
  const [games, setGames] = useState<ApiGame[]>([])

  const [selectedGame, setSelectedGame] = useState<string>(initialGame)
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [currentPage, setCurrentPage] = useState<number>(1)

  const [loading, setLoading] = useState<boolean>(true)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)
  const [hasError, setHasError] = useState<boolean>(false)

  // Track the latest active request ID to prevent race conditions from out-of-order responses
  const activeRequestIdRef = useRef<number>(0)

  // Fetch static metadata (games, categories, disqualifications) on mount
  useEffect(() => {
    Promise.allSettled([
      getGames(),
      getLeaderboardCategories(),
      getLeaderboardDisqualifications(),
    ]).then(([gamesRes, catsRes, dqsRes]) => {
      if (gamesRes.status === 'fulfilled' && Array.isArray(gamesRes.value) && gamesRes.value.length > 0) {
        setGames(gamesRes.value)
      }
      if (catsRes.status === 'fulfilled' && Array.isArray(catsRes.value) && catsRes.value.length > 0) {
        setCategories(catsRes.value)
      }
      if (dqsRes.status === 'fulfilled' && Array.isArray(dqsRes.value)) {
        setDisqualifications(dqsRes.value)
      }
    })
  }, [])

  // Sync selectedGame with URL search parameters (e.g. on back/forward browser navigation)
  useEffect(() => {
    const gameParam = searchParams.get('game') || 'all'
    if (gameParam !== selectedGame) {
      setSelectedGame(gameParam)
      setCurrentPage(1)
    }
  }, [searchParams, selectedGame])

  // Dynamic entries fetching routine with race condition protection
  const fetchEntries = useCallback(async (isRefresh = false) => {
    const requestId = ++activeRequestIdRef.current

    if (isRefresh) {
      setIsRefreshing(true)
    } else {
      setLoading(true)
    }
    setHasError(false)

    try {
      const entriesPromise = getLeaderboardEntries({
        category: selectedCategory !== 'overall' ? selectedCategory : undefined,
        game: selectedGame !== 'all' ? selectedGame : undefined,
        limit: 100,
        include_disqualified: true,
      })

      // If explicit user refresh, also reload categories and disqualifications
      if (isRefresh) {
        const [entriesData, catsData, dqsData] = await Promise.all([
          entriesPromise,
          getLeaderboardCategories().catch(() => []),
          getLeaderboardDisqualifications().catch(() => []),
        ])

        if (requestId === activeRequestIdRef.current) {
          setEntries(Array.isArray(entriesData) ? entriesData : [])
          if (Array.isArray(catsData) && catsData.length > 0) {
            setCategories(catsData)
          }
          if (Array.isArray(dqsData)) {
            setDisqualifications(dqsData)
          }
        }
      } else {
        const entriesData = await entriesPromise
        if (requestId === activeRequestIdRef.current) {
          setEntries(Array.isArray(entriesData) ? entriesData : [])
        }
      }
    } catch (err) {
      if (requestId === activeRequestIdRef.current) {
        console.warn('Failed to load leaderboard data:', err)
        setHasError(true)
      }
    } finally {
      if (requestId === activeRequestIdRef.current) {
        setLoading(false)
        setIsRefreshing(false)
      }
    }
  }, [selectedCategory, selectedGame])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  // Game filter handler
  const handleSelectGame = (slug: string) => {
    setSelectedGame(slug)
    setCurrentPage(1)
    if (slug === 'all') {
      searchParams.delete('game')
    } else {
      searchParams.set('game', slug)
    }
    setSearchParams(searchParams)
  }

  // Category filter handler
  const handleSelectCategory = (catSlug: string) => {
    setSelectedCategory(catSlug)
    setCurrentPage(1)
    if (catSlug === 'overall') {
      searchParams.delete('category')
    } else {
      searchParams.set('category', catSlug)
    }
    setSearchParams(searchParams)
  }

  // Search filter handler
  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
  }

  // Disqualification index set for quick lookups
  const dqIdentifiers = useMemo(() => {
    const ids = new Set<string>()
    disqualifications.forEach((d) => {
      if (d.entity_id) ids.add(d.entity_id.toLowerCase())
      if (d.id) ids.add(d.id.toLowerCase())
      if (d.entity_name) ids.add(d.entity_name.toLowerCase())
      if (d.entity_tag) ids.add(d.entity_tag.toLowerCase())
    })
    return ids
  }, [disqualifications])

  // Games normalized for display
  const displayGames: { slug: string; name: string }[] = useMemo(() => {
    if (games.length > 0) {
      return games.map((g) => ({ slug: g.slug, name: g.name }))
    }
    return GAMES.map((g) => ({ slug: g.slug, name: g.name }))
  }, [games])

  // Filter entries by search query if active
  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries
    const q = searchQuery.toLowerCase().trim()
    return entries.filter((e) => {
      const name = (e.name || '').toLowerCase()
      const tag = (e.tag || '').toLowerCase()
      const cap = (e.captain || '').toLowerCase()
      const game = (e.game_name || e.game_slug || '').toLowerCase()
      return (
        name.includes(q) ||
        tag.includes(q) ||
        cap.includes(q) ||
        game.includes(q)
      )
    })
  }, [entries, searchQuery])

  // Top 3 for Podium
  const podiumEntries = useMemo(() => {
    return filteredEntries.slice(0, 3)
  }, [filteredEntries])

  // Ladder Table Entries:
  // Page 1: Ranks 4 to 10 (index 3 to 10)
  // Page > 1: 10 contenders for that page
  const totalEntries = filteredEntries.length
  const totalPages = Math.max(1, Math.ceil(totalEntries / PAGE_SIZE))
  const safeCurrentPage = Math.min(currentPage, totalPages)

  const tableEntries = useMemo(() => {
    if (safeCurrentPage === 1) {
      return filteredEntries.slice(3, PAGE_SIZE)
    }
    const startIdx = (safeCurrentPage - 1) * PAGE_SIZE
    const endIdx = startIdx + PAGE_SIZE
    return filteredEntries.slice(startIdx, endIdx)
  }, [filteredEntries, safeCurrentPage])

  const hasActiveFilters = selectedGame !== 'all' || selectedCategory !== 'overall' || !!searchQuery.trim()

  const handleResetFilters = () => {
    handleSelectGame('all')
    handleSelectCategory('overall')
    setSearchQuery('')
    setCurrentPage(1)
  }

  return (
    <div className="relative min-h-screen bg-black text-white pt-24 pb-20 selection:bg-[#22c55e]/30 selection:text-white">
      {/* Subtle, low-contrast background grid matching the reference */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.06] select-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.2) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.2) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
        }}
        aria-hidden="true"
      />

      <Container className="relative z-10">
        {/* ============================================================== */}
        {/* DESKTOP: 2-COLUMN LAYOUT (SIDEBAR METRIC SELECTOR + PODIUM/LIST)*/}
        {/* ============================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-[190px_1fr] lg:grid-cols-[210px_1fr] gap-6 lg:gap-8 items-start">
          {/* ============================================================ */}
          {/* LEFT COMPACT SIDEBAR: METRIC SELECTOR ON DESKTOP              */}
          {/* ============================================================ */}
          <aside className="hidden md:block border border-white/10 bg-black/80 p-3 select-none sticky top-24">
            <span className="block font-mono text-[10px] uppercase tracking-wider text-white/40 mb-2">
              Metrics
            </span>
            <div className="space-y-1">
              {METRIC_OPTIONS.map((m) => {
                const isActive = selectedCategory === m.id
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleSelectCategory(m.id)}
                    className={`w-full text-left px-2.5 py-1.5 font-mono text-xs transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-white/[0.08] text-[#22c55e] font-bold border-l-2 border-[#22c55e]'
                        : 'text-white/60 hover:text-white hover:bg-white/[0.03]'
                    }`}
                  >
                    {m.label}
                  </button>
                )
              })}
            </div>

            {/* Discipline selector */}
            {displayGames.length > 1 && (
              <div className="mt-4 pt-3 border-t border-white/10">
                <span className="block font-mono text-[10px] uppercase tracking-wider text-white/40 mb-1.5">
                  Discipline
                </span>
                <select
                  value={selectedGame}
                  onChange={(e) => handleSelectGame(e.target.value)}
                  className="w-full bg-black border border-white/15 px-2 py-1 font-mono text-xs text-white focus:border-[#22c55e] outline-none cursor-pointer"
                >
                  <option value="all">All Titles</option>
                  {displayGames.map((g) => (
                    <option key={g.slug} value={g.slug}>{g.name}</option>
                  ))}
                </select>
              </div>
            )}
          </aside>

          {/* ============================================================ */}
          {/* RIGHT / MAIN CONTENT AREA                                     */}
          {/* ============================================================ */}
          <main className="min-w-0 w-full space-y-6">
            {/* Mobile horizontal metric selector (screen < md) */}
            <div className="block md:hidden border-b border-white/10 pb-2">
              <div className="flex overflow-x-auto gap-1">
                {METRIC_OPTIONS.map((m) => {
                  const isActive = selectedCategory === m.id
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleSelectCategory(m.id)}
                      className={`shrink-0 px-2.5 py-1 font-mono text-xs transition-colors ${
                        isActive
                          ? 'bg-white/10 text-[#22c55e] font-bold border-b border-[#22c55e]'
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      {m.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Content Loading / Error / Empty / Data states */}
            {loading ? (
              <LeaderboardSkeleton />
            ) : hasError ? (
              <LeaderboardErrorState onRetry={() => fetchEntries(false)} />
            ) : filteredEntries.length === 0 ? (
              <LeaderboardEmptyState
                hasFilters={hasActiveFilters}
                onResetFilters={handleResetFilters}
              />
            ) : (
              <div className="space-y-6">
                {/* 1. TOP THREE ELEVATED PODIUM CENTERPIECE */}
                {safeCurrentPage === 1 && podiumEntries.length > 0 && (
                  <LeaderboardPodium
                    topEntries={podiumEntries}
                    selectedCategory={selectedCategory}
                    currentUserId={profile?.id}
                    currentUsername={profile?.username}
                    disqualifiedIds={dqIdentifiers}
                  />
                )}

                {/* 2. SEARCH CONTROL PLACED DIRECTLY ABOVE RANKING LIST */}
                <div className="flex items-center justify-between gap-3 border border-white/10 bg-black/60 px-3 py-2 font-mono">
                  <span className="text-[11px] uppercase tracking-wider text-white/40">
                    Standings List ({totalEntries})
                  </span>
                  <div className="relative max-w-xs w-full">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      placeholder="Search player or squad..."
                      className="w-full bg-black border border-white/15 px-2.5 py-1 text-xs text-white placeholder:text-white/30 focus:border-[#22c55e] outline-none"
                    />
                  </div>
                </div>

                {/* 3. MINIMAL RANKING LIST / STANDINGS TABLE (RANKS 4+) */}
                {tableEntries.length > 0 && (
                  <LeaderboardTable
                    entries={tableEntries}
                    selectedCategory={selectedCategory}
                    currentPage={safeCurrentPage}
                    totalPages={totalPages}
                    totalEntries={totalEntries}
                    pageSize={PAGE_SIZE}
                    onPageChange={(p) => setCurrentPage(p)}
                    currentUserId={profile?.id}
                    currentUsername={profile?.username}
                    disqualifiedIds={dqIdentifiers}
                  />
                )}
              </div>
            )}
          </main>
        </div>
      </Container>
    </div>
  )
}
