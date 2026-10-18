import React, { useState, useEffect } from 'react'
import { Portal } from '../Modal'
import { Brackets } from '../ui'
import {
  getRoundReviewAdmin,
  submitRoundRatingsAdmin,
  finalizeRoundAdmin,
  type RoundReviewResponse,
  type RoundPlayerItem,
  type RoundRatingSubmitItem,
} from '../../services/admin'

interface RoundReviewAndRatingModalProps {
  tournamentId: string
  tournamentTitle?: string
  roundName: string
  isOpen: boolean
  onClose: () => void
  onFinalized?: () => void
}

export const RoundReviewAndRatingModal: React.FC<RoundReviewAndRatingModalProps> = ({
  tournamentId,
  tournamentTitle,
  roundName,
  isOpen,
  onClose,
  onFinalized,
}) => {
  const [activeTab, setActiveTab] = useState<'ratings' | 'qualifications'>('ratings')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [reviewData, setReviewData] = useState<RoundReviewResponse | null>(null)

  // Player ratings state
  const [playerRatings, setPlayerRatings] = useState<Record<string, { rating: number; skill_adjustment: number; notes: string }>>({})
  const [isSubmittingRatings, setIsSubmittingRatings] = useState(false)
  const [ratingsSuccessMsg, setRatingsSuccessMsg] = useState<string | null>(null)

  // Qualifications state
  const [selectedQualifiers, setSelectedQualifiers] = useState<Set<string>>(new Set())
  const [qualificationNotes, setQualificationNotes] = useState('')
  const [isFinalizing, setIsFinalizing] = useState(false)
  const [finalizeSuccessMsg, setFinalizeSuccessMsg] = useState<string | null>(null)

  const loadData = async () => {
    if (!tournamentId || !roundName) return
    setLoading(true)
    setErrorMsg(null)
    setRatingsSuccessMsg(null)
    setFinalizeSuccessMsg(null)
    try {
      const data = await getRoundReviewAdmin(tournamentId, roundName)
      setReviewData(data)

      // Initialize player ratings map
      const initialMap: Record<string, { rating: number; skill_adjustment: number; notes: string }> = {}
      data.players.forEach((p) => {
        initialMap[p.user_id] = {
          rating: p.existing_rating || 8,
          skill_adjustment: p.proposed_adjustment ?? 0,
          notes: p.existing_notes || p.calculation_reason || '',
        }
      })
      setPlayerRatings(initialMap)

      // Initialize selected qualifiers (confirmed if already finalized, else proposed)
      const initialQuals = new Set<string>(
        data.confirmed_qualifiers && data.confirmed_qualifiers.length > 0
          ? data.confirmed_qualifiers
          : data.proposed_qualifiers || []
      )
      setSelectedQualifiers(initialQuals)
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to load round review data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadData()
    }
  }, [isOpen, tournamentId, roundName])

  if (!isOpen) return null

  const handleRatingChange = (userId: string, val: number) => {
    const clamped = Math.min(10, Math.max(1, Math.round(val * 10) / 10))
    setPlayerRatings((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        rating: clamped,
      },
    }))
  }

  const handleSkillAdjustmentChange = (userId: string, delta: number) => {
    setPlayerRatings((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        skill_adjustment: delta,
      },
    }))
  }

  const handleNotesChange = (userId: string, notes: string) => {
    setPlayerRatings((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        notes,
      },
    }))
  }

  const handleSaveRatings = async () => {
    if (!reviewData) return
    setIsSubmittingRatings(true)
    setErrorMsg(null)
    setRatingsSuccessMsg(null)
    try {
      const items: RoundRatingSubmitItem[] = reviewData.players.map((p) => {
        const state = playerRatings[p.user_id] || { rating: 8, skill_adjustment: 0, notes: '' }
        return {
          player_id: p.user_id,
          user_id: p.user_id,
          username: p.username,
          display_name: p.display_name,
          team_id: p.team_id,
          team_name: p.team_name,
          match_id: p.match_id,
          rating: state.rating,
          skill_adjustment: state.skill_adjustment || undefined,
          adjustment_reason: 'Round Performance Evaluation',
          adjustment_explanation: state.notes || `Round ${roundName} performance rating`,
          notes: state.notes || undefined,
          review: state.notes || undefined,
        }
      })

      const submissionId = `round_ratings_${tournamentId}_${roundName}_${Date.now()}`
      await submitRoundRatingsAdmin(tournamentId, roundName, {
        ratings: items,
        submission_id: submissionId,
      })
      setRatingsSuccessMsg(`✓ Saved ratings for ${items.length} player(s) in ${roundName}.`)
      loadData()
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to submit round ratings.')
    } finally {
      setIsSubmittingRatings(false)
    }
  }

  const handleToggleQualifier = (participantId: string) => {
    if (reviewData?.is_round_finalized) return
    setSelectedQualifiers((prev) => {
      const next = new Set(prev)
      if (next.has(participantId)) {
        next.delete(participantId)
      } else {
        next.add(participantId)
      }
      return next
    })
  }

  const handleFinalizeRound = async () => {
    if (!reviewData) return
    if (!reviewData.all_matches_completed) {
      alert('Cannot finalize round: All matches in this round must be COMPLETED first.')
      return
    }
    if (selectedQualifiers.size === 0) {
      if (!confirm('No qualifiers selected. Are you sure you want to finalize this round with 0 qualifiers?')) {
        return
      }
    } else {
      if (
        !confirm(
          `Confirm finalization of ${roundName}? This will certify ${selectedQualifiers.size} qualified participant(s) in the database. (Note: Next round will NOT be created automatically; you can form it manually in the Formation Workspace).`
        )
      ) {
        return
      }
    }

    setIsFinalizing(true)
    setErrorMsg(null)
    setFinalizeSuccessMsg(null)
    try {
      await finalizeRoundAdmin(tournamentId, roundName, {
        qualifier_ids: Array.from(selectedQualifiers),
        notes: qualificationNotes || undefined,
      })
      setFinalizeSuccessMsg(`✓ ${roundName} finalized successfully! ${selectedQualifiers.size} participant(s) qualified.`)
      await loadData()
      if (onFinalized) onFinalized()
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to finalize round.')
    } finally {
      setIsFinalizing(false)
    }
  }

  const allMatchesDone = reviewData?.all_matches_completed ?? false
  const isFinalized = reviewData?.is_round_finalized ?? false

  return (
    <Portal lockScroll>
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-[100] flex items-center justify-center bg-void/85 p-3 sm:p-6 backdrop-blur-md overflow-hidden select-none"
      >
        <div className="relative w-full max-w-4xl border border-cyan/50 bg-graphite p-6 max-h-[min(92vh,calc(100svh-2rem))] overflow-y-auto select-text shadow-2xl flex flex-col">
          <Brackets color="border-cyan/50" />

          {/* Header */}
          <div className="border-b border-white/10 pb-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest text-cyan font-bold">
                {tournamentTitle || 'Tournament'} • Round Management
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 border ${
                    allMatchesDone
                      ? 'border-ok/40 bg-ok/10 text-ok'
                      : 'border-live/40 bg-live/10 text-live animate-pulse'
                  }`}
                >
                  {allMatchesDone
                    ? `✓ All Matches Complete (${reviewData?.completed_matches}/${reviewData?.total_matches})`
                    : `⏳ Matches In Progress (${reviewData?.completed_matches || 0}/${reviewData?.total_matches || 0})`}
                </span>

                {isFinalized && (
                  <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 border border-purple-500/40 bg-purple-500/10 text-purple-400">
                    🔒 Round Finalized
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between mt-1">
              <h3 className="font-display text-2xl font-black uppercase text-ink">
                Round Review: {roundName}
              </h3>
              <div className="flex items-center gap-1 border border-white/10 p-0.5 bg-void text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setActiveTab('ratings')}
                  className={`px-3 py-1 font-bold uppercase transition-colors cursor-pointer ${
                    activeTab === 'ratings' ? 'bg-cyan text-void' : 'text-dim hover:text-ink'
                  }`}
                >
                  ⭐ Player Ratings ({reviewData?.players?.length || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('qualifications')}
                  className={`px-3 py-1 font-bold uppercase transition-colors cursor-pointer ${
                    activeTab === 'qualifications' ? 'bg-cyan text-void' : 'text-dim hover:text-ink'
                  }`}
                >
                  🏆 Standings &amp; Qualifiers ({selectedQualifiers.size})
                </button>
              </div>
            </div>
          </div>

          {/* Banners */}
          {errorMsg && (
            <div className="mt-3 p-2.5 bg-live/15 border border-live/40 text-live text-xs font-mono">
              {errorMsg}
            </div>
          )}

          {ratingsSuccessMsg && (
            <div className="mt-3 p-2.5 bg-ok/15 border border-ok/40 text-ok text-xs font-mono">
              {ratingsSuccessMsg}
            </div>
          )}

          {finalizeSuccessMsg && (
            <div className="mt-3 p-2.5 bg-purple-500/15 border border-purple-500/40 text-purple-300 text-xs font-mono">
              {finalizeSuccessMsg}
            </div>
          )}

          {loading ? (
            <div className="py-16 text-center text-dim font-mono text-xs">
              Loading round participant and standings data...
            </div>
          ) : (
            <div className="mt-4 flex-1 overflow-y-auto font-mono text-xs pr-1">
              {/* TAB 1: RATINGS */}
              {activeTab === 'ratings' && (
                <div className="space-y-4">
                  <div className="p-3 bg-void/60 border border-white/5 text-[11px] text-dim leading-relaxed">
                    <strong className="text-ink">Multi-System Rating Workflow:</strong> Authorized organizers can rate all participants across completed matches in this round. Adjust performance ratings (1-10) and skill rating adjustments (+/- MMR).
                  </div>

                  {reviewData?.players.length === 0 ? (
                    <div className="p-8 border border-white/10 text-center text-dim">
                      No participating players resolved for matches in this round.
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[460px] overflow-y-auto pr-2">
                      {reviewData?.players.map((p) => {
                        const cur = playerRatings[p.user_id] || { rating: 8, skill_adjustment: p.proposed_adjustment ?? 0, notes: '' }
                        const postRating = Math.max(100, (p.current_rating || 500) + (cur.skill_adjustment || 0))
                        const isGain = (cur.skill_adjustment || 0) > 0
                        const isLoss = (cur.skill_adjustment || 0) < 0
                        return (
                          <div
                            key={p.user_id}
                            className="p-3.5 border border-white/10 bg-void/70 flex flex-col gap-3"
                          >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              {/* Player Info */}
                              <div className="flex items-center gap-3 min-w-0 md:w-1/3">
                                {p.avatar_url ? (
                                  <img
                                    src={p.avatar_url}
                                    alt={p.username}
                                    className="size-10 rounded-full object-cover border border-white/20 shrink-0"
                                  />
                                ) : (
                                  <div className="size-10 rounded-full bg-cyan/15 border border-cyan/40 text-cyan flex items-center justify-center font-bold uppercase shrink-0">
                                    {p.username.slice(0, 2)}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <div className="font-display font-black text-sm uppercase text-ink truncate">
                                    {p.display_name || p.username}
                                  </div>
                                  <div className="text-[10px] text-dim truncate">
                                    {p.team_name || 'Solo Contender'} • @{p.username} • <span className="opacity-70">ID: {p.user_id.slice(0, 8)}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Match Statistics Badges */}
                              <div className="flex flex-wrap items-center gap-2">
                                {p.placement !== undefined && p.placement !== null && (
                                  <span className={`px-2 py-0.5 text-[11px] font-bold uppercase border ${
                                    p.placement === 1
                                      ? 'border-amber-400/50 bg-amber-400/10 text-amber-300'
                                      : p.placement <= 3
                                      ? 'border-cyan/50 bg-cyan/10 text-cyan'
                                      : 'border-white/15 bg-white/5 text-ink'
                                  }`}>
                                    Rank #{p.placement}
                                  </span>
                                )}
                                {p.kills !== undefined && p.kills > 0 && (
                                  <span className="px-2 py-0.5 text-[11px] border border-white/15 bg-white/5 text-dim">
                                    Kills: <strong className="text-ink">{p.kills}</strong>
                                  </span>
                                )}
                                {p.points !== undefined && p.points > 0 && (
                                  <span className="px-2 py-0.5 text-[11px] border border-white/15 bg-white/5 text-dim">
                                    Pts: <strong className="text-cyan font-bold">{p.points}</strong>
                                  </span>
                                )}
                                {p.wins !== undefined && p.wins > 0 && (
                                  <span className="px-2 py-0.5 text-[11px] border border-amber-400/40 bg-amber-400/10 text-amber-300 font-bold">
                                    Win: {p.wins}
                                  </span>
                                )}
                              </div>

                              {/* Performance Rating (1-10) with +/- buttons */}
                              <div className="flex items-center gap-2">
                                <span className="text-dim text-[11px]">Match Rating:</span>
                                <div className="flex items-center border border-cyan/40 bg-surface">
                                  <button
                                    type="button"
                                    onClick={() => handleRatingChange(p.user_id, cur.rating - 0.5)}
                                    className="px-2 py-1 text-dim hover:text-cyan font-bold cursor-pointer"
                                    title="Decrease rating"
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    step="0.5"
                                    value={cur.rating}
                                    onChange={(e) => handleRatingChange(p.user_id, parseFloat(e.target.value) || 1)}
                                    className="w-12 text-center font-display font-black text-cyan text-sm bg-transparent outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleRatingChange(p.user_id, cur.rating + 0.5)}
                                    className="px-2 py-1 text-dim hover:text-cyan font-bold cursor-pointer"
                                    title="Increase rating"
                                  >
                                    +
                                  </button>
                                </div>
                                <span className="text-dim text-[10px]">/ 10</span>
                              </div>

                              {/* MMR Progression (Pre -> Adj -> Post) */}
                              <div className="flex items-center gap-2.5">
                                <div className="text-right">
                                  <span className="text-[10px] text-dim block uppercase">Pre MMR</span>
                                  <span className="text-ink font-bold">{p.current_rating}</span>
                                </div>

                                <div className="flex flex-col items-center">
                                  <span className="text-[10px] text-dim uppercase">Skill Adj</span>
                                  <select
                                    value={cur.skill_adjustment}
                                    onChange={(e) => handleSkillAdjustmentChange(p.user_id, parseInt(e.target.value, 10))}
                                    className={`border px-2 py-1 outline-none text-xs font-bold ${
                                      isGain
                                        ? 'border-ok/50 bg-ok/10 text-ok'
                                        : isLoss
                                        ? 'border-live/50 bg-live/10 text-live'
                                        : 'border-white/20 bg-surface text-ink'
                                    }`}
                                  >
                                    <option value="0">0 (Neutral)</option>
                                    <option value="25">+25 (Dominant)</option>
                                    <option value="15">+15 (Strong Win)</option>
                                    <option value="10">+10 (Good Play)</option>
                                    <option value="5">+5 (Slight Gain)</option>
                                    <option value="-5">-5 (Slight Loss)</option>
                                    <option value="-10">-10 (Underperform)</option>
                                    <option value="-15">-15 (Disqualified / AFK)</option>
                                  </select>
                                </div>

                                <div className="text-left">
                                  <span className="text-[10px] text-dim block uppercase">Post MMR</span>
                                  <span className={`font-black ${isGain ? 'text-ok' : isLoss ? 'text-live' : 'text-cyan'}`}>
                                    {postRating}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Transparent Calculation Breakdown & Arbiter Feedback */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-white/5 text-[11px]">
                              {p.calculation_reason && (
                                <div className="flex-1 flex items-center gap-1.5 text-dim bg-white/[0.02] border border-white/5 px-2.5 py-1">
                                  <span className="text-cyan font-bold shrink-0">📊 Reason:</span>
                                  <span className="text-ink/90 truncate">{p.calculation_reason}</span>
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <input
                                  type="text"
                                  placeholder="Arbiter feedback / custom notes..."
                                  value={cur.notes}
                                  onChange={(e) => handleNotesChange(p.user_id, e.target.value)}
                                  className="w-full border border-white/10 bg-surface px-2.5 py-1 text-xs text-ink outline-none focus:border-cyan"
                                />
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <span className="text-[11px] text-dim">
                      {reviewData?.total_rated_players || 0} of {reviewData?.players.length || 0} players previously rated.
                    </span>
                    <button
                      type="button"
                      disabled={isSubmittingRatings || reviewData?.players.length === 0}
                      onClick={handleSaveRatings}
                      className="border border-cyan bg-cyan px-5 py-2 uppercase text-xs font-bold text-void hover:bg-cyan/90 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isSubmittingRatings ? 'Saving Ratings...' : 'Save Round Ratings'}
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: STANDINGS & QUALIFIERS */}
              {activeTab === 'qualifications' && (
                <div className="space-y-4">
                  <div className="p-3 bg-void/60 border border-white/5 text-[11px] text-dim leading-relaxed">
                    <strong className="text-ink">Qualification Review:</strong> Review round standings. Qualifiers are pre-selected based on performance; you can toggle or override selections. When finalized, qualifiers become available in the database for manual Round N+1 formation.
                  </div>

                  {!allMatchesDone && (
                    <div className="p-3 bg-live/10 border border-live/30 text-live text-xs flex items-center justify-between">
                      <span>⚠️ All matches in this round must be COMPLETED before finalization.</span>
                      <span className="font-bold">{reviewData?.completed_matches} / {reviewData?.total_matches} Done</span>
                    </div>
                  )}

                  {reviewData?.standings.length === 0 ? (
                    <div className="p-8 border border-white/10 text-center text-dim">
                      No match results recorded for this round yet.
                    </div>
                  ) : (
                    <div className="border border-white/10 bg-void/60 overflow-hidden">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-white/10 text-dim text-[10px] uppercase bg-surface">
                            <th className="p-2.5 text-center">Rank</th>
                            <th className="p-2.5">Participant / Squad</th>
                            <th className="p-2.5 text-center">Matches</th>
                            <th className="p-2.5 text-center">Points / Wins</th>
                            <th className="p-2.5 text-center">Kills</th>
                            <th className="p-2.5 text-center">Qualify?</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-xs">
                          {reviewData?.standings.map((st) => {
                            const isSelected = selectedQualifiers.has(st.participant_id)
                            return (
                              <tr
                                key={st.participant_id}
                                className={`hover:bg-white/5 transition-colors ${
                                  isSelected ? 'bg-cyan/5' : ''
                                }`}
                              >
                                <td className="p-2.5 text-center font-display font-black text-ink">
                                  #{st.rank}
                                </td>
                                <td className="p-2.5 font-bold text-ink">
                                  {st.participant_name}
                                </td>
                                <td className="p-2.5 text-center text-dim">
                                  {st.matches_played}
                                </td>
                                <td className="p-2.5 text-center font-bold text-cyan">
                                  {st.total_points > 0 ? `${st.total_points} pts` : `${st.wins || 0} Wins`}
                                </td>
                                <td className="p-2.5 text-center text-dim">
                                  {st.kills ?? '-'}
                                </td>
                                <td className="p-2.5 text-center">
                                  <button
                                    type="button"
                                    disabled={isFinalized}
                                    onClick={() => handleToggleQualifier(st.participant_id)}
                                    className={`px-3 py-1 font-bold uppercase text-[10px] border transition-colors cursor-pointer ${
                                      isSelected
                                        ? 'border-ok bg-ok text-void'
                                        : 'border-white/20 bg-void text-dim hover:text-ink'
                                    } disabled:opacity-60 disabled:cursor-not-allowed`}
                                  >
                                    {isSelected ? '✓ QUALIFIED' : 'ELIMINATE'}
                                  </button>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Notes & Finalize Control */}
                  <div className="pt-3 border-t border-white/10 space-y-3">
                    <div>
                      <label className="block text-dim uppercase mb-1 font-bold">
                        Qualification Arbiter Notes (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Top 10 squads qualified directly to Finals based on placement points."
                        value={qualificationNotes}
                        onChange={(e) => setQualificationNotes(e.target.value)}
                        className="w-full border border-white/10 bg-surface px-3 py-2 text-xs text-ink outline-none focus:border-cyan"
                        disabled={isFinalized}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="text-[11px] text-dim">
                        Selected Qualifiers: <strong className="text-cyan font-bold">{selectedQualifiers.size}</strong>
                      </div>

                      <button
                        type="button"
                        disabled={isFinalizing || !allMatchesDone || isFinalized}
                        onClick={handleFinalizeRound}
                        className={`px-6 py-2.5 uppercase text-xs font-bold transition-all border cursor-pointer ${
                          isFinalized
                            ? 'border-white/10 bg-white/5 text-dim cursor-not-allowed'
                            : !allMatchesDone
                            ? 'border-live/40 bg-live/15 text-live/60 cursor-not-allowed'
                            : 'border-ok bg-ok text-void hover:bg-ok/90'
                        }`}
                      >
                        {isFinalizing
                          ? 'Finalizing...'
                          : isFinalized
                          ? 'Round Already Finalized'
                          : `⚖️ Finalize ${roundName} (${selectedQualifiers.size} Qualifiers)`}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-4 border-t border-white/10 mt-4 flex items-center justify-end">
            <button
              type="button"
              onClick={onClose}
              className="border border-white/20 px-4 py-2 uppercase text-dim hover:text-ink cursor-pointer transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </Portal>
  )
}

export default RoundReviewAndRatingModal
