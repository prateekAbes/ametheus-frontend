import { useState, useRef } from 'react'
import { submitMatchResult } from '../../services/matches'
import { optimizeImageForUpload } from '../../utils/imageOptimizer'
import { Brackets, Hud, Modal } from '../ui'

interface Props {
  match: any | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function EvidenceSubmissionModal({ match, isOpen, onClose, onSuccess }: Props) {
  const [scoreA, setScoreA] = useState('13')
  const [scoreB, setScoreB] = useState('9')
  const [notes, setNotes] = useState('Official game completed on AWS Mumbai server.')
  const [evidenceUrl, setEvidenceUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen || !match) return null

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 20 * 1024 * 1024) {
      alert('Screenshot exceeds 20MB limit.')
      return
    }
    const optimized = await optimizeImageForUpload(file, { maxDimension: 1920, maxSizeBytes: 800 * 1024 })
    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      setEvidenceUrl(result)
    }
    reader.readAsDataURL(optimized)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMessage('')
    try {
      await submitMatchResult(match.id, {
        score_a: parseInt(scoreA, 10) || 0,
        score_b: parseInt(scoreB, 10) || 0,
        evidence_url: evidenceUrl || undefined,
      })
      setIsSubmitted(true)
      setTimeout(() => {
        setIsSubmitted(false)
        onSuccess()
        onClose()
      }, 1500)
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to submit match score. Please check connection.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const teamAName = match.a || match.team_a?.name || match.team1_name || 'Team A'
  const teamBName = match.b || match.team_b?.name || match.team2_name || 'Team B'

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      raw
      maxWidth="max-w-xl"
    >
      <div className="relative w-full flex flex-col">

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-surface/80 p-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-cyan/40 bg-cyan/10 text-cyan text-[10px] font-mono font-bold tracking-wider uppercase">
              RESULT EVIDENCE AUDIT
            </div>
            <h3 className="font-display text-xl font-black uppercase text-ink mt-1">
              Submit Match Score &amp; Proof
            </h3>
            <p className="font-mono text-xs text-dim">
              {match.round || match.stage || 'Match Stage'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-dim hover:text-ink hover:bg-white/10 border border-transparent hover:border-white/20 transition-colors cursor-pointer font-mono text-sm"
          >
            ✕
          </button>
        </div>

        {isSubmitted ? (
          <div className="p-8 flex flex-col items-center text-center space-y-4">
            <div className="size-16 rounded-full bg-ok/10 border border-ok/40 flex items-center justify-center text-ok font-display text-2xl font-black">
              ✓
            </div>
            <h4 className="font-display text-xl font-black uppercase text-ink">
              Evidence Logged in Audit Vault
            </h4>
            <p className="font-mono text-xs text-dim max-w-md leading-relaxed">
              Match score recorded. Platform arbiters will review the submission screenshot and advance the tournament bracket tree.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5 font-mono text-xs">
            {errorMessage && (
              <div className="p-3 border border-live/40 bg-live/10 text-live text-xs">
                {errorMessage}
              </div>
            )}

            {/* Score Inputs */}
            <div>
              <label className="block text-xs uppercase text-dim mb-2 font-bold tracking-wider">
                Final Match Score
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-white/10 bg-void/60 p-3">
                  <div className="text-xs font-bold text-ink mb-1 truncate">{teamAName}</div>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={scoreA}
                    onChange={(e) => setScoreA(e.target.value)}
                    required
                    className="w-full border border-white/20 bg-surface px-3 py-2 text-xl font-display font-black text-cyan outline-none focus:border-cyan"
                  />
                </div>
                <div className="border border-white/10 bg-void/60 p-3">
                  <div className="text-xs font-bold text-ink mb-1 truncate">{teamBName}</div>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={scoreB}
                    onChange={(e) => setScoreB(e.target.value)}
                    required
                    className="w-full border border-white/20 bg-surface px-3 py-2 text-xl font-display font-black text-cyan outline-none focus:border-cyan"
                  />
                </div>
              </div>
            </div>

            {/* Screenshot Evidence Upload */}
            <div>
              <label className="block text-xs uppercase text-dim mb-2 font-bold tracking-wider">
                Scoreboard Screenshot / Media Proof
              </label>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/20 hover:border-cyan bg-void/40 p-4 text-center cursor-pointer transition-colors"
              >
                {evidenceUrl ? (
                  <div className="flex flex-col items-center gap-2">
                    <img
                      src={evidenceUrl}
                      alt="Match Scoreboard Evidence"
                      className="max-h-32 border border-white/20 object-contain shadow-md"
                    />
                    <span className="text-xs text-ok font-bold">✓ Screenshot Attached</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEvidenceUrl('')
                      }}
                      className="text-[10px] text-live hover:underline cursor-pointer"
                    >
                      Remove Screenshot
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="text-xl mb-1 text-cyan font-bold">📤</div>
                    <div className="text-xs font-bold text-ink mb-0.5">
                      Click to upload in-game scoreboard screenshot
                    </div>
                    <div className="text-[10px] text-dim">
                      PNG, JPG, WEBP up to 20MB • Must clearly show final round score and participant roster
                    </div>
                  </>
                )}
              </div>
              <div className="mt-2">
                <input
                  type="url"
                  placeholder="Or paste external screenshot link (Imgur / Cloudflare / Discord CDN)"
                  value={evidenceUrl.startsWith('data:') ? '' : evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  className="w-full border border-white/10 bg-void/60 px-3 py-1.5 text-xs text-ink outline-none placeholder:text-dim/60 focus:border-cyan"
                />
              </div>
            </div>

            {/* Captain Observations */}
            <div>
              <label className="block text-xs uppercase text-dim mb-1 font-bold tracking-wider">
                Captain Observations / Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border border-white/10 bg-void/60 p-3 text-xs text-ink outline-none focus:border-cyan"
                placeholder="Game observations, technical issues, server details..."
              />
            </div>

            {/* Anti-Fraud Note */}
            <div className="border border-warn/30 bg-warn/10 p-3 text-[10px] text-warn leading-relaxed">
              Submitting falsified or altered score evidence violates the Ametheus Fair Play Code and results in immediate forfeiture and anti-cheat suspension.
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="border border-white/20 bg-surface px-4 py-2 uppercase text-xs text-dim hover:text-ink cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="border border-cyan bg-cyan px-5 py-2 uppercase text-xs font-bold text-void hover:bg-cyan/90 transition-colors cursor-pointer"
              >
                {isSubmitting ? 'Transmitting...' : 'Confirm & Transmit Score'}
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  )
}
