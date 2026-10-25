import type { NormalizedTournament } from '../../services/tournaments'

export type CompetitionFormat = 'BATTLE_ROYALE' | 'KNOCKOUT'
export type ParticipantFormat = 'TEAM' | 'SOLO'
export type TournamentLifecycle = 'LIVE' | 'SCHEDULED' | 'COMPLETED'

export interface LiveTournamentItem extends NormalizedTournament {
  competitionFormat: CompetitionFormat
  participantFormat: ParticipantFormat
  lifecycleStatus: TournamentLifecycle
  streamUrl?: string | null
}

export interface BattleRoyaleScoreRecord {
  rank: number
  participantId: string
  participantName: string
  participantTag?: string
  kills: number
  placementPoints: number
  totalPoints: number
  isWinner?: boolean
}

export interface BattleRoyaleRound {
  id: string
  roundNumber: number
  name: string
  status: 'LIVE' | 'COMPLETED' | 'UPCOMING'
  mapName?: string
  scheduledTime?: string
  participants: Array<{
    id: string
    name: string
    tag?: string
    isSolo?: boolean
    avatarUrl?: string
    roster?: string[]
  }>
  results?: BattleRoyaleScoreRecord[]
}

export interface KnockoutMatchParticipant {
  id?: string
  name: string
  tag?: string
  score?: number
  isWinner?: boolean
  isConditional?: boolean
  conditionalLabel?: string
  roster?: string[]
}

export interface KnockoutMatch {
  id: string
  matchNumber: number
  name?: string
  status: 'LIVE' | 'COMPLETED' | 'SCHEDULED'
  participantA: KnockoutMatchParticipant
  participantB: KnockoutMatchParticipant
  scheduledTime?: string
  winnerId?: string
  winnerName?: string
}

export interface KnockoutRound {
  id: string
  roundNumber: number
  name: string
  status: 'LIVE' | 'COMPLETED' | 'UPCOMING' | 'SCHEDULED'
  matches: KnockoutMatch[]
}

export interface FinalStandingRecord {
  rank: number
  participantId: string
  participantName: string
  participantTag?: string
  isSolo: boolean
  totalPoints?: number
  kills?: number
  wins?: number
  prizeAmountInr?: number
  awardName?: string
  isChampion?: boolean
}
