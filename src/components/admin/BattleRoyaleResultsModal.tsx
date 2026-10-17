import { useState, useEffect, useMemo } from 'react'
import {
  type ApiMatch,
  type BattleRoyaleTeamResultInput,
  submitBattleRoyaleResultsAdmin,
} from '../../services/matches'
import { Portal } from '../Modal'
import { Brackets, Hud } from '../ui'

interface Props {
  isOpen: boolean
  onClose: () => void
  match: ApiMatch | null
  tournamentTitle?: string
  onSuccess: (result: any) => void
}

interface TeamRowState {
  team_id: string
  team_name: string
  placement: number
  kills: number
  placement_points: number
  elimination_points: number
  total_points: number
  qualified: boolean
}

const DEFAULT_SCORING_MATRIX: Record<string, number> = {
  '1': 10,
  '2': 6,
  '3': 5,
  '4': 4,
  '5': 3,
  '6': 2,
  '7': 1,
  '8': 1,
}

export function BattleRoyaleResultsModal({
  isOpen,
  onClose,
  match,
  tournamentTitle,
  onSuccess,
}: Props) {
  const [rows, setRows] = useState<TeamRowState[]>([])
  const [qualifiersCount, setQualifiersCount] = useState<number>(10)
  const [advanceToNextRound, setAdvanceToNextRound] = useState<boolean>(true)
  const [nextRoundName, setNextRoundName] = useState<string>('')
  const [isFinalRound, setIsFinalRound] = useState<boolean>(false)
  const [step, setStep] = useState<'EDIT' | 'CONFIRM'>('EDIT')
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Initialize or restore selections when match opens
  useEffect(() => {
    if (!isOpen || !match) return

    setErrorMsg(null)
    setStep('EDIT')

    const currRound = match.round_number || 1
    setNextRoundName(`Round ${currRound + 1}`)
    setIsFinalRound(!!match.is_final_round)

    const existingQualIds = new Set(
      Array.isArray(match.qualifier_team_ids) ? match.qualifier_team_ids.map(String) : []
    )

    let initialRows: TeamRowState[] = []

    if (Array.isArray(match.placements) && match.placements.length > 0) {
      // Restore from previously saved placements
      initialRows = match.placements.map((p: any, idx: number) => {
        const tId = String(p.team_id || p.id || `squad-${idx}`)
        const place = p.placement || idx + 1
        const kills = p.kills || 0
        const pPts = p.placement_points ?? (DEFAULT_SCORING_MATRIX[String(place)] || 0)
        const ePts = p.elimination_points ?? kills
        const isQual = existingQualIds.size > 0 ? existingQualIds.has(tId) : !!p.qualified

        return {
          team_id: tId,
          team_name: p.team_name || p.name || `Squad ${idx + 1}`,
          placement: place,
          kills: kills,
          placement_points: pPts,
          elimination_points: ePts,
          total_points: p.total_points ?? (pPts + ePts),
          qualified: isQual,
        }
      })
    } else if (Array.isArray(match.teams) && match.teams.length > 0) {
      // Initialize from match teams roster
      initialRows = match.teams.map((t: any, idx: number) => {
        const tId = String(t.id || t._id || t.team_id || `squad-${idx}`)
        const place = idx + 1
        const pPts = DEFAULT_SCORING_MATRIX[String(place)] || 0
        const isQual = existingQualIds.has(tId)

        return {
          team_id: tId,
          team_name: t.name || t.team_name || `Squad ${idx + 1}`,
          placement: place,
          kills: 0,
          placement_points: pPts,
          elimination_points: 0,
          total_points: pPts,
          qualified: isQual,
        }
      })
    } else if (Array.isArray(match.team_ids) && match.team_ids.length > 0) {
      // Initialize from team IDs
      initialRows = match.team_ids.map((tId: string, idx: number) => {
        const sId = String(tId)
        const place = idx + 1
        const pPts = DEFAULT_SCORING_MATRIX[String(place)] || 0
        const isQual = existingQualIds.has(sId)

        return {
          team_id: sId,
          team_name: `Squad ${idx + 1}`,
          placement: place,
          kills: 0,
          placement_points: pPts,
          elimination_points: 0,
          total_points: pPts,
          qualified: isQual,
        }
      })
    } else {
      // Fallback
      if (match.team_a_id) {
        initialRows.push({
          team_id: match.team_a_id,
          team_name: match.team_a?.name || match.team_a_name || 'Squad A',
          placement: 1,
          kills: 0,
          placement_points: 10,
          elimination_points: 0,
          total_points: 10,
          qualified: existingQualIds.has(match.team_a_id),
        })
      }
      if (match.team_b_id) {
        initialRows.push({
          team_id: match.team_b_id,
          team_name: match.team_b?.name || match.team_b_name || 'Squad B',
          placement: 2,
          kills: 0,
          placement_points: 6,
          elimination_points: 0,
          total_points: 6,
          qualified: existingQualIds.has(match.team_b_id),
        })
      }
    }

    setRows(initialRows)

    // Configurable qualifiers count
    const targetCount =
      match.qualifiers_count && match.qualifiers_count > 0
        ? match.qualifiers_count
        : existingQualIds.size > 0
        ? existingQualIds.size
        : Math.max(1, Math.min(10, initialRows.length))
    setQualifiersCount(targetCount)
  }, [isOpen, match])

  // Computed metrics
  const selectedCount = useMemo(() => rows.filter((r) => r.qualified).length, [rows])
  const qualifyingTeams = useMemo(() => rows.filter((r) => r.qualified), [rows])
  const eliminatedTeams = useMemo(() => rows.filter((r) => !r.qualified), [rows])

  const winnerCandidate = useMemo(() => {
    if (rows.length === 0) return null
    // Team with placement 1, or highest points
    const p1 = rows.find((r) => r.placement === 1)
    if (p1) return p1
    return [...rows].sort((a, b) => b.total_points - a.total_points)[0]
  }, [rows])

  // Row update handlers
  const handleUpdateRow = (idx: number, field: 'placement' | 'kills', val: number) => {
    setRows((prev) => {
      const copy = [...prev]
      const row = { ...copy[idx] }
      if (field === 'placement') row.placement = Math.max(1, val)
      if (field === 'kills') row.kills = Math.max(0, val)

      const pPts = DEFAULT_SCORING_MATRIX[String(row.placement)] || 0
      const ePts = row.kills * 1
      row.placement_points = pPts
      row.elimination_points = ePts
      row.total_points = pPts + ePts

      copy[idx] = row
      return copy
    })
  }

  const handleToggleQualified = (idx: number) => {
    setRows((prev) => {
      const copy = [...prev]
      copy[idx] = { ...copy[idx], qualified: !copy[idx].qualified }
      return copy
    })
  }

  // Quick Action Helpers
  const handleSelectTopN = () => {
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        qualified: r.placement <= qualifiersCount,
      }))
    )
  }

  const handleSelectAll = () => {
    setRows((prev) => prev.map((r) => ({ ...r, qualified: true })))
  }

  const handleClearAll = () => {
    setRows((prev) => prev.map((r) => ({ ...r, qualified: false })))
  }

  const handleSortByPlacement = () => {
    setRows((prev) => [...prev].sort((a, b) => a.placement - b.placement))
  }

  const handleSortByPoints = () => {
    setRows((prev) => [...prev].sort((a, b) => b.total_points - a.total_points))
  }

  // Navigation to Review Step
  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (rows.length === 0) {
      setErrorMsg('No participants available in this match.')
      return
    }

    if (!isFinalRound) {
      if (selectedCount === 0) {
        setErrorMsg('Please select at least 1 qualifying team to advance to the next round.')
        return
      }
      if (qualifiersCount > 0 && selectedCount !== qualifiersCount) {
        const proceed = window.confirm(
          `You have selected ${selectedCount} team(s), but configured qualification requires ${qualifiersCount}. Do you want to proceed anyway?`
        )
        if (!proceed) return
      }
    } else {
      if (!winnerCandidate) {
        setErrorMsg('Unable to determine tournament champion. Please assign a 1st place team.')
        return
      }
    }

    setStep('CONFIRM')
  }

  // Submission to backend
  const handleFinalSubmit = async () => {
    if (!match) return
    setSubmitting(true)
    setErrorMsg(null)

    try {
      const payloadTeamResults: BattleRoyaleTeamResultInput[] = rows.map((r) => ({
        team_id: r.team_id,
        team_name: r.team_name,
        placement: r.placement,
        kills: r.kills,
        placement_points: r.placement_points,
        elimination_points: r.elimination_points,
        total_points: r.total_points,
        qualified: r.qualified,
      }))

      const qualifierTeamIds = rows.filter((r) => r.qualified).map((r) => r.team_id)

      const payload = {
        team_results: payloadTeamResults,
        qualifier_team_ids: qualifierTeamIds,
        qualifiers_count: qualifiersCount,
        advance_to_next_round: !isFinalRound && advanceToNextRound,
        next_round_name: nextRoundName.trim() || undefined,
        is_final_round: isFinalRound,
        scoring_matrix: {
          placement: DEFAULT_SCORING_MATRIX,
          kill: 1,
        },
      }

      const res = await submitBattleRoyaleResultsAdmin(match.id, payload)
      onSuccess(res)
      onClose()
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to submit Battle Royale results and advance qualifiers.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen || !match) return null

  return (
    <Portal lockScroll>
      <div
        role="dialog"
        aria-modal
        className="fixed inset-0 z-[100] flex items-center justify-center bg-void/85 p-3 sm:p-6 backdrop-blur-md overflow-hidden select-none"
      >
        <div className="relative w-full max-w-4xl border border-cyan/50 bg-graphite p-6 max-h-[min(92vh,calc(100svh-1.5rem))] overflow-y-auto select-text font-mono text-xs shadow-2xl">
          <Brackets color="border-cyan/50" />

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-3 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 bg-cyan rounded-full animate-pulse" />
                <h3 className="font-display text-2xl font-black uppercase text-ink tracking-tight">
                  Battle Royale Winner Selection &amp; Qualifiers
                </h3>
              </div>
              <p className="text-xs text-dim mt-0.5">
                {tournamentTitle || match.tournament_title || 'Tournament'} ·{' '}
                <span className="text-cyan font-bold">{match.round_name || match.stage || `Round ${match.round_number || 1}`}</span> · Match #{match.match_order || match.match_number || 1}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="border border-cyan/40 bg-cyan/10 px-2.5 py-1 text-[11px] text-cyan font-bold uppercase">
                {rows.length} Competing Teams
              </span>
              <button
                type="button"
                onClick={onClose}
                className="text-dim hover:text-ink text-xl px-2 py-0.5 cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="my-3 p-3 border border-live/40 bg-live/10 text-live font-bold">
              ⚠ {errorMsg}
            </div>
          )}

          {step === 'EDIT' ? (
            <form onSubmit={handleProceedToReview} className="mt-4 space-y-4">
              {/* Configuration Controls Bar */}
              <div className="border border-white/10 bg-void/60 p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                  <div>
                    <label className="block text-[11px] text-dim uppercase font-bold mb-1">
                      Required Qualifiers Count
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max={rows.length || 100}
                        value={qualifiersCount}
                        onChange={(e) => setQualifiersCount(Math.max(1, parseInt(e.target.value) || 1))}
                        disabled={isFinalRound}
                        className="w-24 border border-white/20 bg-surface px-3 py-1.5 text-sm font-bold text-cyan outline-none focus:border-cyan disabled:opacity-50"
                      />
                      <span className="text-dim text-[11px]">of {rows.length} total teams</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-dim uppercase font-bold mb-1">
                      Live Qualification Counter
                    </label>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 font-bold text-xs uppercase border ${
                          selectedCount === qualifiersCount
                            ? 'border-ok/40 bg-ok/15 text-ok'
                            : 'border-warn/40 bg-warn/15 text-warn'
                        }`}
                      >
                        {selectedCount === qualifiersCount ? '✓' : '⚠️'} Selected: {selectedCount} / {qualifiersCount}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col justify-end">
                    <label className="block text-[11px] text-dim uppercase font-bold mb-1">
                      Stage Mode
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer bg-surface/50 border border-white/10 px-3 py-1.5 hover:border-white/30">
                      <input
                        type="checkbox"
                        checked={isFinalRound}
                        onChange={(e) => {
                          const val = e.target.checked
                          setIsFinalRound(val)
                          if (val) setAdvanceToNextRound(false)
                        }}
                        className="accent-warn"
                      />
                      <span className="text-ink font-bold text-xs">
                        {isFinalRound ? '🏆 Grand Final (Certify Champion)' : '⚡ Intermediate Round'}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Quick Selection Helpers */}
                <div className="flex flex-wrap items-center justify-between pt-2 border-t border-white/10 gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectTopN}
                      disabled={isFinalRound}
                      className="border border-cyan/40 bg-cyan/10 px-2.5 py-1 text-[11px] font-bold text-cyan hover:bg-cyan/20 transition-colors cursor-pointer disabled:opacity-40"
                    >
                      ⚡ Select Top {qualifiersCount} by Placement
                    </button>
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      disabled={isFinalRound}
                      className="border border-white/20 bg-surface px-2.5 py-1 text-[11px] text-dim hover:text-ink cursor-pointer disabled:opacity-40"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAll}
                      disabled={isFinalRound}
                      className="border border-white/20 bg-surface px-2.5 py-1 text-[11px] text-dim hover:text-ink cursor-pointer disabled:opacity-40"
                    >
                      Clear Selection
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSortByPlacement}
                      className="text-dim hover:text-cyan text-[11px] underline cursor-pointer"
                    >
                      Sort by Placement ↑
                    </button>
                    <span className="text-white/20">|</span>
                    <button
                      type="button"
                      onClick={handleSortByPoints}
                      className="text-dim hover:text-cyan text-[11px] underline cursor-pointer"
                    >
                      Sort by Points ↓
                    </button>
                  </div>
                </div>
              </div>

              {/* Downstream Progression Settings (If not final round) */}
              {!isFinalRound && (
                <div className="border border-cyan/20 bg-cyan/[0.03] p-3 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={advanceToNextRound}
                      onChange={(e) => setAdvanceToNextRound(e.target.checked)}
                      className="accent-cyan"
                    />
                    <div>
                      <span className="font-bold text-ink">Advance Qualifiers into Next Round</span>
                      <p className="text-[10px] text-dim">
                        Selected {selectedCount} teams will form the next round Battle Royale lobby.
                      </p>
                    </div>
                  </label>

                  {advanceToNextRound && (
                    <div className="flex items-center gap-2">
                      <span className="text-dim uppercase text-[10px] whitespace-nowrap">Next Stage Label:</span>
                      <input
                        type="text"
                        placeholder="e.g. Round 2, Semifinals"
                        value={nextRoundName}
                        onChange={(e) => setNextRoundName(e.target.value)}
                        className="flex-1 border border-white/20 bg-surface px-2.5 py-1 text-xs text-ink outline-none focus:border-cyan"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Tournament State Notice */}
              <div
                className={`p-3 border text-[11px] leading-relaxed ${
                  isFinalRound
                    ? 'border-warn/40 bg-warn/10 text-warn'
                    : 'border-ok/30 bg-ok/[0.05] text-ok'
                }`}
              >
                {isFinalRound ? (
                  <>
                    🏆 <strong>Championship Stage:</strong> 1st place team ({winnerCandidate?.team_name || 'TBD'}) will be declared the tournament champion. Finalizing this match will mark the tournament <strong>COMPLETED</strong>.
                  </>
                ) : (
                  <>
                    ⚡ <strong>Multi-Round Progression:</strong> Finalizing this match will <strong>NOT</strong> complete the tournament. The tournament status remains <strong>LIVE</strong> while qualifying teams advance to {nextRoundName || 'the next round'}.
                  </>
                )}
              </div>

              {/* Team Results & Qualifier Checkbox Table */}
              <div className="border border-white/10 bg-surface/50 max-h-[380px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-void/80 text-[10px] uppercase text-dim sticky top-0 z-10">
                      <th className="p-2.5 w-16 text-center">Qualify</th>
                      <th className="p-2.5">Squad / Team</th>
                      <th className="p-2.5 w-24 text-center">Placement</th>
                      <th className="p-2.5 w-20 text-center">Kills</th>
                      <th className="p-2.5 w-20 text-center">Place Pts</th>
                      <th className="p-2.5 w-20 text-center">Kill Pts</th>
                      <th className="p-2.5 w-20 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {rows.map((team, idx) => (
                      <tr
                        key={team.team_id || idx}
                        className={`hover:bg-white/[0.03] transition-colors ${
                          team.qualified ? 'bg-cyan/[0.06]' : ''
                        }`}
                      >
                        <td className="p-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={team.qualified}
                            onChange={() => handleToggleQualified(idx)}
                            className="w-4 h-4 accent-cyan cursor-pointer"
                          />
                        </td>
                        <td className="p-2.5 font-display font-black text-ink text-xs uppercase">
                          <div className="flex items-center gap-2">
                            <span className="truncate max-w-[220px]">{team.team_name}</span>
                            {team.placement === 1 && (
                              <span className="px-1.5 py-0.2 bg-warn/20 border border-warn/40 text-[9px] text-warn font-bold">
                                #1 WINNER
                              </span>
                            )}
                            {team.qualified && (
                              <span className="px-1.5 py-0.2 bg-ok/20 border border-ok/40 text-[9px] text-ok font-bold">
                                QUALIFIED
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-2.5 text-center">
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={team.placement}
                            onChange={(e) =>
                              handleUpdateRow(idx, 'placement', parseInt(e.target.value) || 1)
                            }
                            className="w-16 border border-white/20 bg-void px-2 py-1 text-xs text-ink outline-none focus:border-cyan text-center font-bold"
                          />
                        </td>
                        <td className="p-2.5 text-center">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={team.kills}
                            onChange={(e) =>
                              handleUpdateRow(idx, 'kills', parseInt(e.target.value) || 0)
                            }
                            className="w-16 border border-white/20 bg-void px-2 py-1 text-xs text-ink outline-none focus:border-cyan text-center font-bold text-live"
                          />
                        </td>
                        <td className="p-2.5 text-center text-dim tabular-nums font-bold">
                          {team.placement_points}
                        </td>
                        <td className="p-2.5 text-center text-dim tabular-nums font-bold">
                          {team.elimination_points}
                        </td>
                        <td className="p-2.5 text-right font-display font-black text-cyan tabular-nums text-sm pr-4">
                          {team.total_points}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={onClose}
                  className="border border-white/20 px-4 py-2 uppercase text-dim hover:text-ink cursor-pointer"
                >
                  Cancel
                </button>
                <div className="flex items-center gap-3">
                  <span className="text-dim text-[11px]">
                    {selectedCount} team(s) selected for advancement
                  </span>
                  <button
                    type="submit"
                    className="border border-cyan bg-cyan px-5 py-2 uppercase text-xs font-bold text-void hover:bg-cyan/90 transition-colors cursor-pointer shadow-lg shadow-cyan/20"
                  >
                    Review &amp; Finalize Qualifiers →
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* STEP 2: CONFIRMATION REVIEW STEP */
            <div className="mt-4 space-y-4">
              <div
                className={`p-4 border ${
                  isFinalRound
                    ? 'border-warn/40 bg-warn/10 text-warn'
                    : 'border-cyan/40 bg-cyan/10 text-cyan'
                }`}
              >
                <h4 className="font-display text-lg font-bold uppercase mb-1">
                  {isFinalRound ? '🏆 Grand Final Outcome Summary' : '⚡ Multi-Round Progression Summary'}
                </h4>
                <p className="text-xs opacity-90 leading-relaxed">
                  {isFinalRound
                    ? `Tournament will be marked COMPLETED. Official Champion: ${winnerCandidate?.team_name || '1st Place Team'}.`
                    : `Tournament remains LIVE. ${selectedCount} qualified team(s) will advance into ${nextRoundName || 'the next round'} lobby.`}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Qualifying Teams */}
                <div className="border border-ok/30 bg-ok/[0.04] p-4 space-y-2">
                  <div className="flex items-center justify-between border-b border-ok/20 pb-2">
                    <span className="font-bold text-ok uppercase text-xs">
                      ✓ Advancing Qualifiers ({qualifyingTeams.length})
                    </span>
                    <span className="text-[10px] text-ok/80">Advances to Next Stage</span>
                  </div>
                  <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                    {qualifyingTeams.length === 0 ? (
                      <p className="text-dim text-[11px] py-4 text-center">No qualifiers selected.</p>
                    ) : (
                      qualifyingTeams.map((t, idx) => (
                        <div
                          key={t.team_id || idx}
                          className="flex items-center justify-between bg-surface/60 border border-white/10 px-2.5 py-1.5"
                        >
                          <span className="font-bold text-ink truncate max-w-[180px]">
                            #{t.placement} {t.team_name}
                          </span>
                          <span className="font-mono text-cyan text-[11px] font-bold">
                            {t.total_points} pts ({t.kills} kills)
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Eliminated Teams */}
                <div className="border border-white/10 bg-void/50 p-4 space-y-2">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="font-bold text-dim uppercase text-xs">
                      ✕ Eliminated Contenders ({eliminatedTeams.length})
                    </span>
                    <span className="text-[10px] text-dim">Does Not Advance</span>
                  </div>
                  <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                    {eliminatedTeams.length === 0 ? (
                      <p className="text-dim text-[11px] py-4 text-center">All teams qualified.</p>
                    ) : (
                      eliminatedTeams.map((t, idx) => (
                        <div
                          key={t.team_id || idx}
                          className="flex items-center justify-between bg-surface/30 border border-white/5 px-2.5 py-1.5 opacity-70"
                        >
                          <span className="text-dim truncate max-w-[180px]">
                            #{t.placement} {t.team_name}
                          </span>
                          <span className="font-mono text-dim text-[11px]">
                            {t.total_points} pts
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Final Confirmation Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setStep('EDIT')}
                  disabled={submitting}
                  className="border border-white/20 px-4 py-2 uppercase text-dim hover:text-ink cursor-pointer disabled:opacity-50"
                >
                  ← Back to Edit
                </button>
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={submitting}
                  className="border border-ok bg-ok px-6 py-2.5 uppercase text-xs font-black text-void hover:bg-ok/90 transition-colors cursor-pointer shadow-lg shadow-ok/20 disabled:opacity-50"
                >
                  {submitting
                    ? 'Finalizing Results & Advancing Qualifiers...'
                    : isFinalRound
                    ? '🏆 Confirm & Declare Champion'
                    : '⚡ Finalize Results & Advance Qualifiers'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Portal>
  )
}

export default BattleRoyaleResultsModal
