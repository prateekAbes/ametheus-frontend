import { useRef, useState, type KeyboardEvent, type ClipboardEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { Container, Hud, Cta, Crest, Avatar, Panel, Brackets, Badge } from '../components/ui'
import { gameBy } from '../lib/data'
import { joinTeamByCode, type Team } from '../services/teams'
import { useAuthContext } from '../context/AuthContext'

export default function JoinTeam() {
  const navigate = useNavigate()
  const { isSignedIn, profile } = useAuthContext()

  const [code, setCode] = useState('')
  const [gameHandle, setGameHandle] = useState('')
  const [joinedTeam, setJoinedTeam] = useState<Team | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return

    setIsLoading(true)
    setErrorMessage('')
    try {
      const res = await joinTeamByCode({
        invite_code: code.trim().toUpperCase(),
        game_handle: gameHandle.trim() || profile?.username || undefined,
      })
      setJoinedTeam(res)
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Invalid or expired invite code. Please check with your captain.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-void pb-28 pt-32">
      <Container className="max-w-3xl">
        <Hud className="text-violet">◇ Squad up</Hud>
        <h1 className="reveal mt-3 font-display text-[clamp(3rem,10vw,8rem)] font-black uppercase leading-[0.85]">
          Join a team
        </h1>

        {errorMessage && (
          <div className="mt-6 border border-live/40 bg-live/10 p-4 font-mono text-xs text-live">
            {errorMessage}
          </div>
        )}

        {!joinedTeam ? (
          <form className="page-in mt-12 space-y-6" onSubmit={handleJoin}>
            <div>
              <Hud>Team Invite Code</Hud>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. AMT-7X4Q"
                required
                className="mt-2 h-16 w-full border border-white/20 bg-surface px-6 font-mono text-2xl uppercase tracking-wider outline-none transition-colors focus:border-cyan focus:shadow-[0_0_24px_-6px_#3ef2ff]"
              />
              <p className="mt-2 text-xs text-dim">
                Ask your team captain for the squad's unique invite code.
              </p>
            </div>

            <div>
              <Hud>Your In-Game Name / UID (Optional)</Hud>
              <input
                type="text"
                value={gameHandle}
                onChange={(e) => setGameHandle(e.target.value)}
                placeholder="e.g. Vyrus#1234 or Game UID"
                className="mt-2 h-14 w-full border border-white/15 bg-surface px-6 font-mono text-sm outline-none transition-colors focus:border-cyan"
              />
            </div>

            <div className="pt-4 flex gap-4 items-center">
              <Cta type="submit" disabled={isLoading || !code.trim()}>
                {isLoading ? 'Verifying Code...' : 'Join Squad'}
              </Cta>
              <Link
                to="/teams"
                className="border border-white/10 px-5 py-3 font-mono text-xs uppercase tracking-wider text-dim hover:text-ink"
              >
                Cancel
              </Link>
            </div>
          </form>
        ) : (
          <div className="page-in mt-12 border border-ok/30 bg-ok/[0.04] p-8 text-center md:p-14">
            <span className="mx-auto grid size-16 place-items-center border border-ok text-3xl text-ok">
              ✓
            </span>
            <div className="mt-6">
              <Badge s="confirmed" label="Roster Joined" />
            </div>
            <h2 className="mt-4 font-display text-5xl font-black uppercase">
              Welcome to {joinedTeam.name}
            </h2>
            <p className="mx-auto mt-3 max-w-sm text-dim">
              You are now an official member of the squad roster [{joinedTeam.tag}]. Your captain has been notified.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Cta to="/teams" small>
                View My Team Hub
              </Cta>
              <Cta to="/tournaments" small ghost>
                Browse Tournaments
              </Cta>
            </div>
          </div>
        )}
      </Container>
    </div>
  )
}
