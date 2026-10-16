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

/**
 * Clean, minimal row-based standings list for Rank 4 and below.
 * - Square avatar images with subtle neutral borders
 * - Clear, responsive stats matching active category
 * - No blue outlines or neon highlights
 */
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
      case 'spending':
        return 'Total Spent'
      case 'win_rate':
        return 'Win Rate'
      case 'wins':
        return 'Match Wins'
      case 'overall':
      default:
        return 'Rating'
    }
  }

  // Format the single metric value for each row
  const getMetricValue = (entry: LeaderboardEntry) => {
    switch (selectedCategory) {
      case 'spending':
        return inr(Number(entry.spending ?? 0))
      case 'win_rate':
        return `${entry.win_rate ?? 0}%`
      case 'wins':
        return `${(entry.wins ?? 0).toLocaleString()} Wins`
      case 'overall':
      default:
        return `${(entry.rating ?? 1500).toLocaleString('en-US')}`
    }
  }

  return (
    <div id="standings-ladder" className="w-full scroll-mt-20 space-y-4">
      {/* ============================================================== */}
      {/* MINIMAL STANDINGS TABLE / LIST (RANKS 4+)                      */}
      {/* ============================================================== */}
      <div className="border border-white/10 bg-[#0c121d]/85 rounded-sm overflow-hidden backdrop-blur-sm">
        {/* Table Head */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 sm:px-6 py-2.5 bg-white/[0.02] font-mono text-[10px] text-[#8995A8] uppercase tracking-wider">
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
            const avatarUrl = resolveMediaUrl(entry.avatar_url || entry.logo_url)
            const rowKey = entry.id ? `entry-${entry.id}` : `rank-${rankNumber}-${entry.name}`

            // Canonical username display with proper capitalization
            const rawName =
              entry.name &&
              !entry.name.toLowerCase().startsWith('player_') &&
              !entry.name.toLowerCase().startsWith('user_')
                ? entry.name
                : entry.captain
                ? entry.captain.replace('@', '')
                : entry.name || 'Contender'

            const displayName = rawName.trim()
            const initial = displayName.charAt(0).toUpperCase()

            return (
              <div
                key={rowKey}
                className={`flex items-center justify-between px-4 sm:px-6 py-3 transition-colors hover:bg-white/[0.02] ${
                  isCurrent
                    ? 'bg-white/[0.05] border-l-2 border-l-white/60'
                    : isDqEntry
                    ? 'opacity-40'
                    : ''
                }`}
              >
                {/* Left: Rank & Contender (with square avatar) */}
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-9 sm:w-11 text-center font-mono text-xs font-semibold text-white/50 shrink-0">
                    #{String(rankNumber).padStart(2, '0')}
                  </span>

                  {/* Square Profile Picture (Neutral border, no blue glow) */}
                  {isCurrent ? (
                    <Link to="/profile" title="View your profile" className="shrink-0">
                      <div className="size-8 sm:size-9 shrink-0 overflow-hidden rounded-none border border-white/20 bg-[#0d131a]">
                        {avatarUrl ? (
                          <DynamicImage
                            src={avatarUrl}
                            alt={displayName}
                            className="size-full object-cover rounded-none"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center font-display font-bold text-white/80 bg-white/5 text-[11px]">
                            {initial}
                          </div>
                        )}
                      </div>
                    </Link>
                  ) : (
                    <div className="size-8 sm:size-9 shrink-0 overflow-hidden rounded-none border border-white/10 bg-[#0d131a]">
                      {avatarUrl ? (
                        <DynamicImage
                          src={avatarUrl}
                          alt={displayName}
                          className="size-full object-cover rounded-none"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center font-display font-bold text-white/80 bg-white/5 text-[11px]">
                          {initial}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Player Name with Clean Typography */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 truncate">
                      {isCurrent ? (
                        <Link
                          to="/profile"
                          className="font-display font-bold text-xs sm:text-sm text-white hover:text-cyan transition-colors truncate"
                        >
                          {displayName}
                        </Link>
                      ) : (
                        <span className="font-display font-semibold text-xs sm:text-sm text-white/95 truncate">
                          {displayName}
                        </span>
                      )}
                      {entry.tag && (
                        <span className="font-mono text-[10px] text-white/40 shrink-0">
                          [{entry.tag}]
                        </span>
                      )}
                      {isCurrent && (
                        <span className="px-1.5 py-0.5 font-mono text-[7px] uppercase font-bold bg-white text-black rounded-xs shrink-0">
                          YOU
                        </span>
                      )}
                      {isDqEntry && (
                        <span className="px-1 py-0.5 font-mono text-[7px] uppercase font-bold bg-rose-900/60 text-rose-300 border border-rose-500/40 shrink-0">
                          DQ
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Metric Value ONLY */}
                <div className="text-right shrink-0 pl-3">
                  <span className="font-mono font-bold text-xs sm:text-sm text-white tracking-tight">
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
        <div className="flex items-center justify-between border border-white/10 bg-[#0c121d]/80 px-4 py-2.5 font-mono text-xs rounded-sm backdrop-blur-sm">
          <span className="text-[#8995A8] text-[11px]">
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
              className={`px-3 py-1 uppercase font-bold text-[10px] border transition-colors cursor-pointer rounded-sm ${
                currentPage === 1
                  ? 'border-white/5 text-white/20 cursor-not-allowed'
                  : 'border-white/10 text-white hover:border-white/30 hover:bg-white/5'
              }`}
            >
              Prev
            </button>

            <span className="px-2 text-[#8995A8] text-[10px]">
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
              className={`px-3 py-1 uppercase font-bold text-[10px] border transition-colors cursor-pointer rounded-sm ${
                currentPage === totalPages
                  ? 'border-white/5 text-white/20 cursor-not-allowed'
                  : 'border-white/10 text-white hover:border-white/30 hover:bg-white/5'
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
