import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router'
import { Container, Hud } from '../components/ui'
import EsportsHeroVisual from '../components/EsportsHeroVisual'
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
import { LeaderboardControls } from '../components/leaderboard/LeaderboardControls'
import { LeaderboardTable } from '../components/leaderboard/LeaderboardTable'
import { LeaderboardSkeleton } from '../components/leaderboard/LeaderboardSkeleton'
import { LeaderboardEmptyState } from '../components/leaderboard/LeaderboardEmptyState'
import { LeaderboardErrorState } from '../components/leaderboard/LeaderboardErrorState'

const PAGE_SIZE = 10

export default function Leaderboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialGame = searchParams.get('game') || 'all'

  const { profile } = useAuthContext()

  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [disqualifications, setDisqualifications] = useState<LeaderboardDisqualification[]>([])
  const [categories, setCategories] = useState<LeaderboardCategory[]>([])
  const [games, setGames] = useState<ApiGame[]>([])

  const [selectedGame, setSelectedGame] = useState<string>(initialGame)
  const [selectedCategory, setSelectedCategory] = useState<string>('overall')
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
    setSelectedCategory('overall')
    setSearchQuery('')
    setCurrentPage(1)
  }

  return (
    <div className="relative min-h-screen bg-void pb-28 pt-28 sm:pt-32 text-ink overflow-hidden">
      {/* Retained atmospheric esports visual background with subtle grid & flares */}
      <EsportsHeroVisual variant="leaderboard" />

      {/* Cybernetic floor grid lines inspired by reference */}
      <div
        className="pointer-events-none absolute inset-x-0 top-36 h-[650px] opacity-20 select-none overflow-hidden"
        aria-hidden="true"
      >
        <div
          className="size-full"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(61, 255, 154, 0.15) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(61, 255, 154, 0.15) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse at center 40%, black 20%, transparent 75%)',
          }}
        />
      </div>

      <Container className="relative z-10 space-y-10">
        {/* ============================================================== */}
        {/* SECTION 2 — LEADERBOARD INTRODUCTION                           */}
        {/* ============================================================== */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="size-2 rounded-full bg-[#3dff9a] shadow-[0_0_10px_#3dff9a] animate-pulse" />
              <Hud className="text-[#3dff9a] font-bold tracking-widest">
                OFFICIAL STANDINGS &amp; ELO RATINGS
              </Hud>
              <span className="text-white/20 select-none">·</span>
              <span className="font-mono text-[10px] text-dim uppercase tracking-wider hidden sm:inline-block">
                Current Competitive Circuit
              </span>
            </div>

            <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight text-ink">
              Leaderboard
            </h1>

            <p className="mt-2 text-sm sm:text-base text-dim max-w-xl font-mono leading-relaxed">
              The players setting the standard. Verified Elo ratings, match win percentages, and sanctioned tournament earnings across India&apos;s competitive esports battlegrounds.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-4 font-mono text-xs text-dim bg-surface/60 border border-white/10 px-4 py-3 rounded-xs backdrop-blur-md self-start md:self-auto">
            <div>
              <span className="text-[10px] text-dim/70 uppercase block">Active Circuit</span>
              <span className="font-bold text-ink">Tier 1 National</span>
            </div>
            <span className="text-white/20 select-none">|</span>
            <div>
              <span className="text-[10px] text-dim/70 uppercase block">Ranked Squads</span>
              <span className="font-bold text-[#3dff9a]">{totalEntries}</span>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* SECTION 3 — RANKING CONTROLS (DISCIPLINES, METRICS, SEARCH)    */}
        {/* ============================================================== */}
        <LeaderboardControls
          games={displayGames}
          selectedGame={selectedGame}
          onSelectGame={handleSelectGame}
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={handleSelectCategory}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          onRefresh={() => fetchEntries(true)}
          isRefreshing={isRefreshing}
        />

        {/* ============================================================== */}
        {/* SECTION 4 & 5 — CONTENT (PODIUM & STANDINGS TABLE)             */}
        {/* ============================================================== */}
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
          <div className="space-y-16">
            {/* If user is on page > 1, show a compact jump-back notification banner */}
            {safeCurrentPage > 1 && (
              <div className="flex items-center justify-between border border-white/10 bg-surface/50 px-5 py-3">
                <div className="flex items-center gap-2.5">
                  <span className="size-2 rounded-full bg-[#3dff9a] animate-pulse shadow-[0_0_8px_#3dff9a]" />
                  <span className="font-mono text-xs text-dim">
                    Standings Ladder: Page <span className="font-bold text-ink">{safeCurrentPage}</span> of {totalPages} (Ranks #{ (safeCurrentPage - 1) * PAGE_SIZE + 1 } to #{ Math.min(safeCurrentPage * PAGE_SIZE, totalEntries) })
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentPage(1)
                    window.scrollTo({ top: 250, behavior: 'smooth' })
                  }}
                  className="font-mono text-xs font-bold text-[#3dff9a] hover:underline transition-colors cursor-pointer"
                >
                  ← View Top 3 Podium (Page 1)
                </button>
              </div>
            )}

            {/* TOP THREE PODIUM CENTERPIECE (Rendered on Page 1) */}
            {safeCurrentPage === 1 && podiumEntries.length > 0 && (
              <LeaderboardPodium
                topEntries={podiumEntries}
                selectedCategory={selectedCategory}
                currentUserId={profile?.id}
                currentUsername={profile?.username}
                disqualifiedIds={dqIdentifiers}
              />
            )}

            {/* FULL STANDINGS LADDER TABLE / REMAINING PLAYERS */}
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
      </Container>
    </div>
  )
}
