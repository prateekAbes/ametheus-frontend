import { useState, useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Container, Hud } from '../components/ui'
import EsportsHeroVisual from '../components/EsportsHeroVisual'
import {
  getLeaderboardEntries,
  getLeaderboardStats,
  getLeaderboardCategories,
  getLeaderboardDisqualifications,
  LeaderboardEntry,
  LeaderboardStats,
  LeaderboardCategory,
  LeaderboardDisqualification,
} from '../services/leaderboard'
import { getGames, Game as ApiGame, normalizeGame } from '../services/games'
import { GAMES, inr } from '../lib/data'
import DynamicImage from '../components/DynamicImage'
import { resolveMediaUrl } from '../services/apiClient'

const LIMIT_OPTIONS = [10, 20, 30, 40, 50] as const
type LimitOption = (typeof LIMIT_OPTIONS)[number]

export default function Leaderboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialGame = searchParams.get('game') || 'all'

  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [disqualifications, setDisqualifications] = useState<LeaderboardDisqualification[]>([])
  const [stats, setStats] = useState<LeaderboardStats | null>(null)
  const [categories, setCategories] = useState<LeaderboardCategory[]>([])
  const [games, setGames] = useState<ApiGame[]>([])
  const [selectedGame, setSelectedGame] = useState<string>(initialGame)
  const [selectedCategory, setSelectedCategory] = useState<string>('overall')
  const [selectedLimit, setSelectedLimit] = useState<LimitOption>(10)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  // Fetch games list for discipline tabs
  useEffect(() => {
    getGames()
      .then((res) => {
        if (Array.isArray(res) && res.length > 0) {
          setGames(res)
        }
      })
      .catch(() => {})
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [entriesData, statsData, catsData, dqsData] = await Promise.all([
        getLeaderboardEntries({
          category: selectedCategory !== 'overall' ? selectedCategory : undefined,
          game: selectedGame !== 'all' ? selectedGame : undefined,
          search: searchQuery.trim() || undefined,
          limit: selectedLimit,
          include_disqualified: true,
        }).catch(() => []),
        getLeaderboardStats().catch(() => null),
        getLeaderboardCategories().catch(() => []),
        getLeaderboardDisqualifications().catch(() => []),
      ])

      setEntries(Array.isArray(entriesData) ? entriesData : [])
      setStats(statsData || null)
      if (Array.isArray(catsData) && catsData.length > 0) {
        setCategories(catsData)
      }
      setDisqualifications(Array.isArray(dqsData) ? dqsData : [])
    } catch (err) {
      console.warn('Failed to load leaderboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [selectedCategory, selectedGame, selectedLimit])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchData()
  }

  const handleSelectGame = (slug: string) => {
    setSelectedGame(slug)
    if (slug === 'all') {
      searchParams.delete('game')
    } else {
      searchParams.set('game', slug)
    }
    setSearchParams(searchParams)
  }

  // Cross-reference disqualification IDs
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

  const displayGames = games.length > 0 ? games.map((g) => normalizeGame(g as any)) : GAMES

  const top1 = entries[0] || null
  const top2 = entries[1] || null
  const top3 = entries[2] || null
  const remainingEntries = entries.slice(3)

  return (
    <div className="relative min-h-screen bg-void pb-28 pt-32 text-ink overflow-hidden">
      <EsportsHeroVisual variant="leaderboard" />
      <Container className="relative">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
          <div>
            <div className="flex items-center gap-3">
              <span className="size-2 rounded-full bg-cyan animate-pulse" />
              <Hud className="text-cyan font-bold">OFFICIAL ELO RANKINGS &amp; STANDINGS</Hud>
            </div>
            <h1 className="mt-2 font-display text-4xl sm:text-6xl font-black uppercase tracking-tight text-ink">
              Platform <span className="text-cyan">Leaderboard</span>
            </h1>
            <p className="mt-2 text-sm text-dim max-w-2xl font-mono">
              Verified contender ratings, match win percentages, and sanctioned tournament earnings across India&apos;s competitive esports battlegrounds.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/tournaments"
              className="border border-white/15 bg-surface px-5 py-3 font-mono text-xs font-bold uppercase tracking-wider text-ink hover:border-cyan hover:text-cyan transition-colors cursor-pointer"
            >
              Compete in Circuit →
            </Link>
          </div>
        </div>

        {/* COMPACT Secondary Overview Stats Ribbon (Subordinate to 1st/2nd/3rd) */}
        {stats && (
          <div className="mt-6 flex flex-wrap items-center gap-3 sm:gap-6 border border-white/10 bg-surface/40 px-4 py-2.5 backdrop-blur-sm">
            <div className="flex items-center gap-2 border-r border-white/10 pr-4 sm:pr-6 last:border-0">
              <span className="font-mono text-[11px] uppercase text-dim tracking-wider">Awarded Prizes:</span>
              <span className="font-mono text-xs font-bold text-cyan">{stats.total_awarded_prizes || '₹0'}</span>
            </div>
            <div className="flex items-center gap-2 border-r border-white/10 pr-4 sm:pr-6 last:border-0">
              <span className="font-mono text-[11px] uppercase text-dim tracking-wider">Active Contenders:</span>
              <span className="font-mono text-xs font-bold text-ink">{stats.active_contenders || '0'}</span>
            </div>
            <div className="flex items-center gap-2 border-r border-white/10 pr-4 sm:pr-6 last:border-0">
              <span className="font-mono text-[11px] uppercase text-dim tracking-wider">Verified Squads:</span>
              <span className="font-mono text-xs font-bold text-ink">{stats.verified_squads || '0'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] uppercase text-dim tracking-wider">Top Squad:</span>
              <span className="font-mono text-xs font-bold text-amber-400">
                {stats.top_team_name ? `${stats.top_team_name} · ` : ''}{stats.top_team_earnings || '₹0'}
              </span>
            </div>
          </div>
        )}

        {/* 1. Game Discipline Filter Bar */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-xs text-dim uppercase tracking-wider">
              Filter by Discipline:
            </span>
            {selectedGame !== 'all' && (
              <button
                onClick={() => handleSelectGame('all')}
                className="font-mono text-[11px] text-cyan hover:underline cursor-pointer"
              >
                Reset to All Titles
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleSelectGame('all')}
              className={`px-3.5 py-1.5 font-mono text-xs font-bold uppercase tracking-wider transition-colors border cursor-pointer ${
                selectedGame === 'all'
                  ? 'border-cyan bg-cyan text-void shadow-[0_0_12px_rgba(62,242,255,0.3)]'
                  : 'border-white/10 bg-surface/60 text-dim hover:border-white/30 hover:text-ink'
              }`}
            >
              All Disciplines
            </button>
            {displayGames.map((g) => {
              const isSelected = selectedGame === g.slug
              return (
                <button
                  key={g.slug}
                  onClick={() => handleSelectGame(g.slug)}
                  className={`px-3.5 py-1.5 font-mono text-xs font-bold uppercase tracking-wider transition-colors border cursor-pointer ${
                    isSelected
                      ? 'border-cyan bg-cyan text-void shadow-[0_0_12px_rgba(62,242,255,0.3)]'
                      : 'border-white/10 bg-surface/60 text-dim hover:border-white/30 hover:text-ink'
                  }`}
                >
                  {g.name}
                </button>
              )
            })}
          </div>
        </div>

        {/* 2. Ranking Criteria Category, Limit Tabs & Search Bar */}
        <div className="mt-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-t border-white/10 pt-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-dim uppercase mr-2 tracking-wider">Metric:</span>
            {categories.length > 0
              ? categories.map((cat) => (
                  <button
                    key={cat.slug}
                    onClick={() => setSelectedCategory(cat.slug)}
                    className={`px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider transition-colors border cursor-pointer ${
                      selectedCategory === cat.slug
                        ? 'border-cyan bg-cyan/15 text-cyan'
                        : 'border-white/10 bg-surface/40 text-dim hover:border-white/30 hover:text-ink'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))
              : [
                  ['overall', 'Overall Standings'],
                  ['win_rate', 'Highest Win Rate'],
                  ['earnings', 'Top Prize Winners'],
                  ['wins', 'Most Wins'],
                ].map(([slug, label]) => (
                  <button
                    key={slug}
                    onClick={() => setSelectedCategory(slug)}
                    className={`px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider transition-colors border cursor-pointer ${
                      selectedCategory === slug
                        ? 'border-cyan bg-cyan/15 text-cyan'
                        : 'border-white/10 bg-surface/40 text-dim hover:border-white/30 hover:text-ink'
                    }`}
                  >
                    {label}
                  </button>
                ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Limit Selector: Top 10, Top 20, Top 30, Top 40, Top 50 */}
            <div className="flex items-center border border-white/15 bg-surface/80 p-0.5">
              {LIMIT_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setSelectedLimit(opt)}
                  className={`px-2.5 py-1 font-mono text-xs uppercase transition-colors cursor-pointer ${
                    selectedLimit === opt
                      ? 'bg-cyan text-void font-bold shadow-[0_0_10px_rgba(62,242,255,0.4)]'
                      : 'text-dim hover:text-ink'
                  }`}
                >
                  Top {opt}
                </button>
              ))}
            </div>

            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="Search squad or tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-surface border border-white/10 px-3 py-1.5 font-mono text-xs text-ink placeholder:text-dim/50 focus:border-cyan focus:outline-none w-44 sm:w-56"
              />
              <button
                type="submit"
                className="bg-cyan/10 border border-cyan/30 text-cyan hover:bg-cyan/20 px-3.5 py-1.5 font-mono text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Filter
              </button>
            </form>
          </div>
        </div>

        {/* 3. Standings Output */}
        {loading ? (
          <div className="mt-12 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              {[1, 2, 3].map((n) => (
                <div key={n} className="border border-white/10 bg-surface/40 p-6 min-h-[260px] animate-pulse">
                  <div className="h-4 w-24 bg-white/10 rounded mb-4" />
                  <div className="h-8 w-44 bg-white/10 rounded mb-2" />
                  <div className="h-4 w-28 bg-white/10 rounded mb-6" />
                  <div className="h-16 w-full bg-white/10 rounded" />
                </div>
              ))}
            </div>
            <div className="h-64 border border-white/10 bg-surface/20 animate-pulse" />
          </div>
        ) : entries.length === 0 ? (
          <div className="mt-12 border border-white/10 bg-surface/30 p-16 text-center">
            <Hud className="text-cyan">No Ranked Contenders</Hud>
            <p className="mt-2 font-mono text-dim text-sm max-w-md mx-auto">
              {searchQuery
                ? `No contenders matched the search query "${searchQuery}".`
                : 'No ranked squads found in the database for the selected discipline and criteria.'}
            </p>
            {selectedGame !== 'all' && (
              <button
                onClick={() => handleSelectGame('all')}
                className="mt-6 border border-cyan/40 bg-cyan/10 px-4 py-2 font-mono text-xs uppercase font-bold text-cyan hover:bg-cyan/20 transition-colors cursor-pointer"
              >
                View All Disciplines
              </button>
            )}
          </div>
        ) : (
          <div className="mt-12 space-y-12">
            {/* DYNAMIC TOP THREE PODIUM (1st Gold, 2nd Silver, 3rd Bronze) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              {/* 2nd Place: Silver (Left on desktop) */}
              {top2 && (
                <div className="order-2 md:order-1 border-2 border-slate-300/60 bg-gradient-to-b from-slate-400/15 via-surface/90 to-surface p-6 relative transition-all duration-300 hover:border-slate-200 animate-silver-glow">
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="inline-flex items-center gap-1.5 rounded border border-slate-300/80 bg-slate-300/20 px-2.5 py-1 font-mono text-xs font-black text-slate-100 shadow-[0_0_10px_rgba(203,213,225,0.25)]">
                      <span className="animate-medal-breathe inline-block">🥈</span>
                      <span>02 · SILVER RUNNER-UP</span>
                    </span>
                    {isEntryDisqualified(top2) && (
                      <span className="border border-live/80 bg-live/20 text-live px-2 py-0.5 font-mono text-[9px] uppercase font-bold animate-pulse">
                        DISQUALIFIED
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {top2.logo_url ? (
                      <div className="size-12 shrink-0 overflow-hidden border border-white/15 bg-surface">
                        <DynamicImage
                          src={resolveMediaUrl(top2.logo_url)}
                          alt={top2.name}
                          className="size-12 object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex size-12 shrink-0 items-center justify-center border border-slate-300/40 bg-surface font-display text-xl font-black text-slate-200">
                        {top2.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display text-2xl font-black uppercase text-ink truncate leading-tight">
                        {top2.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-xs text-slate-300 font-bold">[{top2.tag}]</span>
                        <span className="text-[10px] text-dim font-mono truncate">
                          {top2.game_name || top2.game_slug || 'Esports'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {top2.captain && (
                    <p className="mt-2 text-[11px] text-dim font-mono">
                      Captain: <span className="text-ink">{top2.captain}</span>
                    </p>
                  )}

                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/10 pt-3 font-mono text-xs">
                    <div>
                      <span className="text-dim text-[10px] block">Elo Rating</span>
                      <p className="font-bold text-slate-200 text-lg">{top2.rating}</p>
                    </div>
                    <div>
                      <span className="text-dim text-[10px] block">Win Rate</span>
                      <p className="font-bold text-ink text-lg">{top2.win_rate}%</p>
                    </div>
                    <div>
                      <span className="text-dim text-[10px] block">Record</span>
                      <p className="font-bold text-ink">
                        <span className="text-ok">{top2.wins}W</span> - <span className="text-warn">{top2.losses}L</span>
                      </p>
                    </div>
                    <div>
                      <span className="text-dim text-[10px] block">Prize Won</span>
                      <p className="font-bold text-amber-400">{inr(Number(top2.earnings || 0))}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 1st Place: Gold Champion (Center, elevated on desktop) */}
              {top1 && (
                <div className="order-1 md:order-2 border-2 border-amber-400/90 bg-gradient-to-b from-amber-500/20 via-surface/95 to-surface p-7 relative md:-translate-y-4 shadow-xl shadow-amber-400/10 animate-gold-glow animate-podium-float z-10 transition-all duration-300 hover:border-amber-300">
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="inline-flex items-center gap-1.5 rounded border border-amber-400/90 bg-amber-400/25 px-3 py-1 font-mono text-xs font-black text-amber-200 shadow-[0_0_14px_rgba(251,191,36,0.35)]">
                      <span className="animate-crown-sway inline-block text-base">👑</span>
                      <span>01 · GOLD CHAMPION</span>
                    </span>
                    {isEntryDisqualified(top1) && (
                      <span className="border border-live/80 bg-live/20 text-live px-2 py-0.5 font-mono text-[9px] uppercase font-bold animate-pulse">
                        DISQUALIFIED
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    {top1.logo_url ? (
                      <div className="size-16 shrink-0 overflow-hidden border-2 border-amber-400/50 bg-surface shadow-[0_0_12px_rgba(251,191,36,0.2)]">
                        <DynamicImage
                          src={resolveMediaUrl(top1.logo_url)}
                          alt={top1.name}
                          className="size-16 object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex size-16 shrink-0 items-center justify-center border-2 border-amber-400/50 bg-surface font-display text-3xl font-black text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.2)]">
                        {top1.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display text-3xl font-black uppercase text-ink truncate leading-tight">
                        {top1.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-sm text-amber-300 font-bold">[{top1.tag}]</span>
                        <span className="text-xs text-dim font-mono truncate">
                          {top1.game_name || top1.game_slug || 'Premier Esports'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {top1.captain && (
                    <p className="mt-3 text-xs text-dim font-mono">
                      Captain: <span className="text-ink font-bold">{top1.captain}</span>
                    </p>
                  )}

                  <div className="mt-5 grid grid-cols-2 gap-3 border-t border-amber-400/25 pt-4 font-mono text-xs">
                    <div>
                      <span className="text-dim text-[10px] block">Elo Rating</span>
                      <p className="font-bold text-amber-300 text-2xl">{top1.rating}</p>
                    </div>
                    <div>
                      <span className="text-dim text-[10px] block">Win Rate</span>
                      <p className="font-bold text-ink text-2xl">{top1.win_rate}%</p>
                    </div>
                    <div>
                      <span className="text-dim text-[10px] block">Record</span>
                      <p className="font-bold text-ink">
                        <span className="text-ok font-bold">{top1.wins}W</span> - <span className="text-warn font-bold">{top1.losses}L</span>
                      </p>
                    </div>
                    <div>
                      <span className="text-dim text-[10px] block">Total Earnings</span>
                      <p className="font-bold text-amber-300 text-lg">{inr(Number(top1.earnings || 0))}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 3rd Place: Bronze (Right on desktop) */}
              {top3 && (
                <div className="order-3 border-2 border-amber-700/60 bg-gradient-to-b from-amber-800/15 via-surface/90 to-surface p-6 relative transition-all duration-300 hover:border-amber-600 animate-bronze-glow">
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="inline-flex items-center gap-1.5 rounded border border-amber-700/80 bg-amber-700/20 px-2.5 py-1 font-mono text-xs font-black text-amber-400 shadow-[0_0_10px_rgba(217,119,6,0.25)]">
                      <span className="animate-medal-breathe inline-block">🥉</span>
                      <span>03 · BRONZE 3RD PLACE</span>
                    </span>
                    {isEntryDisqualified(top3) && (
                      <span className="border border-live/80 bg-live/20 text-live px-2 py-0.5 font-mono text-[9px] uppercase font-bold animate-pulse">
                        DISQUALIFIED
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {top3.logo_url ? (
                      <div className="size-12 shrink-0 overflow-hidden border border-white/15 bg-surface">
                        <DynamicImage
                          src={resolveMediaUrl(top3.logo_url)}
                          alt={top3.name}
                          className="size-12 object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex size-12 shrink-0 items-center justify-center border border-amber-700/40 bg-surface font-display text-xl font-black text-amber-500">
                        {top3.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display text-2xl font-black uppercase text-ink truncate leading-tight">
                        {top3.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-xs text-amber-500 font-bold">[{top3.tag}]</span>
                        <span className="text-[10px] text-dim font-mono truncate">
                          {top3.game_name || top3.game_slug || 'Esports'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {top3.captain && (
                    <p className="mt-2 text-[11px] text-dim font-mono">
                      Captain: <span className="text-ink">{top3.captain}</span>
                    </p>
                  )}

                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/10 pt-3 font-mono text-xs">
                    <div>
                      <span className="text-dim text-[10px] block">Elo Rating</span>
                      <p className="font-bold text-cyan text-lg">{top3.rating}</p>
                    </div>
                    <div>
                      <span className="text-dim text-[10px] block">Win Rate</span>
                      <p className="font-bold text-ink text-lg">{top3.win_rate}%</p>
                    </div>
                    <div>
                      <span className="text-dim text-[10px] block">Record</span>
                      <p className="font-bold text-ink">
                        <span className="text-ok">{top3.wins}W</span> - <span className="text-warn">{top3.losses}L</span>
                      </p>
                    </div>
                    <div>
                      <span className="text-dim text-[10px] block">Prize Won</span>
                      <p className="font-bold text-amber-400">{inr(Number(top3.earnings || 0))}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* REST OF RANKINGS: Clean, compact standings table for rank 4 to selected limit */}
            {remainingEntries.length > 0 && (
              <div className="border border-white/10 bg-surface/20 overflow-hidden">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-3 bg-surface/60">
                  <span className="font-mono text-xs uppercase tracking-wider text-ink font-bold">
                    Standings Ladder (Rank #4 to #{entries.length})
                  </span>
                  <span className="font-mono text-[10px] text-dim uppercase">
                    Showing Top {selectedLimit}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.02] text-dim uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-4 w-16">Rank</th>
                        <th className="py-3 px-4">Contender / Squad</th>
                        <th className="py-3 px-4">Discipline</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-center">Elo Rating</th>
                        <th className="py-3 px-4 text-center">Win Rate</th>
                        <th className="py-3 px-4 text-center">Record</th>
                        <th className="py-3 px-4 text-center">Recent Form</th>
                        <th className="py-3 px-4 text-right">Prize Earnings</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {remainingEntries.map((entry, idx) => {
                        const rankNumber = idx + 4
                        const isDq = isEntryDisqualified(entry)
                        const isDisbanded = entry.is_disbanded || entry.status === 'DISBANDED'

                        return (
                          <tr
                            key={entry.id || idx}
                            className={`transition-colors hover:bg-white/[0.03] ${
                              isDq ? 'bg-live/5' : isDisbanded ? 'bg-amber-950/[0.04]' : ''
                            }`}
                          >
                            <td className="py-3 px-4 font-bold text-dim">
                              #{String(rankNumber).padStart(2, '0')}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                {entry.logo_url ? (
                                  <div className="size-6 shrink-0 overflow-hidden border border-white/10 bg-surface">
                                    <DynamicImage
                                      src={resolveMediaUrl(entry.logo_url)}
                                      alt={entry.name}
                                      className="size-6 object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="flex size-6 shrink-0 items-center justify-center border border-white/10 bg-surface text-[10px] font-bold text-cyan">
                                    {entry.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div>
                                  <span className="font-display text-sm font-black uppercase text-ink">
                                    {entry.name}
                                  </span>
                                  {entry.tag && (
                                    <span className="font-mono text-[10px] text-dim ml-1.5">
                                      [{entry.tag}]
                                    </span>
                                  )}
                                  {entry.captain && (
                                    <span className="text-[10px] text-dim block">
                                      {entry.captain}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-dim">
                              {entry.game_name || entry.game_slug || 'Esports'}
                            </td>
                            <td className="py-3 px-4">
                              {isDq ? (
                                <span className="inline-flex items-center gap-1 border border-live/80 bg-live/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-live animate-pulse">
                                  DISQUALIFIED
                                </span>
                              ) : isDisbanded ? (
                                <span className="inline-flex items-center gap-1 border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                                  Historical
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 border border-ok/30 bg-ok/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ok">
                                  Active
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-cyan">
                              {entry.rating}
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-ink">
                              {entry.win_rate}%
                            </td>
                            <td className="py-3 px-4 text-center text-dim">
                              <span className="text-ok font-bold">{entry.wins}W</span> -{' '}
                              <span className="text-live font-bold">{entry.losses}L</span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {entry.form && entry.form.length > 0 ? (
                                  entry.form.map((f, fIdx) => (
                                    <span
                                      key={fIdx}
                                      className={`inline-block size-4 text-[9px] font-black leading-4 rounded text-center ${
                                        f === 'W'
                                          ? 'bg-ok/20 text-ok border border-ok/40'
                                          : 'bg-live/20 text-live border border-live/40'
                                      }`}
                                    >
                                      {f}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-dim text-[10px]">—</span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-amber-400">
                              {inr(Number(entry.earnings || 0))}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </Container>
    </div>
  )
}
