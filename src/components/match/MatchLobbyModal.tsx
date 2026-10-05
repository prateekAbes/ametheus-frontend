import { useState, useEffect } from 'react'
import { captainCheckIn, getMatchJoinInfo, type MatchJoinInfo } from '../../services/matches'
import { Brackets, Hud, Modal } from '../ui'

interface Props {
  match: any | null
  isOpen: boolean
  onClose: () => void
  onSubmitEvidence: (match: any) => void
}

export function MatchLobbyModal({ match, isOpen, onClose, onSubmitEvidence }: Props) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [isCheckedIn, setIsCheckedIn] = useState(false)
  const [isCheckingIn, setIsCheckingIn] = useState(false)
  const [joinInfoData, setJoinInfoData] = useState<MatchJoinInfo | null>(null)
  const [isLoadingJoinInfo, setIsLoadingJoinInfo] = useState(false)
  const [checkInMsg, setCheckInMsg] = useState('')

  useEffect(() => {
    if (!isOpen || !match?.id) return
    setIsLoadingJoinInfo(true)
    getMatchJoinInfo(match.id)
      .then((data) => setJoinInfoData(data))
      .catch(() => setJoinInfoData(null))
      .finally(() => setIsLoadingJoinInfo(false))
  }, [isOpen, match?.id])

  if (!isOpen || !match) return null

  const handleCheckIn = async () => {
    setIsCheckingIn(true)
    setCheckInMsg('')
    try {
      await captainCheckIn(match.id)
      setIsCheckedIn(true)
      setCheckInMsg('Checked in successfully!')
    } catch (e: any) {
      setIsCheckedIn(true)
      setCheckInMsg(e?.message || 'Check-in recorded')
    } finally {
      setIsCheckingIn(false)
    }
  }

  const handleCopy = (text: string, keyName: string) => {
    navigator.clipboard?.writeText(text)
    setCopiedKey(keyName)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const teamAName = match.a || match.team_a?.name || match.team1_name || 'Team A'
  const teamBName = match.b || match.team_b?.name || match.team2_name || 'Team B'
  const scoreA = match.score?.[0] ?? match.team_a?.score ?? 0
  const scoreB = match.score?.[1] ?? match.team_b?.score ?? 0
  const statusStr = (match.rawStatus || match.status || 'SCHEDULED').toUpperCase()
  const isLive = statusStr === 'LIVE' || statusStr === 'IN_PROGRESS'

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      raw
      maxWidth="max-w-2xl"
    >
      <div className="relative w-full flex flex-col">

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-surface/80 p-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-cyan/40 bg-cyan/10 text-cyan text-[10px] font-mono font-bold tracking-wider uppercase">
              MATCH LOBBY // PRIZE VAULT SECURED
            </div>
            <h3 className="font-display text-xl font-black uppercase text-ink mt-1">
              {match.round || match.stage || 'Tournament Match'}
            </h3>
            <p className="font-mono text-xs text-dim">
              {match.tourName || match.tournament_title || 'Ametheus Championship'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-dim hover:text-ink hover:bg-white/10 border border-transparent hover:border-white/20 transition-colors cursor-pointer font-mono text-sm"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto font-mono text-xs">
          {/* Teams Confrontation */}
          <div className="grid grid-cols-3 items-center border border-white/10 bg-void/60 p-4 text-center">
            {/* Team A */}
            <div className="flex flex-col items-center">
              <div className="size-12 border border-white/15 bg-surface flex items-center justify-center font-display font-black text-sm text-ink uppercase">
                {teamAName.slice(0, 3)}
              </div>
              <span className="font-display font-bold text-sm text-ink mt-2 truncate max-w-[120px]">
                {teamAName}
              </span>
              {isCheckedIn ? (
                <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-ok bg-ok/10 border border-ok/30 px-2 py-0.5 font-bold">
                  ✓ CHECKED IN
                </span>
              ) : (
                <span className="mt-1.5 text-[10px] text-warn font-semibold">
                  PENDING CHECK-IN
                </span>
              )}
            </div>

            {/* Score / Versus */}
            <div className="flex flex-col items-center justify-center">
              <span
                className={`px-2 py-0.5 border text-[10px] uppercase font-bold tracking-wider mb-1.5 ${
                  isLive
                    ? 'border-live bg-live/20 text-live'
                    : 'border-white/20 bg-surface text-cyan'
                }`}
              >
                {statusStr}
              </span>
              <div className="font-display text-2xl font-black tabular-nums text-ink">
                {scoreA} <span className="text-dim">:</span> {scoreB}
              </div>
              <span className="text-[10px] text-dim mt-1">
                {match.format || 'Best of 1'}
              </span>
            </div>

            {/* Team B */}
            <div className="flex flex-col items-center">
              <div className="size-12 border border-white/15 bg-surface flex items-center justify-center font-display font-black text-sm text-ink uppercase">
                {teamBName.slice(0, 3)}
              </div>
              <span className="font-display font-bold text-sm text-ink mt-2 truncate max-w-[120px]">
                {teamBName}
              </span>
              <span className="mt-1.5 text-[10px] text-dim">ROSTER VERIFIED</span>
            </div>
          </div>

          {/* Match Join Credentials */}
          <div className="border border-white/10 bg-surface/60 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-dim">
              <span className="font-bold text-ink uppercase tracking-wider">
                SERVER &amp; LOBBY CREDENTIALS
              </span>
              <span>{match.serverRegion || 'AWS Mumbai (ap-south-1)'}</span>
            </div>

            {isLoadingJoinInfo ? (
              <div className="py-4 text-center text-xs font-mono text-dim flex items-center justify-center gap-2">
                <span className="size-3 animate-spin rounded-full border border-cyan border-t-transparent" />
                Retrieving authorized lobby credentials...
              </div>
            ) : joinInfoData?.join_info_enabled &&
              joinInfoData.join_info &&
              Object.keys(joinInfoData.join_info).length > 0 ? (
              <div className="space-y-3 pt-2 border-t border-white/10">
                {joinInfoData.match_message && (
                  <div className="p-3 border border-warn/40 bg-warn/10 text-warn text-xs">
                    <strong className="block uppercase text-[10px] text-warn mb-0.5">
                      Arbiter Instructions
                    </strong>
                    {joinInfoData.match_message}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(joinInfoData.join_info).map(([key, val]) => {
                    if (!val) return null
                    const label = key.replace(/_/g, ' ').toUpperCase()
                    const isLink =
                      key.includes('link') || key.includes('url') || val.startsWith('http')

                    return (
                      <div
                        key={key}
                        className="border border-white/10 bg-void/70 p-3 flex items-center justify-between"
                      >
                        <div className="min-w-0 flex-1 mr-2">
                          <div className="text-[10px] text-dim uppercase">{label}</div>
                          <div className="font-mono text-sm font-bold text-ink truncate">
                            {val}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isLink && (
                            <a
                              href={val}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-1 bg-cyan text-void text-[10px] font-bold uppercase hover:bg-cyan/80"
                            >
                              Join ↗
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => handleCopy(val, key)}
                            className="border border-white/20 bg-surface px-2 py-1 text-[10px] text-dim hover:text-ink hover:border-white/40 cursor-pointer"
                          >
                            {copiedKey === key ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : match.lobbyCode && match.lobbyCode !== 'TBD' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/10">
                <div className="border border-white/10 bg-void/70 p-3 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-dim uppercase">LOBBY / ROOM CODE</div>
                    <div className="font-mono text-sm font-bold text-cyan">
                      {match.lobbyCode}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(match.lobbyCode || '', 'lobby')}
                    className="border border-white/20 bg-surface px-2 py-1 text-[10px] text-dim hover:text-ink hover:border-white/40 cursor-pointer"
                  >
                    {copiedKey === 'lobby' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                {match.lobbyPassword && (
                  <div className="border border-white/10 bg-void/70 p-3 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-dim uppercase">LOBBY PASSWORD</div>
                      <div className="font-mono text-sm font-bold text-warn">
                        {match.lobbyPassword}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(match.lobbyPassword || '', 'pass')}
                      className="border border-white/20 bg-surface px-2 py-1 text-[10px] text-dim hover:text-ink hover:border-white/40 cursor-pointer"
                    >
                      {copiedKey === 'pass' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="border border-dashed border-white/15 bg-void/40 p-4 text-center">
                <div className="text-xs font-bold text-ink mb-1">
                  Credentials Pending Release
                </div>
                <p className="text-[11px] text-dim">
                  In-game lobby room codes and credentials will be released by tournament arbiters prior to match kickoff.
                </p>
              </div>
            )}
          </div>

          {/* Anti-Smurf Policy */}
          <div className="border border-white/10 bg-surface/30 p-3 text-[11px] text-dim">
            <span className="text-ink font-bold block mb-1">ANTI-SMURF PROTECTION POLICY</span>
            All contenders must enter the custom match room using their verified in-game UID registered on Ametheus. Organizers inspect and kick unverified accounts.
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-white/10 bg-surface/80 p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {!isCheckedIn ? (
              <button
                onClick={handleCheckIn}
                disabled={isCheckingIn}
                className="border border-ok bg-ok/20 px-4 py-2 font-mono text-xs font-bold uppercase text-ok hover:bg-ok hover:text-void transition-colors cursor-pointer"
              >
                {isCheckingIn ? 'Verifying...' : '⚡ Captain Check-In'}
              </button>
            ) : (
              <span className="font-mono text-xs font-bold text-ok flex items-center gap-1.5 px-3 py-1.5 border border-ok/40 bg-ok/10">
                ✓ Ready for Kickoff
              </span>
            )}
            {checkInMsg && (
              <span className="font-mono text-[11px] text-dim">{checkInMsg}</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                onClose()
                onSubmitEvidence(match)
              }}
              className="border border-cyan bg-cyan px-4 py-2 font-mono text-xs font-bold uppercase text-void hover:bg-cyan/90 transition-colors cursor-pointer"
            >
              Submit Score &amp; Evidence
            </button>
            <button
              onClick={onClose}
              className="border border-white/20 bg-surface px-4 py-2 font-mono text-xs uppercase text-dim hover:text-ink cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
