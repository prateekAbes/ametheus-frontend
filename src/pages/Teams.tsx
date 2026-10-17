import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { Container, Hud, Crest, Avatar, MatchCard, Panel, Brackets, Stat, Particles } from '../components/ui'
import { MATCHES, TOURNAMENTS, AVATARS, gameBy } from '../lib/data'
import { getMyTeams, leaveTeam, deleteTeam, transferTeamLeadership, kickTeamMember, type Team } from '../services/teams'
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

  // Active roster
  const mainMembers = activeTeam?.members?.filter((m) => m.role !== 'SUBSTITUTE') || []
  const subMembers = activeTeam?.members?.filter((m) => m.role === 'SUBSTITUTE') || []
  const isCaptain = Boolean(
    activeTeam &&
      profile &&
      (activeTeam.captain_id === profile.id ||
        (profile.clerk_user_id && activeTeam.captain_id === profile.clerk_user_id))
  )

  const handleLeaveOrDelete = async () => {
    if (!activeTeam) return
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

  const handleTransferLeadership = async (targetUserId: string, targetName: string) => {
    if (!activeTeam) return
    if (!window.confirm(`Transfer team captaincy of "${activeTeam.name}" to ${targetName}? You will become a regular team member.`)) return

    setActionLoading(true)
    try {
      await transferTeamLeadership(activeTeam.id || (activeTeam as any)._id, targetUserId)
      fetchTeams()
    } catch (err: any) {
      alert(err.message || 'Failed to transfer leadership')
    } finally {
      setActionLoading(false)
    }
  }

  const handleKickMember = async (targetUserId: string, targetName: string) => {
    if (!activeTeam) return
    if (!window.confirm(`Remove ${targetName} from the roster of "${activeTeam.name}"?`)) return

    setActionLoading(true)
    try {
      await kickTeamMember(activeTeam.id || (activeTeam as any)._id, targetUserId)
      fetchTeams()
    } catch (err: any) {
      alert(err.message || 'Failed to remove member')
    } finally {
      setActionLoading(false)
    }
  }

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
            <h1 className="reveal font-display text-[clamp(3.5rem,12vw,11rem)] font-black uppercase leading-[0.8]">
              Build your<br /><span className="outline-text">squad</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-dim">
              Tournaments are played as teams. Start your own and invite players, or join an existing roster with a team code.
            </p>
            <div className="mt-14 grid gap-6 md:grid-cols-2">
              <Link
                to="/teams/create"
                className="group relative flex min-h-[300px] flex-col justify-between overflow-hidden border border-white/15 bg-surface/60 p-8 transition-colors hover:border-amber-400/60 md:p-10"
              >
                <div>
                  <div className="inline-flex items-center justify-center size-12 rounded-lg bg-amber-400/10 border border-amber-400/30 text-amber-400 mb-6">
                    <svg className="size-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
                    </svg>
                  </div>
                  <h2 className="font-display text-3xl font-black uppercase tracking-wide text-ink md:text-4xl">
                    Create a Team
                  </h2>
                  <p className="mt-3 max-w-sm font-sans text-sm text-dim leading-relaxed">
                    Found your own esports squad, register rosters, and lead tournament entries as team captain.
                  </p>
                </div>
                <div className="mt-8 flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-amber-400 group-hover:gap-3 transition-all">
                  <span>Start Building</span>
                  <span>→</span>
                </div>
              </Link>
              <Link
                to="/teams/join"
                className="group relative flex min-h-[300px] flex-col justify-between overflow-hidden border border-white/15 bg-surface/60 p-8 transition-colors hover:border-cyan/60 md:p-10"
              >
                <div>
                  <div className="inline-flex items-center justify-center size-12 rounded-lg bg-cyan/10 border border-cyan/30 text-cyan mb-6">
                    <svg className="size-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                    </svg>
                  </div>
                  <h2 className="font-display text-3xl font-black uppercase tracking-wide text-ink md:text-4xl">
                    Join a Team
                  </h2>
                  <p className="mt-3 max-w-sm font-sans text-sm text-dim leading-relaxed">
                    Received an invite code from your captain? Enter your team code to claim your roster slot.
                  </p>
                </div>
                <div className="mt-8 flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-cyan group-hover:gap-3 transition-all">
                  <span>Enter Code</span>
                  <span>→</span>
                </div>
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
                  {isCaptain ? 'Disband Team' : 'Leave Team'}
                </button>
              </div>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-6 border-y border-white/10 py-6 md:grid-cols-4">
              <Stat k="Members" v={mainMembers.length} />
              <Stat k="Substitutes" v={subMembers.length} />
              <Stat k="Registrations" v={regs.length} accent="#3ef2ff" />
              <Stat k="Upcoming Matches" v={upcoming.length} />
            </div>

            <div className="mt-14 grid gap-10 lg:grid-cols-[1fr_380px]">
              <div>
                <div className="flex items-center justify-between">
                  <Hud className="text-cyan">◇ Active Roster ({mainMembers.length}/{activeTeam.max_members || 5})</Hud>
                  {isCaptain && (
                    <span className="font-mono text-[10px] text-amber-400">★ You are Team Captain</span>
                  )}
                </div>

                <div className="mt-4 divide-y divide-white/10 border border-white/10 bg-surface/30">
                  {mainMembers.length === 0 ? (
                    <div className="p-8 text-center text-dim font-mono">
                      No squad members yet. Share your team code <span className="text-cyan font-bold">{inviteCode}</span> to recruit teammates.
                    </div>
                  ) : (
                    mainMembers.map((p: any, idx: number) => {
                      const isSelf = Boolean(
                        profile &&
                          (p.user_id === profile.id ||
                            (profile.clerk_user_id && p.user_id === profile.clerk_user_id))
                      )
                      const isMemberCaptain =
                        p.role === 'CAPTAIN' ||
                        p.user_id === activeTeam.captain_id ||
                        (Boolean(profile?.clerk_user_id) && activeTeam.captain_id === profile?.clerk_user_id && isSelf)
                      return (
                        <div
                          key={p.user_id || idx}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 transition-colors hover:bg-white/[0.03]"
                        >
                          <div className="flex items-center gap-4">
                            <Avatar id={AVATARS[idx % AVATARS.length]} size={52} />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-display text-2xl font-black uppercase text-ink">
                                  {p.username || 'Contender'}
                                </p>
                                {isSelf && (
                                  <span className="rounded bg-cyan/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-cyan border border-cyan/30">
                                    YOU
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className={`inline-block font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                                  isMemberCaptain ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'bg-white/5 text-dim border border-white/10'
                                }`}>
                                  {isMemberCaptain ? '★ CAPTAIN' : 'MEMBER'}
                                </span>
                                <span className="font-mono text-xs text-dim">
                                  Game ID: <strong className="text-ink">{p.game_handle || 'VERIFIED'}</strong>
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            {isCaptain && !isSelf && (
                              <>
                                <button
                                  disabled={actionLoading}
                                  onClick={() => handleTransferLeadership(p.user_id, p.username)}
                                  className="border border-amber-500/30 bg-amber-500/5 px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-400 hover:bg-amber-500/15 transition-colors disabled:opacity-40"
                                  title="Transfer team leadership to this member"
                                >
                                  Make Captain
                                </button>
                                <button
                                  disabled={actionLoading}
                                  onClick={() => handleKickMember(p.user_id, p.username)}
                                  className="border border-live/30 bg-live/5 px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-live hover:bg-live/15 transition-colors disabled:opacity-40"
                                  title="Remove member from squad"
                                >
                                  Remove
                                </button>
                              </>
                            )}
                            {!isCaptain && isSelf && (
                              <button
                                disabled={actionLoading}
                                onClick={handleLeaveOrDelete}
                                className="border border-live/30 bg-live/5 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-live hover:bg-live/15 transition-colors disabled:opacity-40"
                              >
                                Leave Team
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                {subMembers.length > 0 && (
                  <>
                    <Hud className="mt-8 block">Substitutes ({subMembers.length}/{activeTeam.max_substitutes || 1})</Hud>
                    <div className="mt-3 divide-y divide-white/10 border border-dashed border-white/15 bg-surface/20">
                      {subMembers.map((p: any, idx: number) => {
                        const isSelf = Boolean(
                          profile &&
                            (p.user_id === profile.id ||
                              (profile.clerk_user_id && p.user_id === profile.clerk_user_id))
                        )
                        return (
                          <div key={p.user_id || idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 opacity-90">
                            <div className="flex items-center gap-4">
                              <Avatar id={AVATARS[(idx + 3) % AVATARS.length]} size={44} />
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-display text-xl font-black uppercase text-ink">
                                    {p.username || 'Substitute'}
                                  </p>
                                  {isSelf && (
                                    <span className="rounded bg-cyan/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-cyan border border-cyan/30">
                                      YOU
                                    </span>
                                  )}
                                </div>
                                <p className="font-mono text-xs text-dim">Handle: {p.game_handle || 'SUB'}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 self-end sm:self-center">
                              {isCaptain && !isSelf && (
                                <button
                                  disabled={actionLoading}
                                  onClick={() => handleKickMember(p.user_id, p.username)}
                                  className="border border-live/30 bg-live/5 px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-live hover:bg-live/15 transition-colors disabled:opacity-40"
                                >
                                  Remove
                                </button>
                              )}
                              {!isCaptain && isSelf && (
                                <button
                                  disabled={actionLoading}
                                  onClick={handleLeaveOrDelete}
                                  className="border border-live/30 bg-live/5 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-live hover:bg-live/15 transition-colors disabled:opacity-40"
                                >
                                  Leave Team
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
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
