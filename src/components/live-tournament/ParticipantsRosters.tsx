import { useState, useMemo } from 'react'
import type { TournamentRoster } from '../../services/tournaments'
import { Hud } from '../ui'

interface ParticipantsRostersProps {
  isSolo: boolean
  rosters?: TournamentRoster[]
  registeredCount: number
  maxCapacity: number
  currentRoundName?: string
  roundParticipants?: string[]
}

export function ParticipantsRosters({
  isSolo,
  rosters = [],
  registeredCount,
  maxCapacity,
  currentRoundName,
  roundParticipants,
}: ParticipantsRostersProps) {
  const [search, setSearch] = useState('')

  const activeRosters = useMemo(() => {
    if (!Array.isArray(rosters)) return []
    return rosters.filter((r) => r && (r.name || r.tag || r.captain))
  }, [rosters])

  const filteredRosters = useMemo(() => {
    if (!search.trim()) return activeRosters
    const q = search.toLowerCase().trim()
    return activeRosters.filter((r) => {
      const nameMatch = r.name?.toLowerCase().includes(q)
      const tagMatch = r.tag?.toLowerCase().includes(q)
      const capMatch = r.captain?.toLowerCase().includes(q)
      const memberMatch = r.members?.some((m) => m?.toLowerCase().includes(q))
      return nameMatch || tagMatch || capMatch || memberMatch
    })
  }, [activeRosters, search])

  const participantLabel = isSolo ? 'Solo Contenders' : 'Teams & Squads'

  return (
    <div className="space-y-6">
      {/* Header & Stats bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-cyan" />
            <Hud className="text-cyan">{isSolo ? 'CONFIRMED CONTENDERS' : 'OFFICIAL SQUAD ROSTERS'}</Hud>
          </div>
          <h2 className="mt-1 font-display text-2xl sm:text-3xl font-black uppercase text-ink">
            {isSolo ? 'Individual Contenders' : 'Confirmed Team Rosters'}
          </h2>
          <p className="text-xs text-dim font-mono">
            Verified participant registrations confirmed by tournament arbiters. Complete player line-ups and handles.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="border border-white/10 bg-surface px-3 py-1.5 font-mono text-xs">
            <span className="text-dim">Slots: </span>
            <span className="text-cyan font-bold">
              {registeredCount} / {maxCapacity} {isSolo ? 'Players' : 'Teams'}
            </span>
          </div>
          {currentRoundName && (
            <div className="border border-cyan/30 bg-cyan/10 px-3 py-1.5 font-mono text-xs text-cyan">
              <span>Current Round: {currentRoundName}</span>
            </div>
          )}
        </div>
      </div>

      {/* Search Filter */}
      {activeRosters.length > 3 && (
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <input
              type="text"
              placeholder={isSolo ? 'Search contenders by name or handle...' : 'Search squads by name, tag, or player...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-white/10 bg-surface px-3 py-2 font-mono text-xs text-ink placeholder:text-dim outline-none focus:border-cyan transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-dim hover:text-ink font-mono"
              >
                ✕
              </button>
            )}
          </div>
          <span className="font-mono text-xs text-dim">
            Showing {filteredRosters.length} of {activeRosters.length}
          </span>
        </div>
      )}

      {/* Participants Content: Solo vs Team presentation */}
      {activeRosters.length === 0 ? (
        <div className="border border-dashed border-white/10 bg-void p-8 text-center">
          <Hud className="text-dim">NO CONFIRMED PARTICIPANTS YET</Hud>
          <p className="mt-2 text-xs text-dim font-mono">
            Participant roster details will be officially announced as registrations lock before tournament kickoff.
          </p>
        </div>
      ) : isSolo ? (
        /* Solo Contenders View */
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredRosters.map((c, idx) => {
            const displayName = c.name || c.captain || `Contender #${idx + 1}`
            const tag = c.tag ? `[${c.tag}]` : ''
            const isPlayingCurrent = roundParticipants
              ? roundParticipants.includes(displayName) || roundParticipants.includes(c.name)
              : false

            return (
              <div
                key={c.name || idx}
                className={`border p-4 transition-colors ${
                  isPlayingCurrent
                    ? 'border-cyan bg-cyan/5'
                    : 'border-white/10 bg-surface/40 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] text-dim">#{idx + 1}</span>
                  {isPlayingCurrent && (
                    <span className="border border-live/40 bg-live/10 px-1.5 py-0.5 font-mono text-[9px] uppercase text-live">
                      In Round
                    </span>
                  )}
                </div>

                <div className="mt-2 flex items-center gap-3">
                  <div className="grid size-9 shrink-0 place-items-center rounded bg-white/10 font-mono text-sm font-bold text-cyan">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-display font-bold uppercase text-ink truncate text-sm">
                      {displayName}
                    </p>
                    {tag && <p className="font-mono text-xs text-dim truncate">{tag}</p>}
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2 text-[10px] font-mono text-dim">
                  <span>Status: Confirmed</span>
                  <span className="text-ok">✓ Verified</span>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Team / Squad Rosters View */
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredRosters.map((team, idx) => {
            const teamName = team.name || `Team ${idx + 1}`
            const teamTag = team.tag ? `[${team.tag}]` : ''
            const captain = team.captain
            const members = Array.isArray(team.members) ? team.members : []
            const isPlayingCurrent = roundParticipants
              ? roundParticipants.includes(teamName) || roundParticipants.includes(team.tag || '')
              : false

            return (
              <div
                key={team.name || idx}
                className={`border p-5 transition-colors ${
                  isPlayingCurrent
                    ? 'border-cyan bg-cyan/5'
                    : 'border-white/10 bg-surface/40 hover:border-white/20'
                }`}
              >
                {/* Team Card Header */}
                <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-cyan font-bold">
                        {teamTag}
                      </span>
                      {isPlayingCurrent && (
                        <span className="border border-live/40 bg-live/10 px-1.5 py-0.5 font-mono text-[9px] uppercase text-live">
                          In Round
                        </span>
                      )}
                    </div>
                    <h3 className="mt-0.5 font-display text-lg font-black uppercase text-ink truncate max-w-[200px]">
                      {teamName}
                    </h3>
                  </div>
                  <span className="border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[10px] text-dim">
                    Squad #{idx + 1}
                  </span>
                </div>

                {/* Team Captain & Members */}
                <div className="mt-3 space-y-2 text-xs">
                  {captain && (
                    <div className="flex items-center justify-between font-mono bg-white/[0.02] p-2 border border-white/5">
                      <span className="text-dim flex items-center gap-1.5">
                        <span className="text-warn">★</span> Captain:
                      </span>
                      <span className="font-bold text-ink truncate max-w-[140px]">{captain}</span>
                    </div>
                  )}

                  <div className="pt-1">
                    <p className="font-mono text-[10px] uppercase text-dim tracking-wider mb-1.5">
                      Roster Line-up ({members.length} Players):
                    </p>
                    {members.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {members.map((member, mIdx) => (
                          <span
                            key={mIdx}
                            className="border border-white/10 bg-white/5 px-2 py-1 font-mono text-xs text-ink/80 truncate max-w-[130px]"
                          >
                            {member}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="font-mono text-xs text-dim italic">
                        Roster verified with team captain
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-2 text-[10px] font-mono text-dim">
                  <span>Registration: Confirmed</span>
                  <span className="text-ok">✓ Roster Locked</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
