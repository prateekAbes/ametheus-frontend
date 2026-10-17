import { useState, useEffect, useMemo } from 'react'
import {
  getRatingManagementHierarchy,
  adjustRatingsBulk,
  reverseRatingAdjustment,
  getRatingAuditLogs,
  type RatingGameHierarchy,
  type RatingTournamentInfo,
  type RatingRoundInfo,
  type RatingMatchInfo,
  type RatingAdjustmentPayloadItem,
} from '../../services/admin'
import { Panel, Hud, Badge, Brackets, Modal, Cta } from '../ui'
import { resolveMediaUrl } from '../../services/apiClient'

interface Props {
  onRatingUpdated?: () => void
}

const REASONS = [
  'Placement',
  'MVP',
  'Performance',
  'Penalty',
  'Administrative Correction',
  'Other',
] as const

interface AdjustmentState {
  adjustment: number
  reason: string
  explanation: string
}

export function RatingManager({ onRatingUpdated }: Props) {
  const [hierarchy, setHierarchy] = useState<RatingGameHierarchy[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Selection states
  const [selectedGameSlug, setSelectedGameSlug] = useState<string>('')
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('')
  const [selectedRoundId, setSelectedRoundId] = useState<string>('')
  const [selectedMatchId, setSelectedMatchId] = useState<string>('')

  // Form adjustments state: player_id -> AdjustmentState
  const [adjustments, setAdjustments] = useState<Record<string, AdjustmentState>>({})

  // Review modal
  const [isReviewOpen, setIsReviewOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)

  // Reversal Modal
  const [reversingLog, setReversingLog] = useState<any | null>(null)
  const [reversalReason, setReversalReason] = useState('')
  const [isReversing, setIsReversing] = useState(false)

  const fetchHierarchy = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getRatingManagementHierarchy()
      setHierarchy(res.hierarchy || [])
      if (res.hierarchy?.length > 0 && !selectedGameSlug) {
        setSelectedGameSlug(res.hierarchy[0].game_slug)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load rating hierarchy')
    } finally {
      setLoading(false)
    }
  }

  const fetchAuditLogs = async () => {
    setLoadingLogs(true)
    try {
      const res = await getRatingAuditLogs({ game_id: selectedGameSlug || undefined, limit: 30 })
      setAuditLogs(res.logs || [])
    } catch (err) {
      // ignore
    } finally {
      setLoadingLogs(false)
    }
  }

  useEffect(() => {
    fetchHierarchy()
  }, [])

  useEffect(() => {
    fetchAuditLogs()
  }, [selectedGameSlug])

  // Current selections
  const currentGame = useMemo(
    () => hierarchy.find((g) => g.game_slug === selectedGameSlug),
    [hierarchy, selectedGameSlug]
  )

  const currentTournaments = useMemo(
    () => currentGame?.tournaments || [],
    [currentGame]
  )

  const currentTournament = useMemo(
    () => currentTournaments.find((t) => t.tournament_id === selectedTournamentId),
    [currentTournaments, selectedTournamentId]
  )

  const currentRounds = useMemo(
    () => currentTournament?.rounds || [],
    [currentTournament]
  )

  const currentRound = useMemo(
    () => currentRounds.find((r) => r.round_id === selectedRoundId),
    [currentRounds, selectedRoundId]
  )

  const currentMatches = useMemo(
    () => currentRound?.matches || [],
    [currentRound]
  )

  const currentMatch = useMemo(
    () => currentMatches.find((m) => m.match_id === selectedMatchId),
    [currentMatches, selectedMatchId]
  )

  // Auto-select first tournament/round/match when parents change
  useEffect(() => {
    if (currentTournaments.length > 0) {
      if (!selectedTournamentId || !currentTournaments.some((t) => t.tournament_id === selectedTournamentId)) {
        setSelectedTournamentId(currentTournaments[0].tournament_id)
      }
    } else {
      setSelectedTournamentId('')
    }
  }, [currentTournaments, selectedTournamentId])

  useEffect(() => {
    if (currentRounds.length > 0) {
      if (!selectedRoundId || !currentRounds.some((r) => r.round_id === selectedRoundId)) {
        setSelectedRoundId(currentRounds[0].round_id)
      }
    } else {
      setSelectedRoundId('')
    }
  }, [currentRounds, selectedRoundId])

  useEffect(() => {
    if (currentMatches.length > 0) {
      if (!selectedMatchId || !currentMatches.some((m) => m.match_id === selectedMatchId)) {
        setSelectedMatchId(currentMatches[0].match_id)
      }
    } else {
      setSelectedMatchId('')
    }
  }, [currentMatches, selectedMatchId])

  // Reset or initialize adjustment inputs when match changes
  useEffect(() => {
    if (currentMatch) {
      const initial: Record<string, AdjustmentState> = {}
      for (const p of currentMatch.participants) {
        initial[p.player_id] = {
          adjustment: 0,
          reason: 'Placement',
          explanation: '',
        }
      }
      setAdjustments(initial)
    } else {
      setAdjustments({})
    }
  }, [currentMatch?.match_id])

  const handleAdjustmentChange = (
    playerId: string,
    field: keyof AdjustmentState,
    value: any
  ) => {
    setAdjustments((prev) => ({
      ...prev,
      [playerId]: {
        ...(prev[playerId] || { adjustment: 0, reason: 'Placement', explanation: '' }),
        [field]: value,
      },
    }))
  }

  // Active non-zero adjustments for review
  const pendingChanges = useMemo(() => {
    if (!currentMatch) return []
    return currentMatch.participants
      .filter((p) => {
        const adj = adjustments[p.player_id]
        return adj && adj.adjustment !== 0
      })
      .map((p) => {
        const adj = adjustments[p.player_id]
        return {
          player: p,
          adjustment: adj.adjustment,
          reason: adj.reason,
          explanation: adj.explanation,
          projectedRating: Math.max(0, p.current_rating + adj.adjustment),
        }
      })
  }, [currentMatch, adjustments])

  const handleOpenReview = () => {
    setActionError(null)
    if (pendingChanges.length === 0) {
      setActionError('Please enter at least one non-zero rating adjustment.')
      return
    }
    // Validate explanation
    for (const c of pendingChanges) {
      if (!c.explanation.trim()) {
        setActionError(`Please provide a player-visible explanation for ${c.player.display_name}.`)
        return
      }
    }
    setIsReviewOpen(true)
  }

  const handleConfirmBulkAdjustment = async () => {
    if (!currentGame || !currentMatch) return
    setIsSubmitting(true)
    setActionError(null)
    setActionSuccess(null)

    const payload: RatingAdjustmentPayloadItem[] = pendingChanges.map((c) => ({
      player_id: c.player.player_id,
      game_id: currentGame.game_slug,
      adjustment: c.adjustment,
      reason: c.reason,
      explanation: c.explanation.trim(),
      tournament_id: currentTournament?.tournament_id,
      round_id: currentRound?.round_id,
      match_id: currentMatch.match_id,
    }))

    try {
      const res = await adjustRatingsBulk(payload)
      setActionSuccess(res.message || 'Rating adjustments applied successfully!')
      setIsReviewOpen(false)

      // Refresh data
      await fetchHierarchy()
      await fetchAuditLogs()
      if (onRatingUpdated) onRatingUpdated()
      window.dispatchEvent(new CustomEvent('ametheus:rating_updated'))
    } catch (err: any) {
      setActionError(err.message || 'Failed to submit rating adjustments')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmReversal = async () => {
    if (!reversingLog) return
    setIsReversing(true)
    setActionError(null)
    setActionSuccess(null)

    try {
      const res = await reverseRatingAdjustment(
        reversingLog.id || reversingLog._id,
        reversalReason.trim() || undefined
      )
      setActionSuccess(res.message || 'Rating adjustment reversed successfully!')
      setReversingLog(null)
      setReversalReason('')

      await fetchHierarchy()
      await fetchAuditLogs()
      if (onRatingUpdated) onRatingUpdated()
      window.dispatchEvent(new CustomEvent('ametheus:rating_updated'))
    } catch (err: any) {
      setActionError(err.message || 'Failed to reverse rating adjustment')
    } finally {
      setIsReversing(false)
    }
  }

  return (
    <div className="space-y-10">
      {/* SECTION HEADER */}
      <div className="border border-cyan/30 bg-surface/80 p-6 relative">
        <Brackets />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Hud className="text-cyan text-xs font-bold uppercase tracking-widest">
              Authoritative Rating Management
            </Hud>
            <h2 className="mt-1 font-display text-2xl font-black uppercase text-white tracking-wide">
              Tournament Rating Assignment
            </h2>
            <p className="mt-1 font-mono text-xs text-dim max-w-2xl">
              Manual administrative control for assigning exact, auditable rating points (+/-)
              to match contenders. Starting initial rating is strictly 500 per competitive game.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              fetchHierarchy()
              fetchAuditLogs()
            }}
            className="border border-white/20 bg-surface/60 px-4 py-2 font-mono text-xs uppercase tracking-wider text-white hover:border-cyan hover:text-cyan transition-colors"
          >
            ↻ Refresh Hierarchy
          </button>
        </div>

        {actionSuccess && (
          <div className="mt-4 border border-emerald-500/40 bg-emerald-950/30 p-3 font-mono text-xs text-emerald-400">
            ✓ {actionSuccess}
          </div>
        )}
        {actionError && (
          <div className="mt-4 border border-rose-500/40 bg-rose-950/30 p-3 font-mono text-xs text-rose-400">
            ⚠ {actionError}
          </div>
        )}
      </div>

      {loading ? (
        <div className="border border-white/10 bg-surface/40 p-12 text-center font-mono text-sm text-dim animate-pulse">
          Loading platform game and match hierarchy...
        </div>
      ) : hierarchy.length === 0 ? (
        <div className="border border-white/10 bg-surface/30 p-12 text-center">
          <p className="font-mono text-sm text-dim">No active games or tournaments found in the database.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* STEP 1: SELECT GAME */}
          <Panel className="p-6">
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
              <Hud className="text-cyan text-xs">◇ Step 1: Select Competitive Title</Hud>
            </div>
            <div className="flex flex-wrap gap-2">
              {hierarchy.map((g) => {
                const active = g.game_slug === selectedGameSlug
                return (
                  <button
                    key={g.game_slug}
                    type="button"
                    onClick={() => {
                      setSelectedGameSlug(g.game_slug)
                      setSelectedTournamentId('')
                      setSelectedRoundId('')
                      setSelectedMatchId('')
                    }}
                    className={`px-4 py-2 font-display text-sm uppercase font-bold tracking-wider transition-all border ${
                      active
                        ? 'border-cyan bg-cyan/20 text-white shadow-[0_0_15px_rgba(0,242,254,0.2)]'
                        : 'border-white/10 bg-surface/40 text-dim hover:text-white hover:border-white/30'
                    }`}
                  >
                    {g.game_name}
                  </button>
                )
              })}
            </div>
          </Panel>

          {/* STEP 2: SELECT TOURNAMENT */}
          <Panel className="p-6">
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
              <Hud className="text-cyan text-xs">◇ Step 2: Select Tournament</Hud>
            </div>
            {currentTournaments.length === 0 ? (
              <p className="font-mono text-xs text-dim">No tournaments configured for {currentGame?.game_name}.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {currentTournaments.map((t) => {
                  const active = t.tournament_id === selectedTournamentId
                  return (
                    <button
                      key={t.tournament_id}
                      type="button"
                      onClick={() => {
                        setSelectedTournamentId(t.tournament_id)
                        setSelectedRoundId('')
                        setSelectedMatchId('')
                      }}
                      className={`p-4 text-left border transition-all ${
                        active
                          ? 'border-cyan bg-cyan/15 text-white'
                          : 'border-white/10 bg-surface/40 text-dim hover:text-white hover:border-white/30'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-display font-black text-base uppercase text-white truncate">
                          {t.title}
                        </span>
                        <Badge
                          label={t.status}
                          s={t.status === 'LIVE' ? 'active' : t.status === 'COMPLETED' ? 'dim' : 'warning'}
                        />
                      </div>
                      <div className="mt-2 font-mono text-[10px] text-dim">
                        {t.rounds.length} Stage/Round{t.rounds.length === 1 ? '' : 's'}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </Panel>

          {/* STEP 3 & 4: SELECT ROUND AND MATCH */}
          {selectedTournamentId && (
            <div className="grid gap-6 md:grid-cols-2">
              <Panel className="p-6">
                <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
                  <Hud className="text-cyan text-xs">◇ Step 3: Select Stage / Round</Hud>
                </div>
                {currentRounds.length === 0 ? (
                  <p className="font-mono text-xs text-dim">No rounds in this tournament.</p>
                ) : (
                  <div className="space-y-2">
                    {currentRounds.map((r) => {
                      const active = r.round_id === selectedRoundId
                      return (
                        <button
                          key={r.round_id}
                          type="button"
                          onClick={() => {
                            setSelectedRoundId(r.round_id)
                            setSelectedMatchId('')
                          }}
                          className={`w-full p-3 text-left font-mono text-xs uppercase flex items-center justify-between border transition-all ${
                            active
                              ? 'border-cyan bg-cyan/15 text-white font-bold'
                              : 'border-white/10 bg-surface/30 text-dim hover:text-white'
                          }`}
                        >
                          <span>{r.round_name}</span>
                          <span className="text-[10px] text-dim">{r.matches?.length || 0} matches</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </Panel>

              <Panel className="p-6">
                <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
                  <Hud className="text-cyan text-xs">◇ Step 4: Select Match</Hud>
                </div>
                {currentMatches.length === 0 ? (
                  <p className="font-mono text-xs text-dim">No matches found in this round.</p>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin">
                    {currentMatches.map((m) => {
                      const active = m.match_id === selectedMatchId
                      return (
                        <button
                          key={m.match_id}
                          type="button"
                          onClick={() => setSelectedMatchId(m.match_id)}
                          className={`w-full p-3 text-left font-mono text-xs border transition-all flex items-center justify-between ${
                            active
                              ? 'border-cyan bg-cyan/15 text-white font-bold'
                              : 'border-white/10 bg-surface/30 text-dim hover:text-white'
                          }`}
                        >
                          <span className="truncate mr-2">{m.title}</span>
                          <Badge
                            label={m.status}
                            s={m.status === 'COMPLETED' ? 'dim' : m.status === 'LIVE' ? 'active' : 'warning'}
                          />
                        </button>
                      )
                    })}
                  </div>
                )}
              </Panel>
            </div>
          )}

          {/* STEP 5: REVIEW PARTICIPANTS & ASSIGN RATING CHANGES */}
          {selectedMatchId && currentMatch && (
            <Panel className="p-6">
              <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
                <Hud className="text-cyan text-xs">◇ Step 5: Assign Ratings — {currentMatch.title}</Hud>
              </div>
              {currentMatch.participants.length === 0 ? (
                <div className="p-8 text-center border border-white/10 bg-surface/20">
                  <p className="font-mono text-xs text-dim">
                    No confirmed participants registered for this match lobby yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-mono text-xs">
                      <thead>
                        <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-dim">
                          <th className="py-2.5 px-3">Contender</th>
                          <th className="py-2.5 px-3">Team</th>
                          <th className="py-2.5 px-3 text-center">Current Rating</th>
                          <th className="py-2.5 px-3 text-center">Adjustment (+/-)</th>
                          <th className="py-2.5 px-3">Reason Category</th>
                          <th className="py-2.5 px-3">Player Explanation</th>
                          <th className="py-2.5 px-3 text-center">Projected Rating</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {currentMatch.participants.map((p) => {
                          const state = adjustments[p.player_id] || {
                            adjustment: 0,
                            reason: 'Placement',
                            explanation: '',
                          }
                          const projected = Math.max(0, p.current_rating + Number(state.adjustment || 0))
                          return (
                            <tr key={p.player_id} className="hover:bg-white/[0.02]">
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-2.5">
                                  {p.avatar_url ? (
                                    <img
                                      src={resolveMediaUrl(p.avatar_url)}
                                      alt={p.display_name}
                                      className="size-7 rounded-sm object-cover border border-white/10"
                                    />
                                  ) : (
                                    <div className="size-7 rounded-sm bg-white/10 flex items-center justify-center font-bold text-dim">
                                      {p.display_name?.slice(0, 2).toUpperCase() || 'P'}
                                    </div>
                                  )}
                                  <div>
                                    <div className="font-display font-bold uppercase text-white truncate">
                                      {p.display_name}
                                    </div>
                                    <div className="text-[10px] text-dim">@{p.username}</div>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3 px-3 text-dim truncate max-w-[120px]">
                                {p.team_name || 'Solo'}
                              </td>

                              <td className="py-3 px-3 text-center font-display font-black text-sm text-cyan tabular-nums">
                                {p.current_rating}
                              </td>

                              <td className="py-3 px-3 text-center">
                                <input
                                  type="number"
                                  value={state.adjustment}
                                  onChange={(e) =>
                                    handleAdjustmentChange(
                                      p.player_id,
                                      'adjustment',
                                      parseInt(e.target.value, 10) || 0
                                    )
                                  }
                                  className="w-20 px-2 py-1.5 text-center font-mono text-xs bg-void border border-white/20 focus:border-cyan text-white rounded-xs outline-none"
                                  placeholder="0"
                                />
                              </td>

                              <td className="py-3 px-3">
                                <select
                                  value={state.reason}
                                  onChange={(e) =>
                                    handleAdjustmentChange(p.player_id, 'reason', e.target.value)
                                  }
                                  className="px-2.5 py-1.5 font-mono text-xs bg-void border border-white/20 text-white rounded-xs outline-none focus:border-cyan"
                                >
                                  {REASONS.map((r) => (
                                    <option key={r} value={r}>
                                      {r}
                                    </option>
                                  ))}
                                </select>
                              </td>

                              <td className="py-3 px-3">
                                <input
                                  type="text"
                                  value={state.explanation}
                                  onChange={(e) =>
                                    handleAdjustmentChange(p.player_id, 'explanation', e.target.value)
                                  }
                                  placeholder="Visible to player in rating history..."
                                  className="w-full min-w-[200px] px-2.5 py-1.5 font-mono text-xs bg-void border border-white/20 focus:border-cyan text-white rounded-xs outline-none"
                                />
                              </td>

                              <td className="py-3 px-3 text-center font-display font-black text-sm tabular-nums">
                                <span
                                  className={
                                    projected > p.current_rating
                                      ? 'text-emerald-400'
                                      : projected < p.current_rating
                                      ? 'text-rose-400'
                                      : 'text-dim'
                                  }
                                >
                                  {projected}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="pt-4 flex items-center justify-between border-t border-white/10">
                    <div className="font-mono text-xs text-dim">
                      {pendingChanges.length} contender{pendingChanges.length === 1 ? '' : 's'} queued with
                      rating adjustments.
                    </div>
                    <Cta
                      onClick={handleOpenReview}
                      disabled={pendingChanges.length === 0}
                      className="px-6 py-2.5 font-mono text-xs uppercase tracking-wider"
                    >
                      Review & Confirm Changes →
                    </Cta>
                  </div>
                </div>
              )}
            </Panel>
          )}

          {/* AUDIT LOGS & REVERSAL HISTORY */}
          <Panel className="p-6">
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
              <Hud className="text-cyan text-xs">◇ Authoritative Rating Audit Logs & Historical Reversals</Hud>
            </div>
            {loadingLogs ? (
              <div className="p-6 text-center font-mono text-xs text-dim animate-pulse">
                Loading audit trail...
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="p-6 text-center font-mono text-xs text-dim">
                No rating adjustments recorded for this title yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-dim">
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Player</th>
                      <th className="py-2 px-3">Tournament / Event</th>
                      <th className="py-2 px-3 text-center">Adjustment</th>
                      <th className="py-2 px-3 text-center">Previous → New</th>
                      <th className="py-2 px-3">Reason & Explanation</th>
                      <th className="py-2 px-3">Admin</th>
                      <th className="py-2 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {auditLogs.map((log) => {
                      const dt = log.created_at
                        ? new Date(log.created_at).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'
                      const isRev = Boolean(log.is_reversal)
                      const isReversed = Boolean(log.is_reversed)
                      return (
                        <tr key={log.id || log._id} className="hover:bg-white/[0.02]">
                          <td className="py-2.5 px-3 text-dim whitespace-nowrap">{dt}</td>
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-white uppercase">
                              {log.player_display_name || log.player_username || log.player_id}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-dim">
                            {log.tournament_name || log.tournament_id || 'Direct Adjustment'}
                            {log.round_name ? ` · ${log.round_name}` : ''}
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold">
                            <span
                              className={`px-2 py-0.5 rounded-xs ${
                                log.adjustment > 0
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : log.adjustment < 0
                                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                  : 'text-dim'
                              }`}
                            >
                              {log.adjustment > 0 ? `+${log.adjustment}` : log.adjustment}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center text-dim font-bold tabular-nums">
                            {log.previous_rating} → <span className="text-white">{log.new_rating}</span>
                          </td>
                          <td className="py-2.5 px-3 max-w-[240px]">
                            <div className="font-bold text-cyan text-[10px] uppercase">{log.reason}</div>
                            <div className="text-dim truncate text-[11px]">{log.explanation}</div>
                          </td>
                          <td className="py-2.5 px-3 text-dim text-[11px]">
                            {log.admin_username || 'Admin'}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {isRev ? (
                              <Badge label="REVERSAL" s="dim" />
                            ) : isReversed ? (
                              <Badge label="REVERSED" s="warning" />
                            ) : (
                              <button
                                type="button"
                                onClick={() => setReversingLog(log)}
                                className="px-2.5 py-1 font-mono text-[10px] uppercase font-bold tracking-wider text-rose-400 border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500 hover:text-white transition-colors"
                              >
                                Reversal
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>
      )}

      {/* REVIEW & CONFIRMATION MODAL */}
      {isReviewOpen && (
        <Modal
          title="Review Proposed Rating Adjustments"
          onClose={() => setIsReviewOpen(false)}
        >
          <div className="space-y-6">
            <p className="font-mono text-xs text-dim">
              The following rating changes will be committed to the authoritative player database and
              immutable audit logs. These will immediately update contender leaderboards and player profiles.
            </p>

            <div className="border border-white/10 bg-void/80 max-h-64 overflow-y-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] uppercase text-dim">
                    <th className="p-2">Player</th>
                    <th className="p-2 text-center">Previous</th>
                    <th className="p-2 text-center">Change</th>
                    <th className="p-2 text-center">New</th>
                    <th className="p-2">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {pendingChanges.map((c) => (
                    <tr key={c.player.player_id}>
                      <td className="p-2 font-bold text-white">{c.player.display_name}</td>
                      <td className="p-2 text-center text-dim">{c.player.current_rating}</td>
                      <td className="p-2 text-center font-bold">
                        <span className={c.adjustment > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {c.adjustment > 0 ? `+${c.adjustment}` : c.adjustment}
                        </span>
                      </td>
                      <td className="p-2 text-center font-bold text-cyan">{c.projectedRating}</td>
                      <td className="p-2 text-dim truncate max-w-[150px]">{c.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsReviewOpen(false)}
                disabled={isSubmitting}
                className="px-4 py-2 font-mono text-xs uppercase tracking-wider text-dim hover:text-white border border-white/10"
              >
                Cancel
              </button>
              <Cta
                onClick={handleConfirmBulkAdjustment}
                disabled={isSubmitting}
                className="px-6 py-2 font-mono text-xs uppercase tracking-wider"
              >
                {isSubmitting ? 'Committing Changes...' : 'Confirm & Apply Adjustments'}
              </Cta>
            </div>
          </div>
        </Modal>
      )}

      {/* COMPENSATING REVERSAL MODAL */}
      {reversingLog && (
        <Modal
          title={`Reverse Rating Adjustment #${reversingLog.id?.slice(0, 8)}`}
          onClose={() => setReversingLog(null)}
        >
          <div className="space-y-4 font-mono text-xs">
            <p className="text-dim">
              This will perform an auditable compensating transaction for{' '}
              <strong className="text-white">{reversingLog.player_display_name || reversingLog.player_username}</strong>.
            </p>
            <div className="border border-white/10 bg-void p-3 space-y-1">
              <div>
                Original Adjustment:{' '}
                <strong className={reversingLog.adjustment > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {reversingLog.adjustment > 0 ? `+${reversingLog.adjustment}` : reversingLog.adjustment}
                </strong>
              </div>
              <div>
                Compensating Adjustment:{' '}
                <strong className={reversingLog.adjustment > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                  {-reversingLog.adjustment > 0 ? `+${-reversingLog.adjustment}` : -reversingLog.adjustment}
                </strong>
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase text-dim mb-1">
                Correction Explanation (Player-Visible)
              </label>
              <input
                type="text"
                value={reversalReason}
                onChange={(e) => setReversalReason(e.target.value)}
                placeholder="e.g. Administrative scoring correction"
                className="w-full px-3 py-2 bg-void border border-white/20 focus:border-cyan text-white outline-none rounded-xs"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setReversingLog(null)}
                disabled={isReversing}
                className="px-4 py-2 font-mono text-xs uppercase tracking-wider text-dim hover:text-white border border-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReversal}
                disabled={isReversing}
                className="px-6 py-2 font-mono text-xs uppercase tracking-wider bg-rose-600 hover:bg-rose-500 text-white font-bold transition-colors"
              >
                {isReversing ? 'Processing Reversal...' : 'Confirm Reversal'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
