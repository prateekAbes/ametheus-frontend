import { useState, useEffect, useMemo } from 'react'
import {
  getLeaderboardEntries,
  getLeaderboardDisqualifications,
  LeaderboardEntry,
  LeaderboardDisqualification,
} from '../../services/leaderboard'
import { inr } from '../../lib/data'
import { Hud, Panel } from '../ui'
import DynamicImage from '../DynamicImage'
import { resolveMediaUrl } from '../../services/apiClient'

interface AdminOverviewLeaderboardProps {
  onNavigateTab?: (tab: string) => void
}

const LIMIT_OPTIONS = [10, 20, 30, 40, 50] as const
type LimitOption = (typeof LIMIT_OPTIONS)[number]

const CATEGORY_OPTIONS = [
  { slug: 'overall', label: 'Overall Standings', metric: 'rating' },
  { slug: 'win_rate', label: 'Highest Win Rate', metric: 'win_rate' },
  { slug: 'earnings', label: 'Top Prize Winners', metric: 'earnings' },
  { slug: 'wins', label: 'Most Match Wins', metric: 'wins' },
]

export function AdminOverviewLeaderboard({ onNavigateTab }: AdminOverviewLeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [disqualifications, setDisqualifications] = useState<LeaderboardDisqualification[]>([])
  const [limit, setLimit] = useState<LimitOption>(10)
  const [category, setCategory] = useState<string>('overall')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLeaderboard = async () => {
    setLoading(true)
    setError(null)
    try {
      const [resEntries, resDqs] = await Promise.all([
        getLeaderboardEntries({
          category: category !== 'overall' ? category : undefined,
          limit,
          include_disqualified: true,
        }).catch(() => []),
        getLeaderboardDisqualifications().catch(() => []),
      ])

      setEntries(Array.isArray(resEntries) ? resEntries : [])
      setDisqualifications(Array.isArray(resDqs) ? resDqs : [])
    } catch (err: any) {
      setError(err.message || 'Failed to fetch leaderboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeaderboard()
  }, [limit, category])

  // Build disqualified identifiers set
  const dqIdentifiers = useMemo(() => {
    const ids = new Set<string>()
    const names = new Set<string>()
    const tags = new Set<string>()

    disqualifications.forEach((d) => {
      if (d.entity_id) ids.add(d.entity_id.toLowerCase())
      if (d.id) ids.add(d.id.toLowerCase())
      if (d.entity_name) names.add(d.entity_name.toLowerCase())
      if (d.entity_tag) tags.add(d.entity_tag.toLowerCase())
    })

    return { ids, names, tags }
  }, [disqualifications])

  // Check if an entry is disqualified
  const isEntryDisqualified = (e: LeaderboardEntry): boolean => {
    if (e.is_disqualified) return true
    if ((e.status || '').toUpperCase() === 'DISQUALIFIED') return true
    const eId = (e.id || '').toLowerCase()
    const eName = (e.name || '').toLowerCase()
    const eTag = (e.tag || '').toLowerCase()
    if (dqIdentifiers.ids.has(eId)) return true
    if (dqIdentifiers.names.has(eName)) return true
    if (eTag && dqIdentifiers.tags.has(eTag)) return true
    return false
  }

  // Filtered entries by search
  const filteredEntries = useMemo(() => {
    if (!search.trim()) return entries
    const q = search.toLowerCase()
    return entries.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        (e.tag && e.tag.toLowerCase().includes(q)) ||
        (e.captain && e.captain.toLowerCase().includes(q)) ||
        (e.game_name && e.game_name.toLowerCase().includes(q))
    )
  }, [entries, search])

  // Top 3 Podium Cards
  const top1 = filteredEntries[0] || null
  const top2 = filteredEntries[1] || null
  const top3 = filteredEntries[2] || null
  const restEntries = filteredEntries.slice(3)

  return (
    <div className="space-y-6">
      {/* Section Header & View Controls */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="size-2 rounded-full bg-cyan animate-pulse" />
            <Hud className="text-cyan font-bold">PLATFORM LEADERBOARD & STANDINGS</Hud>
            <span className="border border-white/10 bg-surface px-2 py-0.5 font-mono text-[9px] uppercase text-dim">
              100% DB GROUNDED
            </span>
          </div>
          <h2 className="mt-2 font-display text-3xl md:text-4xl font-black uppercase text-ink">
            Contender Hierarchy
          </h2>
          <p className="mt-1 text-xs text-dim font-mono max-w-2xl">
            Authoritative platform rankings, tournament performance, Elo ladder ratings, and verified prize disbursements.
          </p>
        </div>

        {/* Controls: Limit Tabs & Refresh */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Limit selector tabs */}
          <div className="flex items-center border border-white/15 bg-surface/80 p-0.5">
            {LIMIT_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => setLimit(opt)}
                className={`px-3 py-1 font-mono text-xs uppercase transition-colors cursor-pointer ${
                  limit === opt
                    ? 'bg-cyan text-void font-bold shadow-[0_0_12px_rgba(62,242,255,0.4)]'
                    : 'text-dim hover:text-ink'
                }`}
              >
                Top {opt}
              </button>
            ))}
          </div>

          {/* Sync Button */}
          <button
            onClick={fetchLeaderboard}
            disabled={loading}
            className="border border-white/20 bg-surface px-3 py-1.5 font-mono text-xs uppercase text-dim hover:border-cyan hover:text-cyan transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span>{loading ? '...' : '↻'}</span>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar: Category Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          {CATEGORY_OPTIONS.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => setCategory(cat.slug)}
              className={`px-3 py-1 font-mono text-xs uppercase border transition-colors cursor-pointer ${
                category === cat.slug
                  ? 'border-cyan bg-cyan/15 text-cyan font-bold'
                  : 'border-white/10 bg-surface/40 text-dim hover:text-ink hover:border-white/20'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-64">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search squad or captain..."
            className="w-full border border-white/10 bg-surface px-3 py-1.5 font-mono text-xs text-ink placeholder-dim/50 focus:border-cyan focus:outline-none"
          />
        </div>
      </div>

      {/* TOP 3 PODIUM DISPLAY */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="border border-white/10 bg-surface/30 p-6 min-h-[220px] animate-pulse">
              <div className="h-4 w-20 bg-white/10 rounded mb-4" />
              <div className="h-8 w-40 bg-white/10 rounded mb-2" />
              <div className="h-4 w-24 bg-white/10 rounded mb-6" />
              <div className="h-10 w-full bg-white/10 rounded" />
            </div>
          ))}
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="border border-white/10 bg-surface/30 p-16 text-center">
          <Hud className="text-cyan">No Standings Recorded</Hud>
          <p className="mt-2 font-mono text-sm text-dim max-w-md mx-auto">
            {search
              ? `No contenders matched the search query "${search}".`
              : 'No leaderboard entries are currently populated in the database.'}
          </p>
          <button
            onClick={() => {
              setSearch('')
              fetchLeaderboard()
            }}
            className="mt-6 border border-cyan/40 bg-cyan/10 px-4 py-2 font-mono text-xs uppercase font-bold text-cyan hover:bg-cyan/20 transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Visual Top 3 Podium Cards */}
          <div className="grid gap-4 md:grid-cols-3 items-stretch">
            {/* Rank 2: Silver (Runner-Up) */}
            {top2 && (
              <PodiumCard
                entry={top2}
                rank={2}
                badgeTitle="02 · SILVER RUNNER-UP"
                badgeStyle="border-slate-300/80 bg-slate-300/15 text-slate-200"
                glowBorder="border-slate-400/50 hover:border-slate-300"
                glowBg="bg-gradient-to-b from-slate-400/10 via-surface to-surface"
                accentColor="text-slate-200"
                isDisqualified={isEntryDisqualified(top2)}
              />
            )}

            {/* Rank 1: Gold (Champion) - Most Prominent */}
            {top1 && (
              <PodiumCard
                entry={top1}
                rank={1}
                badgeTitle="👑 01 · GOLD CHAMPION"
                badgeStyle="border-amber-400/90 bg-amber-400/20 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.3)]"
                glowBorder="border-amber-400/80 hover:border-amber-300 shadow-[0_0_24px_rgba(251,191,36,0.15)]"
                glowBg="bg-gradient-to-b from-amber-500/15 via-surface to-surface"
                accentColor="text-amber-300"
                isDisqualified={isEntryDisqualified(top1)}
                featured
              />
            )}

            {/* Rank 3: Bronze (3rd Place) */}
            {top3 && (
              <PodiumCard
                entry={top3}
                rank={3}
                badgeTitle="03 · BRONZE 3RD PLACE"
                badgeStyle="border-amber-700/80 bg-amber-700/15 text-amber-500"
                glowBorder="border-amber-700/50 hover:border-amber-600"
                glowBg="bg-gradient-to-b from-amber-800/10 via-surface to-surface"
                accentColor="text-amber-500"
                isDisqualified={isEntryDisqualified(top3)}
              />
            )}
          </div>

          {/* Full Standings Table for All Selected Entries */}
          <div className="border border-white/10 bg-surface/40 overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3 bg-surface/80">
              <span className="font-mono text-xs uppercase tracking-wider text-ink font-bold">
                Complete Ladder Standings ({filteredEntries.length} Ranked Contenders)
              </span>
              <span className="font-mono text-[10px] text-dim uppercase">
                Showing Top {limit}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-void/50 text-[10px] uppercase text-dim tracking-wider">
                    <th className="px-5 py-3 w-16">Rank</th>
                    <th className="px-5 py-3">Contender Squad</th>
                    <th className="px-5 py-3">Captain</th>
                    <th className="px-5 py-3 text-right">Rating (Elo)</th>
                    <th className="px-5 py-3 text-right">Win Rate</th>
                    <th className="px-5 py-3 text-right">Match Record</th>
                    <th className="px-5 py-3 text-right">Total Earnings</th>
                    <th className="px-5 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredEntries.map((e, idx) => {
                    const isDq = isEntryDisqualified(e)
                    const rankNum = idx + 1

                    return (
                      <tr
                        key={e.id || idx}
                        className={`transition-colors hover:bg-white/[0.03] ${
                          isDq ? 'bg-live/5' : ''
                        }`}
                      >
                        {/* Rank */}
                        <td className="px-5 py-4 font-bold">
                          {rankNum === 1 ? (
                            <span className="text-amber-300">#01 👑</span>
                          ) : rankNum === 2 ? (
                            <span className="text-slate-300">#02</span>
                          ) : rankNum === 3 ? (
                            <span className="text-amber-600">#03</span>
                          ) : (
                            <span className="text-dim">#{String(rankNum).padStart(2, '0')}</span>
                          )}
                        </td>

                        {/* Contender Squad */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {e.logo_url ? (
                              <div className="size-8 shrink-0 overflow-hidden border border-white/10 bg-surface">
                                <DynamicImage
                                  src={resolveMediaUrl(e.logo_url)}
                                  alt={e.name}
                                  className="size-8 object-cover"
                                />
                              </div>
                            ) : (
                              <div className="flex size-8 shrink-0 items-center justify-center border border-white/10 bg-surface font-display text-sm font-black text-cyan">
                                {e.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-display font-black uppercase text-ink">
                                  {e.name}
                                </span>
                                {e.tag && (
                                  <span className="border border-white/10 bg-white/5 px-1.5 py-0.2 font-mono text-[9px] text-cyan">
                                    [{e.tag}]
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-dim block mt-0.5">
                                {e.game_name || e.game_slug || 'Competitive Esports'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Captain */}
                        <td className="px-5 py-4 text-dim">
                          {e.captain || '—'}
                        </td>

                        {/* Elo Rating */}
                        <td className="px-5 py-4 text-right font-display text-base font-black text-cyan">
                          {e.rating}
                        </td>

                        {/* Win Rate */}
                        <td className="px-5 py-4 text-right text-ink">
                          {typeof e.win_rate === 'number' ? `${e.win_rate}%` : e.win_rate || '0%'}
                        </td>

                        {/* Match Record */}
                        <td className="px-5 py-4 text-right text-dim">
                          <span className="text-ok font-bold">{e.wins}W</span>
                          <span className="mx-1">/</span>
                          <span className="text-warn">{e.losses}L</span>
                          <span className="text-[10px] text-dim ml-1">({e.matches_played})</span>
                        </td>

                        {/* Total Earnings */}
                        <td className="px-5 py-4 text-right font-bold text-ink">
                          {typeof e.earnings === 'number' ? inr(e.earnings) : e.earnings || '₹0'}
                        </td>

                        {/* Status Badge */}
                        <td className="px-5 py-4 text-center">
                          {isDq ? (
                            <span className="border border-live/80 bg-live/20 text-live px-2 py-0.5 font-mono text-[10px] uppercase font-bold tracking-wider animate-pulse">
                              DISQUALIFIED
                            </span>
                          ) : (
                            <span className="border border-ok/40 bg-ok/10 text-ok px-2 py-0.5 font-mono text-[10px] uppercase font-bold tracking-wider">
                              ACTIVE
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PodiumCard({
  entry,
  rank,
  badgeTitle,
  badgeStyle,
  glowBorder,
  glowBg,
  accentColor,
  isDisqualified,
  featured = false,
}: {
  entry: LeaderboardEntry
  rank: number
  badgeTitle: string
  badgeStyle: string
  glowBorder: string
  glowBg: string
  accentColor: string
  isDisqualified: boolean
  featured?: boolean
}) {
  return (
    <Panel
      className={`relative p-6 border transition-all duration-300 flex flex-col justify-between ${glowBorder} ${glowBg} ${
        featured ? 'md:-translate-y-2' : ''
      }`}
    >
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <span className={`border px-2.5 py-1 font-mono text-[10px] uppercase font-bold tracking-wider ${badgeStyle}`}>
            {badgeTitle}
          </span>
          {isDisqualified && (
            <span className="border border-live/80 bg-live/20 text-live px-2 py-0.5 font-mono text-[9px] uppercase font-bold animate-pulse">
              DISQUALIFIED
            </span>
          )}
        </div>

        {/* Team Identity */}
        <div className="flex items-center gap-4 mt-2">
          {entry.logo_url ? (
            <div className="size-14 shrink-0 overflow-hidden border border-white/15 bg-surface">
              <DynamicImage
                src={resolveMediaUrl(entry.logo_url)}
                alt={entry.name}
                className="size-14 object-cover"
              />
            </div>
          ) : (
            <div className="flex size-14 shrink-0 items-center justify-center border border-white/15 bg-surface font-display text-2xl font-black text-cyan">
              {entry.name.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h3 className="font-display text-2xl font-black uppercase text-ink truncate leading-tight">
              {entry.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              {entry.tag && (
                <span className="border border-white/10 bg-white/5 px-1.5 py-0.2 font-mono text-[10px] text-cyan">
                  [{entry.tag}]
                </span>
              )}
              <span className="text-xs text-dim truncate font-mono">
                {entry.game_name || entry.game_slug || 'Esports'}
              </span>
            </div>
          </div>
        </div>

        {/* Captain */}
        <p className="mt-3 text-xs text-dim font-mono">
          Captain: <span className="text-ink">{entry.captain || '—'}</span>
        </p>

        {/* Stat Grid */}
        <div className="mt-5 grid grid-cols-2 gap-2 border-t border-white/10 pt-4">
          <div className="border border-white/5 bg-surface/50 p-2.5">
            <Hud className="text-[10px] text-dim block">PLATFORM RATING</Hud>
            <p className={`font-display text-2xl font-black mt-1 ${accentColor}`}>
              {entry.rating}
            </p>
          </div>
          <div className="border border-white/5 bg-surface/50 p-2.5">
            <Hud className="text-[10px] text-dim block">WIN RATE</Hud>
            <p className="font-display text-2xl font-black text-ink mt-1">
              {typeof entry.win_rate === 'number' ? `${entry.win_rate}%` : entry.win_rate || '0%'}
            </p>
          </div>
          <div className="border border-white/5 bg-surface/50 p-2.5">
            <Hud className="text-[10px] text-dim block">RECORD (W - L)</Hud>
            <p className="font-mono text-sm text-ink font-bold mt-1">
              <span className="text-ok">{entry.wins}W</span> - <span className="text-warn">{entry.losses}L</span>
            </p>
          </div>
          <div className="border border-white/5 bg-surface/50 p-2.5">
            <Hud className="text-[10px] text-dim block">VERIFIED PRIZES</Hud>
            <p className="font-mono text-sm font-bold text-ok mt-1">
              {typeof entry.earnings === 'number' ? inr(entry.earnings) : entry.earnings || '₹0'}
            </p>
          </div>
        </div>
      </div>
    </Panel>
  )
}
