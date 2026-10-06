import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Container, Hud, Stat } from '../components/ui'
import EsportsHeroVisual from '../components/EsportsHeroVisual'
import {
  getLeaderboardEntries,
  getLeaderboardStats,
  getLeaderboardCategories,
  LeaderboardEntry,
  LeaderboardStats,
  LeaderboardCategory,
} from '../services/leaderboard'
import { getGames, Game as ApiGame, normalizeGame } from '../services/games'
import { GAMES, inr } from '../lib/data'

export default function Leaderboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialGame = searchParams.get('game') || 'all'

  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [stats, setStats] = useState<LeaderboardStats | null>(null)
  const [categories, setCategories] = useState<LeaderboardCategory[]>([])
  const [games, setGames] = useState<ApiGame[]>([])
  const [selectedGame, setSelectedGame] = useState<string>(initialGame)
  const [selectedCategory, setSelectedCategory] = useState<string>('overall')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  // Fetch games list for game discipline tabs
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
      const [entriesData, statsData, catsData] = await Promise.all([
        getLeaderboardEntries({
          category: selectedCategory,
          game: selectedGame !== 'all' ? selectedGame : undefined,
          search: searchQuery.trim() || undefined,
        }),
        getLeaderboardStats(),
        getLeaderboardCategories(),
      ])
      setEntries(entriesData || [])
      setStats(statsData || null)
      if (catsData && catsData.length > 0) {
        setCategories(catsData)
      }
    } catch (err) {
      console.warn('Failed to load leaderboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [selectedCategory, selectedGame])

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

  const displayGames = games.length > 0 ? games.map((g) => normalizeGame(g as any)) : GAMES

  const top3 = entries.slice(0, 3)

  return (
    <div className="relative min-h-screen bg-void pb-28 pt-32 text-ink overflow-hidden">
      <EsportsHeroVisual variant="leaderboard" />
      <Container className="relative">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
          <div>
            <Hud className="text-cyan">OFFICIAL ELO RANKINGS &amp; STANDINGS</Hud>
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

        {/* Dynamic Overview Stats Row */}
        {stats && (
          <div className="mt-10 grid grid-cols-2 gap-6 border-y border-white/10 py-6 md:grid-cols-4">
            <Stat k="Awarded Prizes" v={stats.total_awarded_prizes} accent="#3ef2ff" />
            <Stat k="Active Contenders" v={stats.active_contenders} />
            <Stat k="Verified Squads" v={stats.verified_squads} />
            <Stat k="Top Squad Earnings" v={stats.top_team_earnings} accent="#f59e0b" />
          </div>
        )}

        {/* 1. Game Discipline Filter Bar */}
        <div className="mt-10">
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

        {/* 2. Ranking Criteria Category & Search Bar */}
        <div className="mt-8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-t border-white/10 pt-6">
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

          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="Search squad or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-surface border border-white/10 px-3 py-1.5 font-mono text-xs text-ink placeholder:text-dim/50 focus:border-cyan focus:outline-none w-48 sm:w-64"
            />
            <button
              type="submit"
              className="bg-cyan/10 border border-cyan/30 text-cyan hover:bg-cyan/20 px-3.5 py-1.5 font-mono text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              Filter
            </button>
          </form>
        </div>

        {/* 3. Standings Output */}
        {loading ? (
          <div className="mt-12 border border-white/10 bg-surface/50 p-20 text-center">
            <div className="inline-block size-8 animate-spin rounded-full border-2 border-cyan border-t-transparent mb-4" />
            <Hud className="text-cyan">Computing dynamic Elo standings...</Hud>
          </div>
        ) : entries.length === 0 ? (
          <div className="mt-12 border border-white/10 bg-surface/30 p-16 text-center">
            <Hud className="text-cyan">No Ranked Contenders</Hud>
            <p className="mt-2 font-mono text-dim text-sm">
              No ranked squads found for the selected title and ranking criteria.
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
            {/* Top 3 Podium (when >= 3 entries exist) */}
            {top3.length >= 3 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                {/* 2nd Place */}
                <div className="order-2 md:order-1 border border-white/15 bg-surface/30 p-6 relative">
                  <div className="absolute top-3 right-3 rounded bg-zinc-400/10 border border-zinc-400/30 px-2 py-0.5 font-mono text-xs font-black text-zinc-300">
                    #2 SILVER
                  </div>
                  <div className="flex items-center gap-2">
                    <Hud className="text-dim">{top3[1].game_name || 'Esports Title'}</Hud>
                    {(top3[1].is_disbanded || top3[1].status === 'DISBANDED') ? (
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 border border-amber-500/30 bg-amber-500/10 text-amber-400">
                        Historical
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 border border-ok/30 bg-ok/10 text-ok">
                        Active
                      </span>
                    )}
                  </div>
                  <h3 className="mt-2 font-display text-2xl font-black uppercase text-ink">
                    {top3[1].name} <span className="text-dim text-sm">[{top3[1].tag}]</span>
                  </h3>
                  <div className="mt-4 grid grid-cols-2 gap-4 border-t border-white/10 pt-4 font-mono text-xs">
                    <div>
                      <span className="text-dim">Elo Rating</span>
                      <p className="font-bold text-cyan text-base">{top3[1].rating}</p>
                    </div>
                    <div>
                      <span className="text-dim">Win Rate</span>
                      <p className="font-bold text-ink text-base">{top3[1].win_rate}%</p>
                    </div>
                    <div>
                      <span className="text-dim">Record</span>
                      <p className="font-bold text-ink">{top3[1].wins}W - {top3[1].losses}L</p>
                    </div>
                    <div>
                      <span className="text-dim">Prize Won</span>
                      <p className="font-bold text-amber-400">{inr(Number(top3[1].earnings || 0))}</p>
                    </div>
                  </div>
                </div>

                {/* 1st Place */}
                <div className="order-1 md:order-2 border-2 border-amber-400/50 bg-amber-400/[0.03] p-8 relative shadow-lg shadow-amber-400/5 md:-translate-y-4">
                  <div className="absolute top-3 right-3 rounded bg-amber-400/20 border border-amber-400/50 px-2.5 py-1 font-mono text-xs font-black text-amber-300">
                    👑 #1 GOLD CHAMPION
                  </div>
                  <div className="flex items-center gap-2">
                    <Hud className="text-amber-400">{top3[0].game_name || 'Premier Title'}</Hud>
                    {(top3[0].is_disbanded || top3[0].status === 'DISBANDED') ? (
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 border border-amber-500/30 bg-amber-500/10 text-amber-400">
                        Historical
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 border border-ok/30 bg-ok/10 text-ok">
                        Active
                      </span>
                    )}
                  </div>
                  <h3 className="mt-2 font-display text-3xl font-black uppercase text-ink">
                    {top3[0].name} <span className="text-amber-400 text-base">[{top3[0].tag}]</span>
                  </h3>
                  <div className="mt-6 grid grid-cols-2 gap-4 border-t border-amber-400/20 pt-4 font-mono text-xs">
                    <div>
                      <span className="text-dim">Elo Rating</span>
                      <p className="font-bold text-amber-400 text-xl">{top3[0].rating}</p>
                    </div>
                    <div>
                      <span className="text-dim">Win Rate</span>
                      <p className="font-bold text-ink text-xl">{top3[0].win_rate}%</p>
                    </div>
                    <div>
                      <span className="text-dim">Record</span>
                      <p className="font-bold text-ink">{top3[0].wins}W - {top3[0].losses}L</p>
                    </div>
                    <div>
                      <span className="text-dim">Total Earnings</span>
                      <p className="font-bold text-amber-300 text-lg">{inr(Number(top3[0].earnings || 0))}</p>
                    </div>
                  </div>
                </div>

                {/* 3rd Place */}
                <div className="order-3 border border-white/15 bg-surface/30 p-6 relative">
                  <div className="absolute top-3 right-3 rounded bg-amber-700/20 border border-amber-700/40 px-2 py-0.5 font-mono text-xs font-black text-amber-600">
                    #3 BRONZE
                  </div>
                  <div className="flex items-center gap-2">
                    <Hud className="text-dim">{top3[2].game_name || 'Esports Title'}</Hud>
                    {(top3[2].is_disbanded || top3[2].status === 'DISBANDED') ? (
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 border border-amber-500/30 bg-amber-500/10 text-amber-400">
                        Historical
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 border border-ok/30 bg-ok/10 text-ok">
                        Active
                      </span>
                    )}
                  </div>
                  <h3 className="mt-2 font-display text-2xl font-black uppercase text-ink">
                    {top3[2].name} <span className="text-dim text-sm">[{top3[2].tag}]</span>
                  </h3>
                  <div className="mt-4 grid grid-cols-2 gap-4 border-t border-white/10 pt-4 font-mono text-xs">
                    <div>
                      <span className="text-dim">Elo Rating</span>
                      <p className="font-bold text-cyan text-base">{top3[2].rating}</p>
                    </div>
                    <div>
                      <span className="text-dim">Win Rate</span>
                      <p className="font-bold text-ink text-base">{top3[2].win_rate}%</p>
                    </div>
                    <div>
                      <span className="text-dim">Record</span>
                      <p className="font-bold text-ink">{top3[2].wins}W - {top3[2].losses}L</p>
                    </div>
                    <div>
                      <span className="text-dim">Prize Won</span>
                      <p className="font-bold text-amber-400">{inr(Number(top3[2].earnings || 0))}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Standings Table with ACTIVE vs HISTORICAL / DISBANDED status badges */}
            <div className="border border-white/10 bg-surface/20 overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02] text-dim uppercase tracking-wider">
                    <th className="py-3 px-4">Rank</th>
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
                  {entries.map((entry, idx) => {
                    const isDisbanded = entry.is_disbanded || entry.status === 'DISBANDED'
                    return (
                      <tr
                        key={entry.id || idx}
                        className={`transition-colors ${
                          isDisbanded ? 'bg-amber-950/[0.04] hover:bg-amber-950/[0.08]' : 'hover:bg-white/[0.03]'
                        }`}
                      >
                        <td className="py-4 px-4 font-bold">
                          <span
                            className={`inline-block size-6 text-center leading-6 rounded font-black ${
                              idx === 0
                                ? 'bg-amber-400 text-black'
                                : idx === 1
                                ? 'bg-zinc-300 text-black'
                                : idx === 2
                                ? 'bg-amber-700 text-white'
                                : 'text-dim'
                            }`}
                          >
                            {entry.rank || idx + 1}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-display text-base font-black uppercase text-ink">
                            {entry.name}{' '}
                            <span className="font-mono text-xs font-normal text-dim">
                              [{entry.tag}]
                            </span>
                          </div>
                          {entry.captain && (
                            <div className="text-[10px] text-dim">{entry.captain}</div>
                          )}
                        </td>
                        <td className="py-4 px-4 text-dim">
                          {entry.game_name || entry.game_slug || 'General'}
                        </td>
                        <td className="py-4 px-4">
                          {isDisbanded ? (
                            <span
                              title="Squad has been disbanded. Historical statistics and tournament results are preserved."
                              className="inline-flex items-center gap-1 border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-400"
                            >
                              Historical
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 border border-ok/30 bg-ok/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ok">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-center font-bold text-cyan">
                          {entry.rating}
                        </td>
                        <td className="py-4 px-4 text-center font-bold text-ink">
                          {entry.win_rate}%
                        </td>
                        <td className="py-4 px-4 text-center text-dim">
                          <span className="text-ok font-bold">{entry.wins}W</span> -{' '}
                          <span className="text-live font-bold">{entry.losses}L</span>
                        </td>
                        <td className="py-4 px-4 text-center">
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
                        <td className="py-4 px-4 text-right font-bold text-amber-400">
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
      </Container>
    </div>
  )
}
