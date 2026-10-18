import React, { useState, useEffect } from 'react'
import { Portal } from '../Modal'
import { Brackets } from '../ui'
import type { ApiMatch } from '../../services/matches'

interface EditLobbyCredentialsModalProps {
  match: ApiMatch | null
  tournamentTitle?: string
  isOpen: boolean
  onClose: () => void
  onSave: (payload: { room_id?: string; room_password?: string; custom_instructions?: string }) => Promise<void>
}

export const EditLobbyCredentialsModal: React.FC<EditLobbyCredentialsModalProps> = ({
  match,
  tournamentTitle,
  isOpen,
  onClose,
  onSave,
}) => {
  const [roomId, setRoomId] = useState('')
  const [roomPassword, setRoomPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [customInstructions, setCustomInstructions] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (match) {
      setRoomId(match.room_id || match.lobby_code || '')
      setRoomPassword(match.room_password || match.lobby_password || '')
      setCustomInstructions(match.custom_instructions || '')
      setShowPassword(false)
      setErrorMsg(null)
    }
  }, [match])

  if (!isOpen || !match) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMsg(null)
    try {
      await onSave({
        room_id: roomId.trim() || undefined,
        room_password: roomPassword.trim() || undefined,
        custom_instructions: customInstructions.trim() || undefined,
      })
      onClose()
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to save lobby credentials.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isReleased = Boolean(match.credentials_released)

  return (
    <Portal lockScroll>
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-[100] flex items-center justify-center bg-void/85 p-3 sm:p-6 backdrop-blur-md overflow-hidden select-none"
      >
        <div className="relative w-full max-w-lg border border-cyan/50 bg-graphite p-6 max-h-[min(90vh,calc(100svh-2rem))] overflow-y-auto select-text shadow-2xl">
          <Brackets color="border-cyan/50" />

          {/* Header */}
          <div className="border-b border-white/10 pb-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest text-cyan font-bold">
                {tournamentTitle || 'Tournament'} • Lobby Setup
              </span>
              <span
                className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 border ${
                  isReleased
                    ? 'border-ok/40 bg-ok/10 text-ok'
                    : 'border-warn/40 bg-warn/10 text-warn'
                }`}
              >
                {isReleased ? '📢 Released to Players' : '🔒 Confidential (Draft)'}
              </span>
            </div>
            <h3 className="font-display text-2xl font-black uppercase text-ink mt-1">
              🔑 Edit Lobby Credentials
            </h3>
            <p className="text-xs text-dim mt-1 font-mono">
              Match #{match.match_number || 1} • {match.round_name || match.stage || 'Round 1'}
            </p>
          </div>

          {/* Explanation note */}
          <div className="mt-3 p-2.5 bg-void/60 border border-white/5 text-[11px] font-mono text-dim leading-relaxed">
            <strong className="text-ink">Confidentiality Protocol:</strong> Saving credentials here stores them safely in the backend. Registered participants will only see Room ID and Password once you explicitly release credentials.
          </div>

          {errorMsg && (
            <div className="mt-3 p-2.5 bg-live/15 border border-live/40 text-live text-xs font-mono">
              {errorMsg}
            </div>
          )}

          {/* Clean Focused Form */}
          <form onSubmit={handleSubmit} className="mt-4 space-y-4 font-mono text-xs">
            {/* Room ID */}
            <div>
              <label className="block text-dim uppercase mb-1 font-bold">
                Room ID / Custom Lobby Code
              </label>
              <input
                type="text"
                placeholder="e.g. AMT-BR-ROOM-01"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full border border-white/20 bg-surface px-3 py-2 text-ink outline-none focus:border-cyan font-mono text-sm font-bold text-cyan placeholder:text-dim/40"
              />
            </div>

            {/* Room Password with Toggleable Visibility */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-dim uppercase font-bold">Room Password / PIN</label>
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="text-[11px] text-cyan hover:text-ink underline cursor-pointer"
                >
                  {showPassword ? '🙈 Hide Password' : '👁 Show Password'}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="e.g. 7894"
                  value={roomPassword}
                  onChange={(e) => setRoomPassword(e.target.value)}
                  className="w-full border border-white/20 bg-surface px-3 py-2 text-ink outline-none focus:border-cyan font-mono text-sm font-bold text-warn placeholder:text-dim/40"
                />
              </div>
            </div>

            {/* Custom Join Instructions */}
            <div>
              <label className="block text-dim uppercase mb-1 font-bold">
                Custom Join Instructions (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Map: Erangel, TPP Squads. Team Slots 1-25 strictly assigned. Join within 10 minutes of release."
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                className="w-full border border-white/20 bg-surface px-3 py-2 text-ink outline-none focus:border-cyan text-xs leading-relaxed placeholder:text-dim/40"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="border border-white/20 px-4 py-2 uppercase text-dim hover:text-ink cursor-pointer transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="border border-cyan bg-cyan px-5 py-2 uppercase text-xs font-bold text-void hover:bg-cyan/90 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Credentials'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  )
}

export default EditLobbyCredentialsModal
