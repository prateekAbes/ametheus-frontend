import { useMemo } from 'react'
import type { FinalStandingRecord } from './types'
import { Hud } from '../ui'
import { inr } from '../../lib/data'

interface FinalResultsViewProps {
  isSolo: boolean
  champion?: { id?: string; name?: string; type?: string; prize_inr?: number } | null
  mvp?: { player_id?: string; player_name?: string; stats?: string; notes?: string } | null
  standings?: FinalStandingRecord[]
  completedAt?: string
  isBattleRoyale?: boolean
}

export function FinalResultsView({
  isSolo,
  champion,
  mvp,
  standings = [],
  completedAt,
  isBattleRoyale,
}: FinalResultsViewProps) {
  // Sort standings by rank
  const sortedStandings = useMemo(() => {
    return [...standings].sort((a, b) => a.rank - b.rank)
  }, [standings])

  const championName = champion?.name || (sortedStandings[0]?.participantName ?? null)

  const formattedDate = useMemo(() => {
    if (!completedAt) return null
    try {
      const d = new Date(completedAt)
      if (isNaN(d.getTime())) return null
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    } catch {
      return null
    }
  }, [completedAt])

  return (
    <div className="space-y-8">
      {/* Champion Podium Banner */}
      {championName ? (
        <div className="relative overflow-hidden border-2 border-ok/50 bg-gradient-to-r from-ok/10 via-surface/80 to-ok/5 p-6 sm:p-8">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏆</span>
                <Hud className="text-ok font-bold">OFFICIAL TOURNAMENT CHAMPION</Hud>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-black uppercase text-ink tracking-tight">
                {championName}
              </h2>
              <p className="font-mono text-xs text-dim">
                Sanctioned tournament winner verified by Ametheus arbiter panel.
                {formattedDate && ` Concluded on ${formattedDate}.`}
              </p>
            </div>

            {champion?.prize_inr && champion.prize_inr > 0 ? (
              <div className="border border-ok/40 bg-ok/10 px-5 py-3 text-right">
                <span className="block font-mono text-[10px] uppercase text-dim">Champion Prize</span>
                <span className="font-display text-2xl font-black text-ok">
                  {inr(champion.prize_inr)}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Tournament MVP Card (if awarded) */}
      {mvp && mvp.player_name && (
        <div className="border border-white/10 bg-surface/50 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-warn text-sm">⭐</span>
              <Hud className="text-warn font-bold">TOURNAMENT MVP</Hud>
            </div>
            <h3 className="font-display text-xl font-black uppercase text-ink">
              {mvp.player_name}
            </h3>
            {mvp.notes && <p className="font-mono text-xs text-dim">{mvp.notes}</p>}
          </div>

          {mvp.stats && (
            <div className="border border-white/10 bg-void px-4 py-2 font-mono text-xs text-right">
              <span className="text-dim block text-[10px] uppercase">Recorded MVP Stats</span>
              <span className="text-cyan font-bold">{mvp.stats}</span>
            </div>
          )}
        </div>
      )}

      {/* Final Standings Table */}
      <section className="border border-white/10 bg-surface/40 p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <Hud className="text-cyan">FINAL STANDINGS & PLACEMENT</Hud>
            <h3 className="mt-1 font-display text-xl font-black uppercase text-ink">
              Official Tournament Results
            </h3>
            <p className="text-xs text-dim font-mono">
              Final verified scores, eliminations, and rankings finalized by platform arbiters.
            </p>
          </div>
          <span className="font-mono text-xs text-ok border border-ok/30 bg-ok/10 px-3 py-1">
            ✓ Finalized & Confirmed
          </span>
        </div>

        {sortedStandings.length === 0 ? (
          <div className="border border-dashed border-white/10 bg-void/50 p-6 text-center">
            <p className="font-mono text-xs text-dim">
              Final standings and award allocations are currently being compiled by the match referee panel.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-white/10 bg-void">
            <table className="w-full text-left font-mono text-xs">
              <thead className="border-b border-white/10 bg-white/5 uppercase text-dim text-[11px]">
                <tr>
                  <th className="p-3 w-16">Rank</th>
                  <th className="p-3">{isSolo ? 'Contender' : 'Team / Squad'}</th>
                  {isBattleRoyale ? (
                    <>
                      <th className="p-3 text-center">Eliminations</th>
                      <th className="p-3 text-right">Total Points</th>
                    </>
                  ) : (
                    <th className="p-3 text-center">Status</th>
                  )}
                  <th className="p-3 text-right">Prize Award</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sortedStandings.map((row, idx) => {
                  const isFirst = row.rank === 1
                  const isPodium = row.rank <= 3

                  return (
                    <tr
                      key={row.participantId || idx}
                      className={isFirst ? 'bg-ok/10' : isPodium ? 'bg-cyan/[0.03]' : 'hover:bg-white/[0.02]'}
                    >
                      <td className="p-3 font-bold">
                        {row.rank === 1 ? (
                          <span className="text-ok">🥇 1st</span>
                        ) : row.rank === 2 ? (
                          <span className="text-ink">🥈 2nd</span>
                        ) : row.rank === 3 ? (
                          <span className="text-warn">🥉 3rd</span>
                        ) : (
                          <span className="text-dim">#{row.rank}</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="font-display font-bold uppercase text-ink">
                          {row.participantName}
                        </span>
                        {row.participantTag && (
                          <span className="text-dim text-[10px] ml-1.5">[{row.participantTag}]</span>
                        )}
                        {isFirst && (
                          <span className="ml-2 border border-ok/40 bg-ok/10 px-1.5 py-0.5 text-[9px] uppercase text-ok">
                            Champion
                          </span>
                        )}
                      </td>

                      {isBattleRoyale ? (
                        <>
                          <td className="p-3 text-center text-dim">{row.kills ?? '-'}</td>
                          <td className="p-3 text-right font-display font-black text-cyan text-sm">
                            {row.totalPoints ?? '-'}
                          </td>
                        </>
                      ) : (
                        <td className="p-3 text-center text-dim">
                          {isFirst ? 'Champion' : row.rank === 2 ? 'Finalist' : `Top ${row.rank * 2}`}
                        </td>
                      )}

                      <td className="p-3 text-right font-mono font-bold text-ink">
                        {row.prizeAmountInr && row.prizeAmountInr > 0 ? (
                          <span className="text-ok">{inr(row.prizeAmountInr)}</span>
                        ) : (
                          <span className="text-dim">-</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
