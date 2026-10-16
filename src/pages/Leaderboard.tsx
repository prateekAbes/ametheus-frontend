import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { Container, Hud } from '../components/ui'
import { useAuthContext } from '../context/AuthContext'
import {
  getLeaderboardEntries,
  getLeaderboardDisqualifications,
  LeaderboardEntry,
} from '../services/leaderboard'
import { LeaderboardPodium } from '../components/leaderboard/LeaderboardPodium'
import { LeaderboardTable } from '../components/leaderboard/LeaderboardTable'
import { LeaderboardSkeleton } from '../components/leaderboard/LeaderboardSkeleton'
import { LeaderboardEmptyState } from '../components/leaderboard/LeaderboardEmptyState'
import { LeaderboardErrorState } from '../components/leaderboard/LeaderboardErrorState'

const METRIC_TABS = [
  { id: 'overall', label: 'Overall Standing' },
  { id: 'spending', label: 'Highest Spending' },
  { id: 'win_rate', label: 'Win Rate' },
] as const

type MetricId = (typeof METRIC_TABS)[number]['id']

export default function Leaderboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { profile } = useAuthContext()

  // URL state synchronization for active metric
  const initialMetric = (searchParams.get('metric') as MetricId) || 'overall'
  const [metric, setMetric] = useState<MetricId>(
    METRIC_TABS.some((t) => t.id === initialMetric) ? initialMetric : 'overall'
  )

  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [disqualifiedIds, setDisqualifiedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<boolean>(false)

  // Ladder pagination state (for rank 4+)
  const [page, setPage] = useState<number>(1)
  const pageSize = 15

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
        // Disqualifications endpoint may require organizer role; ignore if unauthorized
      })
    return () => {
      isMounted = false
    }
  }, [])

  // Sync metric state to URL parameter
  useEffect(() => {
    const params = new URLSearchParams()
    if (metric !== 'overall') {
      params.set('metric', metric)
    }
    setSearchParams(params, { replace: true })
  }, [metric, setSearchParams])

  // Fetch leaderboard data based on active metric
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
      console.error('[Leaderboard] Error retrieving standings:', err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [metric])

  useEffect(() => {
    fetchLeaderboardData()
  }, [fetchLeaderboardData])

  // Reset to default standing
  const handleResetFilters = () => {
    setMetric('overall')
    setPage(1)
  }

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

  return (
    <div
      className="relative min-h-[calc(100vh-72px)] w-full mt-16 md:mt-[72px] bg-[#05060A] text-[#F1F4FA] overflow-hidden"
      style={{ backgroundColor: '#05060A' }}
    >
      {/* ============================================================== */}
      {/* SUBTLE DARK-BLUE TINT CONCENTRATED TOWARD UPPER-RIGHT CORNER   */}
      {/* ============================================================== */}
      <div
        className="pointer-events-none absolute top-0 right-0 w-[60vw] max-w-[800px] h-[600px] select-none"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse 65% 55% at 92% 8%, rgba(16, 38, 76, 0.32) 0%, rgba(10, 24, 48, 0.12) 45%, rgba(5, 6, 10, 0) 75%)',
        }}
      />

      <Container className="pt-10 sm:pt-14 pb-24 relative z-10">
        {/* ============================================================== */}
        {/* LEADERBOARD HEADING AND TYPOGRAPHY                             */}
        {/* Large, prominent heading matching Tournaments & major pages     */}
        {/* ============================================================== */}
        <div className="mb-10 sm:mb-14">
          <div className="flex items-center gap-4 mb-4">
            <span className="h-px w-10 bg-white/30" />
            <Hud className="text-white/60">Competitive Circuit</Hud>
          </div>
          <h1 className="font-display text-[clamp(2.75rem,7vw,5.5rem)] sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase leading-[0.88] tracking-tight text-white">
            Leaderboard
          </h1>
          <p className="mt-4 max-w-xl font-mono text-xs sm:text-sm text-[#8995A8] tracking-wide">
            Authoritative player standings and competitive rankings across sanctioned tournament circuits
          </p>
        </div>

        {/* ============================================================== */}
        {/* RETAINED METRIC CATEGORIES ONLY: 3 TABS                         */}
        {/* Overall Standing | Highest Spending | Win Rate                 */}
        {/* ============================================================== */}
        <div className="flex items-center justify-start gap-2 mb-10">
          <div className="inline-flex items-center gap-1.5 p-1 bg-[#0c121d]/90 border border-white/10 rounded-sm backdrop-blur-sm">
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
                  className={`px-4 py-2 font-mono text-xs font-bold uppercase transition-all rounded-sm cursor-pointer ${
                    isActive
                      ? 'bg-white/15 text-white border border-white/25 shadow-sm'
                      : 'text-[#8995A8] hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
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
            hasFilters={metric !== 'overall'}
            onResetFilters={handleResetFilters}
          />
        ) : (
          <div>
            {/* Top-3 Stair-Like Podium with Interactive Starry Particle Background */}
            <LeaderboardPodium
              topEntries={topThree}
              selectedCategory={metric}
              currentUserId={profile?.id}
              currentUsername={profile?.username}
              disqualifiedIds={disqualifiedIds}
            />

            {/* Subtle Horizontal Divider Separating Podium & Challengers List */}
            {ladderEntries.length > 0 && (
              <>
                <div className="w-full max-w-4xl mx-auto my-12 sm:my-16 border-b border-white/10" />

                {/* Player Rankings List (Ranks 4+) */}
                <div className="space-y-4 max-w-4xl mx-auto">
                  <div className="flex items-center justify-between pb-1">
                    <h2 className="font-display text-base sm:text-lg uppercase font-bold text-white tracking-wide">
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
              </>
            )}
          </div>
        )}
      </Container>
    </div>
  )
}
