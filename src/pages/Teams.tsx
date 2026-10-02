import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { Container, Hud, Crest, Avatar, MatchCard, Panel, Brackets, Stat, Particles } from '../components/ui'
import { SQUAD, MATCHES, TOURNAMENTS, AVATARS, gameBy } from '../lib/data'
import { getMyTeams, leaveTeam, deleteTeam, type Team } from '../services/teams'
import { useAuthContext } from '../context/AuthContext'

export default function Teams() {
  const { profile, isSignedIn } = useAuthContext()
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeamIndex, setSelectedTeamIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchTeams = () => {
    if (!isSignedIn) {
      setTeams([])
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    getMyTeams()
      .then((data) => {
        if (Array.isArray(data)) {
          setTeams(data)
        }
      })
      .catch((err) => {
        console.warn('Error fetching teams:', err)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  useEffect(() => {
    fetchTeams()
  }, [isSignedIn])

  const activeTeam = teams[selectedTeamIndex] || null
  const hasTeam = !!activeTeam

  const inviteCode = activeTeam?.invite_code || 'AMT-7X4Q'
  const copy = () => {
    navigator.clipboard?.writeText(inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  const handleLeaveOrDelete = async () => {
    if (!activeTeam) return
    const isCaptain = activeTeam.captain_id === profile?.id
    const confirmText = isCaptain
      ? `Are you sure you want to disband ${activeTeam.name}? This will delete the team for all members.`
      : `Are you sure you want to leave ${activeTeam.name}?`

    if (!window.confirm(confirmText)) return

    setActionLoading(true)
    try {
      if (isCaptain) {
        await deleteTeam(activeTeam.id || (activeTeam as any)._id)
      } else {
        await leaveTeam(activeTeam.id || (activeTeam as any)._id)
      }
      fetchTeams()
      setSelectedTeamIndex(0)
    } catch (err: any) {
      alert(err.message || 'Action failed')
    } finally {
      setActionLoading(false)
    }
  }

  // Active roster
  const mainMembers = activeTeam?.members?.filter((m) => m.role !== 'SUBSTITUTE') || []
  const subMembers = activeTeam?.members?.filter((m) => m.role === 'SUBSTITUTE') || []

  // Upcoming matches for active team
  const upcoming = MATCHES.filter(
    (m) => (m.a === (activeTeam?.name || 'Team Alpha') || m.b === (activeTeam?.name || 'Team Alpha')) && m.status !== 'completed'
  )
  const regs = TOURNAMENTS.filter((t) => ['bgmi-monsoon-cup', 'val-ascent-series', 'ff-inferno-league'].includes(t.id))

  return (
    <div className="relative min-h-screen bg-void pb-28 pt-32">
      <Container>
        {isLoading ? (
          <div className="border border-white/10 bg-surface/50 p-20 text-center">
            <div className="inline-block size-8 animate-spin rounded-full border-2 border-cyan border-t-transparent mb-4" />
            <Hud className="text-cyan">Querying your squad data...</Hud>
          </div>
        ) : !hasTeam ? (
          <div>
            <Hud className="text-cyan">◇ No squad detected</Hud>
            <h1 className="reveal mt-4 font-display text-[clamp(3.5rem,12vw,11rem)] font-black uppercase leading-[0.8]">
              Build your<br /><span className="outline-text">squad</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-dim">
              Tournaments are played as teams. Start your own and invite players, or join an existing roster with a team code.
            </p>
            <div className="mt-14 grid gap-4 md:grid-cols-2">
              <Link
                to="/teams/create"
                className="group relative flex min-h-[340px] flex-col justify-end overflow-hidden bg-ink p-8 text-void transition-all duration-500 md:p-12"
              >
                <span className="absolute right-6 top-4 font-display text-[10rem] font-black leading-none text-void/10 transition-transform duration-700 group-hover:scale-110">
                  +
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-void/60">
                  01 · Captain
                </span>
                <h2 className="mt-3 font-display text-6xl font-black uppercase leading-[0.85] md:text-7xl">
                  Create<br />Team
                </h2>
                <p className="mt-4 max-w-sm text-void/70">
                  Name it, pick a game, add your players. Get a team code instantly.
                </p>
                <span className="mt-6 inline-flex items-center gap-2 font-display font-extrabold uppercase tracking-[0.08em] transition-all group-hover:gap-4">
                  Start building →
                </span>
              </Link>
              <Link
                to="/teams/join"
                className="group relative flex min-h-[340px] flex-col justify-end overflow-hidden border border-white/15 bg-surface p-8 transition-all duration-500 hover:border-violet md:p-12"
              >
                <Particles n={16} />
                <Brackets color="border-violet/60" />
                <span className="absolute right-6 top-4 font-display text-[10rem] font-black leading-none text-violet/15 transition-transform duration-700 group-hover:scale-110">
                  #
                </span>
                <Hud className="text-violet">02 · Player</Hud>
                <h2 className="relative mt-3 font-display text-6xl font-black uppercase leading-[0.85] md:text-7xl">
                  Join<br />Team
                </h2>
                <p className="relative mt-4 max-w-sm text-dim">
                  Got a code from your captain? Enter it and lock in your slot.
                </p>
                <span className="relative mt-6 inline-flex items-center gap-2 font-display font-extrabold uppercase tracking-[0.08em] transition-all group-hover:gap-4 group-hover:text-violet">
                  Enter code →
                </span>
              </Link>
            </div>
          </div>
        ) : (
          <div>
            {/* Multiple teams selector if user has more than 1 team */}
            {teams.length > 1 && (
              <div className="mb-8 flex items-center gap-3 overflow-x-auto pb-2">
                <Hud className="text-cyan">Switch Team:</Hud>
                {teams.map((t, idx) => (
                  <button
                    key={t.id || (t as any)._id}
                    onClick={() => setSelectedTeamIndex(idx)}
                    className={`border px-4 py-2 font-mono text-xs font-bold uppercase transition-colors ${
                      idx === selectedTeamIndex
                        ? 'border-cyan bg-cyan/15 text-cyan'
                        : 'border-white/15 text-dim hover:text-ink'
                    }`}
                  >
                    {t.name} [{t.tag}]
                  </button>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
              <div className="flex items-center gap-6">
                <Crest name={activeTeam.name} size={110} />
                <div>
                  <Hud className="text-cyan">Your team · [{activeTeam.tag}]</Hud>
                  <h1 className="reveal font-display text-[clamp(3rem,9vw,8rem)] font-black uppercase leading-[0.85]">
                    {activeTeam.name}
                  </h1>
                  <Hud className="mt-2 block">
                    Captain ·{' '}
                    <span className="text-ink">
                      {activeTeam.members?.find((m) => m.role === 'CAPTAIN')?.username || profile?.username || 'Captain'}
                    </span>
                  </Hud>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={copy}
                  className="group flex items-center gap-4 border border-white/15 bg-surface px-5 py-4 text-left transition-colors hover:border-cyan"
                >
                  <div>
                    <Hud>Team code</Hud>
                    <p className="font-mono text-2xl tracking-[0.2em]">{inviteCode}</p>
                  </div>
                  <span
                    className={`font-mono text-[10px] uppercase tracking-[0.2em] ${
                      copied ? 'text-ok' : 'text-dim group-hover:text-cyan'
                    }`}
                  >
                    {copied ? '✓ Copied' : 'Copy'}
                  </span>
                </button>
                <button
                  disabled={actionLoading}
                  onClick={handleLeaveOrDelete}
                  className="border border-live/30 bg-live/5 px-4 py-4 font-mono text-xs font-bold uppercase tracking-wider text-live hover:bg-live/15 transition-colors disabled:opacity-40"
                >
                  {activeTeam.captain_id === profile?.id ? 'Disband Team' : 'Leave Team'}
                </button>
              </div>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-6 border-y border-white/10 py-6 md:grid-cols-4">
              <Stat k="Members" v={mainMembers.length || 1} />
              <Stat k="Substitutes" v={subMembers.length} />
              <Stat k="Registrations" v={regs.length} accent="#3ef2ff" />
              <Stat k="Upcoming Matches" v={upcoming.length} />
            </div>

            <div className="mt-14 grid gap-10 lg:grid-cols-[1fr_380px]">
              <div>
                <Hud className="text-cyan">◇ Roster</Hud>
                <div className="mt-4 divide-y divide-white/10 border border-white/10">
                  {(mainMembers.length > 0 ? mainMembers : SQUAD.filter((p) => p.role !== 'Substitute')).map(
                    (p: any, idx: number) => (
                      <div
                        key={p.user_id || p.u || idx}
                        className="flex items-center gap-4 p-4 transition-colors hover:bg-white/[0.03]"
                      >
                        <Avatar id={AVATARS[idx % AVATARS.length]} size={52} />
                        <div className="min-w-0 flex-1">
                          <p className="font-display text-2xl font-black uppercase">
                            {p.username || p.u}
                          </p>
                          <Hud>{p.role}</Hud>
                        </div>
                        <div className="text-right">
                          <Hud>Game ID</Hud>
                          <p className="font-mono text-sm">{p.game_handle || p.uid || 'VERIFIED'}</p>
                        </div>
                      </div>
                    )
                  )}
                </div>

                {subMembers.length > 0 && (
                  <>
                    <Hud className="mt-8 block">Substitutes</Hud>
                    <div className="mt-3 divide-y divide-white/10 border border-dashed border-white/15">
                      {subMembers.map((p, idx) => (
                        <div key={p.user_id || idx} className="flex items-center gap-4 p-4 opacity-80">
                          <Avatar id={AVATARS[(idx + 3) % AVATARS.length]} size={44} />
                          <p className="flex-1 font-display text-xl font-black uppercase">
                            {p.username}
                          </p>
                          <p className="font-mono text-sm text-dim">{p.game_handle || 'SUB'}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <div className="mt-8 flex gap-3">
                  <Link
                    to="/teams/create"
                    className="border border-white/15 bg-surface px-5 py-3 font-mono text-xs font-bold uppercase tracking-wider text-ink hover:border-cyan hover:text-cyan transition-colors"
                  >
                    + Create Another Team
                  </Link>
                  <Link
                    to="/teams/join"
                    className="border border-white/15 bg-surface px-5 py-3 font-mono text-xs font-bold uppercase tracking-wider text-dim hover:border-violet hover:text-violet transition-colors"
                  >
                    Join with Code
                  </Link>
                </div>
              </div>

              <div className="space-y-6">
                <Panel className="p-6">
                  <Hud>Game Title</Hud>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="border border-white/20 bg-void px-3 py-1.5 font-display text-sm font-bold uppercase tracking-wider text-cyan">
                      {(activeTeam as any).game_name || (activeTeam.game_id ? gameBy(activeTeam.game_id).name : 'Competitive Title')}
                    </span>
                  </div>
                  <Hud className="mt-6 block">Quick Invite Link</Hud>
                  <p className="mt-2 font-mono text-xs text-dim">
                    Teammates can visit <code>/teams/join</code> and paste:
                  </p>
                  <p className="mt-2 font-mono text-xl font-black tracking-widest text-cyan">
                    {inviteCode}
                  </p>
                </Panel>
              </div>
            </div>
          </div>
        )}
      </Container>
    </div>
  )
}
