import React from 'react'
import { LeaderboardEntry } from '../../services/leaderboard'
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

  const isUser = (e: LeaderboardEntry) => {
    const uid = currentUserId?.toLowerCase()
    const uname = currentUsername?.toLowerCase()
    const eId = (e.id || '').toLowerCase()
    const eName = (e.name || '').toLowerCase()
    const eCap = (e.captain || '').replace('@', '').toLowerCase()
    return (
      (!!uid && (eId === uid || eName === uid)) ||
      (!!uname && (eName === uname || eCap === uname))
    )
  }

  const isDq = (e: LeaderboardEntry) => {
    if (e.is_disqualified) return true
    if ((e.status || '').toUpperCase() === 'DISQUALIFIED') return true
    const id = (e.id || '').toLowerCase()
    const name = (e.name || '').toLowerCase()
    return disqualifiedIds.has(id) || disqualifiedIds.has(name)
  }

  const ladderStartRank =
    currentPage === 1 ? 4 : (currentPage - 1) * pageSize + 1
  const ladderEndRank =
    currentPage === 1
      ? Math.min(pageSize, totalEntries)
      : Math.min(currentPage * pageSize, totalEntries)

  // Primary metric column title
  const getPrimaryMetricLabel = () => {
    switch (selectedCategory) {
      case 'win_rate':
        return 'Win Rate'
      case 'earnings':
        return 'Prize Earnings'
      case 'wins':
        return 'Victories'
      case 'matches_played':
        return 'Matches'
      case 'overall':
      default:
        return 'Elo Rating'
    }
  }

  // Generate page numbers
  const pageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages]
    }
    if (currentPage >= totalPages - 3) {
      return [
        1,
        '...',
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ]
    }
    return [
      1,
      '...',
      currentPage - 1,
      currentPage,
      currentPage + 1,
      '...',
      totalPages,
    ]
  }

  return (
    <div id="standings-ladder" className="w-full scroll-mt-24 space-y-4">
      {/* ============================================================== */}
      {/* 1. DESKTOP / TABLET LADDER TABLE */}
      {/* ============================================================== */}
      <div className="border border-white/10 bg-surface/30 overflow-hidden shadow-xl backdrop-blur-md">
        {/* Table Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 px-5 py-3.5 bg-surface/80">
          <div className="flex items-center gap-2.5">
            <span className="w-1.5 h-4 bg-[#3dff9a] rounded-full shadow-[0_0_8px_#3dff9a]" />
            <span className="font-mono text-xs uppercase tracking-wider text-ink font-bold">
              Standings Ladder (Ranks #{ladderStartRank} to #{ladderEndRank})
            </span>
          </div>
          <span className="font-mono text-[11px] text-dim uppercase tracking-wider">
            Page {currentPage} of {totalPages} · {totalEntries} Contenders Listed
          </span>
        </div>

        {/* Responsive Table for md+ screens */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02] text-dim uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 w-16 text-center">Rank</th>
                <th className="py-3 px-4">Contender / Squad</th>
                <th className="py-3 px-4">Discipline</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center font-bold text-[#3dff9a]">
                  {getPrimaryMetricLabel()} (Primary)
                </th>
                <th className="py-3 px-4 text-center">Elo</th>
                <th className="py-3 px-4 text-center">Win Rate</th>
                <th className="py-3 px-4 text-center">Record</th>
                <th className="py-3 px-4 text-center">Recent Form</th>
                <th className="py-3 px-4 text-right">Prize Earnings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {entries.map((entry, idx) => {
                const rankNumber =
                  entry.rank ||
                  (currentPage === 1
                    ? idx + 4
                    : (currentPage - 1) * pageSize + idx + 1)
                const isDqEntry = isDq(entry)
                const isDisbanded =
                  entry.is_disbanded || entry.status === 'DISBANDED'
                const isCurrent = isUser(entry)
                const avatarUrl = resolveMediaUrl(entry.logo_url)

                return (
                  <tr
                    key={entry.id || idx}
                    className={`transition-colors hover:bg-white/[0.04] ${
                      isCurrent
                        ? 'bg-[#3dff9a]/10 border-l-2 border-l-[#3dff9a]'
                        : isDqEntry
                        ? 'bg-live/5'
                        : isDisbanded
                        ? 'bg-amber-950/[0.04]'
                        : ''
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-3 px-4 text-center font-bold text-dim">
                      #{String(rankNumber).padStart(2, '0')}
                    </td>

                    {/* Contender Name, Avatar, Tag */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {avatarUrl ? (
                          <div className="size-8 shrink-0 overflow-hidden rounded border border-white/15 bg-surface">
                            <DynamicImage
                              src={avatarUrl}
                              alt={entry.name}
                              className="size-8 object-cover"
                            />
                          </div>
                        ) : (
                          <div className="flex size-8 shrink-0 items-center justify-center rounded border border-white/15 bg-surface text-xs font-bold text-[#3dff9a]">
                            {(entry.name || 'C').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-display text-sm font-black uppercase text-ink truncate">
                              {entry.name}
                            </span>
                            {entry.tag && (
                              <span className="font-mono text-[10px] text-dim">
                                [{entry.tag}]
                              </span>
                            )}
                            {isCurrent && (
                              <span className="border border-[#3dff9a]/80 bg-[#3dff9a]/20 text-[#3dff9a] px-1 py-0.2 font-mono text-[8px] font-bold uppercase rounded-xs">
                                YOU
                              </span>
                            )}
                          </div>
                          {entry.captain && (
                            <span className="text-[10px] text-dim block truncate">
                              {entry.captain}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Discipline */}
                    <td className="py-3 px-4 text-dim">
                      {entry.game_name || entry.game_slug || 'Esports'}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4">
                      {isDqEntry ? (
                        <span className="inline-flex items-center border border-live/80 bg-live/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-live animate-pulse">
                          DISQUALIFIED
                        </span>
                      ) : isDisbanded ? (
                        <span className="inline-flex items-center border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-400">
                          Historical
                        </span>
                      ) : (
                        <span className="inline-flex items-center border border-[#3dff9a]/40 bg-[#3dff9a]/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#3dff9a]">
                          Active
                        </span>
                      )}
                    </td>

                    {/* Primary Highlighted Metric */}
                    <td className="py-3 px-4 text-center font-bold text-[#3dff9a]">
                      {selectedCategory === 'win_rate'
                        ? `${entry.win_rate ?? 0}%`
                        : selectedCategory === 'earnings'
                        ? inr(Number(entry.earnings || 0))
                        : selectedCategory === 'wins'
                        ? `${entry.wins ?? 0} W`
                        : selectedCategory === 'matches_played'
                        ? `${entry.matches_played ?? 0}`
                        : `${entry.rating ?? 1500} ELO`}
                    </td>

                    {/* Elo */}
                    <td className="py-3 px-4 text-center font-bold text-ink">
                      {entry.rating ?? 1500}
                    </td>

                    {/* Win Rate */}
                    <td className="py-3 px-4 text-center font-bold text-ink">
                      {entry.win_rate ?? 0}%
                    </td>

                    {/* Record */}
                    <td className="py-3 px-4 text-center text-dim">
                      <span className="text-ok font-bold">{entry.wins ?? 0}W</span>{' '}
                      -{' '}
                      <span className="text-rose-400 font-bold">
                        {entry.losses ?? 0}L
                      </span>
                    </td>

                    {/* Recent Form */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {entry.form && entry.form.length > 0 ? (
                          entry.form.map((f, fIdx) => (
                            <span
                              key={fIdx}
                              className={`inline-block size-4 text-[9px] font-black leading-4 rounded-xs text-center ${
                                f === 'W'
                                  ? 'bg-[#3dff9a]/20 text-[#3dff9a] border border-[#3dff9a]/40'
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

                    {/* Prize Earnings */}
                    <td className="py-3 px-4 text-right font-bold text-ink">
                      {inr(Number(entry.earnings || 0))}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Compact Card Layout for < md screens */}
        <div className="block md:hidden divide-y divide-white/10">
          {entries.map((entry, idx) => {
            const rankNumber =
              entry.rank ||
              (currentPage === 1
                ? idx + 4
                : (currentPage - 1) * pageSize + idx + 1)
            const isDqEntry = isDq(entry)
            const isCurrent = isUser(entry)
            const avatarUrl = resolveMediaUrl(entry.logo_url)

            return (
              <div
                key={entry.id || idx}
                className={`p-3.5 space-y-2 ${
                  isCurrent
                    ? 'bg-[#3dff9a]/10 border-l-2 border-l-[#3dff9a]'
                    : isDqEntry
                    ? 'bg-live/5'
                    : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-dim">
                      #{String(rankNumber).padStart(2, '0')}
                    </span>
                    {avatarUrl ? (
                      <div className="size-7 shrink-0 overflow-hidden rounded border border-white/15 bg-surface">
                        <DynamicImage
                          src={avatarUrl}
                          alt={entry.name}
                          className="size-7 object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex size-7 shrink-0 items-center justify-center rounded border border-white/15 bg-surface text-xs font-bold text-[#3dff9a]">
                        {(entry.name || 'C').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <span className="font-display text-sm font-black uppercase text-ink">
                        {entry.name}
                      </span>
                      {entry.tag && (
                        <span className="font-mono text-[10px] text-dim ml-1">
                          [{entry.tag}]
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Primary Stat on mobile */}
                  <span className="font-mono text-xs font-black text-[#3dff9a]">
                    {selectedCategory === 'win_rate'
                      ? `${entry.win_rate ?? 0}%`
                      : selectedCategory === 'earnings'
                      ? inr(Number(entry.earnings || 0))
                      : selectedCategory === 'wins'
                      ? `${entry.wins ?? 0} W`
                      : selectedCategory === 'matches_played'
                      ? `${entry.matches_played ?? 0} M`
                      : `${entry.rating ?? 1500} ELO`}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-dim border-t border-white/5 pt-1.5">
                  <span>{entry.game_name || entry.game_slug || 'Esports'}</span>
                  <span>
                    Rating: <strong className="text-ink">{entry.rating ?? 1500}</strong>
                  </span>
                  <span>
                    Record: <strong className="text-ok">{entry.wins ?? 0}W</strong>-
                    <strong className="text-rose-400">{entry.losses ?? 0}L</strong>
                  </span>
                  <span>{inr(Number(entry.earnings || 0))}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. PAGINATION CONTROLS */}
      {/* ============================================================== */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border border-white/10 bg-surface/40 p-4 backdrop-blur-md">
          <div className="font-mono text-xs text-dim">
            Showing standings <span className="font-bold text-ink">#{ladderStartRank}</span> to{' '}
            <span className="font-bold text-ink">#{ladderEndRank}</span> of{' '}
            <span className="font-bold text-[#3dff9a]">{totalEntries}</span> contenders
          </div>

          <div className="flex items-center gap-1.5 font-mono text-xs">
            {/* Previous Button */}
            <button
              type="button"
              onClick={() => {
                if (currentPage > 1) {
                  onPageChange(currentPage - 1)
                  document
                    .getElementById('standings-ladder')
                    ?.scrollIntoView({ behavior: 'smooth' })
                }
              }}
              disabled={currentPage === 1}
              className={`px-3 py-1.5 border uppercase font-bold transition-all cursor-pointer ${
                currentPage === 1
                  ? 'border-white/5 bg-white/[0.02] text-dim/30 cursor-not-allowed'
                  : 'border-white/15 bg-surface text-dim hover:border-[#3dff9a] hover:text-ink'
              }`}
            >
              ← Previous
            </button>

            {/* Numbered Page Buttons */}
            {pageNumbers().map((p, pIdx) => {
              if (p === '...') {
                return (
                  <span
                    key={`ellipsis-${pIdx}`}
                    className="px-2 py-1 text-dim select-none"
                  >
                    …
                  </span>
                )
              }
              const isCurrent = p === currentPage
              return (
                <button
                  key={`page-${p}`}
                  type="button"
                  onClick={() => {
                    onPageChange(p as number)
                    document
                      .getElementById('standings-ladder')
                      ?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className={`min-w-8 h-8 px-2 border font-bold transition-all cursor-pointer ${
                    isCurrent
                      ? 'border-[#3dff9a] bg-[#3dff9a] text-void shadow-[0_0_12px_rgba(61,255,154,0.4)]'
                      : 'border-white/10 bg-surface/60 text-dim hover:border-white/30 hover:text-ink'
                  }`}
                >
                  {p}
                </button>
              )
            })}

            {/* Next Button */}
            <button
              type="button"
              onClick={() => {
                if (currentPage < totalPages) {
                  onPageChange(currentPage + 1)
                  document
                    .getElementById('standings-ladder')
                    ?.scrollIntoView({ behavior: 'smooth' })
                }
              }}
              disabled={currentPage === totalPages}
              className={`px-3 py-1.5 border uppercase font-bold transition-all cursor-pointer ${
                currentPage === totalPages
                  ? 'border-white/5 bg-white/[0.02] text-dim/30 cursor-not-allowed'
                  : 'border-white/15 bg-surface text-dim hover:border-[#3dff9a] hover:text-ink'
              }`}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
