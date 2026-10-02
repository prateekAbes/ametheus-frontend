import { useState, useEffect } from 'react'
import { Container, Hud, Badge, Crest, EmptyState } from '../components/ui'
import { Link } from 'react-router'
import { gameBy, tourBy, type MStatus } from '../lib/data'
import { getMatches, mapApiMatchToUiMatch } from '../services/matches'
import { getMyTeams } from '../services/teams'
import { useAuthContext } from '../context/AuthContext'

const SECTIONS: [MStatus, string][] = [
  ['live', 'Live'],
  ['upcoming', 'Upcoming'],
  ['completed', 'Completed'],
]

export default function MyMatches() {
  const { isSignedIn, profile } = useAuthContext()
  const [matches, setMatches] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [myTeamNames, setMyTeamNames] = useState<string[]>([])

  useEffect(() => {
    if (!isSignedIn) {
      setIsLoading(false)
      return
    }
    setIsLoading(true)

    Promise.allSettled([getMyTeams(), getMatches()])
      .then(([teamsRes, matchesRes]) => {
        let teamNames: string[] = []
        if (teamsRes.status === 'fulfilled' && Array.isArray(teamsRes.value)) {
          teamNames = teamsRes.value.map((t) => t.name)
        }
        if (profile?.username) teamNames.push(profile.username)
        if (profile?.display_name) teamNames.push(profile.display_name)
        if (teamsRes.status === 'fulfilled' && Array.isArray(teamsRes.value)) {
          teamsRes.value.forEach((t) => {
            if (t.tag) teamNames.push(t.tag)
          })
        }
        setMyTeamNames(teamNames)

        if (matchesRes.status === 'fulfilled' && Array.isArray(matchesRes.value)) {
          const mapped = matchesRes.value.map(mapApiMatchToUiMatch)
          // Filter to matches where one of user's teams is competing
          const userMatches = mapped.filter((m) =>
            teamNames.some((tn) => tn.toLowerCase() === m.a.toLowerCase() || tn.toLowerCase() === m.b.toLowerCase())
          )
          setMatches(userMatches)
        }
      })
      .finally(() => setIsLoading(false))
  }, [isSignedIn, profile])

  return (
    <div className="relative min-h-screen bg-void pb-28 pt-32">
      <Container>
        <Hud className="text-cyan">◇ Match Schedule</Hud>
        <h1 className="reveal mt-3 font-display text-[clamp(3rem,9vw,8rem)] font-black uppercase leading-[0.85]">
          My matches
        </h1>

        {isLoading ? (
          <div className="p-16 text-center border border-white/10 bg-surface/50 mt-8">
            <div className="inline-block size-6 animate-spin rounded-full border-2 border-cyan border-t-transparent mb-3" />
            <Hud className="text-cyan">Querying your tournament matches...</Hud>
          </div>
        ) : (
          SECTIONS.map(([s, label]) => {
            const list = matches.filter((m) => m.status === s)
            return (
              <section key={s} className="mt-14">
                <div className="mb-4 flex items-center gap-4">
                  <h2
                    className={`font-display text-3xl font-black uppercase ${
                      s === 'live' ? 'text-live' : ''
                    }`}
                  >
                    {label}
                  </h2>
                  <span className="h-px flex-1 bg-white/10" />
                  <Hud>{list.length}</Hud>
                </div>
                {list.length === 0 ? (
                  <EmptyState
                    code="0"
                    title={`No ${label.toLowerCase()} matches`}
                    body="Matches appear here once brackets are drawn for your registered tournaments."
                  />
                ) : (
                  <div className="space-y-3">
                    {list.map((m) => {
                      const g = gameBy(m.game)
                      return (
                        <Link
                          key={m.id}
                          to={`/matches/${m.id}`}
                          className={`relative grid gap-4 overflow-hidden border p-5 transition-colors hover:bg-white/[0.03] md:grid-cols-[1fr_auto_1fr_auto] md:items-center ${
                            s === 'live'
                              ? 'border-live/50 bg-live/[0.04]'
                              : 'border-white/10'
                          }`}
                        >
                          {s === 'live' && (
                            <span className="absolute inset-y-0 left-0 w-[3px] bg-live" />
                          )}
                          <div>
                            <span
                              className="font-display text-sm font-black tracking-[0.15em]"
                              style={{ color: g.accent }}
                            >
                              {g.short}
                            </span>
                            <p className="font-display text-lg font-black uppercase">
                              {m.tourName || tourBy(m.tour)?.name || 'Tournament'}
                            </p>
                            <Hud>{m.round}</Hud>
                          </div>
                          <div className="flex items-center gap-3">
                            <Crest name={m.a} size={36} color={g.accent} />
                            <span className="font-display text-xl font-black uppercase text-cyan">
                              {m.a}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-xs text-dim">VS</span>
                            {m.score && (
                              <span className="font-display text-xl font-black tabular-nums">
                                {m.score.join(':')}
                              </span>
                            )}
                            <Crest name={m.b} size={36} color={g.accent} />
                            <span className="font-display text-xl font-black uppercase">
                              {m.b}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-3 md:flex-col md:items-end">
                            <Badge s={m.status} />
                            <Hud>
                              {m.date} · {m.time}
                            </Hud>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </section>
            )
          })
        )}
      </Container>
    </div>
  )
}
