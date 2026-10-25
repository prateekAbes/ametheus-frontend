import { useState, useMemo } from 'react'
import type { BattleRoyaleRound, BattleRoyaleScoreRecord } from './types'
import { Hud, Dot } from '../ui'

interface BattleRoyaleViewProps {
  isSolo: boolean
  rounds?: BattleRoyaleRound[]
  tournamentStatus: string
  confirmedParticipants?: string[]
}

export function BattleRoyaleView({
  isSolo,
  rounds = [],
  tournamentStatus,
  confirmedParticipants = [],
}: BattleRoyaleViewProps) {
  // Identify current active/live round, completed rounds, and upcoming rounds
  const currentRound = useMemo(() => {
    return (
      rounds.find((r) => r.status === 'LIVE') ||
      (tournamentStatus === 'LIVE' && rounds.find((r) => r.status !== 'COMPLETED'))
    )
  }, [rounds, tournamentStatus])

  const completedRounds = useMemo(() => {
    return rounds.filter((r) => r.status === 'COMPLETED' || (r.results && r.results.length > 0))
  }, [rounds])

  const upcomingRounds = useMemo(() => {
    return rounds.filter(
      (r) =>
        r.status === 'UPCOMING' &&
        (!currentRound || r.id !== currentRound.id)
    )
  }, [rounds, currentRound])

  // Selected completed round for inspection
  const [selectedRoundId, setSelectedRoundId] = useState<string>(() => {
    if (completedRounds.length > 0) {
      return completedRounds[completedRounds.length - 1].id
    }
    return rounds[0]?.id || ''
  })

  const inspectedRound = useMemo(() => {
    return rounds.find((r) => r.id === selectedRoundId) || completedRounds[0] || currentRound
  }, [rounds, selectedRoundId, completedRounds, currentRound])

  const participantLabel = isSolo ? 'Solo Contenders' : 'Squads'

  return (
    <div className="space-y-8">
      {/* Format Header Description */}
      <div className="border border-white/10 bg-surface/30 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-cyan" />
              <Hud className="text-cyan">BATTLE ROYALE ROUNDS STRUCTURE</Hud>
            </div>
            <h2 className="mt-1 font-display text-2xl font-black uppercase text-ink">
              Multi-Lobby Round Progression
            </h2>
            <p className="mt-1 text-xs text-dim font-mono max-w-2xl">
              Battle Royale tournaments advance in structured rounds where all participating {participantLabel.toLowerCase()} deploy simultaneously into custom lobbies. Progression is determined strictly by verified placement and elimination scores.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-mono">
            <span className="border border-white/10 bg-white/5 px-2.5 py-1 text-dim">
              Rounds: {rounds.length > 0 ? rounds.length : 'Scheduled Live'}
            </span>
            <span className="border border-white/10 bg-white/5 px-2.5 py-1 text-dim">
              Scoring: Placement + Kills
            </span>
          </div>
        </div>
      </div>

      {/* 1. CURRENT ROUND SECTION */}
      {currentRound && (
        <section className="border-2 border-live/50 bg-surface/60 p-5 sm:p-6 shadow-[0_0_20px_rgba(255,59,48,0.1)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-2.5">
              <Dot c="bg-live" pulse />
              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-live font-bold">
                  ACTIVE ROUND IN PROGRESS
                </span>
                <h3 className="font-display text-xl sm:text-2xl font-black uppercase text-ink">
                  {currentRound.name || `Round ${currentRound.roundNumber}`}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-3 font-mono text-xs">
              {currentRound.mapName && (
                <span className="border border-white/15 bg-white/5 px-2.5 py-1 text-ink">
                  🗺️ Map: {currentRound.mapName}
                </span>
              )}
              {currentRound.scheduledTime && (
                <span className="text-dim">
                  Started: {currentRound.scheduledTime}
                </span>
              )}
            </div>
          </div>

          {/* Current Round Participants */}
          <div className="mt-4">
            <p className="font-mono text-xs uppercase text-dim tracking-wider mb-2">
              Lobby Contenders ({currentRound.participants?.length || confirmedParticipants.length} {participantLabel}):
            </p>

            {(currentRound.participants && currentRound.participants.length > 0) || confirmedParticipants.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 max-h-56 overflow-y-auto no-scrollbar">
                {currentRound.participants && currentRound.participants.length > 0 ? (
                  currentRound.participants.map((p, idx) => (
                    <div
                      key={p.id || idx}
                      className="border border-cyan/30 bg-cyan/5 px-3 py-2 font-mono text-xs truncate"
                    >
                      <span className="text-dim mr-1">#{idx + 1}</span>
                      <span className="font-bold text-ink truncate">{p.name}</span>
                      {p.tag && <span className="text-cyan text-[10px] block truncate">[{p.tag}]</span>}
                    </div>
                  ))
                ) : (
                  confirmedParticipants.map((name, idx) => (
                    <div
                      key={idx}
                      className="border border-cyan/30 bg-cyan/5 px-3 py-2 font-mono text-xs truncate"
                    >
                      <span className="text-dim mr-1">#{idx + 1}</span>
                      <span className="font-bold text-ink truncate">{name}</span>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <p className="font-mono text-xs text-dim italic">
                Active lobby roster is being synchronized by the match referee.
              </p>
            )}
          </div>
        </section>
      )}

      {/* 2. COMPLETED ROUNDS & ROUND HISTORY */}
      <section className="border border-white/10 bg-surface/40 p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <Hud className="text-ok">COMPLETED ROUNDS & HISTORICAL RESULTS</Hud>
            <h3 className="mt-1 font-display text-xl font-black uppercase text-ink">
              Round Scorecards & Standings
            </h3>
            <p className="text-xs text-dim font-mono">
              Inspect historical participant scores, eliminations, and placement points from each concluded round.
            </p>
          </div>

          {/* Round Selector Tabs */}
          {completedRounds.length > 1 && (
            <div className="flex flex-wrap gap-1.5 font-mono text-xs">
              {completedRounds.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedRoundId(r.id)}
                  className={`border px-3 py-1.5 uppercase transition-colors ${
                    inspectedRound?.id === r.id
                      ? 'border-cyan bg-cyan text-void font-bold'
                      : 'border-white/10 bg-surface text-dim hover:text-ink'
                  }`}
                >
                  {r.name || `Round ${r.roundNumber}`}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected Round Scoreboard Table */}
        {inspectedRound && inspectedRound.results && inspectedRound.results.length > 0 ? (
          <div>
            <div className="flex items-center justify-between font-mono text-xs text-dim mb-2">
              <span className="font-bold text-ink">{inspectedRound.name || `Round ${inspectedRound.roundNumber}`} Standings</span>
              {inspectedRound.mapName && <span>Map: {inspectedRound.mapName}</span>}
            </div>

            <div className="overflow-x-auto border border-white/10 bg-void">
              <table className="w-full text-left font-mono text-xs">
                <thead className="border-b border-white/10 bg-white/5 uppercase text-dim text-[11px]">
                  <tr>
                    <th className="p-3 w-16">Rank</th>
                    <th className="p-3">{isSolo ? 'Contender' : 'Squad'}</th>
                    <th className="p-3 text-center">Kills</th>
                    <th className="p-3 text-center">Placement Pts</th>
                    <th className="p-3 text-right">Total Pts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {inspectedRound.results.map((rec, rIdx) => (
                    <tr
                      key={rec.participantId || rIdx}
                      className={rec.rank === 1 ? 'bg-cyan/10' : 'hover:bg-white/[0.02]'}
                    >
                      <td className="p-3 font-bold text-cyan">
                        {rec.rank === 1 ? '🥇 #1' : `#${rec.rank}`}
                      </td>
                      <td className="p-3">
                        <span className="font-display font-bold uppercase text-ink">
                          {rec.participantName}
                        </span>
                        {rec.participantTag && (
                          <span className="text-dim text-[10px] ml-1.5">[{rec.participantTag}]</span>
                        )}
                        {rec.rank === 1 && (
                          <span className="ml-2 border border-ok/40 bg-ok/10 px-1.5 py-0.5 text-[9px] uppercase text-ok">
                            Winner
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center text-dim">{rec.kills ?? 0}</td>
                      <td className="p-3 text-center text-dim">{rec.placementPoints ?? 0}</td>
                      <td className="p-3 text-right font-display font-black text-cyan text-sm">
                        {rec.totalPoints ?? (rec.kills ?? 0) + (rec.placementPoints ?? 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="border border-dashed border-white/10 bg-void/50 p-6 text-center">
            <p className="font-mono text-xs text-dim">
              {completedRounds.length === 0
                ? 'No completed rounds have been finalized yet. Results will appear here once each round concludes and scores are verified by the arbiters.'
                : 'Select a round above to view recorded round scores.'}
            </p>
          </div>
        )}
      </section>

      {/* 3. UPCOMING ROUNDS SECTION */}
      {upcomingRounds.length > 0 && (
        <section className="border border-white/10 bg-surface/30 p-5 sm:p-6 space-y-4">
          <div className="border-b border-white/10 pb-3">
            <Hud className="text-cyan">UPCOMING SCHEDULED ROUNDS</Hud>
            <h3 className="mt-1 font-display text-xl font-black uppercase text-ink">
              Subsequent Lobbies & Fixtures
            </h3>
            <p className="text-xs text-dim font-mono">
              Upcoming rounds scheduled for this Battle Royale tournament. Participants are confirmed once round qualifications conclude.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {upcomingRounds.map((upRound) => (
              <div
                key={upRound.id}
                className="border border-white/10 bg-void p-4 space-y-2.5 font-mono text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan text-sm uppercase">
                    {upRound.name || `Round ${upRound.roundNumber}`}
                  </span>
                  <span className="border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-dim">
                    SCHEDULED
                  </span>
                </div>

                <div className="text-dim space-y-1">
                  {upRound.scheduledTime && (
                    <p>🕒 Kickoff: <span className="text-ink">{upRound.scheduledTime}</span></p>
                  )}
                  {upRound.mapName && (
                    <p>🗺️ Map: <span className="text-ink">{upRound.mapName}</span></p>
                  )}
                </div>

                <div className="border-t border-white/5 pt-2 text-[11px]">
                  {upRound.participants && upRound.participants.length > 0 ? (
                    <p className="text-ink">
                      Confirmed: {upRound.participants.length} {participantLabel}
                    </p>
                  ) : (
                    <p className="text-dim italic">
                      Qualifiers determined from previous round
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Scoring Reference */}
      <div className="border border-white/10 bg-void/50 p-4 font-mono text-[11px] text-dim flex flex-wrap items-center justify-between gap-3">
        <span>Scoring System: #1: 15 pts · #2: 12 pts · #3: 10 pts · #4: 8 pts · #5: 6 pts · 1 pt per Elimination</span>
        <span className="text-cyan">Official Ametheus Esports Rules</span>
      </div>
    </div>
  )
}
