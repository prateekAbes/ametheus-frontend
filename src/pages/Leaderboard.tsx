import { useState, useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Container, Hud } from '../components/ui'
import EsportsHeroVisual from '../components/EsportsHeroVisual'
import { ChampionshipCrown, PodiumMedalBadge } from '../components/ChampionshipCrown'
import {
  getLeaderboardEntries,
  getLeaderboardCategories,
  getLeaderboardDisqualifications,
  LeaderboardEntry,
  LeaderboardCategory,
  LeaderboardDisqualification,
} from '../services/leaderboard'
import { getGames, Game as ApiGame, normalizeGame } from '../services/games'
import { GAMES, inr } from '../lib/data'
import DynamicImage from '../components/DynamicImage'
import { resolveMediaUrl } from '../services/apiClient'

const PAGE_SIZE = 10

export default function Leaderboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialGame = searchParams.get('game') || 'all'

  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [disqualifications, setDisqualifications] = useState<LeaderboardDisqualification[]>([])
  const [categories, setCategories] = useState<LeaderboardCategory[]>([])
  const [games, setGames] = useState<ApiGame[]>([])
  const [selectedGame, setSelectedGame] = useState<string>(initialGame)
  const [selectedCategory, setSelectedCategory] = useState<string>('overall')
  const [currentPage, setCurrentPage] = useState<number>(1)
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
      const [entriesData, catsData, dqsData] = await Promise.all([
        getLeaderboardEntries({
          category: selectedCategory !== 'overall' ? selectedCategory : undefined,
          game: selectedGame !== 'all' ? selectedGame : undefined,
          limit: 100,
          include_disqualified: true,
        }).catch(() => []),
        getLeaderboardCategories().catch(() => []),
        getLeaderboardDisqualifications().catch(() => []),
      ])

      setEntries(Array.isArray(entriesData) ? entriesData : [])
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
  }, [selectedCategory, selectedGame])

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

  const handleSelectCategory = (catSlug: string) => {
    setSelectedCategory(catSlug)
    setCurrentPage(1)
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

  const totalEntries = entries.length
  const totalPages = Math.max(1, Math.ceil(totalEntries / PAGE_SIZE))
  const safeCurrentPage = Math.min(currentPage, totalPages)

  const top1 = entries[0] || null
  const top2 = entries[1] || null
  const top3 = entries[2] || null

  // Entries for ladder table:
  // Page 1: Ranks 4 to 10 (index 3 to 10)
  // Page > 1: 10 contenders for that page
  const tableEntries = useMemo(() => {
    if (safeCurrentPage === 1) {
      return entries.slice(3, PAGE_SIZE)
    }
    const startIdx = (safeCurrentPage - 1) * PAGE_SIZE
    const endIdx = startIdx + PAGE_SIZE
    return entries.slice(startIdx, endIdx)
  }, [entries, safeCurrentPage])

  const ladderStartRank = safeCurrentPage === 1 ? 4 : (safeCurrentPage - 1) * PAGE_SIZE + 1
  const ladderEndRank = safeCurrentPage === 1
    ? Math.min(PAGE_SIZE, totalEntries)
    : Math.min(safeCurrentPage * PAGE_SIZE, totalEntries)

  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    if (safeCurrentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages]
    }
    if (safeCurrentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    }
    return [1, '...', safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, '...', totalPages]
  }, [totalPages, safeCurrentPage])

  return (
    <div className="relative min-h-screen bg-void pb-28 pt-32 text-ink overflow-hidden">
      {/* Retained atmospheric esports hero background with dark red / maroon tones */}
      <EsportsHeroVisual variant="leaderboard" />

      <Container className="relative">
        {/* Header — Sophisticated Reddish / Crimson Esports Accent */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
          <div>
            <div className="flex items-center gap-3">
              <span className="size-2 rounded-full bg-rose-500 shadow-[0_0_10px_#f43f5e] animate-pulse" />
              <Hud className="text-rose-400 font-bold tracking-widest">OFFICIAL ELO RANKINGS &amp; STANDINGS</Hud>
            </div>
            <h1 className="mt-2 font-display text-4xl sm:text-6xl font-black uppercase tracking-tight text-ink">
              Platform{' '}
              <span className="bg-gradient-to-r from-rose-500 via-rose-400 to-rose-200 bg-clip-text text-transparent">
                Leaderboard
              </span>
            </h1>
            <p className="mt-2 text-sm text-dim max-w-2xl font-mono leading-relaxed">
              Verified contender ratings, match win percentages, and sanctioned tournament earnings across India&apos;s competitive esports battlegrounds.
            </p>
          </div>

        </div>

        {/* 1. Game Discipline Filter Bar */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-xs text-dim uppercase tracking-wider flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-rose-500/80" />
              Filter by Discipline:
            </span>
            {selectedGame !== 'all' && (
              <button
                onClick={() => handleSelectGame('all')}
                className="font-mono text-[11px] text-rose-400 hover:underline cursor-pointer"
              >
                Reset to All Titles
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleSelectGame('all')}
              className={`px-3.5 py-1.5 font-mono text-xs font-bold uppercase tracking-wider transition-all border cursor-pointer ${
                selectedGame === 'all'
                  ? 'border-rose-500 bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.35)]'
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
                  className={`px-3.5 py-1.5 font-mono text-xs font-bold uppercase tracking-wider transition-all border cursor-pointer ${
                    isSelected
                      ? 'border-rose-500 bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.35)]'
                      : 'border-white/10 bg-surface/60 text-dim hover:border-white/30 hover:text-ink'
                  }`}
                >
                  {g.name}
                </button>
              )
            })}
          </div>
        </div>

        {/* 2. Ranking Criteria Metric Bar */}
        <div className="mt-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-t border-white/10 pt-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-dim uppercase mr-2 tracking-wider">Metric:</span>
            {categories.length > 0
              ? categories.map((cat) => (
                  <button
                    key={cat.slug}
                    onClick={() => handleSelectCategory(cat.slug)}
                    className={`px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider transition-colors border cursor-pointer ${
                      selectedCategory === cat.slug
                        ? 'border-rose-500/80 bg-rose-500/15 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.2)]'
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
                    onClick={() => handleSelectCategory(slug)}
                    className={`px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider transition-colors border cursor-pointer ${
                      selectedCategory === slug
                        ? 'border-rose-500/80 bg-rose-500/15 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.2)]'
                        : 'border-white/10 bg-surface/40 text-dim hover:border-white/30 hover:text-ink'
                    }`}
                  >
                    {label}
                  </button>
                ))}
          </div>
        </div>

        {/* 3. Standings Output */}
        {loading ? (
          <div className="mt-14 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-end">
              {[1, 2, 3].map((n) => (
                <div key={n} className="border border-white/10 bg-surface/40 p-6 min-h-[340px] animate-pulse">
                  <div className="h-10 w-16 bg-white/10 mx-auto rounded mb-4" />
                  <div className="size-20 bg-white/10 rounded-full mx-auto mb-4" />
                  <div className="h-6 w-32 bg-white/10 mx-auto rounded mb-2" />
                  <div className="h-4 w-24 bg-white/10 mx-auto rounded mb-6" />
                  <div className="h-16 w-full bg-white/10 rounded" />
                </div>
              ))}
            </div>
            <div className="h-64 border border-white/10 bg-surface/20 animate-pulse" />
          </div>
        ) : entries.length === 0 ? (
          <div className="mt-14 border border-white/10 bg-surface/30 p-16 text-center">
            <Hud className="text-rose-400">No Ranked Contenders</Hud>
            <p className="mt-2 font-mono text-dim text-sm max-w-md mx-auto">
              No ranked squads found in the database for the selected discipline and criteria.
            </p>
            {selectedGame !== 'all' && (
              <button
                onClick={() => handleSelectGame('all')}
                className="mt-6 border border-rose-500/40 bg-rose-500/10 px-4 py-2 font-mono text-xs uppercase font-bold text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
              >
                View All Disciplines
              </button>
            )}
          </div>
        ) : (
          <div className="mt-14 space-y-16">
            {/* If on page > 1, show compact breadcrumb banner instead of repeating full podium */}
            {safeCurrentPage > 1 && (
              <div className="flex items-center justify-between border border-white/10 bg-surface/50 px-5 py-3">
                <div className="flex items-center gap-2.5">
                  <span className="size-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_#f43f5e]" />
                  <span className="font-mono text-xs text-dim">
                    Standings Ladder: Page <span className="font-bold text-ink">{safeCurrentPage}</span> of {totalPages} (Ranks #{ladderStartRank} to #{ladderEndRank})
                  </span>
                </div>
                <button
                  onClick={() => {
                    setCurrentPage(1)
                    window.scrollTo({ top: 300, behavior: 'smooth' })
                  }}
                  className="font-mono text-xs font-bold text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                >
                  ← View Champions Podium (Page 1)
                </button>
              </div>
            )}

            {/* DYNAMIC TOP THREE PODIUM (1st Gold, 2nd Silver, 3rd Bronze) — Displayed on Page 1 */}
            {safeCurrentPage === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-end pt-8 overflow-visible">
              {/* 2nd Place: Silver Runner-Up (Left on desktop) */}
              {top2 && (
                <div className="order-2 md:order-1 relative border border-slate-300/40 bg-gradient-to-b from-slate-300/10 via-surface/90 to-surface/95 p-6 pt-10 shadow-[0_0_20px_rgba(203,213,225,0.08),0_15px_30px_rgba(0,0,0,0.5)] animate-silver-glow transition-all duration-300 hover:border-slate-200">
                  {/* Disqualification Status */}
                  {isEntryDisqualified(top2) && (
                    <div className="absolute top-3 left-3 z-30">
                      <span className="border border-live/80 bg-live/20 text-live px-2 py-0.5 font-mono text-[9px] uppercase font-bold animate-pulse">
                        DISQUALIFIED
                      </span>
                    </div>
                  )}

                  {/* Crown perched directly above the contender avatar */}
                  <div className="relative -mb-4 z-20 flex justify-center">
                    <ChampionshipCrown rank={2} size="md" />
                  </div>

                  {/* Avatar & Medal Badge */}
                  <div className="relative z-10 flex flex-col items-center">
                    {top2.logo_url ? (
                      <div className="size-16 sm:size-18 shrink-0 overflow-hidden border-2 border-slate-300 bg-surface shadow-[0_0_15px_rgba(203,213,225,0.25)]">
                        <DynamicImage
                          src={resolveMediaUrl(top2.logo_url)}
                          alt={top2.name}
                          className="size-16 sm:size-18 object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex size-16 sm:size-18 shrink-0 items-center justify-center border-2 border-slate-300 bg-surface font-display text-2xl font-black text-slate-100 shadow-[0_0_15px_rgba(203,213,225,0.25)]">
                        {top2.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="mt-3">
                      <PodiumMedalBadge rank={2} />
                    </div>
                  </div>

                  {/* Contender Identity */}
                  <div className="mt-4 text-center">
                    <h3 className="font-display text-2xl sm:text-3xl font-black uppercase text-ink truncate leading-tight tracking-tight">
                      {top2.name}
                    </h3>
                    <div className="flex items-center justify-center gap-2 mt-1 font-mono text-xs">
                      <span className="text-slate-300 font-bold">[{top2.tag}]</span>
                      <span className="text-white/20">·</span>
                      <span className="text-dim truncate">
                        {top2.game_name || top2.game_slug || 'Esports'}
                      </span>
                    </div>
                    {top2.captain && (
                      <p className="mt-1 text-[11px] text-dim font-mono">
                        Captain: <span className="text-ink font-bold">{top2.captain}</span>
                      </p>
                    )}
                  </div>

                  {/* Performance Metrics */}
                  <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-3.5 font-mono text-xs">
                    <div>
                      <span className="text-dim text-[10px] uppercase tracking-wider block">Elo Rating</span>
                      <p className="font-bold text-slate-100 text-xl mt-0.5">{top2.rating}</p>
                    </div>
                    <div>
                      <span className="text-dim text-[10px] uppercase tracking-wider block">Win Rate</span>
                      <p className="font-bold text-ink text-xl mt-0.5">{top2.win_rate}%</p>
                    </div>
                    <div>
                      <span className="text-dim text-[10px] uppercase tracking-wider block">Record</span>
                      <p className="font-bold text-ink mt-0.5">
                        <span className="text-ok font-bold">{top2.wins}W</span> - <span className="text-rose-400 font-bold">{top2.losses}L</span>
                      </p>
                    </div>
                    <div>
                      <span className="text-dim text-[10px] uppercase tracking-wider block">Prize Won</span>
                      <p className="font-bold text-slate-200 text-base mt-0.5">{inr(Number(top2.earnings || 0))}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 1st Place: Gold Champion (Center, elevated on desktop) */}
              {top1 && (
                <div className="order-1 md:order-2 relative border border-amber-400/80 bg-gradient-to-b from-amber-500/15 via-surface/90 to-surface/95 p-7 pt-12 md:-translate-y-6 md:scale-[1.02] shadow-[0_0_35px_rgba(251,191,36,0.14),0_0_50px_rgba(225,29,72,0.1),0_25px_50px_rgba(0,0,0,0.7)] animate-gold-glow animate-podium-float z-10 transition-all duration-300 hover:border-amber-300">
                  {/* Subtle decorative crimson corner ticks */}
                  <div className="absolute top-0 right-0 size-8 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 right-0 w-12 h-1 bg-gradient-to-l from-rose-500 to-transparent" />
                    <div className="absolute top-0 right-0 w-1 h-12 bg-gradient-to-b from-rose-500 to-transparent" />
                  </div>

                  {/* Disqualification Status */}
                  {isEntryDisqualified(top1) && (
                    <div className="absolute top-3 left-3 z-30">
                      <span className="border border-live/80 bg-live/20 text-live px-2 py-0.5 font-mono text-[9px] uppercase font-bold animate-pulse">
                        DISQUALIFIED
                      </span>
                    </div>
                  )}

                  {/* Noticeably Larger Champion Crown perched directly above winner's avatar */}
                  <div className="relative -mb-5 z-20 flex justify-center">
                    <ChampionshipCrown rank={1} size="lg" />
                  </div>

                  {/* Winner Avatar & Medal Badge */}
                  <div className="relative z-10 flex flex-col items-center">
                    {top1.logo_url ? (
                      <div className="size-20 sm:size-24 shrink-0 overflow-hidden border-2 border-amber-400 bg-surface shadow-[0_0_20px_rgba(251,191,36,0.35)]">
                        <DynamicImage
                          src={resolveMediaUrl(top1.logo_url)}
                          alt={top1.name}
                          className="size-20 sm:size-24 object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex size-20 sm:size-24 shrink-0 items-center justify-center border-2 border-amber-400 bg-surface font-display text-3xl sm:text-4xl font-black text-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.35)]">
                        {top1.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="mt-3">
                      <PodiumMedalBadge rank={1} />
                    </div>
                  </div>

                  {/* Contender Identity */}
                  <div className="mt-4 text-center">
                    <h3 className="font-display text-3xl sm:text-4xl font-black uppercase text-ink truncate leading-tight tracking-tight">
                      {top1.name}
                    </h3>
                    <div className="flex items-center justify-center gap-2 mt-1 font-mono text-xs">
                      <span className="text-amber-300 font-bold">[{top1.tag}]</span>
                      <span className="text-white/20">·</span>
                      <span className="text-dim truncate">
                        {top1.game_name || top1.game_slug || 'Premier Esports'}
                      </span>
                    </div>
                    {top1.captain && (
                      <p className="mt-1 text-xs text-dim font-mono">
                        Captain: <span className="text-ink font-bold">{top1.captain}</span>
                      </p>
                    )}
                  </div>

                  {/* Champion Performance Metrics */}
                  <div className="mt-6 grid grid-cols-2 gap-4 border-t border-amber-400/25 pt-4 font-mono text-xs">
                    <div>
                      <span className="text-dim text-[10px] uppercase tracking-wider block">Elo Rating</span>
                      <p className="font-bold text-amber-300 text-2xl mt-0.5">{top1.rating}</p>
                    </div>
                    <div>
                      <span className="text-dim text-[10px] uppercase tracking-wider block">Win Rate</span>
                      <p className="font-bold text-ink text-2xl mt-0.5">{top1.win_rate}%</p>
                    </div>
                    <div>
                      <span className="text-dim text-[10px] uppercase tracking-wider block">Record</span>
                      <p className="font-bold text-ink mt-0.5">
                        <span className="text-ok font-bold">{top1.wins}W</span> - <span className="text-rose-400 font-bold">{top1.losses}L</span>
                      </p>
                    </div>
                    <div>
                      <span className="text-dim text-[10px] uppercase tracking-wider block">Total Earnings</span>
                      <p className="font-bold text-amber-300 text-lg mt-0.5">{inr(Number(top1.earnings || 0))}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 3rd Place: Bronze 3rd Place (Right on desktop) */}
              {top3 && (
                <div className="order-3 relative border border-amber-700/50 bg-gradient-to-b from-amber-800/10 via-surface/90 to-surface/95 p-6 pt-10 shadow-[0_0_20px_rgba(217,119,6,0.08),0_15px_30px_rgba(0,0,0,0.5)] animate-bronze-glow transition-all duration-300 hover:border-amber-600">
                  {/* Disqualification Status */}
                  {isEntryDisqualified(top3) && (
                    <div className="absolute top-3 left-3 z-30">
                      <span className="border border-live/80 bg-live/20 text-live px-2 py-0.5 font-mono text-[9px] uppercase font-bold animate-pulse">
                        DISQUALIFIED
                      </span>
                    </div>
                  )}

                  {/* Crown perched directly above avatar */}
                  <div className="relative -mb-4 z-20 flex justify-center">
                    <ChampionshipCrown rank={3} size="md" />
                  </div>

                  {/* Avatar & Medal Badge */}
                  <div className="relative z-10 flex flex-col items-center">
                    {top3.logo_url ? (
                      <div className="size-16 sm:size-18 shrink-0 overflow-hidden border-2 border-amber-700 bg-surface shadow-[0_0_15px_rgba(217,119,6,0.25)]">
                        <DynamicImage
                          src={resolveMediaUrl(top3.logo_url)}
                          alt={top3.name}
                          className="size-16 sm:size-18 object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex size-16 sm:size-18 shrink-0 items-center justify-center border-2 border-amber-700 bg-surface font-display text-2xl font-black text-amber-400 shadow-[0_0_15px_rgba(217,119,6,0.25)]">
                        {top3.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="mt-3">
                      <PodiumMedalBadge rank={3} />
                    </div>
                  </div>

                  {/* Contender Identity */}
                  <div className="mt-4 text-center">
                    <h3 className="font-display text-2xl sm:text-3xl font-black uppercase text-ink truncate leading-tight tracking-tight">
                      {top3.name}
                    </h3>
                    <div className="flex items-center justify-center gap-2 mt-1 font-mono text-xs">
                      <span className="text-amber-400 font-bold">[{top3.tag}]</span>
                      <span className="text-white/20">·</span>
                      <span className="text-dim truncate">
                        {top3.game_name || top3.game_slug || 'Esports'}
                      </span>
                    </div>
                    {top3.captain && (
                      <p className="mt-1 text-[11px] text-dim font-mono">
                        Captain: <span className="text-ink font-bold">{top3.captain}</span>
                      </p>
                    )}
                  </div>

                  {/* Performance Metrics */}
                  <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-3.5 font-mono text-xs">
                    <div>
                      <span className="text-dim text-[10px] uppercase tracking-wider block">Elo Rating</span>
                      <p className="font-bold text-amber-400 text-xl mt-0.5">{top3.rating}</p>
                    </div>
                    <div>
                      <span className="text-dim text-[10px] uppercase tracking-wider block">Win Rate</span>
                      <p className="font-bold text-ink text-xl mt-0.5">{top3.win_rate}%</p>
                    </div>
                    <div>
                      <span className="text-dim text-[10px] uppercase tracking-wider block">Record</span>
                      <p className="font-bold text-ink mt-0.5">
                        <span className="text-ok font-bold">{top3.wins}W</span> - <span className="text-rose-400 font-bold">{top3.losses}L</span>
                      </p>
                    </div>
                    <div>
                      <span className="text-dim text-[10px] uppercase tracking-wider block">Prize Won</span>
                      <p className="font-bold text-amber-300 text-base mt-0.5">{inr(Number(top3.earnings || 0))}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* REST OF RANKINGS: Clean, compact standings table */}
          {tableEntries.length > 0 && (
            <div id="standings-ladder" className="border border-white/10 bg-surface/20 overflow-hidden shadow-lg scroll-mt-24">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 px-6 py-3.5 bg-surface/70">
                <div className="flex items-center gap-2.5">
                  <span className="w-1.5 h-4 bg-rose-500 rounded-full" />
                  <span className="font-mono text-xs uppercase tracking-wider text-ink font-bold">
                    Standings Ladder (Rank #{ladderStartRank} to #{ladderEndRank})
                  </span>
                </div>
                <span className="font-mono text-[10px] text-dim uppercase tracking-wider">
                  Page {safeCurrentPage} of {totalPages} · {totalEntries} Total Contenders
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
                    {tableEntries.map((entry, idx) => {
                      const rankNumber = entry.rank || (safeCurrentPage === 1 ? idx + 4 : (safeCurrentPage - 1) * PAGE_SIZE + idx + 1)
                      const isDq = isEntryDisqualified(entry)
                      const isDisbanded = entry.is_disbanded || entry.status === 'DISBANDED'

                      return (
                        <tr
                          key={entry.id || idx}
                          className={`transition-colors hover:bg-white/[0.03] ${
                            isDq ? 'bg-live/5' : isDisbanded ? 'bg-amber-950/[0.04]' : ''
                          }`}
                        >
                          <td className="py-3.5 px-4 font-bold text-dim">
                            #{String(rankNumber).padStart(2, '0')}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              {entry.logo_url ? (
                                <div className="size-7 shrink-0 overflow-hidden border border-white/10 bg-surface">
                                  <DynamicImage
                                    src={resolveMediaUrl(entry.logo_url)}
                                    alt={entry.name}
                                    className="size-7 object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="flex size-7 shrink-0 items-center justify-center border border-white/10 bg-surface text-[10px] font-bold text-rose-400">
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
                          <td className="py-3.5 px-4 text-dim">
                            {entry.game_name || entry.game_slug || 'Esports'}
                          </td>
                          <td className="py-3.5 px-4">
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
                          <td className="py-3.5 px-4 text-center font-bold text-rose-300">
                            {entry.rating}
                          </td>
                          <td className="py-3.5 px-4 text-center font-bold text-ink">
                            {entry.win_rate}%
                          </td>
                          <td className="py-3.5 px-4 text-center text-dim">
                            <span className="text-ok font-bold">{entry.wins}W</span> -{' '}
                            <span className="text-rose-400 font-bold">{entry.losses}L</span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {entry.form && entry.form.length > 0 ? (
                                entry.form.map((f, fIdx) => (
                                  <span
                                    key={fIdx}
                                    className={`inline-block size-4 text-[9px] font-black leading-4 rounded text-center ${
                                      f === 'W'
                                        ? 'bg-ok/20 text-ok border border-ok/40'
                                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
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
                          <td className="py-3.5 px-4 text-right font-bold text-ink">
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

          {/* Proper Bottom Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border border-white/10 bg-surface/40 p-4 backdrop-blur-md">
              <div className="font-mono text-xs text-dim">
                Showing standings <span className="font-bold text-ink">#{ladderStartRank}</span> to{' '}
                <span className="font-bold text-ink">#{ladderEndRank}</span> of{' '}
                <span className="font-bold text-rose-400">{totalEntries}</span> contenders
              </div>

              <div className="flex items-center gap-1.5 font-mono text-xs">
                {/* Previous Button */}
                <button
                  onClick={() => {
                    if (safeCurrentPage > 1) {
                      setCurrentPage(safeCurrentPage - 1)
                      document.getElementById('standings-ladder')?.scrollIntoView({ behavior: 'smooth' })
                    }
                  }}
                  disabled={safeCurrentPage === 1}
                  className={`px-3 py-1.5 border uppercase font-bold transition-all cursor-pointer ${
                    safeCurrentPage === 1
                      ? 'border-white/5 bg-white/[0.02] text-dim/30 cursor-not-allowed'
                      : 'border-white/15 bg-surface text-dim hover:border-rose-500 hover:text-ink'
                  }`}
                >
                  ← Previous
                </button>

                {/* Numbered Page Buttons */}
                {pageNumbers.map((p, pIdx) => {
                  if (p === '...') {
                    return (
                      <span key={`ellipsis-${pIdx}`} className="px-2 py-1 text-dim select-none">
                        …
                      </span>
                    )
                  }
                  const isCurrent = p === safeCurrentPage
                  return (
                    <button
                      key={`page-${p}`}
                      onClick={() => {
                        setCurrentPage(p as number)
                        document.getElementById('standings-ladder')?.scrollIntoView({ behavior: 'smooth' })
                      }}
                      className={`min-w-8 h-8 px-2 border font-bold transition-all cursor-pointer ${
                        isCurrent
                          ? 'border-rose-500 bg-rose-500 text-white shadow-[0_0_12px_rgba(244,63,94,0.4)]'
                          : 'border-white/10 bg-surface/60 text-dim hover:border-white/30 hover:text-ink'
                      }`}
                    >
                      {p}
                    </button>
                  )
                })}

                {/* Next Button */}
                <button
                  onClick={() => {
                    if (safeCurrentPage < totalPages) {
                      setCurrentPage(safeCurrentPage + 1)
                      document.getElementById('standings-ladder')?.scrollIntoView({ behavior: 'smooth' })
                    }
                  }}
                  disabled={safeCurrentPage === totalPages}
                  className={`px-3 py-1.5 border uppercase font-bold transition-all cursor-pointer ${
                    safeCurrentPage === totalPages
                      ? 'border-white/5 bg-white/[0.02] text-dim/30 cursor-not-allowed'
                      : 'border-white/15 bg-surface text-dim hover:border-rose-500 hover:text-ink'
                  }`}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </Container>
  </div>
  )
}
