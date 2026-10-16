import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { Container } from '../components/ui'
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
import { LeaderboardParticleBackground } from '../components/leaderboard/LeaderboardParticleBackground'

const METRIC_TABS = [
  { id: 'overall', label: 'Overall Standing' },
  { id: 'spending', label: 'Highest Spending' },
  { id: 'win_rate', label: 'Win Rate' },
  { id: 'wins', label: 'Match Wins' },
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
      {/* EXTENDED SUBTLE BLUE ATMOSPHERIC TINT DOWN THE RIGHT SIDE     */}
      {/* ============================================================== */}
      <div
        className="pointer-events-none absolute top-0 right-0 w-[75vw] max-w-[1100px] h-[1200px] select-none"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 85% 15%, rgba(16, 42, 85, 0.28) 0%, rgba(10, 26, 54, 0.14) 40%, rgba(6, 16, 36, 0.05) 70%, rgba(5, 6, 10, 0) 100%)',
        }}
      />

      {/* ============================================================== */}
      {/* UPPER SECTION: Heading, Metric Tabs, Podium & Starry Particles */}
      {/* Particles drift seamlessly from behind heading down to divider */}
      {/* ============================================================== */}
      <section className="relative overflow-hidden">
        {/* Full-coverage particle background across entire upper section */}
        <LeaderboardParticleBackground />

        <Container className="pt-10 sm:pt-14 pb-8 sm:pb-12 relative z-10">
          {/* LEADERBOARD HEADING AND TYPOGRAPHY (Matching Tournaments page scale) */}
          <div className="mb-10 sm:mb-14">
            <h1 className="font-display text-[clamp(3.5rem,12vw,12rem)] font-black uppercase leading-[0.8] tracking-tight text-white">
              LEADERBOARD
            </h1>
            <p className="mt-5 max-w-xl text-base sm:text-lg text-ink/75 font-sans">
              Authoritative player standings and competitive rankings across sanctioned tournament circuits.
            </p>
          </div>

          {/* 4 METRIC CATEGORIES: Overall Standing | Highest Spending | Win Rate | Match Wins */}
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

          {/* Top-3 Podium / Loading / Error / Empty States */}
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
            <LeaderboardPodium
              topEntries={topThree}
              selectedCategory={metric}
              currentUserId={profile?.id}
              currentUsername={profile?.username}
              disqualifiedIds={disqualifiedIds}
            />
          )}
        </Container>
      </section>

      {/* ============================================================== */}
      {/* SUBTLE HORIZONTAL DIVIDER SEPARATING PODIUM & CHALLENGERS LIST */}
      {/* Particle field strictly terminates at this line                */}
      {/* ============================================================== */}
      {!loading && !error && entries.length > 0 && ladderEntries.length > 0 && (
        <div className="w-full max-w-4xl mx-auto my-12 sm:my-16 border-b border-white/10 relative z-10" />
      )}

      {/* ============================================================== */}
      {/* LOWER SECTION: Challengers List (Ranks 4+)                      */}
      {/* Clean, quiet, dark background with zero particles              */}
      {/* ============================================================== */}
      {!loading && !error && entries.length > 0 && ladderEntries.length > 0 && (
        <Container className="pb-24 relative z-10">
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
        </Container>
      )}
    </div>
  )
}
