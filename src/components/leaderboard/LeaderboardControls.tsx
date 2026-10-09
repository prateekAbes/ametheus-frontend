import { LeaderboardCategory } from '../../services/leaderboard'

interface GameOption {
  slug: string
  name: string
}

interface LeaderboardControlsProps {
  games: GameOption[]
  selectedGame: string
  onSelectGame: (slug: string) => void
  categories: LeaderboardCategory[]
  selectedCategory: string
  onSelectCategory: (slug: string) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  onRefresh: () => void
  isRefreshing?: boolean
}

export function LeaderboardControls({
  games,
  selectedGame,
  onSelectGame,
  categories,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  onRefresh,
  isRefreshing = false,
}: LeaderboardControlsProps) {
  const fallbackCategories = [
    { slug: 'overall', name: 'Overall Standings' },
    { slug: 'win_rate', name: 'Highest Win Rate' },
    { slug: 'earnings', name: 'Top Prize Winners' },
    { slug: 'wins', name: 'Most Wins' },
  ]

  const displayCategories =
    categories.length > 0
      ? categories.map((c) => ({ slug: c.slug, name: c.name }))
      : fallbackCategories

  return (
    <div className="w-full space-y-4">
      {/* ============================================================== */}
      {/* 1. DISCIPLINE / GAME FILTER CHIPS & LIVE STATUS BAR */}
      {/* ============================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        {/* Discipline Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <span className="shrink-0 font-mono text-[11px] uppercase tracking-wider text-dim mr-1 flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-[#3dff9a]" />
            Title:
          </span>

          <button
            type="button"
            onClick={() => onSelectGame('all')}
            className={`shrink-0 px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider transition-all border cursor-pointer ${
              selectedGame === 'all'
                ? 'border-[#3dff9a] bg-[#3dff9a] text-void shadow-[0_0_12px_rgba(61,255,154,0.4)]'
                : 'border-white/10 bg-surface/60 text-dim hover:border-white/30 hover:text-ink'
            }`}
          >
            All Titles
          </button>

          {games.map((g) => {
            const isSelected = selectedGame === g.slug
            return (
              <button
                key={g.slug}
                type="button"
                onClick={() => onSelectGame(g.slug)}
                className={`shrink-0 px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider transition-all border cursor-pointer ${
                  isSelected
                    ? 'border-[#3dff9a] bg-[#3dff9a] text-void shadow-[0_0_12px_rgba(61,255,154,0.4)]'
                    : 'border-white/10 bg-surface/60 text-dim hover:border-white/30 hover:text-ink'
                }`}
              >
                {g.name}
              </button>
            )
          })}
        </div>

        {/* Live Status & Refresh Trigger */}
        <div className="shrink-0 flex items-center justify-between sm:justify-end gap-3 font-mono text-xs">
          <div className="flex items-center gap-2 px-2.5 py-1 bg-surface/40 border border-white/10 rounded-xs">
            <span className="size-2 rounded-full bg-[#3dff9a] animate-pulse shadow-[0_0_8px_#3dff9a]" />
            <span className="text-dim text-[11px] uppercase tracking-wider">
              Live Standings
            </span>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 border border-white/10 bg-surface/60 px-2.5 py-1 text-[11px] text-dim hover:text-[#3dff9a] hover:border-[#3dff9a]/40 transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh Leaderboard Data"
          >
            <svg
              className={`size-3.5 ${isRefreshing ? 'animate-spin text-[#3dff9a]' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>{isRefreshing ? 'Syncing...' : 'Sync'}</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. RANKING CATEGORY SELECTOR & REAL-TIME SEARCH BAR */}
      {/* ============================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Metric / Category Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <span className="shrink-0 font-mono text-[11px] uppercase tracking-wider text-dim mr-1">
            Metric:
          </span>
          {displayCategories.map((cat) => {
            const isSelected = selectedCategory === cat.slug
            return (
              <button
                key={cat.slug}
                type="button"
                onClick={() => onSelectCategory(cat.slug)}
                className={`shrink-0 px-3 py-1 font-mono text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all border cursor-pointer ${
                  isSelected
                    ? 'border-[#3dff9a]/80 bg-[#3dff9a]/15 text-[#3dff9a] shadow-[0_0_10px_rgba(61,255,154,0.2)]'
                    : 'border-white/10 bg-surface/40 text-dim hover:border-white/30 hover:text-ink'
                }`}
              >
                {cat.name}
              </button>
            )
          })}
        </div>

        {/* Player / Team Search Input */}
        <div className="relative w-full md:w-72 shrink-0">
          <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
            <svg
              className="size-3.5 text-dim"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search player or squad tag..."
            className="w-full pl-9 pr-8 py-1.5 bg-surface/70 border border-white/15 text-xs font-mono text-ink placeholder:text-dim/60 focus:outline-none focus:border-[#3dff9a] focus:ring-1 focus:ring-[#3dff9a]/40 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-dim hover:text-ink cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
