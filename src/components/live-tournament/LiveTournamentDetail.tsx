import { useState, useMemo } from 'react'
import { Link } from 'react-router'
import type { LiveTournamentItem, BattleRoyaleRound, KnockoutRound, FinalStandingRecord } from './types'
import { LiveBroadcast } from './LiveBroadcast'
import { BattleRoyaleView } from './BattleRoyaleView'
import { KnockoutView } from './KnockoutView'
import { ParticipantsRosters } from './ParticipantsRosters'
import { FinalResultsView } from './FinalResultsView'
import { Hud, Dot } from '../ui'
import { inr } from '../../lib/data'

interface LiveTournamentDetailProps {
  tournament: LiveTournamentItem
  onBack?: () => void
}

export function LiveTournamentDetail({ tournament, onBack }: LiveTournamentDetailProps) {
  const isBattleRoyale = tournament.competitionFormat === 'BATTLE_ROYALE'
  const isSolo = tournament.participantFormat === 'SOLO'
  const isLive = tournament.lifecycleStatus === 'LIVE'
  const isCompleted = tournament.lifecycleStatus === 'COMPLETED'

  // Sub-navigation tabs within the detail view
  const TABS = useMemo(() => {
    const list: string[] = []
    list.push(isBattleRoyale ? 'ROUNDS & SCORES' : 'KNOCKOUT FIXTURES')
    list.push(isSolo ? 'CONTENDERS' : 'TEAM ROSTERS')
    if (isCompleted || (tournament.standings && tournament.standings.length > 0)) {
      list.push('FINAL RESULTS')
    }
    list.push('TOURNAMENT INFO')
    return list
  }, [isBattleRoyale, isSolo, isCompleted, tournament.standings])

  const [activeTab, setActiveTab] = useState<string>(TABS[0])

  const formattedDate = useMemo(() => {
    const raw = tournament.startDate || tournament.startsAt
    if (!raw) return 'Schedule Pending'
    try {
      const d = new Date(raw)
      if (isNaN(d.getTime())) return 'Schedule Pending'
      return d.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    } catch {
      return 'Schedule Pending'
    }
  }, [tournament.startDate, tournament.startsAt])

  // Extract Battle Royale rounds from tournament object if available
  const brRounds: BattleRoyaleRound[] = useMemo(() => {
    if (!isBattleRoyale) return []

    // 1. Check if tournament has stages with rounds
    if (Array.isArray((tournament as any).stages)) {
      const extracted: BattleRoyaleRound[] = []
      for (const st of (tournament as any).stages) {
        if (Array.isArray(st.rounds)) {
          for (const r of st.rounds) {
            extracted.push({
              id: r.id || r.round_id || `r-${r.round_number}`,
              roundNumber: r.round_number || r.round_order || 1,
              name: r.name || r.round_name || `Round ${r.round_number || 1}`,
              status: r.status === 'IN_PROGRESS' || r.status === 'LIVE' ? 'LIVE' : r.status === 'COMPLETED' ? 'COMPLETED' : 'UPCOMING',
              scheduledTime: r.scheduled_time,
              participants: [],
            })
          }
        }
      }
      if (extracted.length > 0) return extracted
    }

    // 2. Check custom rounds or schedule
    if (Array.isArray((tournament as any).custom_rounds) && (tournament as any).custom_rounds.length > 0) {
      return (tournament as any).custom_rounds.map((name: string, i: number) => ({
        id: `cr-${i + 1}`,
        roundNumber: i + 1,
        name: name || `Round 0${i + 1}`,
        status: i === 0 && isLive ? 'LIVE' : isCompleted ? 'COMPLETED' : 'UPCOMING',
        participants: [],
      }))
    }

    // 3. Fallback based on tournament status
    return [
      {
        id: 'round-1',
        roundNumber: 1,
        name: 'Round 1 — Opening Lobby',
        status: isLive ? 'LIVE' : isCompleted ? 'COMPLETED' : 'UPCOMING',
        mapName: 'Official Sanctioned Map',
        participants: [],
      },
    ]
  }, [isBattleRoyale, tournament, isLive, isCompleted])

  // Extract Knockout rounds and matches from tournament object if available
  const koRounds: KnockoutRound[] = useMemo(() => {
    if (isBattleRoyale) return []

    // 1. Check bracket_rounds or matches_summary
    if (Array.isArray((tournament as any).bracket_rounds) && (tournament as any).bracket_rounds.length > 0) {
      return (tournament as any).bracket_rounds.map((r: any, rIdx: number) => ({
        id: r.id || `ko-round-${rIdx + 1}`,
        roundNumber: r.round || rIdx + 1,
        name: r.name || r.round_name || `Round ${rIdx + 1}`,
        status: r.status || (isLive ? 'LIVE' : isCompleted ? 'COMPLETED' : 'SCHEDULED'),
        matches: Array.isArray(r.matches)
          ? r.matches.map((m: any, mIdx: number) => ({
              id: m.id || `m-${rIdx}-${mIdx}`,
              matchNumber: mIdx + 1,
              name: m.name || `Match 0${mIdx + 1}`,
              status: m.status || 'SCHEDULED',
              participantA: {
                name: m.team_a_name || m.team1_name || 'Team 1',
                score: m.team_a_score,
                isWinner: m.winner_id && (m.winner_id === m.team_a_id || m.winner_name === m.team_a_name),
              },
              participantB: {
                name: m.team_b_name || m.team2_name || 'Team 2',
                score: m.team_b_score,
                isWinner: m.winner_id && (m.winner_id === m.team_b_id || m.winner_name === m.team_b_name),
              },
            }))
          : [],
      }))
    }

    return []
  }, [isBattleRoyale, tournament, isLive, isCompleted])

  // Extract Final standings
  const finalStandings: FinalStandingRecord[] = useMemo(() => {
    const rawList = tournament.finalResults || (tournament as any).final_results || tournament.standings || []
    if (Array.isArray(rawList) && rawList.length > 0) {
      return rawList.map((st: any, idx: number) => ({
        rank: st.rank || st.position || idx + 1,
        participantId: st.participant_id || st.team_id || st.recipient_id || `p-${idx}`,
        participantName: st.participant_name || st.team_name || st.recipient_name || `Participant ${idx + 1}`,
        participantTag: st.team_tag || st.tag,
        isSolo,
        totalPoints: st.total_points || st.points || st.score,
        kills: st.kills || st.eliminations,
        wins: st.wins,
        prizeAmountInr: st.prize_amount || st.prize_inr || st.amount,
        awardName: st.award_name,
        isChampion: (st.rank || idx + 1) === 1,
      }))
    }
    return []
  }, [tournament, isSolo])

  return (
    <div className="space-y-8">
      {/* Back button & Breadcrumbs */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <Link
          to="/live-tournaments"
          onClick={(e) => {
            if (onBack) {
              e.preventDefault()
              onBack()
            }
          }}
          className="flex items-center gap-2 font-mono text-xs uppercase text-dim hover:text-cyan transition-colors"
        >
          <span>←</span>
          <span>Back to Live Tournaments</span>
        </Link>

        <div className="flex items-center gap-2">
          {isLive ? (
            <span className="flex items-center gap-1.5 border border-live/80 bg-live/10 px-2.5 py-1 font-mono text-xs font-bold uppercase text-live">
              <Dot c="bg-live" pulse />
              LIVE MATCHES ACTIVE
            </span>
          ) : isCompleted ? (
            <span className="border border-ok/40 bg-ok/10 px-2.5 py-1 font-mono text-xs font-bold uppercase text-ok">
              ✓ TOURNAMENT CONCLUDED
            </span>
          ) : (
            <span className="border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-xs uppercase text-dim">
              SCHEDULED COMPETITION
            </span>
          )}
        </div>
      </div>

      {/* Hero Header & Tournament Specs */}
      <div className="border border-white/10 bg-surface/50 p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
              <span className="text-cyan font-bold">{tournament.gameName}</span>
              <span className="text-white/20">·</span>
              <span className="border border-white/10 bg-white/5 px-2 py-0.5 text-dim">
                {isBattleRoyale ? 'Battle Royale' : 'Knockout'}
              </span>
              <span className="border border-white/10 bg-white/5 px-2 py-0.5 text-dim">
                {isSolo ? 'Solo Contenders' : 'Team (Squad)'}
              </span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black uppercase text-ink tracking-tight">
              {tournament.title}
            </h1>

            <p className="max-w-2xl text-xs sm:text-sm text-dim leading-relaxed font-mono">
              {tournament.description ||
                `Official ${tournament.gameName} tournament circuit sanctioned by Ametheus. Verified arbiters, real-time live progression, and sanctioned results.`}
            </p>
          </div>

          {/* Quick Specs Grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2 shrink-0 font-mono text-xs">
            <div className="border border-white/10 bg-void p-3.5">
              <span className="block text-[10px] uppercase text-dim">Start Time</span>
              <span className="text-ink font-bold block truncate" title={formattedDate}>
                {formattedDate}
              </span>
            </div>

            <div className="border border-white/10 bg-void p-3.5">
              <span className="block text-[10px] uppercase text-dim">Registered Contenders</span>
              <span className="text-cyan font-bold block truncate">
                {tournament.registeredTeams} / {tournament.maxTeams} {isSolo ? 'Players' : 'Squads'}
              </span>
            </div>

            <div className="border border-white/10 bg-void p-3.5">
              <span className="block text-[10px] uppercase text-dim">Prize Pool</span>
              <span className="text-ok font-bold block truncate">
                {tournament.prizePoolInr > 0 ? inr(tournament.prizePoolInr) : 'Official Sanction'}
              </span>
            </div>

            <div className="border border-white/10 bg-void p-3.5">
              <span className="block text-[10px] uppercase text-dim">Format</span>
              <span className="text-ink font-bold block truncate">
                {isBattleRoyale ? 'Battle Royale Rounds' : 'Knockout Fixtures'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Broadcast Feed (Rendered ONLY if stream URL is configured) */}
      <LiveBroadcast
        streamUrl={tournament.streamUrl || (tournament as any).stream_url || (tournament as any).live_stream_url}
        title={tournament.title}
        isLive={isLive}
      />

      {/* Detail Section Tabs */}
      <div className="border-b border-white/10 pb-px">
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`shrink-0 border-b-2 px-5 py-3 font-mono text-xs uppercase tracking-[0.16em] transition-colors ${
                activeTab === tab
                  ? 'border-cyan bg-cyan/10 text-cyan font-bold'
                  : 'border-transparent text-dim hover:text-ink hover:bg-white/[0.02]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: COMPETITION STRUCTURE */}
      {activeTab === (isBattleRoyale ? 'ROUNDS & SCORES' : 'KNOCKOUT FIXTURES') && (
        <div>
          {isBattleRoyale ? (
            <BattleRoyaleView
              isSolo={isSolo}
              rounds={brRounds}
              tournamentStatus={tournament.lifecycleStatus}
              confirmedParticipants={
                tournament.registeredRosters?.map((r) => r.name) || []
              }
            />
          ) : (
            <KnockoutView
              isSolo={isSolo}
              rounds={koRounds}
              tournamentStatus={tournament.lifecycleStatus}
              confirmedParticipants={
                tournament.registeredRosters?.map((r) => r.name) || []
              }
            />
          )}
        </div>
      )}

      {/* TAB 2: PARTICIPANTS & ROSTERS */}
      {activeTab === (isSolo ? 'CONTENDERS' : 'TEAM ROSTERS') && (
        <ParticipantsRosters
          isSolo={isSolo}
          rosters={tournament.registeredRosters}
          registeredCount={tournament.registeredTeams}
          maxCapacity={tournament.maxTeams}
          currentRoundName={brRounds[0]?.name}
        />
      )}

      {/* TAB 3: FINAL RESULTS */}
      {activeTab === 'FINAL RESULTS' && (
        <FinalResultsView
          isSolo={isSolo}
          champion={tournament.champion}
          mvp={tournament.tournamentMvp || (tournament as any).tournament_mvp}
          standings={finalStandings}
          completedAt={tournament.completedAt || (tournament as any).completed_at}
          isBattleRoyale={isBattleRoyale}
        />
      )}

      {/* TAB 4: TOURNAMENT INFO & RULES */}
      {activeTab === 'TOURNAMENT INFO' && (
        <div className="border border-white/10 bg-surface/40 p-6 space-y-6">
          <div>
            <Hud className="text-cyan">TOURNAMENT SPECIFICATIONS</Hud>
            <h3 className="mt-1 font-display text-2xl font-black uppercase text-ink">
              Official Regulations & Schedule
            </h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 text-xs font-mono">
            <div className="border border-white/10 bg-void p-4 space-y-1.5">
              <span className="text-dim uppercase text-[10px] block">Competition Structure</span>
              <p className="text-ink font-bold">
                {isBattleRoyale ? 'Battle Royale (Multi-Round Lobby Scoring)' : 'Knockout (Single Elimination Bracket)'}
              </p>
              <p className="text-dim text-[11px] pt-1">
                {isBattleRoyale
                  ? 'All teams participate simultaneously in designated rounds. Final standing is determined by total points accumulated.'
                  : 'Teams face off in head-to-head fixtures. Losing participants are eliminated while winners advance.'}
              </p>
            </div>

            <div className="border border-white/10 bg-void p-4 space-y-1.5">
              <span className="text-dim uppercase text-[10px] block">Participant Format</span>
              <p className="text-ink font-bold">
                {isSolo ? 'Solo Contenders (1v1 Free-For-All)' : 'Team Roster (Squad/Duo Play)'}
              </p>
              <p className="text-dim text-[11px] pt-1">
                {isSolo
                  ? 'Individual contenders compete under personal handles without team roster affiliations.'
                  : 'Official registered rosters with designated team captains and confirmed substitute line-ups.'}
              </p>
            </div>
          </div>

          {tournament.rules && Array.isArray(tournament.rules) && tournament.rules.length > 0 && (
            <div className="border-t border-white/10 pt-4">
              <p className="font-mono text-xs uppercase text-dim tracking-wider mb-2">Rule Highlights:</p>
              <ul className="list-disc list-inside space-y-1 font-mono text-xs text-ink/80">
                {tournament.rules.map((rule: any, idx: number) => (
                  <li key={idx}>{typeof rule === 'string' ? rule : rule.title || rule.name}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
