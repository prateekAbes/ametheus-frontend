import React from 'react'
import { Link } from 'react-router'
import {
  LeaderboardEntry,
  isEntryCurrentUser,
  isEntryDisqualified,
} from '../../services/leaderboard'
import { resolveMediaUrl } from '../../services/apiClient'
import DynamicImage from '../DynamicImage'
import { inr } from '../../lib/data'

interface LeaderboardTableProps {
  entries: LeaderboardEntry[]
  selectedCategory: string
  currentPage: number
  totalPages: number
  totalEntries: number
  pageSize: number
  onPageChange: (page: number) => void
  currentUserId?: string
  currentUsername?: string
  disqualifiedIds?: Set<string>
}

export function LeaderboardTable({
  entries,
  selectedCategory,
  currentPage,
  totalPages,
  totalEntries,
  pageSize,
  onPageChange,
  currentUserId,
  currentUsername,
  disqualifiedIds = new Set(),
}: LeaderboardTableProps) {
  if (entries.length === 0) {
    return null
  }

  const ladderStartRank =
    currentPage === 1 ? 4 : (currentPage - 1) * pageSize + 1
  const ladderEndRank =
    currentPage === 1
      ? Math.min(pageSize, totalEntries)
      : Math.min(currentPage * pageSize, totalEntries)

  // Primary metric column title matching active metric only
  const getMetricHeader = () => {
    switch (selectedCategory) {
      case 'win_rate':
        return 'Win Rate'
      case 'wins':
        return 'Match Wins'
      case 'spending':
        return 'Highest Spending'
      case 'earnings':
        return 'Total Prize'
      case 'pc':
        return 'PC Rating'
      case 'mobile':
        return 'Mobile Rating'
      case 'overall':
      default:
        return 'Volume'
    }
  }

  // Format the single metric value for each row
  const getMetricValue = (entry: LeaderboardEntry) => {
    switch (selectedCategory) {
      case 'win_rate':
        return `${entry.win_rate ?? 0}%`
      case 'wins':
        return `${entry.wins ?? 0} W`
      case 'spending':
        return inr(150)
      case 'earnings':
        return inr(Number(entry.earnings || 0))
      case 'pc':
      case 'mobile':
        return `${entry.rating ?? 1500}`
      case 'overall':
      default:
        return `${Math.round((entry.rating ?? 1500) * 16).toLocaleString('en-US')} kg`
    }
  }

  return (
    <div id="standings-ladder" className="w-full scroll-mt-20 space-y-3">
      {/* ============================================================== */}
      {/* MINIMAL STANDINGS TABLE / LIST                                  */}
      {/* ============================================================== */}
      <div className="border border-white/10 bg-black/70 overflow-hidden">
        {/* Table Head */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-2 bg-white/[0.02] font-mono text-[10px] text-white/40 uppercase tracking-wider">
          <div className="flex items-center gap-3">
            <span className="w-10 text-center">Rank</span>
            <span>Contender</span>
          </div>
          <span className="text-right">{getMetricHeader()}</span>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-white/5 font-mono text-xs">
          {entries.map((entry, idx) => {
            const rankNumber =
              entry.rank ||
              (currentPage === 1
                ? idx + 4
                : (currentPage - 1) * pageSize + idx + 1)
            const isDqEntry = isEntryDisqualified(entry, disqualifiedIds)
            const isCurrent = isEntryCurrentUser(entry, currentUserId, currentUsername)
            const avatarUrl = resolveMediaUrl(entry.logo_url)
            const rowKey = entry.id ? `entry-${entry.id}` : `rank-${rankNumber}-${entry.name}`

            // Canonical username display
            const displayName =
              entry.name && !entry.name.toLowerCase().startsWith('player_') && !entry.name.toLowerCase().startsWith('user_')
                ? entry.name
                : entry.captain
                ? entry.captain.replace('@', '')
                : entry.name || 'Contender'

            const initial = displayName.charAt(0).toUpperCase()

            return (
              <div
                key={rowKey}
                className={`flex items-center justify-between px-4 py-2.5 transition-colors hover:bg-white/[0.03] ${
                  isCurrent
                    ? 'bg-[#22c55e]/10 border-l-2 border-l-[#22c55e]'
                    : isDqEntry
                    ? 'opacity-40'
                    : ''
                }`}
              >
                {/* Left: Rank & Contender (with square avatar) */}
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-10 text-center font-bold text-white/50 shrink-0">
                    #{String(rankNumber).padStart(2, '0')}
                  </span>

                  {/* Square Profile Picture */}
                  {isCurrent ? (
                    <Link to="/profile" title="View your profile" className="shrink-0">
                      <div className="size-7 sm:size-8 shrink-0 overflow-hidden rounded-none border border-[#22c55e]/50 bg-black">
                        {avatarUrl ? (
                          <DynamicImage
                            src={avatarUrl}
                            alt={displayName}
                            className="size-full object-cover rounded-none"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center font-bold text-white/80 bg-white/5 text-[10px]">
                            {initial}
                          </div>
                        )}
                      </div>
                    </Link>
                  ) : (
                    <div className="size-7 sm:size-8 shrink-0 overflow-hidden rounded-none border border-white/15 bg-black">
                      {avatarUrl ? (
                        <DynamicImage
                          src={avatarUrl}
                          alt={displayName}
                          className="size-full object-cover rounded-none"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center font-bold text-white/80 bg-white/5 text-[10px]">
                          {initial}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Player Name */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 truncate">
                      {isCurrent ? (
                        <Link
                          to="/profile"
                          className="font-bold uppercase text-white hover:text-[#22c55e] transition-colors truncate"
                        >
                          {displayName}
                        </Link>
                      ) : (
                        <span className="font-bold uppercase text-white truncate">
                          {displayName}
                        </span>
                      )}
                      {entry.tag && (
                        <span className="text-[10px] text-white/40 shrink-0">
                          [{entry.tag}]
                        </span>
                      )}
                      {isCurrent && (
                        <span className="px-1 py-0.2 font-mono text-[7px] uppercase font-bold bg-[#22c55e] text-black shrink-0">
                          YOU
                        </span>
                      )}
                      {isDqEntry && (
                        <span className="px-1 py-0.2 font-mono text-[7px] uppercase font-bold bg-rose-900/60 text-rose-300 border border-rose-500/40 shrink-0">
                          DQ
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Metric Value ONLY */}
                <div className="text-right shrink-0 pl-3">
                  <span className="font-bold text-white">
                    {getMetricValue(entry)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ============================================================== */}
      {/* PAGINATION CONTROLS                                             */}
      {/* ============================================================== */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border border-white/10 bg-black/60 px-3 py-2 font-mono text-xs">
          <span className="text-white/40 text-[11px]">
            #{ladderStartRank}-#{ladderEndRank} of {totalEntries}
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                if (currentPage > 1) {
                  onPageChange(currentPage - 1)
                  document.getElementById('standings-ladder')?.scrollIntoView({ behavior: 'smooth' })
                }
              }}
              disabled={currentPage === 1}
              className={`px-2.5 py-1 uppercase font-bold text-[10px] border transition-colors cursor-pointer ${
                currentPage === 1
                  ? 'border-white/5 text-white/20 cursor-not-allowed'
                  : 'border-white/15 text-white/70 hover:border-white/30 hover:text-white'
              }`}
            >
              Prev
            </button>

            <span className="px-2 text-white/50 text-[10px]">
              {currentPage} / {totalPages}
            </span>

            <button
              type="button"
              onClick={() => {
                if (currentPage < totalPages) {
                  onPageChange(currentPage + 1)
                  document.getElementById('standings-ladder')?.scrollIntoView({ behavior: 'smooth' })
                }
              }}
              disabled={currentPage === totalPages}
              className={`px-2.5 py-1 uppercase font-bold text-[10px] border transition-colors cursor-pointer ${
                currentPage === totalPages
                  ? 'border-white/5 text-white/20 cursor-not-allowed'
                  : 'border-white/15 text-white/70 hover:border-white/30 hover:text-white'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
