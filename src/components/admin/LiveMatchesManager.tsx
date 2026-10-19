import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  type ApiMatch,
  getMatches,
  createMatchAdmin,
  updateMatchDetailsAdmin,
  deleteMatchAdmin,
  completeMatchAdmin,
  swapTeamsAdmin,
  updateMatchStatus,
  getTournamentRegisteredRosters,
  closeTournamentRegistration,
  reopenTournamentRegistration,
  updateTournamentStream,
  updateRoundStreamAdmin,
  updateMatchCredentialsAdmin,
  releaseMatchCredentialsAdmin,
  getQualifiedContendersAdmin,
  updateMatchAliveStatusAdmin,
  submitBattleRoyaleResultsAdmin,
  getMatchRatingsAdmin,
  submitMatchRatingsAdmin,
  getTournamentRoundsRosters,
  publishRosterAdmin,
  publishAllRostersAdmin,
  saveLiveMatchStructureAdmin,
  type RegisteredRosterTeam,
  type TournamentRoundsRostersResponse,
  type QualifiedContender,
  type BattleRoyaleTeamResultInput,
  type ParticipantRatingItem,
  getTournamentRoundsAdmin,
  createTournamentRoundAdmin,
  saveRoundCredentialsAdmin,
  releaseRoundCredentialsAdmin,
  startRoundLiveAdmin,
  setRoundQualifiersAdmin,
  createKnockoutMatchAdmin,
  recordKnockoutMatchResultAdmin,
  setRoundMvpAdmin,
  setTournamentMvpAdmin,
  saveFinalTournamentResultsAdmin,
  endTournamentRoundAdmin,
  updateTournamentRoundAdmin,
  deleteTournamentRoundAdmin,
  updateRoundMatchAdmin,
  deleteRoundMatchAdmin,
  completeRoundMatchAdmin,
  saveKnockoutMatchCredentialsAdmin,
  releaseKnockoutMatchCredentialsAdmin,
  type TournamentRoundDetail,
  type TournamentRoundContender,
} from '../../services/matches'
import { type Tournament } from '../../services/tournaments'
import { resolveMediaUrl } from '../../services/apiClient'
import { Panel, Hud, Badge, Brackets } from '../ui'
import { Portal } from '../Modal'
import { BattleRoyaleResultsModal } from './BattleRoyaleResultsModal'
import { EditLobbyCredentialsModal } from './EditLobbyCredentialsModal'
import { RoundReviewAndRatingModal } from './RoundReviewAndRatingModal'

function normalizeStreamUrl(url?: string): string {
  if (!url) return ''
  const t = url.trim()
  if (!t) return ''
  if (/^https?:\/\//i.test(t)) return t
  return `https://${t}`
}

interface Props {
  tournaments: Tournament[]
  onMatchesUpdated?: () => void
  initialTournamentId?: string
}

const DEFAULT_STAGES = [
  'Round 1',
  'Round 2',
  'Round 3',
  'Quarterfinals',
  'Semifinals',
  'Grand Final',
  'Losers Bracket Round 1',
  'Losers Bracket Round 2',
  'Third Place Match',
]

export const COMPETITION_FORMATS = [
  'Knockout',
  'Round Robin',
  'Battle Royale',
] as const

interface FormationRound {
  round_name: string
  round_number: number
  format?: string
}

interface FormationMatch {
  id?: string
  round_name: string
  round_number: number
  match_number: number
  stage: string
  format: string
  series_format: string
  roster_status: 'DRAFT' | 'PUBLISHED'
  team_a_id?: string
  team_b_id?: string
  team_a_name?: string
  team_b_name?: string
  team_a_placeholder?: string
  team_b_placeholder?: string
  team_ids?: string[]
  teams?: Array<{ id: string; name: string; tag?: string }>
  next_match_slot?: string
  advancement_label?: string
  scheduled_date?: string
  scheduled_time?: string
  youtube_live_url?: string
  room_id?: string
  room_password?: string
  server_region?: string
  score_a?: number
  score_b?: number
  winner_team_id?: string
  status?: string
}

export function LiveMatchesManager({ tournaments, onMatchesUpdated, initialTournamentId }: Props) {
  // Navigation tabs: Live Operations vs Manual Formation Builder
  const [activeTab, setActiveTab] = useState<'OPERATIONS' | 'FORMATION'>('OPERATIONS')

  useEffect(() => {
    if (initialTournamentId) {
      setFormationTournId(initialTournamentId)
      // Auto-selected target tournament
    }
  }, [initialTournamentId])

  // Banner message
  const [bannerMsg, setBannerMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const showBanner = (text: string, type: 'ok' | 'err' = 'ok') => {
    setBannerMsg({ type, text })
    setTimeout(() => setBannerMsg(null), 5000)
  }

  // -------------------------------------------------------------
  // TARGET TOURNAMENTS SELECTOR (Closed registrations or ongoing active)
  // -------------------------------------------------------------
  const closedTournaments = useMemo(() => {
    return tournaments.filter((t) => {
      const regStatus = (t.registration_status || '').toUpperCase()
      const status = (t.status || '').toUpperCase()
      const isRegClosed = regStatus === 'CLOSED' || status === 'REGISTRATION_CLOSED'
      const isOngoingActive = status === 'IN_PROGRESS' || status === 'LIVE' || status === 'ACTIVE'
      const isCancelled = status === 'CANCELLED'
      return (isRegClosed || isOngoingActive) && !isCancelled
    })
  }, [tournaments])

  // -------------------------------------------------------------
  // FORMATION WORKSPACE STATE (Initial state: strictly ZERO rounds & ZERO matches)
  // -------------------------------------------------------------
  const [formationTournId, setFormationTournId] = useState<string>('')
  const [formationStatus, setFormationStatus] = useState<'DRAFT' | 'PUBLISHED'>('DRAFT')
  const [savingFormation, setSavingFormation] = useState(false)
  const [loadingFormation, setLoadingFormation] = useState(false)
  const [formationRounds, setFormationRounds] = useState<FormationRound[]>([])
  const [formationMatches, setFormationMatches] = useState<FormationMatch[]>([])
  const [formationRosters, setFormationRosters] = useState<RegisteredRosterTeam[]>([])
  const [roundQualifiedRoster, setRoundQualifiedRoster] = useState<RegisteredRosterTeam[] | null>(null)
  const [roundPendingMatches, setRoundPendingMatches] = useState<number>(0)
  const [isLoadingQualified, setIsLoadingQualified] = useState<boolean>(false)
  const [formationStreamUrl, setFormationStreamUrl] = useState('')
  const [savingFormationStream, setSavingFormationStream] = useState(false)
  const [formationSquadSearch, setFormationSquadSearch] = useState('')

  // Round creation modal/popover in Formation Workspace
  const [isAddRoundModalOpen, setIsAddRoundModalOpen] = useState(false)
  const [newRoundInputName, setNewRoundInputName] = useState('')

  // Match creation modal in Formation Workspace
  const [isAddFormationMatchOpen, setIsAddFormationMatchOpen] = useState(false)
  const [formationMatchRound, setFormationMatchRound] = useState<string>('')
  const [formationMatchFormData, setFormationMatchFormData] = useState({
    format: 'Knockout' as (typeof COMPETITION_FORMATS)[number],
    series_format: 'BO1',
    team_a_mode: 'ROSTER' as 'ROSTER' | 'PLACEHOLDER',
    team_b_mode: 'ROSTER' as 'ROSTER' | 'PLACEHOLDER',
    team_a_id: '',
    team_b_id: '',
    team_a_placeholder: '',
    team_b_placeholder: '',
    selected_team_ids: [] as string[],
    next_match_slot: '',
    advancement_label: '',
    scheduled_date: '',
    scheduled_time: '',
    youtube_live_url: '',
    server_region: 'AWS Mumbai (ap-south-1)',
    match_number: 1,
  })

  // Selected tournament object for Formation
  const currentFormationTourn = useMemo(
    () => tournaments.find((t) => (t.id || t.slug) === formationTournId),
    [tournaments, formationTournId]
  )

  // Load Formation Data for selected closed tournament
  const loadFormationData = useCallback(async (tournId: string) => {
    if (!tournId) {
      setFormationRounds([])
      setFormationMatches([])
      setFormationRosters([])
      setFormationStreamUrl('')
      return
    }

    setLoadingFormation(true)
    try {
      // 1. Fetch registered teams
      const rostersRes = await getTournamentRegisteredRosters(tournId)
      if (rostersRes && Array.isArray(rostersRes.teams)) {
        setFormationRosters(rostersRes.teams)
      } else {
        setFormationRosters([])
      }

      // 2. Fetch existing saved rounds and matches (if already created and saved)
      const data = await getTournamentRoundsRosters(tournId)
      if (data?.tournament?.live_stream_url) {
        setFormationStreamUrl(data.tournament.live_stream_url)
      }

      const existingRounds: FormationRound[] = []
      const existingMatches: FormationMatch[] = []

      if (data?.rounds && data.rounds.length > 0) {
        data.rounds.forEach((r, idx) => {
          existingRounds.push({
            round_name: r.round_name,
            round_number: r.round_number || idx + 1,
            format: (r.matches?.[0] as any)?.format || data.tournament.format || 'Knockout',
          })
          if (Array.isArray(r.matches)) {
            r.matches.forEach((m) => {
              existingMatches.push({
                id: m.id,
                round_name: r.round_name,
                round_number: m.round_number || idx + 1,
                match_number: m.match_number || m.order || 1,
                stage: m.stage || r.round_name,
                format: m.format || 'Knockout',
                series_format: m.series_format || 'BO1',
                roster_status: (m.roster_status?.toUpperCase() as any) || 'DRAFT',
                team_a_id: m.team_a_id || m.team_a?.id,
                team_b_id: m.team_b_id || m.team_b?.id,
                team_a_name: m.team_a_name || m.team_a?.name,
                team_b_name: m.team_b_name || m.team_b?.name,
                team_a_placeholder: m.team_a_placeholder,
                team_b_placeholder: m.team_b_placeholder,
                team_ids: m.team_ids || [],
                teams: m.teams || [],
                next_match_slot: m.next_match_slot,
                advancement_label: m.advancement_label,
                scheduled_date: m.scheduled_date,
                scheduled_time: m.scheduled_time,
                youtube_live_url: m.youtube_live_url || m.live_link,
                room_id: m.room_id,
                room_password: m.room_password,
                server_region: m.server_region,
                score_a: m.team_a?.score ?? m.score_a ?? 0,
                score_b: m.team_b?.score ?? m.score_b ?? 0,
                winner_team_id: m.winner_team_id,
                status: m.status || 'SCHEDULED',
              })
            })
          }
        })
      } else if (data?.tournament?.custom_rounds && data.tournament.custom_rounds.length > 0) {
        data.tournament.custom_rounds.forEach((rn, idx) => {
          existingRounds.push({
            round_name: rn,
            round_number: idx + 1,
            format: data.tournament.format || 'Knockout',
          })
        })
      }

      // STRICT REQUIREMENT: Initial state contains ZERO ROUNDS and ZERO MATCHES if not previously saved!
      setFormationRounds(existingRounds)
      setFormationMatches(existingMatches)
    } catch (err: any) {
      console.warn('Could not load formation details:', err)
      setFormationRounds([])
      setFormationMatches([])
    } finally {
      setLoadingFormation(false)
    }
  }, [])

  // DB-backed TournamentRound state
  const [dbRounds, setDbRounds] = useState<TournamentRoundDetail[]>([])
  const [loadingDbRounds, setLoadingDbRounds] = useState(false)

  // 3-field Round Creation Modal state
  const [newRoundStageName, setNewRoundStageName] = useState('')
  const [newRoundFormat, setNewRoundFormat] = useState<'Battle Royale' | 'Knockout'>('Battle Royale')
  const [newRoundIsFinal, setNewRoundIsFinal] = useState(false)
  const [isSubmittingRound, setIsSubmittingRound] = useState(false)

  // 3-field Knockout Match Creation Modal state
  const [knockoutRoundId, setKnockoutRoundId] = useState<string>('')
  const [knockoutMatchNumber, setKnockoutMatchNumber] = useState<number>(1)
  const [knockoutContenderAId, setKnockoutContenderAId] = useState<string>('')
  const [knockoutContenderBId, setKnockoutContenderBId] = useState<string>('')
  const [knockoutScheduledTime, setKnockoutScheduledTime] = useState<string>('18:00')
  const [isAddKnockoutMatchOpen, setIsAddKnockoutMatchOpen] = useState(false)
  const [isSubmittingKnockoutMatch, setIsSubmittingKnockoutMatch] = useState(false)

  // Round Credentials edit state
  const [roundCredsEditing, setRoundCredsEditing] = useState<{ [roundId: string]: { room_id: string; room_password: string; custom_instructions: string } }>({})
  const [savingRoundCreds, setSavingRoundCreds] = useState<string | null>(null)
  const [releasingRoundCreds, setReleasingRoundCreds] = useState<string | null>(null)

  // Qualifiers selection state per round
  const [selectedQualifiersByRound, setSelectedQualifiersByRound] = useState<{ [roundId: string]: string[] }>({})
  const [savingQualifiersRoundId, setSavingQualifiersRoundId] = useState<string | null>(null)
  const [championSelectionByRound, setChampionSelectionByRound] = useState<{ [roundId: string]: { id: string; name: string } }>({})
  const [showEliminatedByRound, setShowEliminatedByRound] = useState<{ [roundId: string]: boolean }>({})

  // Knockout match scoring state
  const [knockoutScores, setKnockoutScores] = useState<{ [matchId: string]: { score_a: number; score_b: number; winner_id: string } }>({})
  const [savingMatchResultId, setSavingMatchResultId] = useState<string | null>(null)

  // End Round Modal & Workflow states
  const [activeEndingRound, setActiveEndingRound] = useState<TournamentRoundDetail | null>(null)
  const [mvpModalOpen, setMvpModalOpen] = useState(false)
  const [mvpPlayerId, setMvpPlayerId] = useState('')
  const [mvpPlayerName, setMvpPlayerName] = useState('')
  const [mvpStats, setMvpStats] = useState('')
  const [mvpNotes, setMvpNotes] = useState('')
  const [savingMvp, setSavingMvp] = useState(false)

  // Final Tournament MVP & Final Results states
  const [tournMvpModalOpen, setTournMvpModalOpen] = useState(false)
  const [tournMvpPlayerId, setTournMvpPlayerId] = useState('')
  const [tournMvpPlayerName, setTournMvpPlayerName] = useState('')
  const [tournMvpStats, setTournMvpStats] = useState('')
  const [tournMvpNotes, setTournMvpNotes] = useState('')

  const [finalResultsModalOpen, setFinalResultsModalOpen] = useState(false)
  const [finalResultRows, setFinalResultRows] = useState<Array<{ id: string; award_name: string; recipient_type: 'PLAYER' | 'TEAM'; recipient_id: string; recipient_name: string; display_order: number; prize_amount?: number }>>([])
  const [savingFinalResults, setSavingFinalResults] = useState(false)

  // Edit Round state
  const [editingRound, setEditingRound] = useState<TournamentRoundDetail | null>(null)
  const [editRoundStageName, setEditRoundStageName] = useState('')
  const [editRoundFormat, setEditRoundFormat] = useState<'Battle Royale' | 'Knockout'>('Battle Royale')
  const [editRoundIsFinal, setEditRoundIsFinal] = useState(false)
  const [editRoundStatus, setEditRoundStatus] = useState('UPCOMING')
  const [isEditRoundModalOpen, setIsEditRoundModalOpen] = useState(false)
  const [isSavingEditRound, setIsSavingEditRound] = useState(false)

  // Delete Round state
  const [roundToDelete, setRoundToDelete] = useState<TournamentRoundDetail | null>(null)
  const [isDeletingRound, setIsDeletingRound] = useState(false)

  // Edit Match state
  const [editingMatchData, setEditingMatchData] = useState<{ roundId: string; match: any } | null>(null)
  const [editMatchNumber, setEditMatchNumber] = useState<number>(1)
  const [editMatchContenderA, setEditMatchContenderA] = useState<string>('')
  const [editMatchContenderB, setEditMatchContenderB] = useState<string>('')
  const [editMatchTime, setEditMatchTime] = useState<string>('')
  const [editMatchCustomInstructions, setEditMatchCustomInstructions] = useState<string>('')
  const [isEditMatchModalOpen, setIsEditMatchModalOpen] = useState(false)
  const [isSavingEditMatch, setIsSavingEditMatch] = useState(false)

  // Knockout match credentials state
  const [knockoutMatchCreds, setKnockoutMatchCreds] = useState<{ [matchId: string]: { room_id: string; room_password: string; custom_instructions: string } }>({})
  const [savingKnockoutMatchCreds, setSavingKnockoutMatchCreds] = useState<string | null>(null)
  const [releasingKnockoutMatchCreds, setReleasingKnockoutMatchCreds] = useState<string | null>(null)

  // Left rail active round selection
  const [selectedContenderRoundId, setSelectedContenderRoundId] = useState<string>('ALL')
  const [showActiveOnly, setShowActiveOnly] = useState<boolean>(true)
  const [contenderFilterStatus, setContenderFilterStatus] = useState<'ALL' | 'ACTIVE' | 'QUALIFIED' | 'ELIMINATED'>('ALL')

  const isSoloTournament = useMemo(() => {
    if (!currentFormationTourn) return false
    const mode = (currentFormationTourn.participation_mode || (currentFormationTourn as any).participationMode || '').toUpperCase()
    return mode === 'SOLO' || Boolean((currentFormationTourn as any).is_solo)
  }, [currentFormationTourn])

  const loadDbRounds = useCallback(async (tournId: string) => {
    if (!tournId) {
      setDbRounds([])
      return
    }
    setLoadingDbRounds(true)
    try {
      const res = await getTournamentRoundsAdmin(tournId)
      if (res && Array.isArray(res.rounds)) {
        setDbRounds(res.rounds)
        const credsMap: { [roundId: string]: { room_id: string; room_password: string; custom_instructions: string } } = {}
        const qualMap: { [roundId: string]: string[] } = {}
        const champMap: { [roundId: string]: { id: string; name: string } } = {}
        const koCredsMap: { [matchId: string]: { room_id: string; room_password: string; custom_instructions: string } } = {}
        res.rounds.forEach((rnd) => {
          credsMap[rnd.id] = {
            room_id: rnd.room_id || '',
            room_password: rnd.room_password || '',
            custom_instructions: rnd.custom_instructions || '',
          }
          qualMap[rnd.id] = rnd.qualifier_ids || [];
          (rnd.matches || []).forEach((m: any) => {
            koCredsMap[m.id] = {
              room_id: m.room_id || '',
              room_password: m.room_password || '',
              custom_instructions: m.custom_instructions || '',
            }
          })
          if (rnd.champion_id) {
            champMap[rnd.id] = { id: rnd.champion_id, name: rnd.champion_name || '' }
          }
        })
        setRoundCredsEditing((prev) => ({ ...credsMap, ...prev }))
        setSelectedQualifiersByRound((prev) => ({ ...qualMap, ...prev }))
        setChampionSelectionByRound((prev) => ({ ...champMap, ...prev }))
        setKnockoutMatchCreds((prev) => ({ ...koCredsMap, ...prev }))
      } else {
        setDbRounds([])
      }
    } catch (err: any) {
      console.error('Failed to load DB tournament rounds:', err)
      setDbRounds([])
    } finally {
      setLoadingDbRounds(false)
    }
  }, [])

  // Re-fetch when target tournament in formation workspace changes
  useEffect(() => {
    if (formationTournId) {
      loadFormationData(formationTournId)
      loadDbRounds(formationTournId)
    }
  }, [formationTournId, loadFormationData, loadDbRounds])

  // Compute paired teams in Formation Workspace
  const pairedFormationTeamIds = useMemo(() => {
    const s = new Set<string>()
    formationMatches.forEach((m) => {
      if (m.team_a_id) s.add(String(m.team_a_id))
      if (m.team_b_id) s.add(String(m.team_b_id))
      if (m.team_ids && Array.isArray(m.team_ids)) {
        m.team_ids.forEach((id) => s.add(String(id)))
      }
    })
    return s
  }, [formationMatches])

  // Contenders dynamically resolved for left rail based on selected stage / round
  const displayedContenders = useMemo(() => {
    if (selectedContenderRoundId === 'ALL' || !dbRounds.length) {
      const completedRounds = dbRounds.filter((r) => r.status === 'COMPLETED')
      const latestCompleted = completedRounds[completedRounds.length - 1]
      const activeRound = dbRounds.find((r) => r.status === 'LIVE') || dbRounds.find((r) => r.status === 'UPCOMING')

      return formationRosters.map((team, idx) => {
        const teamIdStr = String(team.team_id)
        const isPaired = pairedFormationTeamIds.has(teamIdStr)
        let statusTag = isPaired ? 'Paired' : 'Unpaired'
        let statusType: 'ok' | 'warn' | 'live' | 'cyan' = isPaired ? 'ok' : 'warn'

        const isChamp = dbRounds.some((r) => r.champion_id === teamIdStr)
        if (isChamp) {
          statusTag = '🏆 Champion'
          statusType = 'warn'
        } else if (latestCompleted) {
          const wasInRound = (latestCompleted.eligible_contenders || []).some((c: any) => String(c.id) === teamIdStr)
          if (wasInRound) {
            const qualified = (latestCompleted.qualifier_ids || []).some((qid: string) => String(qid) === teamIdStr)
            if (qualified) {
              statusTag = 'Qualified'
              statusType = 'ok'
            } else {
              statusTag = 'Eliminated'
              statusType = 'live'
            }
          } else if (activeRound && (activeRound.eligible_contenders || []).some((c: any) => String(c.id) === teamIdStr)) {
            statusTag = activeRound.status === 'LIVE' ? 'Playing' : 'Active'
            statusType = 'cyan'
          }
        } else if (activeRound && activeRound.status === 'LIVE') {
          statusTag = 'Playing'
          statusType = 'cyan'
        }

        const displayName = isSoloTournament
          ? team.captain?.username || team.team_name
          : `${team.team_name} [${team.team_tag}]`

        return {
          id: teamIdStr,
          idx: idx + 1,
          displayName,
          captainName: team.captain?.username || team.captain_username || 'TBD',
          memberCount: team.members?.length || 0,
          statusTag,
          statusType,
          isEliminated: statusTag === 'Eliminated',
          isQualified: statusTag === 'Qualified' || statusTag === '🏆 Champion',
          isActive: statusTag === 'Playing' || statusTag === 'Active',
          isPaired,
        }
      })
    }

    const targetRound = dbRounds.find((r) => r.id === selectedContenderRoundId)
    if (!targetRound) return []

    const eligible = targetRound.eligible_contenders || []
    return eligible.map((c, idx) => {
      const cIdStr = String(c.id)
      let statusTag = 'Eligible'
      let statusType: 'ok' | 'warn' | 'live' | 'cyan' = 'cyan'

      if (targetRound.champion_id === cIdStr) {
        statusTag = '🏆 Champion'
        statusType = 'warn'
      } else if (targetRound.status === 'COMPLETED') {
        const qualified = (targetRound.qualifier_ids || []).some((qid: string) => String(qid) === cIdStr)
        if (qualified) {
          statusTag = 'Qualified'
          statusType = 'ok'
        } else {
          statusTag = 'Eliminated'
          statusType = 'live'
        }
      } else if (targetRound.status === 'LIVE') {
        statusTag = 'Playing'
        statusType = 'live'
      }

      const displayName = isSoloTournament
        ? c.name
        : `${c.name}${c.tag ? ` [${c.tag}]` : ''}`

      return {
        id: cIdStr,
        idx: idx + 1,
        displayName,
        captainName: c.name,
        memberCount: 0,
        statusTag,
        statusType,
        isEliminated: statusTag === 'Eliminated',
        isQualified: statusTag === 'Qualified' || statusTag === '🏆 Champion',
        isActive: statusTag === 'Playing' || statusTag === 'Eligible',
        isPaired: true,
      }
    })
  }, [selectedContenderRoundId, dbRounds, formationRosters, pairedFormationTeamIds, isSoloTournament])

  // Handle Add Round in Formation Workspace
  const handleAddRoundToFormation = (roundName: string) => {
    const clean = roundName.trim()
    if (!clean) return
    if (formationRounds.some((r) => r.round_name.toLowerCase() === clean.toLowerCase())) {
      showBanner(`Round "${clean}" already exists in the formation.`, 'err')
      return
    }

    const newRound: FormationRound = {
      round_name: clean,
      round_number: formationRounds.length + 1,
      format: currentFormationTourn?.format || 'Knockout',
    }
    setFormationRounds((prev) => [...prev, newRound])
    showBanner(`Round "${clean}" container created!`)
    setIsAddRoundModalOpen(false)
    setNewRoundInputName('')
  }

  // Overhaul Round Action Handlers
  const handleCreateRoundSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formationTournId || !newRoundStageName.trim()) return
    setIsSubmittingRound(true)
    try {
      const fmt = newRoundFormat.toLowerCase().includes('battle royale') ? 'Battle Royale' : 'Knockout'
      await createTournamentRoundAdmin(formationTournId, {
        stage_name: newRoundStageName.trim(),
        competition_format: fmt,
        is_final_round: Boolean(newRoundIsFinal),
      })
      showBanner(`Round "${newRoundStageName.trim()}" created successfully!`)
      setIsAddRoundModalOpen(false)
      setNewRoundStageName('')
      setNewRoundIsFinal(false)
      await loadDbRounds(formationTournId)
    } catch (err: any) {
      showBanner(err.message || 'Failed to create round', 'err')
    } finally {
      setIsSubmittingRound(false)
    }
  }

  const handleStartRoundLive = async (roundId: string) => {
    if (!formationTournId || !roundId) return
    try {
      await startRoundLiveAdmin(formationTournId, roundId)
      showBanner('Round is now LIVE!')
      await loadDbRounds(formationTournId)
      onMatchesUpdated?.()
    } catch (err: any) {
      showBanner(err.message || 'Failed to start round live', 'err')
    }
  }

  const handleSaveRoundCredentials = async (roundId: string) => {
    if (!formationTournId || !roundId) return
    const creds = roundCredsEditing[roundId] || { room_id: '', room_password: '', custom_instructions: '' }
    if (!creds.room_id.trim()) {
      showBanner('Room ID is required to save credentials.', 'err')
      return
    }
    setSavingRoundCreds(roundId)
    try {
      await saveRoundCredentialsAdmin(formationTournId, roundId, {
        room_id: creds.room_id.trim(),
        room_password: creds.room_password.trim() || undefined,
        custom_instructions: creds.custom_instructions.trim() || undefined,
      })
      showBanner('Credentials saved! (Not yet released to participants)')
      await loadDbRounds(formationTournId)
    } catch (err: any) {
      showBanner(err.message || 'Failed to save credentials', 'err')
    } finally {
      setSavingRoundCreds(null)
    }
  }

  const handleReleaseRoundCredentials = async (roundId: string) => {
    if (!formationTournId || !roundId) return
    setReleasingRoundCreds(roundId)
    try {
      await releaseRoundCredentialsAdmin(formationTournId, roundId)
      showBanner('Credentials released and delivered to participants!')
      await loadDbRounds(formationTournId)
    } catch (err: any) {
      showBanner(err.message || 'Failed to release credentials', 'err')
    } finally {
      setReleasingRoundCreds(null)
    }
  }

  const handleOpenEditRound = (round: TournamentRoundDetail) => {
    setEditingRound(round)
    setEditRoundStageName(round.stage_name || round.round_name || '')
    setEditRoundFormat(round.format === 'BATTLE_ROYALE' ? 'Battle Royale' : 'Knockout')
    setEditRoundIsFinal(Boolean(round.is_final_round))
    setEditRoundStatus(round.status || 'UPCOMING')
    setIsEditRoundModalOpen(true)
  }

  const handleSaveEditRound = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formationTournId || !editingRound) return
    setIsSavingEditRound(true)
    try {
      await updateTournamentRoundAdmin(formationTournId, editingRound.id, {
        round_name: editRoundStageName.trim(),
        stage_name: editRoundStageName.trim(),
        format: editRoundFormat === 'Battle Royale' ? 'BATTLE_ROYALE' : 'KNOCKOUT',
        is_final_round: editRoundIsFinal,
        status: editRoundStatus,
      })
      showBanner(`Round "${editRoundStageName.trim()}" updated successfully!`)
      await loadDbRounds(formationTournId)
      setIsEditRoundModalOpen(false)
      setEditingRound(null)
    } catch (err: any) {
      showBanner(err.message || 'Failed to update round', 'err')
    } finally {
      setIsSavingEditRound(false)
    }
  }

  const handleDeleteRound = async () => {
    if (!formationTournId || !roundToDelete) return
    setIsDeletingRound(true)
    try {
      await deleteTournamentRoundAdmin(formationTournId, roundToDelete.stage_name || roundToDelete.round_name)
      showBanner(`Round "${roundToDelete.stage_name}" deleted successfully.`)
      await loadDbRounds(formationTournId)
      setRoundToDelete(null)
    } catch (err: any) {
      showBanner(err.message || 'Failed to delete round', 'err')
    } finally {
      setIsDeletingRound(false)
    }
  }

  const handleOpenEditMatch = (roundId: string, match: any) => {
    setEditingMatchData({ roundId, match })
    setEditMatchNumber(match.match_number || 1)
    setEditMatchContenderA(match.team_a_id || '')
    setEditMatchContenderB(match.team_b_id || '')
    setEditMatchTime(match.scheduled_time || '18:00')
    setEditMatchCustomInstructions(match.custom_instructions || '')
    setIsEditMatchModalOpen(true)
  }

  const handleSaveEditMatch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formationTournId || !editingMatchData) return
    setIsSavingEditMatch(true)
    try {
      await updateRoundMatchAdmin(formationTournId, editingMatchData.roundId, editingMatchData.match.id, {
        match_number: editMatchNumber,
        team_a_id: editMatchContenderA,
        team_b_id: editMatchContenderB,
        scheduled_time: editMatchTime,
        custom_instructions: editMatchCustomInstructions,
      })
      showBanner(`Match #${editMatchNumber} updated successfully!`)
      await loadDbRounds(formationTournId)
      setIsEditMatchModalOpen(false)
      setEditingMatchData(null)
    } catch (err: any) {
      showBanner(err.message || 'Failed to update match', 'err')
    } finally {
      setIsSavingEditMatch(false)
    }
  }

  const handleDeleteRoundMatch = async (roundId: string, matchId: string, matchNumber: number) => {
    if (!formationTournId) return
    if (!window.confirm(`Delete Match #${matchNumber}? This cannot be undone.`)) return
    try {
      await deleteRoundMatchAdmin(formationTournId, roundId, matchId)
      showBanner(`Match #${matchNumber} deleted successfully.`)
      await loadDbRounds(formationTournId)
    } catch (err: any) {
      showBanner(err.message || 'Failed to delete match', 'err')
    }
  }

  const handleCompleteKnockoutMatch = async (roundId: string, matchId: string, winnerId: string, scoreA: number, scoreB: number) => {
    if (!formationTournId) return
    if (!winnerId) {
      showBanner('Please select a winner before completing the match.', 'err')
      return
    }
    try {
      await completeRoundMatchAdmin(formationTournId, roundId, matchId, {
        winner_id: winnerId,
        score_a: scoreA,
        score_b: scoreB,
      })
      showBanner('Match marked as COMPLETED and results recorded.')
      await loadDbRounds(formationTournId)
    } catch (err: any) {
      showBanner(err.message || 'Failed to complete match', 'err')
    }
  }

  const handleSaveKnockoutMatchCreds = async (roundId: string, matchId: string) => {
    if (!formationTournId) return
    const creds = knockoutMatchCreds[matchId] || { room_id: '', room_password: '', custom_instructions: '' }
    if (!creds.room_id.trim()) {
      showBanner('Room ID is required to save match credentials.', 'err')
      return
    }
    setSavingKnockoutMatchCreds(matchId)
    try {
      await saveKnockoutMatchCredentialsAdmin(formationTournId, roundId, matchId, {
        room_id: creds.room_id.trim(),
        room_password: creds.room_password.trim() || undefined,
        custom_instructions: creds.custom_instructions.trim() || undefined,
      })
      showBanner('Match Room credentials saved! (Not yet released)')
      await loadDbRounds(formationTournId)
    } catch (err: any) {
      showBanner(err.message || 'Failed to save match credentials', 'err')
    } finally {
      setSavingKnockoutMatchCreds(null)
    }
  }

  const handleReleaseKnockoutMatchCreds = async (roundId: string, matchId: string) => {
    if (!formationTournId) return
    setReleasingKnockoutMatchCreds(matchId)
    try {
      const res = await releaseKnockoutMatchCredentialsAdmin(formationTournId, roundId, matchId)
      showBanner(`Credentials successfully released and sent to ${res.released_to_participants || 2} contenders!`)
      await loadDbRounds(formationTournId)
    } catch (err: any) {
      showBanner(err.message || 'Failed to release match credentials', 'err')
    } finally {
      setReleasingKnockoutMatchCreds(null)
    }

  }

  const handleSaveRoundQualifiers = async (round: TournamentRoundDetail) => {
    if (!formationTournId || !round) return
    setSavingQualifiersRoundId(round.id)
    try {
      if (round.is_final_round) {
        const champ = championSelectionByRound[round.id]
        if (!champ || !champ.id) {
          showBanner('Please select a tournament champion first.', 'err')
          setSavingQualifiersRoundId(null)
          return
        }
        await setRoundQualifiersAdmin(formationTournId, round.id, {
          champion_id: champ.id,
          champion_name: champ.name,
        })
        showBanner(`Tournament champion saved: ${champ.name}!`)
      } else {
        const qualIds = selectedQualifiersByRound[round.id] || []
        if (qualIds.length === 0) {
          showBanner('Please select at least one qualifying contender.', 'err')
          setSavingQualifiersRoundId(null)
          return
        }
        await setRoundQualifiersAdmin(formationTournId, round.id, {
          qualifier_ids: qualIds,
        })
        showBanner(`${qualIds.length} qualifiers saved and advanced to next round!`)
      }
      await loadDbRounds(formationTournId)
    } catch (err: any) {
      showBanner(err.message || 'Failed to save qualifiers', 'err')
    } finally {
      setSavingQualifiersRoundId(null)
    }
  }

  const handleOpenAddKnockoutMatch = (round: TournamentRoundDetail) => {
    setKnockoutRoundId(round.id)
    const existingCount = round.matches?.length || 0
    setKnockoutMatchNumber(existingCount + 1)
    const eligible = round.eligible_contenders || []
    setKnockoutContenderAId(eligible[0]?.id || '')
    setKnockoutContenderBId(eligible[1]?.id || '')
    setKnockoutScheduledTime('18:00')
    setIsAddKnockoutMatchOpen(true)
  }

  const handleCreateKnockoutMatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formationTournId || !knockoutRoundId) return
    if (!knockoutContenderAId || !knockoutContenderBId) {
      showBanner('Both Contender A and Contender B must be selected.', 'err')
      return
    }
    if (knockoutContenderAId === knockoutContenderBId) {
      showBanner('Contender A and Contender B cannot be the same.', 'err')
      return
    }
    setIsSubmittingKnockoutMatch(true)
    try {
      await createKnockoutMatchAdmin(formationTournId, knockoutRoundId, {
        match_number: Number(knockoutMatchNumber),
        team_a_id: knockoutContenderAId,
        team_b_id: knockoutContenderBId,
        scheduled_time: knockoutScheduledTime,
      })
      showBanner(`Match #${knockoutMatchNumber} added!`)
      setIsAddKnockoutMatchOpen(false)
      await loadDbRounds(formationTournId)
    } catch (err: any) {
      showBanner(err.message || 'Failed to add knockout match', 'err')
    } finally {
      setIsSubmittingKnockoutMatch(false)
    }
  }

  const handleRecordKnockoutMatchResult = async (roundId: string, matchId: string, winnerId: string, scoreA: number, scoreB: number) => {
    if (!formationTournId || !roundId || !matchId || !winnerId) return
    setSavingMatchResultId(matchId)
    try {
      await recordKnockoutMatchResultAdmin(formationTournId, roundId, matchId, {
        winner_id: winnerId,
        score_a: scoreA,
        score_b: scoreB,
      })
      showBanner('Match result saved!')
      await loadDbRounds(formationTournId)
    } catch (err: any) {
      showBanner(err.message || 'Failed to record match result', 'err')
    } finally {
      setSavingMatchResultId(null)
    }
  }

  const handleInitiateEndRound = (round: TournamentRoundDetail) => {
    setActiveEndingRound(round)
    if (currentFormationTourn?.enable_mvp) {
      setMvpPlayerId('')
      setMvpPlayerName('')
      setMvpStats('')
      setMvpNotes('')
      setMvpModalOpen(true)
    } else {
      proceedToFinalResultsOrEnd(round)
    }
  }

  const handleSaveRoundMvpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formationTournId || !activeEndingRound || !mvpPlayerName.trim()) return
    setSavingMvp(true)
    try {
      await setRoundMvpAdmin(formationTournId, activeEndingRound.id, {
        player_id: mvpPlayerId || `mvp_${Date.now()}`,
        player_name: mvpPlayerName.trim(),
        stats: mvpStats.trim() || undefined,
        notes: mvpNotes.trim() || undefined,
      })
      showBanner(`Round MVP saved: ${mvpPlayerName.trim()}`)
      setMvpModalOpen(false)
      proceedToFinalResultsOrEnd(activeEndingRound)
    } catch (err: any) {
      showBanner(err.message || 'Failed to save Round MVP', 'err')
    } finally {
      setSavingMvp(false)
    }
  }

  const proceedToFinalResultsOrEnd = (round: TournamentRoundDetail) => {
    if (round.is_final_round) {
      if (currentFormationTourn?.enable_mvp) {
        setTournMvpPlayerId('')
        setTournMvpPlayerName('')
        setTournMvpStats('')
        setTournMvpNotes('')
        setTournMvpModalOpen(true)
      } else {
        openFinalResultsModal(round)
      }
    } else {
      handleCompleteRound(round)
    }
  }

  const handleSaveTournMvpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formationTournId || !tournMvpPlayerName.trim()) return
    try {
      await setTournamentMvpAdmin(formationTournId, {
        player_id: tournMvpPlayerId || `tourn_mvp_${Date.now()}`,
        player_name: tournMvpPlayerName.trim(),
        stats: tournMvpStats.trim() || undefined,
        notes: tournMvpNotes.trim() || undefined,
      })
      showBanner(`Tournament MVP saved: ${tournMvpPlayerName.trim()}`)
      setTournMvpModalOpen(false)
      if (activeEndingRound) {
        openFinalResultsModal(activeEndingRound)
      }
    } catch (err: any) {
      showBanner(err.message || 'Failed to save Tournament MVP', 'err')
    }
  }

  const openFinalResultsModal = (round: TournamentRoundDetail) => {
    const rawPrizes = Array.isArray((currentFormationTourn as any)?.prize_distribution)
      ? (currentFormationTourn as any).prize_distribution
      : []
    const initialRows = rawPrizes.map((p: any, i: number) => ({
      id: `res_${i}_${Date.now()}`,
      award_name: p.name || p.category_name || (i === 0 ? 'Champions / 1st Place' : `Rank ${i + 1}`),
      recipient_type: isSoloTournament ? ('PLAYER' as const) : ('TEAM' as const),
      recipient_id: i === 0 && round.champion_id ? round.champion_id : '',
      recipient_name: i === 0 && round.champion_name ? round.champion_name : '',
      display_order: i + 1,
      prize_amount: Number(p.amount ?? p.prize_amount ?? 0),
    }))
    if (initialRows.length === 0) {
      initialRows.push({
        id: `res_0_${Date.now()}`,
        award_name: 'Champions / 1st Place',
        recipient_type: isSoloTournament ? ('PLAYER' as const) : ('TEAM' as const),
        recipient_id: round.champion_id || '',
        recipient_name: round.champion_name || '',
        display_order: 1,
        prize_amount: currentFormationTourn?.prize_pool_inr || 0,
      })
    }
    setFinalResultRows(initialRows)
    setFinalResultsModalOpen(true)
  }

  const handleSaveFinalResultsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formationTournId || !activeEndingRound) return
    setSavingFinalResults(true)
    try {
      await saveFinalTournamentResultsAdmin(formationTournId, {
        results: finalResultRows.map((r) => ({
          award_name: r.award_name,
          recipient_type: r.recipient_type,
          recipient_id: r.recipient_id,
          recipient_name: r.recipient_name,
          display_order: r.display_order,
          prize_amount: r.prize_amount,
        })),
        champion_id: activeEndingRound.champion_id,
        champion_name: activeEndingRound.champion_name,
      })
      showBanner('Final tournament results and awards saved!')
      setFinalResultsModalOpen(false)
      await handleCompleteRound(activeEndingRound)
    } catch (err: any) {
      showBanner(err.message || 'Failed to save final results', 'err')
    } finally {
      setSavingFinalResults(false)
    }
  }

  const handleCompleteRound = async (round: TournamentRoundDetail) => {
    if (!formationTournId || !round) return
    try {
      const res = await endTournamentRoundAdmin(formationTournId, round.id)
      if (res.tournament_completed) {
        showBanner('🏆 Final Round ended! Tournament is now COMPLETED.')
      } else {
        showBanner(`Round "${round.stage_name}" closed successfully!`)
      }
      setActiveEndingRound(null)
      await loadDbRounds(formationTournId)
      onMatchesUpdated?.()
    } catch (err: any) {
      showBanner(err.message || 'Failed to end round', 'err')
    }
  }

  // Handle Delete Round in Formation Workspace
  const handleDeleteRoundFromFormation = (roundName: string) => {
    if (!confirm(`Permanently remove round "${roundName}" and all its matches from this formation?`)) return
    setFormationRounds((prev) => prev.filter((r) => r.round_name !== roundName))
    setFormationMatches((prev) => prev.filter((m) => m.round_name !== roundName))
    showBanner(`Round "${roundName}" removed.`)
  }

  // Handle Delete Match in Formation Workspace
  const handleDeleteMatchFromFormation = (roundName: string, matchIndexInRound: number) => {
    const matchesInRound = formationMatches.filter((m) => m.round_name === roundName)
    const targetMatch = matchesInRound[matchIndexInRound]
    if (!targetMatch) return

    setFormationMatches((prev) => prev.filter((m) => m !== targetMatch))
    showBanner(`Match removed from ${roundName}.`)
  }

  // Handle Open Add Match to specific round in Formation Workspace
  const handleOpenAddMatchForRound = (roundName: string) => {
    const roundObj = formationRounds.find((r) => r.round_name === roundName)
    const matchesInRound = formationMatches.filter((m) => m.round_name === roundName)
    const defaultFormat = (roundObj?.format as any) || (currentFormationTourn?.format as any) || 'Knockout'
    const rNum = roundObj?.round_number || 1

    setFormationMatchRound(roundName)
    setRoundQualifiedRoster(null)
    setRoundPendingMatches(0)

    if (rNum > 1 && formationTournId) {
      setIsLoadingQualified(true)
      getQualifiedContendersAdmin(formationTournId, undefined, rNum)
        .then((res) => {
          if (res && Array.isArray(res.contenders)) {
            const mappedContenders: RegisteredRosterTeam[] = res.contenders.map((c) => ({
              team_id: c.team_id,
              team_name: c.team_name,
              team_tag: c.team_tag || '',
              captain: {
                user_id: c.team_id,
                username: (c as any).captain_username || 'Qualified Winner',
              },
              members: [],
            }))
            setRoundQualifiedRoster(mappedContenders)
          }
          if (res && res.pending_matches) {
            setRoundPendingMatches(res.pending_matches)
          }
        })
        .catch((err) => {
          console.warn('Failed to load qualified contenders for round:', err)
        })
        .finally(() => {
          setIsLoadingQualified(false)
        })
    }

    setFormationMatchFormData({
      format: defaultFormat,
      series_format: 'BO1',
      team_a_mode: 'ROSTER',
      team_b_mode: 'ROSTER',
      team_a_id: '',
      team_b_id: '',
      team_a_placeholder: '',
      team_b_placeholder: '',
      selected_team_ids: [],
      next_match_slot: '',
      advancement_label: '',
      scheduled_date: '',
      scheduled_time: '',
      youtube_live_url: formationStreamUrl || '',
      server_region: currentFormationTourn?.server_region || 'AWS Mumbai (ap-south-1)',
      match_number: matchesInRound.length + 1,
    })
    setIsAddFormationMatchOpen(true)
  }

  // Handle Submit New Match inside Formation Workspace
  const handleSaveMatchToFormation = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formationMatchRound) return

    const roundObj = formationRounds.find((r) => r.round_name === formationMatchRound)
    const rNum = roundObj?.round_number || 1
    const mNum = Number(formationMatchFormData.match_number) || 1

    let teamAName: string | undefined = undefined
    let teamBName: string | undefined = undefined
    let teamsList: Array<{ id: string; name: string; tag?: string }> | undefined = undefined

    const candidateRoster = roundQualifiedRoster !== null ? roundQualifiedRoster : formationRosters

    if (formationMatchFormData.format === 'Battle Royale') {
      if (formationMatchFormData.selected_team_ids.length < 2) {
        alert('Please select at least 2 contender squads for a Battle Royale match.')
        return
      }
      teamsList = candidateRoster
        .filter((r) => formationMatchFormData.selected_team_ids.includes(r.team_id))
        .map((r) => ({ id: r.team_id, name: r.team_name, tag: r.team_tag }))
    } else {
      if (formationMatchFormData.team_a_mode === 'ROSTER') {
        const t = candidateRoster.find((r) => r.team_id === formationMatchFormData.team_a_id)
        teamAName = t?.team_name
      } else {
        teamAName = formationMatchFormData.team_a_placeholder.trim() || 'TBD (Team A)'
      }

      if (formationMatchFormData.team_b_mode === 'ROSTER') {
        const t = candidateRoster.find((r) => r.team_id === formationMatchFormData.team_b_id)
        teamBName = t?.team_name
      } else {
        teamBName = formationMatchFormData.team_b_placeholder.trim() || 'TBD (Team B)'
      }
    }

    const newMatch: FormationMatch = {
      round_name: formationMatchRound,
      round_number: rNum,
      match_number: mNum,
      stage: formationMatchRound,
      format: formationMatchFormData.format,
      series_format: formationMatchFormData.series_format,
      roster_status: formationStatus,
      team_a_id:
        formationMatchFormData.format === 'Battle Royale'
          ? undefined
          : formationMatchFormData.team_a_mode === 'ROSTER'
          ? formationMatchFormData.team_a_id
          : undefined,
      team_b_id:
        formationMatchFormData.format === 'Battle Royale'
          ? undefined
          : formationMatchFormData.team_b_mode === 'ROSTER'
          ? formationMatchFormData.team_b_id
          : undefined,
      team_a_name: teamAName,
      team_b_name: teamBName,
      team_a_placeholder:
        formationMatchFormData.team_a_mode === 'PLACEHOLDER'
          ? formationMatchFormData.team_a_placeholder.trim()
          : undefined,
      team_b_placeholder:
        formationMatchFormData.team_b_mode === 'PLACEHOLDER'
          ? formationMatchFormData.team_b_placeholder.trim()
          : undefined,
      team_ids:
        formationMatchFormData.format === 'Battle Royale'
          ? formationMatchFormData.selected_team_ids
          : undefined,
      teams: teamsList,
      next_match_slot: formationMatchFormData.next_match_slot.trim() || undefined,
      advancement_label: formationMatchFormData.advancement_label.trim() || undefined,
      scheduled_date: formationMatchFormData.scheduled_date || undefined,
      scheduled_time: formationMatchFormData.scheduled_time || undefined,
      youtube_live_url: formationMatchFormData.youtube_live_url.trim() || undefined,
      server_region: formationMatchFormData.server_region,
      status: 'SCHEDULED',
    }

    setFormationMatches((prev) => [...prev, newMatch])
    showBanner(`Match #${mNum} added to ${formationMatchRound}!`)
    setIsAddFormationMatchOpen(false)
  }

  // Handle Save Complete Match Formation to Database
  const handleSaveMatchFormation = async () => {
    if (!formationTournId) return
    setSavingFormation(true)
    try {
      const payload = {
        match_format: currentFormationTourn?.format || 'Knockout',
        series_format: 'BO1',
        formation_status: formationStatus,
        rounds: formationRounds.map((r, idx) => ({
          round_name: r.round_name,
          round_number: r.round_number || idx + 1,
        })),
        matches: formationMatches.map((m, idx) => ({
          id: m.id,
          round_number: m.round_number || 1,
          match_number: m.match_number || idx + 1,
          stage: m.round_name,
          round_name: m.round_name,
          format: m.format,
          series_format: m.series_format || 'BO1',
          roster_status: formationStatus,
          team_a_id: m.team_a_id || undefined,
          team_b_id: m.team_b_id || undefined,
          team_a_name: m.team_a_name || undefined,
          team_b_name: m.team_b_name || undefined,
          team_a_placeholder: m.team_a_placeholder || undefined,
          team_b_placeholder: m.team_b_placeholder || undefined,
          team_ids: m.team_ids || [],
          teams: m.teams || [],
          next_match_slot: m.next_match_slot || undefined,
          advancement_label: m.advancement_label || undefined,
          scheduled_date: m.scheduled_date || undefined,
          scheduled_time: m.scheduled_time || undefined,
          youtube_live_url: m.youtube_live_url || undefined,
        })),
      }

      await saveLiveMatchStructureAdmin(formationTournId, payload)
      showBanner(
        `✓ Match formation successfully persisted to database! (${formationMatches.length} matches across ${formationRounds.length} rounds)`
      )
      fetchMatches()
      loadFormationData(formationTournId)
      onMatchesUpdated?.()
    } catch (err: any) {
      showBanner(err?.message || 'Failed to save match formation', 'err')
    } finally {
      setSavingFormation(false)
    }
  }

  // Handle Save Stream URL in Formation Workspace
  const handleSaveFormationStream = async () => {
    if (!formationTournId) return
    setSavingFormationStream(true)
    try {
      await updateTournamentStream(formationTournId, formationStreamUrl.trim())
      showBanner('Tournament live broadcast stream URL updated!')
    } catch (err: any) {
      showBanner(err?.message || 'Failed to update stream URL', 'err')
    } finally {
      setSavingFormationStream(false)
    }
  }

  // -------------------------------------------------------------
  // OPERATIONS VIEW STATE & FUNCTIONALITY
  // -------------------------------------------------------------
  const [matches, setMatches] = useState<ApiMatch[]>([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedTournId, setSelectedTournId] = useState<string>('ALL')
  const [selectedGameFilter, setSelectedGameFilter] = useState<string>('ALL')
  const [selectedRoundTab, setSelectedRoundTab] = useState<string>('ALL')

  const [tournRosters, setTournRosters] = useState<RegisteredRosterTeam[]>([])
  const [loadingRosters, setLoadingRosters] = useState(false)
  const [tournStreamUrl, setTournStreamUrl] = useState('')
  const [roundStreamUrl, setRoundStreamUrl] = useState('')
  const [savingStream, setSavingStream] = useState(false)
  const [savingRoundStream, setSavingRoundStream] = useState(false)
  const [closingReg, setClosingReg] = useState(false)
  const [reopeningReg, setReopeningReg] = useState(false)
  const [showRostersDrawer, setShowRostersDrawer] = useState(false)
  const [squadSearch, setSquadSearch] = useState('')

  const [customRounds, setCustomRounds] = useState<string[]>([])
  const [newRoundName, setNewRoundName] = useState('')
  const [roundFormatMap, setRoundFormatMap] = useState<Record<string, string>>({})
  const [roundsRostersData, setRoundsRostersData] = useState<TournamentRoundsRostersResponse | null>(null)

  // Operations Modals
  const [isAddMatchOpen, setIsAddMatchOpen] = useState(false)
  const [addMatchData, setAddMatchData] = useState({
    tournament_id: '',
    stage: 'Round 1',
    round_name: 'Round 1',
    round_number: 1,
    match_number: 1,
    format: 'Knockout',
    selected_team_ids: [] as string[],
    roster_status: 'DRAFT' as 'DRAFT' | 'PUBLISHED',
    team_a_mode: 'ROSTER' as 'ROSTER' | 'PLACEHOLDER',
    team_b_mode: 'ROSTER' as 'ROSTER' | 'PLACEHOLDER',
    team_a_id: '',
    team_b_id: '',
    team_a_placeholder: '',
    team_b_placeholder: '',
    next_match_slot: '',
    advancement_label: '',
    series_format: 'BO1',
    scheduled_time: '',
    scheduled_date: '',
    youtube_live_url: '',
    server_region: 'AWS Mumbai (ap-south-1)',
    room_id: '',
    room_password: '',
  })
  const [submittingAdd, setSubmittingAdd] = useState(false)

  const [publishModalMatch, setPublishModalMatch] = useState<ApiMatch | null>(null)
  const [publishNotifyLeaders, setPublishNotifyLeaders] = useState(true)
  const [publishMatchNotes, setPublishMatchNotes] = useState('')
  const [submittingPublish, setSubmittingPublish] = useState(false)

  const [isBatchPublishOpen, setIsBatchPublishOpen] = useState(false)
  const [submittingBatchPublish, setSubmittingBatchPublish] = useState(false)

  const [goLiveMatch, setGoLiveMatch] = useState<ApiMatch | null>(null)
  const [goLiveUrl, setGoLiveUrl] = useState('')
  const [submittingLive, setSubmittingLive] = useState(false)

  const [scoreMatch, setScoreMatch] = useState<ApiMatch | null>(null)
  const [scoreForm, setScoreForm] = useState({ score_a: 0, score_b: 0, winner_team_id: '' })
  const [submittingScore, setSubmittingScore] = useState(false)

  const [editMatch, setEditMatch] = useState<ApiMatch | null>(null)
  const [editForm, setEditForm] = useState({
    status: 'SCHEDULED',
    roster_status: 'PUBLISHED',
    round_name: '',
    round_number: 1,
    match_number: 1,
    scheduled_time: '',
    scheduled_date: '',
    next_match_slot: '',
    youtube_live_url: '',
    room_id: '',
    room_password: '',
    server_region: 'AWS Mumbai (ap-south-1)',
    score_a: 0,
    score_b: 0,
    winner_team_id: '',
  })
  const [submittingEdit, setSubmittingEdit] = useState(false)

  // 2-Level Scope: Games List
  const availableGames = useMemo(() => {
    const s = new Set<string>()
    tournaments.forEach((t) => {
      const g = t.game_title || t.game_name || t.game_id
      if (g) s.add(g)
    })
    return Array.from(s)
  }, [tournaments])

  // Sync roundStreamUrl whenever selectedRoundTab or roundsRostersData changes
  useEffect(() => {
    if (selectedRoundTab !== 'ALL' && roundsRostersData?.rounds) {
      const foundRound = roundsRostersData.rounds.find((r) => r.round_name === selectedRoundTab)
      if (foundRound?.stream_url) {
        setRoundStreamUrl(foundRound.stream_url)
      } else {
        const matchWithStream = matches.find(
          (m) =>
            (m.round_name === selectedRoundTab || m.stage === selectedRoundTab) &&
            (m.youtube_live_url || m.live_link)
        )
        setRoundStreamUrl(matchWithStream?.youtube_live_url || matchWithStream?.live_link || '')
      }
    } else {
      setRoundStreamUrl(tournStreamUrl || '')
    }
  }, [selectedRoundTab, roundsRostersData, matches, tournStreamUrl])

  const handleSaveRoundStream = async () => {
    if (!selectedTournId || selectedTournId === 'ALL') {
      showBanner('Please select a specific tournament first.', 'err')
      return
    }
    const targetRound = selectedRoundTab !== 'ALL' ? selectedRoundTab : (availableRoundTabs[0] || 'Round 1')
    setSavingRoundStream(true)
    try {
      await updateRoundStreamAdmin(selectedTournId, targetRound, roundStreamUrl.trim())
      showBanner(`Round "${targetRound}" broadcast stream updated!`)
      fetchRoundsData(selectedTournId)
      fetchMatches()
      onMatchesUpdated?.()
    } catch (err: any) {
      showBanner(err?.message || 'Failed to update round stream', 'err')
    } finally {
      setSavingRoundStream(false)
    }
  }

  // Credentials Modal State & Handlers
  const [credentialModalMatch, setCredentialModalMatch] = useState<ApiMatch | null>(null)
  const [credentialForm, setCredentialForm] = useState({
    room_id: '',
    room_password: '',
    custom_instructions: '',
  })
  const [submittingCredentials, setSubmittingCredentials] = useState(false)

  const handleOpenCredentialsModal = (m: ApiMatch) => {
    setCredentialModalMatch(m)
    setCredentialForm({
      room_id: m.room_id || '',
      room_password: m.room_password || '',
      custom_instructions: m.custom_instructions || '',
    })
  }

  const handleSaveCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!credentialModalMatch) return
    setSubmittingCredentials(true)
    try {
      await updateMatchCredentialsAdmin(credentialModalMatch.id, {
        room_id: credentialForm.room_id.trim() || undefined,
        room_password: credentialForm.room_password.trim() || undefined,
        custom_instructions: credentialForm.custom_instructions.trim() || undefined,
      })
      showBanner('Credentials saved in confidential state.')
      setCredentialModalMatch(null)
      fetchMatches()
      if (selectedTournId !== 'ALL') fetchRoundsData(selectedTournId)
    } catch (err: any) {
      showBanner(err?.message || 'Failed to save credentials', 'err')
    } finally {
      setSubmittingCredentials(false)
    }
  }

  const handleReleaseCredentialsClick = async (m: ApiMatch) => {
    if (
      !confirm(
        `Release room credentials for Match #${m.match_number || 1}? Registered participants will receive in-app alerts and access room credentials immediately.`
      )
    )
      return
    try {
      await releaseMatchCredentialsAdmin(m.id)
      showBanner('✓ Credentials released to participants.')
      fetchMatches()
      if (selectedTournId !== 'ALL') fetchRoundsData(selectedTournId)
      onMatchesUpdated?.()
    } catch (err: any) {
      showBanner(err?.message || 'Failed to release credentials', 'err')
    }
  }

  // Battle Royale Modal State & Handlers
  const [brResultsMatch, setBrResultsMatch] = useState<ApiMatch | null>(null)

  const handleOpenBrResultsModal = (m: ApiMatch) => {
    setBrResultsMatch(m)
  }

  const handleToggleSquadAlive = async (matchId: string, teamId: string, currentAlive: boolean) => {
    try {
      await updateMatchAliveStatusAdmin(matchId, teamId, !currentAlive)
      showBanner(`Squad operational status updated (${!currentAlive ? 'ALIVE' : 'ELIMINATED'})`)
      fetchMatches()
      if (selectedTournId !== 'ALL') fetchRoundsData(selectedTournId)
    } catch (err: any) {
      showBanner(err?.message || 'Failed to toggle alive status', 'err')
    }
  }

  // Collapsible squad roster state
  const [expandedRosterMatchIds, setExpandedRosterMatchIds] = useState<Record<string, boolean>>({})
  const toggleRosterExpanded = (matchId: string) => {
    setExpandedRosterMatchIds((prev) => ({ ...prev, [matchId]: !prev[matchId] }))
  }

  // Round Review and Finalize Modal State
  const [roundReviewModalOpen, setRoundReviewModalOpen] = useState(false)
  const [roundReviewTarget, setRoundReviewTarget] = useState<{
    tournamentId: string
    roundName: string
    tournamentTitle?: string
  } | null>(null)

  // Participant Ratings Modal State & Handlers
  const [ratingsModalMatch, setRatingsModalMatch] = useState<ApiMatch | null>(null)
  const [ratingsList, setRatingsList] = useState<ParticipantRatingItem[]>([])
  const [loadingRatings, setLoadingRatings] = useState(false)
  const [submittingRatings, setSubmittingRatings] = useState(false)

  const handleOpenRatingsModal = async (m: ApiMatch) => {
    setRatingsModalMatch(m)
    setLoadingRatings(true)
    try {
      const existing = await getMatchRatingsAdmin(m.id)
      if (existing?.participants && existing.participants.length > 0) {
        setRatingsList(
          existing.participants.map((p) => ({
            user_id: p.user_id,
            player_id: p.player_id || p.user_id,
            username: p.username || p.display_name || 'Player',
            display_name: p.display_name || p.username || 'Player',
            avatar_url: p.avatar_url,
            team_id: p.team_id,
            team_name: p.team_name,
            current_rating: p.current_rating || 500,
            rating: p.rating || 8,
            skill_adjustment: p.skill_adjustment || 0,
            review: p.review || p.notes || '',
            notes: p.notes || p.review || '',
          }))
        )
      } else if (existing?.ratings && existing.ratings.length > 0) {
        setRatingsList(existing.ratings)
      } else {
        const items: ParticipantRatingItem[] = []
        if (m.team_a_details?.members) {
          m.team_a_details.members.forEach((mem: any) => {
            if (mem.id || mem.user_id) {
              const uid = mem.id || mem.user_id
              items.push({
                user_id: uid,
                player_id: uid,
                username: mem.name || mem.username || 'Player',
                display_name: mem.name || mem.display_name || mem.username || 'Player',
                avatar_url: mem.avatar_url,
                team_id: m.team_a_id,
                team_name: m.team_a?.name || m.team_a_name,
                current_rating: 500,
                rating: 8,
                skill_adjustment: 0,
                review: '',
              })
            }
          })
        }
        if (m.team_b_details?.members) {
          m.team_b_details.members.forEach((mem: any) => {
            if (mem.id || mem.user_id) {
              const uid = mem.id || mem.user_id
              items.push({
                user_id: uid,
                player_id: uid,
                username: mem.name || mem.username || 'Player',
                display_name: mem.name || mem.display_name || mem.username || 'Player',
                avatar_url: mem.avatar_url,
                team_id: m.team_b_id,
                team_name: m.team_b?.name || m.team_b_name,
                current_rating: 500,
                rating: 8,
                skill_adjustment: 0,
                review: '',
              })
            }
          })
        }
        setRatingsList(items)
      }
    } catch {
      setRatingsList([])
    } finally {
      setLoadingRatings(false)
    }
  }

  const handleSubmitRatings = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ratingsModalMatch) return
    setSubmittingRatings(true)
    try {
      const submissionId = `match_ratings_${ratingsModalMatch.id}_${Date.now()}`
      await submitMatchRatingsAdmin(ratingsModalMatch.id, ratingsList, submissionId)
      showBanner(`✓ Match ratings submitted successfully for ${ratingsList.length} player(s).`)
      setRatingsModalMatch(null)
      fetchMatches()
    } catch (err: any) {
      alert(err?.message || 'Failed to submit ratings')
    } finally {
      setSubmittingRatings(false)
    }
  }

  // Qualified Contenders State
  const [qualifiedContenders, setQualifiedContenders] = useState<QualifiedContender[]>([])
  const [loadingContenders, setLoadingContenders] = useState(false)

  const fetchContenders = useCallback(async (tId: string) => {
    if (!tId || tId === 'ALL') {
      setQualifiedContenders([])
      return
    }
    setLoadingContenders(true)
    try {
      const res = await getQualifiedContendersAdmin(tId)
      if (res?.contenders) {
        setQualifiedContenders(res.contenders)
      } else {
        setQualifiedContenders([])
      }
    } catch {
      setQualifiedContenders([])
    } finally {
      setLoadingContenders(false)
    }
  }, [])

  // Fetch all matches for Operations View
  const fetchMatches = useCallback(async () => {
    setLoading(true)
    try {
      const params = selectedTournId && selectedTournId !== 'ALL' ? { tournament_id: selectedTournId } : undefined
      const data = await getMatches(params)
      if (Array.isArray(data)) {
        setMatches(data)
      }
    } catch (err: any) {
      console.warn('Failed to load matches:', err)
    } finally {
      setLoading(false)
    }
  }, [selectedTournId])

  useEffect(() => {
    fetchMatches()
  }, [fetchMatches])

  const currentTournament = useMemo(
    () => tournaments.find((t) => t.id === selectedTournId || t.slug === selectedTournId),
    [tournaments, selectedTournId]
  )

  const fetchRoundsData = useCallback(async (tournId: string) => {
    if (!tournId || tournId === 'ALL') {
      setRoundsRostersData(null)
      return
    }
    try {
      const res = await getTournamentRoundsRosters(tournId)
      setRoundsRostersData(res)
    } catch (err) {
      setRoundsRostersData(null)
    }
  }, [])

  useEffect(() => {
    if (selectedTournId === 'ALL' || !selectedTournId) {
      setTournRosters([])
      setTournStreamUrl('')
      setRoundsRostersData(null)
      setSelectedRoundTab('ALL')
      return
    }

    setTournStreamUrl(currentTournament?.live_stream_url || '')
    setLoadingRosters(true)
    getTournamentRegisteredRosters(selectedTournId)
      .then((res) => {
        if (res && Array.isArray(res.teams)) {
          setTournRosters(res.teams)
        } else {
          setTournRosters([])
        }
      })
      .catch(() => setTournRosters([]))
      .finally(() => setLoadingRosters(false))

    fetchRoundsData(selectedTournId)
    setSelectedRoundTab('ALL')
  }, [selectedTournId, currentTournament, fetchRoundsData])

  const availableRoundTabs = useMemo(() => {
    const roundsSet = new Set<string>()
    if (roundsRostersData?.rounds && roundsRostersData.rounds.length > 0) {
      roundsRostersData.rounds.forEach((r) => {
        if (r.round_name) roundsSet.add(r.round_name)
      })
    }
    const scopedMatches =
      selectedTournId === 'ALL'
        ? matches
        : matches.filter(
            (m) =>
              m.tournament_id === selectedTournId ||
              (currentTournament?.slug && m.tournament_id === currentTournament.slug)
          )
    scopedMatches.forEach((m) => {
      const rName = m.round_name || m.stage || (m.round_number ? `Round ${m.round_number}` : '')
      if (rName) roundsSet.add(rName)
    })
    customRounds.forEach((cr) => roundsSet.add(cr))
    return Array.from(roundsSet)
  }, [roundsRostersData, matches, selectedTournId, currentTournament, customRounds])

  const handleSaveTournStream = async () => {
    if (!selectedTournId || selectedTournId === 'ALL') return
    setSavingStream(true)
    try {
      await updateTournamentStream(selectedTournId, tournStreamUrl.trim())
      showBanner('Tournament live stream URL broadcast updated!')
    } catch (err: any) {
      showBanner(err?.message || 'Failed to update stream URL', 'err')
    } finally {
      setSavingStream(false)
    }
  }

  const handleCloseRegistration = async () => {
    if (!selectedTournId || selectedTournId === 'ALL') return
    if (!confirm('Close registration and lock rosters for this tournament?')) return
    setClosingReg(true)
    try {
      await closeTournamentRegistration(selectedTournId)
      showBanner('Tournament registrations locked. Ready for match formation.')
      if (currentTournament) {
        currentTournament.status = 'REGISTRATION_CLOSED'
        currentTournament.registration_status = 'CLOSED'
      }
      fetchRoundsData(selectedTournId)
      onMatchesUpdated?.()
    } catch (err: any) {
      showBanner(err?.message || 'Failed to close registration', 'err')
    } finally {
      setClosingReg(false)
    }
  }

  const handleReopenRegistration = async () => {
    if (!selectedTournId || selectedTournId === 'ALL') return
    if (!confirm('Reopen registrations for this tournament? New teams will be able to register.')) return
    setReopeningReg(true)
    try {
      await reopenTournamentRegistration(selectedTournId)
      showBanner('Tournament registrations reopened! Contenders may now register again.')
      if (currentTournament) {
        currentTournament.status = 'REGISTRATION_OPEN'
        currentTournament.registration_status = 'OPEN'
      }
      fetchRoundsData(selectedTournId)
      onMatchesUpdated?.()
    } catch (err: any) {
      showBanner(err?.message || 'Failed to reopen registration', 'err')
    } finally {
      setReopeningReg(false)
    }
  }

  const handleAddNewRound = (e?: React.FormEvent) => {
    e?.preventDefault()
    const trimmed = newRoundName.trim()
    if (!trimmed) return
    if (availableRoundTabs.includes(trimmed)) {
      setSelectedRoundTab(trimmed)
      setNewRoundName('')
      return
    }
    setCustomRounds((prev) => [...prev, trimmed])
    setSelectedRoundTab(trimmed)
    setNewRoundName('')
    showBanner(`Round "${trimmed}" added to workspace!`)
  }

  const handleSetRoundFormat = (fmt: string) => {
    if (selectedRoundTab === 'ALL') return
    setRoundFormatMap((prev) => ({ ...prev, [selectedRoundTab]: fmt }))
    showBanner(`Format for "${selectedRoundTab}" set to ${fmt}`)
  }

  const handleQuickStatus = async (matchId: string, status: string) => {
    try {
      await updateMatchStatus(matchId, status)
      showBanner(`Match status changed to ${status}`)
      fetchMatches()
      if (selectedTournId !== 'ALL') fetchRoundsData(selectedTournId)
      onMatchesUpdated?.()
    } catch (err: any) {
      showBanner(err?.message || 'Failed to change match status', 'err')
    }
  }

  const handleSwapTeams = async (matchId: string) => {
    try {
      await swapTeamsAdmin(matchId)
      showBanner('Teams swapped successfully')
      fetchMatches()
      if (selectedTournId !== 'ALL') fetchRoundsData(selectedTournId)
      onMatchesUpdated?.()
    } catch (err: any) {
      showBanner(err?.message || 'Failed to swap teams', 'err')
    }
  }

  const handleDeleteMatch = async (matchId: string) => {
    if (!confirm('Are you sure you want to permanently delete this match?')) return
    try {
      await deleteMatchAdmin(matchId)
      showBanner('Match deleted from bracket')
      fetchMatches()
      if (selectedTournId !== 'ALL') fetchRoundsData(selectedTournId)
      onMatchesUpdated?.()
    } catch (err: any) {
      showBanner(err?.message || 'Failed to delete match', 'err')
    }
  }

  const handleAddMatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const targetTournId = addMatchData.tournament_id || selectedTournId
    if (!targetTournId || targetTournId === 'ALL') {
      alert('Please select a specific tournament for this match.')
      return
    }

    setSubmittingAdd(true)
    try {
      const payload: any = {
        tournament_id: targetTournId,
        stage: addMatchData.round_name || addMatchData.stage,
        round_name: addMatchData.round_name || addMatchData.stage,
        round_number: Number(addMatchData.round_number) || 1,
        match_number: Number(addMatchData.match_number) || 1,
        format: addMatchData.format,
        roster_status: addMatchData.roster_status,
        series_format: addMatchData.series_format,
        scheduled_time: addMatchData.scheduled_time || 'TBD',
        scheduled_date: addMatchData.scheduled_date || undefined,
        next_match_slot: addMatchData.next_match_slot.trim() || undefined,
        advancement_label: addMatchData.advancement_label.trim() || undefined,
        youtube_live_url: addMatchData.youtube_live_url.trim() || undefined,
        server_region: addMatchData.server_region.trim() || undefined,
        room_id: addMatchData.room_id.trim() || undefined,
        room_password: addMatchData.room_password.trim() || undefined,
        status: 'SCHEDULED',
      }

      if (addMatchData.format === 'Battle Royale') {
        payload.team_ids = addMatchData.selected_team_ids
        payload.teams = tournRosters
          .filter((r) => addMatchData.selected_team_ids.includes(r.team_id))
          .map((r) => ({ id: r.team_id, name: r.team_name, tag: r.team_tag }))
      } else {
        if (addMatchData.team_a_mode === 'ROSTER' && addMatchData.team_a_id) {
          payload.team_a_id = addMatchData.team_a_id
          const t = tournRosters.find((r) => r.team_id === addMatchData.team_a_id)
          if (t) payload.team_a_name = t.team_name
        } else {
          payload.team_a_placeholder = addMatchData.team_a_placeholder.trim() || 'TBD (Team A)'
        }

        if (addMatchData.team_b_mode === 'ROSTER' && addMatchData.team_b_id) {
          payload.team_b_id = addMatchData.team_b_id
          const t = tournRosters.find((r) => r.team_id === addMatchData.team_b_id)
          if (t) payload.team_b_name = t.team_name
        } else {
          payload.team_b_placeholder = addMatchData.team_b_placeholder.trim() || 'TBD (Team B)'
        }
      }

      await createMatchAdmin(payload)
      showBanner(
        addMatchData.roster_status === 'PUBLISHED'
          ? 'Match roster created and PUBLISHED! Contenders notified.'
          : 'Match created as DRAFT. Remember to review and publish when finalized.'
      )
      setIsAddMatchOpen(false)
      fetchMatches()
      if (selectedTournId !== 'ALL') fetchRoundsData(selectedTournId)
      onMatchesUpdated?.()
    } catch (err: any) {
      alert(err?.message || 'Failed to create match')
    } finally {
      setSubmittingAdd(false)
    }
  }

  const handlePublishRosterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!publishModalMatch) return
    setSubmittingPublish(true)
    try {
      const res = await publishRosterAdmin(publishModalMatch.id, {
        notify_leaders: publishNotifyLeaders,
        match_notes: publishMatchNotes.trim() || undefined,
      })
      showBanner(`✓ Roster Published! ${res.notified_count} captain(s) notified via in-app & email.`)
      setPublishModalMatch(null)
      fetchMatches()
      if (selectedTournId !== 'ALL') fetchRoundsData(selectedTournId)
      onMatchesUpdated?.()
    } catch (err: any) {
      alert(err?.message || 'Failed to publish match roster')
    } finally {
      setSubmittingPublish(false)
    }
  }

  const handleBatchPublishSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTournId || selectedTournId === 'ALL') return
    setSubmittingBatchPublish(true)
    try {
      const res = await publishAllRostersAdmin(
        selectedTournId,
        selectedRoundTab !== 'ALL' ? selectedRoundTab : undefined
      )
      showBanner(
        `✓ All Draft Rosters Published! ${res.published_matches} match(es) published, ${res.notified_leaders} captain(s) alerted.`
      )
      setIsBatchPublishOpen(false)
      fetchMatches()
      fetchRoundsData(selectedTournId)
      onMatchesUpdated?.()
    } catch (err: any) {
      alert(err?.message || 'Failed to batch publish draft rosters')
    } finally {
      setSubmittingBatchPublish(false)
    }
  }

  const handleGoLiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!goLiveMatch) return
    setSubmittingLive(true)
    try {
      await updateMatchDetailsAdmin(goLiveMatch.id, {
        status: 'LIVE',
        youtube_live_url: goLiveUrl.trim(),
      })
      showBanner(`Match is now LIVE with active broadcast link!`)
      setGoLiveMatch(null)
      fetchMatches()
      if (selectedTournId !== 'ALL') fetchRoundsData(selectedTournId)
      onMatchesUpdated?.()
    } catch (err: any) {
      alert(err?.message || 'Failed to start live stream')
    } finally {
      setSubmittingLive(false)
    }
  }

  const handleScoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!scoreMatch) return
    setSubmittingScore(true)
    try {
      await completeMatchAdmin(scoreMatch.id, {
        score_a: Number(scoreForm.score_a),
        score_b: Number(scoreForm.score_b),
        winner_team_id: scoreForm.winner_team_id || undefined,
      })
      showBanner(`Match completed! Winner automatically advanced into configured next-round slot.`)
      setScoreMatch(null)
      fetchMatches()
      if (selectedTournId !== 'ALL') fetchRoundsData(selectedTournId)
      onMatchesUpdated?.()
    } catch (err: any) {
      alert(err?.message || 'Failed to record match score and advance winner')
    } finally {
      setSubmittingScore(false)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editMatch) return
    setSubmittingEdit(true)
    try {
      await updateMatchDetailsAdmin(editMatch.id, {
        status: editForm.status,
        roster_status: editForm.roster_status,
        round_name: editForm.round_name || undefined,
        round_number: Number(editForm.round_number) || undefined,
        match_number: Number(editForm.match_number) || undefined,
        scheduled_time: editForm.scheduled_time || undefined,
        scheduled_date: editForm.scheduled_date || undefined,
        next_match_slot: editForm.next_match_slot || undefined,
        youtube_live_url: editForm.youtube_live_url.trim() || undefined,
        room_id: editForm.room_id.trim() || undefined,
        room_password: editForm.room_password.trim() || undefined,
        server_region: editForm.server_region.trim() || undefined,
        score_a: Number(editForm.score_a),
        score_b: Number(editForm.score_b),
        winner_team_id: editForm.winner_team_id || undefined,
      })
      showBanner('Match credentials, schedule, stream & score updated successfully')
      setEditMatch(null)
      fetchMatches()
      if (selectedTournId !== 'ALL') fetchRoundsData(selectedTournId)
      onMatchesUpdated?.()
    } catch (err: any) {
      alert(err?.message || 'Failed to update match')
    } finally {
      setSubmittingEdit(false)
    }
  }

  // Filtered Matches in Operations
  const filteredMatches = matches.filter((m) => {
    const statusMatch =
      statusFilter === 'ALL' || (m.status || '').toUpperCase() === statusFilter
    const tourMatch =
      selectedTournId === 'ALL' ||
      m.tournament_id === selectedTournId ||
      (currentTournament?.slug && m.tournament_id === currentTournament.slug)
    const roundMatch =
      selectedRoundTab === 'ALL' ||
      m.round_name === selectedRoundTab ||
      m.stage === selectedRoundTab ||
      (m.round_number && `Round ${m.round_number}` === selectedRoundTab)
    const matchTourn = tournaments.find((t) => t.id === m.tournament_id || t.slug === m.tournament_id)
    const matchGame = m.game_name || m.game_title || matchTourn?.game_title || matchTourn?.game_name || ''
    const gameMatch =
      selectedGameFilter === 'ALL' || matchGame === selectedGameFilter
    return statusMatch && tourMatch && roundMatch && gameMatch
  })

  const draftMatchesInScope = useMemo(() => {
    return filteredMatches.filter((m) => (m.roster_status || '').toUpperCase() === 'DRAFT')
  }, [filteredMatches])

  const liveCount = matches.filter((m) => (m.status || '').toUpperCase() === 'LIVE').length
  const scheduledCount = matches.filter(
    (m) =>
      (m.status || '').toUpperCase() === 'SCHEDULED' ||
      (m.status || '').toUpperCase() === 'CHECK_IN_OPEN'
  ).length
  const completedCount = matches.filter((m) => (m.status || '').toUpperCase() === 'COMPLETED').length
  const totalDraftCount = matches.filter(
    (m) => (m.roster_status || '').toUpperCase() === 'DRAFT'
  ).length

  const isRegistrationClosed =
    currentTournament?.registration_status === 'CLOSED' ||
    currentTournament?.status === 'REGISTRATION_CLOSED' ||
    currentTournament?.status === 'IN_PROGRESS' ||
    currentTournament?.status === 'COMPLETED'

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* UNIFIED WORKSPACE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-cyan" />
            <h2 className="font-display text-2xl font-black uppercase text-ink">
              Create Match &amp; Formation Workspace
            </h2>
          </div>
          <p className="text-xs text-dim mt-0.5">
            Admin Tournament Engine: manual round progression, credentials release, scores, and verified results.
          </p>
        </div>
      </div>

      {bannerMsg && (
        <div
          className={`p-3 border text-xs font-bold ${
            bannerMsg.type === 'ok'
              ? 'border-ok/40 bg-ok/10 text-ok'
              : 'border-live/40 bg-live/10 text-live'
          }`}
        >
          {bannerMsg.text}
        </div>
      )}

      {/* ========================================================================= */}
      {/* WORKSPACE CONTENT: Target Tournament & Round Progression */}
      {/* ========================================================================= */}
      <div className="space-y-6">
        {/* Target Tournament Dropdown (Closed registration or ongoing active) */}
        <Panel className="p-4 md:p-5 border-white/15 bg-surface/50 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <Hud className="text-cyan">Tournament Engine</Hud>
              <h3 className="font-display text-xl font-black uppercase text-ink mt-1">
                Target Tournament Selector
              </h3>
              <p className="text-xs text-dim">
                Select a tournament with closed registration or ongoing active status to manage its rounds and matches.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-dim uppercase font-bold text-[11px] shrink-0">Select Tournament:</span>
              <select
                value={formationTournId}
                onChange={(e) => setFormationTournId(e.target.value)}
                className="border border-white/20 bg-void px-3 py-2 text-xs text-ink outline-none focus:border-cyan min-w-[280px]"
              >
                <option value="">-- Select Target Tournament --</option>
                {closedTournaments.map((t) => (
                  <option key={t.id || t.slug} value={t.id || t.slug}>
                    {t.title} [{(t.status || 'CLOSED').toUpperCase()}]
                  </option>
                ))}
              </select>
            </div>
          </div>

          {closedTournaments.length === 0 && (
            <div className="p-3 border border-warn/40 bg-warn/10 text-warn text-xs">
              ⚠️ No tournaments currently match the target criteria (closed registration or ongoing active).
            </div>
          )}
          </Panel>

          {/* If a tournament is selected, render Minimum Tournament Identification Card */}
          {formationTournId && currentFormationTourn && (
            <Panel className="p-4 md:p-5 border-cyan/30 bg-surface/80 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  {currentFormationTourn.banner_url ? (
                    <img
                      src={resolveMediaUrl(currentFormationTourn.banner_url)}
                      alt={currentFormationTourn.title}
                      className="size-16 object-cover border border-white/20 rounded shrink-0 bg-void"
                    />
                  ) : (
                    <div className="size-16 grid place-items-center bg-void border border-white/10 text-dim text-[10px] font-bold uppercase shrink-0">
                      Banner
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="border border-ok/40 bg-ok/10 text-ok px-2 py-0.5 text-[10px] font-bold uppercase">
                        🔒 REGISTRATION CLOSED
                      </span>
                      <span className="border border-cyan/40 bg-cyan/10 text-cyan px-2 py-0.5 text-[10px] font-bold uppercase">
                        👁️ VISIBLE
                      </span>
                      <span className="border border-white/20 bg-void px-2 py-0.5 text-[10px] text-dim uppercase">
                        Format: {currentFormationTourn.format || 'Knockout'}
                      </span>
                    </div>
                    <h2 className="font-display text-2xl font-black uppercase text-ink truncate mt-1">
                      {currentFormationTourn.title}
                    </h2>
                    <p className="text-xs text-dim">
                      Formation: {formationRounds.length === 0 ? 'No rounds created' : `${formationRounds.length} Rounds`} · Matches: {formationMatches.length}
                    </p>
                  </div>
                </div>

                {/* Draft vs Published Toggle & Save Button */}
                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <div className="flex items-center border border-white/20 bg-void p-1 gap-1">
                    <button
                      type="button"
                      onClick={() => setFormationStatus('DRAFT')}
                      className={`px-3 py-1 text-[11px] font-bold uppercase transition-colors cursor-pointer ${
                        formationStatus === 'DRAFT'
                          ? 'bg-warn text-void font-black'
                          : 'text-dim hover:text-ink'
                      }`}
                    >
                      Draft
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormationStatus('PUBLISHED')}
                      className={`px-3 py-1 text-[11px] font-bold uppercase transition-colors cursor-pointer ${
                        formationStatus === 'PUBLISHED'
                          ? 'bg-cyan text-void font-black'
                          : 'text-dim hover:text-ink'
                      }`}
                    >
                      Published
                    </button>
                  </div>

                  <button
                    onClick={handleSaveMatchFormation}
                    disabled={savingFormation}
                    className="border border-cyan bg-cyan px-4 py-2 font-display text-xs font-black uppercase text-void hover:bg-cyan/90 transition-all cursor-pointer shadow-xs"
                  >
                    {savingFormation ? 'Saving Formation...' : 'Save Match Formation'}
                  </button>

                  <button
                    onClick={() => setFormationTournId('')}
                    className="border border-white/20 px-3 py-2 text-xs uppercase text-dim hover:text-ink cursor-pointer"
                  >
                    Switch Tournament
                  </button>
                </div>
              </div>

              {/* YouTube / Stream Broadcast Box — ONLY CONFIGURED AFTER MATCH FORMATION EXISTS */}
              {(formationRounds.length > 0 || formationMatches.length > 0) && (
                <div className="pt-3 border-t border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-void/60 p-3">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-live font-bold uppercase tracking-wider shrink-0 text-[11px]">
                      🔴 Live Match Broadcast URL:
                    </span>
                    <input
                      type="url"
                      placeholder="https://www.youtube.com/watch?v=... or /live/..."
                      value={formationStreamUrl}
                      onChange={(e) => setFormationStreamUrl(e.target.value)}
                      className="w-full border border-white/15 bg-surface px-3 py-1 text-xs text-ink outline-none focus:border-cyan"
                    />
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={handleSaveFormationStream}
                      disabled={savingFormationStream}
                      className="border border-live bg-live/20 px-3 py-1 text-[11px] font-bold text-live hover:bg-live hover:text-white transition-colors cursor-pointer"
                    >
                      {savingFormationStream ? 'Saving...' : 'Broadcast Stream'}
                    </button>
                    {formationStreamUrl && (
                      <a
                        href={formationStreamUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="border border-white/20 px-2.5 py-1 text-[11px] text-dim hover:text-ink"
                      >
                        Watch ↗
                      </a>
                    )}
                  </div>
                </div>
              )}
            </Panel>
          )}

          {/* MAIN FORMATION WORKSPACE (2-Columns) */}
          {formationTournId && currentFormationTourn && (
            <div className="flex flex-col lg:flex-row gap-5 items-start">
              {/* LEFT RAIL: CONTENDER SQUADS (<300px) */}
              <div className="w-full lg:w-72 max-w-full lg:max-w-[280px] shrink-0 space-y-3">
                <Panel className="p-3 border-white/15 bg-surface/50 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <Hud className="text-cyan">{isSoloTournament ? 'Registered Contenders' : 'Contender Squads'}</Hud>
                    <span className="border border-white/20 bg-void px-1.5 py-0.5 text-[10px] text-ink font-bold">
                      {displayedContenders.length} {isSoloTournament ? 'Players' : 'Teams'}
                    </span>
                  </div>

                  {/* Stage / Round Filter */}
                  <div>
                    <label className="block text-dim uppercase text-[9px] mb-1 font-bold">Stage / Round View:</label>
                    <select
                      value={selectedContenderRoundId}
                      onChange={(e) => setSelectedContenderRoundId(e.target.value)}
                      className="w-full border border-white/20 bg-void px-2 py-1 text-[11px] text-ink outline-none focus:border-cyan"
                    >
                      <option value="ALL">All Registered ({formationRosters.length})</option>
                      {dbRounds.map((rnd) => (
                        <option key={rnd.id} value={rnd.id}>
                          {rnd.stage_name} ({rnd.format === 'BATTLE_ROYALE' ? 'BR' : 'Knockout'}) — [{rnd.status}]
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Status Filter Pill Buttons */}
                  <div className="flex items-center gap-1 border-b border-white/10 pb-2">
                    <button
                      type="button"
                      onClick={() => setContenderFilterStatus('ALL')}
                      className={`px-2 py-0.5 text-[9px] font-bold uppercase transition-colors cursor-pointer border ${
                        contenderFilterStatus === 'ALL'
                          ? 'border-cyan bg-cyan/20 text-cyan'
                          : 'border-white/10 text-dim hover:text-ink'
                      }`}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => setContenderFilterStatus('ACTIVE')}
                      className={`px-2 py-0.5 text-[9px] font-bold uppercase transition-colors cursor-pointer border ${
                        contenderFilterStatus === 'ACTIVE'
                          ? 'border-cyan bg-cyan/20 text-cyan'
                          : 'border-white/10 text-dim hover:text-ink'
                      }`}
                    >
                      Active
                    </button>
                    <button
                      type="button"
                      onClick={() => setContenderFilterStatus('QUALIFIED')}
                      className={`px-2 py-0.5 text-[9px] font-bold uppercase transition-colors cursor-pointer border ${
                        contenderFilterStatus === 'QUALIFIED'
                          ? 'border-ok bg-ok/20 text-ok'
                          : 'border-white/10 text-dim hover:text-ink'
                      }`}
                    >
                      Qualified
                    </button>
                    <button
                      type="button"
                      onClick={() => setContenderFilterStatus('ELIMINATED')}
                      className={`px-2 py-0.5 text-[9px] font-bold uppercase transition-colors cursor-pointer border ${
                        contenderFilterStatus === 'ELIMINATED'
                          ? 'border-live bg-live/20 text-live'
                          : 'border-white/10 text-dim hover:text-ink'
                      }`}
                    >
                      Eliminated
                    </button>
                  </div>

                  {/* Filter search */}
                  <input
                    type="text"
                    placeholder={isSoloTournament ? 'Filter players...' : 'Filter squads...'}
                    value={formationSquadSearch}
                    onChange={(e) => setFormationSquadSearch(e.target.value)}
                    className="w-full border border-white/15 bg-void px-2 py-1 text-[11px] text-ink placeholder:text-dim/50 outline-none focus:border-cyan"
                  />

                  {/* Contender List */}
                  {displayedContenders.length === 0 ? (
                    <div className="p-4 border border-dashed border-white/10 text-center text-dim text-[11px]">
                      {isSoloTournament ? 'No players found for this stage.' : 'No teams found for this stage.'}
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[540px] overflow-y-auto pr-1">
                      {displayedContenders
                        .filter((c) => {
                          if (
                            formationSquadSearch.trim() &&
                            !c.displayName.toLowerCase().includes(formationSquadSearch.toLowerCase()) &&
                            !c.captainName.toLowerCase().includes(formationSquadSearch.toLowerCase())
                          ) {
                            return false
                          }
                          if (contenderFilterStatus === 'ACTIVE') return c.isActive
                          if (contenderFilterStatus === 'QUALIFIED') return c.isQualified
                          if (contenderFilterStatus === 'ELIMINATED') return c.isEliminated
                          return true
                        })
                        .map((c) => {
                          return (
                            <div
                              key={c.id}
                              className={`border p-2 space-y-1 transition-colors ${
                                c.isEliminated
                                  ? 'border-live/20 bg-void/50 opacity-60'
                                  : c.isQualified
                                  ? 'border-ok/30 bg-ok/5'
                                  : 'border-white/10 bg-void/80 hover:border-cyan/40'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span
                                  className="font-display font-black uppercase text-ink truncate text-[11px]"
                                  title={c.displayName}
                                >
                                  <span className="text-cyan mr-1 font-mono">#{c.idx}</span>
                                  {c.displayName}
                                </span>
                                <span
                                  className={`text-[8px] px-1 py-0.2 border uppercase shrink-0 font-bold ${
                                    c.statusType === 'ok'
                                      ? 'border-ok/40 text-ok bg-ok/10'
                                      : c.statusType === 'warn'
                                      ? 'border-warn/40 text-warn bg-warn/10'
                                      : c.statusType === 'live'
                                      ? 'border-live/40 text-live bg-live/10'
                                      : 'border-cyan/40 text-cyan bg-cyan/10'
                                  }`}
                                >
                                  {c.statusTag}
                                </span>
                              </div>
                              {!isSoloTournament && c.captainName && (
                                <div className="text-[10px] text-dim flex items-center justify-between">
                                  <span className="truncate max-w-[150px]">
                                    Capt: @{c.captainName}
                                  </span>
                                  {c.memberCount > 0 && (
                                    <span className="text-dim/70 shrink-0 font-mono">
                                      ({c.memberCount}p)
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                    </div>
                  )}
                </Panel>
              </div>

              {/* RIGHT WORKSPACE: ROUNDS & MATCH FORMATION */}
              <div className="flex-1 min-w-0 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border border-white/10 bg-surface/60 p-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-ink uppercase tracking-wider">Tournament Rounds:</span>
                    <span className="border border-cyan/40 bg-cyan/10 px-2 py-0.5 text-cyan font-bold text-[11px]">
                      {dbRounds.length} Rounds Created
                    </span>
                    <span className="border border-white/20 bg-void px-2 py-0.5 text-dim font-bold text-[11px]">
                      Mode: {currentFormationTourn?.participation_mode || 'Squad'} (Inherited)
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setNewRoundStageName(`Round ${dbRounds.length + 1}`)
                      setNewRoundFormat(
                        (currentFormationTourn?.format || '').toLowerCase().includes('battle royale')
                          ? 'Battle Royale'
                          : 'Knockout'
                      )
                      setNewRoundIsFinal(false)
                      setIsAddRoundModalOpen(true)
                    }}
                    className="border border-cyan bg-cyan px-3 py-1.5 font-display text-xs font-black uppercase tracking-wider text-void hover:bg-cyan/90 transition-all cursor-pointer"
                  >
                    + Add Round
                  </button>
                </div>

                {loadingDbRounds ? (
                  <div className="p-12 text-center text-dim font-mono text-xs animate-pulse">
                    Loading tournament rounds...
                  </div>
                ) : dbRounds.length === 0 ? (
                  /* ZERO ROUNDS INITIAL STATE */
                  <Panel className="border border-dashed border-white/20 p-12 text-center space-y-3 bg-surface/30">
                    <div className="text-2xl">📋</div>
                    <h3 className="font-display text-2xl font-black uppercase text-ink">
                      No rounds created
                    </h3>
                    <p className="text-xs text-dim max-w-md mx-auto">
                      Matches: 0. The initial match structure is completely empty. The admin decides how many rounds,
                      their names, and matchups manually.
                    </p>
                    <div className="pt-2">
                      <button
                        onClick={() => {
                          setNewRoundStageName('Round 1')
                          setNewRoundFormat(
                            (currentFormationTourn?.format || '').toLowerCase().includes('battle royale')
                              ? 'Battle Royale'
                              : 'Knockout'
                          )
                          setNewRoundIsFinal(false)
                          setIsAddRoundModalOpen(true)
                        }}
                        className="border border-cyan bg-cyan px-5 py-2 font-display text-xs font-black uppercase text-void hover:bg-cyan/90 transition-all cursor-pointer"
                      >
                        + Add Round
                      </button>
                    </div>
                  </Panel>
                ) : (
                  /* ROUND CONTAINERS (DB-BACKED) */
                  <div className="space-y-6">
                    {dbRounds.map((rnd) => {
                      const isBR = rnd.format === 'BATTLE_ROYALE'
                      const isLive = rnd.status === 'LIVE'
                      const isCompleted = rnd.status === 'COMPLETED'
                      const creds = roundCredsEditing[rnd.id] || {
                        room_id: rnd.room_id || '',
                        room_password: rnd.room_password || '',
                        custom_instructions: rnd.custom_instructions || '',
                      }
                      const selectedQuals = selectedQualifiersByRound[rnd.id] || rnd.qualifier_ids || []
                      const selectedChamp = championSelectionByRound[rnd.id] || (rnd.champion_id ? { id: rnd.champion_id, name: rnd.champion_name || '' } : null)
                      const showElim = Boolean(showEliminatedByRound[rnd.id])

                      return (
                        <Panel
                          key={rnd.id}
                          className={`border p-4 space-y-4 ${
                            isCompleted
                              ? 'border-white/10 bg-surface/20 opacity-90'
                              : isLive
                              ? 'border-live/40 bg-surface/60 shadow-lg shadow-live/5'
                              : 'border-white/15 bg-surface/40'
                          }`}
                        >
                          {/* Round Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                            <div className="flex flex-wrap items-center gap-2.5">
                              <span className={`size-2.5 rounded-full ${isLive ? 'bg-live animate-ping' : isCompleted ? 'bg-ok' : 'bg-cyan'}`} />
                              <h3 className="font-display text-xl font-black uppercase text-cyan">
                                {rnd.stage_name}
                              </h3>
                              <span className="border border-cyan/30 bg-cyan/10 px-2 py-0.5 text-[10px] text-cyan font-bold uppercase">
                                {isBR ? 'Battle Royale' : 'Knockout'}
                              </span>
                              <span className="border border-white/20 bg-void px-2 py-0.5 text-[10px] text-dim uppercase">
                                Mode: {currentFormationTourn?.participation_mode || 'Squad'}
                              </span>
                              {rnd.is_final_round && (
                                <span className="border border-warn/50 bg-warn/15 px-2 py-0.5 text-[10px] text-warn font-black uppercase">
                                  🏆 Final Round
                                </span>
                              )}
                              <span
                                className={`border px-2 py-0.5 text-[10px] font-bold uppercase ${
                                  isLive
                                    ? 'border-live/50 text-live bg-live/10'
                                    : isCompleted
                                    ? 'border-ok/50 text-ok bg-ok/10'
                                    : 'border-white/20 text-dim bg-void'
                                }`}
                              >
                                {rnd.status}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Go Live button (hidden/disabled once live or completed) */}
                              {!isLive && !isCompleted && (
                                <button
                                  onClick={() => handleStartRoundLive(rnd.id)}
                                  className="border border-live bg-live/20 px-3 py-1 font-display text-[11px] font-black uppercase text-live hover:bg-live hover:text-white transition-colors cursor-pointer"
                                >
                                  ▶ Go Live
                                </button>
                              )}

                              {/* Edit Round button */}
                              <button
                                type="button"
                                onClick={() => handleOpenEditRound(rnd)}
                                className="border border-white/20 bg-white/5 hover:border-cyan hover:text-cyan px-2.5 py-1 font-mono text-[11px] uppercase text-dim transition-colors cursor-pointer"
                              >
                                ✎ Edit
                              </button>

                              {/* Delete Round button */}
                              <button
                                type="button"
                                onClick={() => setRoundToDelete(rnd)}
                                className="border border-live/30 bg-live/5 hover:bg-live/15 hover:border-live px-2 py-1 font-mono text-[11px] uppercase text-live transition-colors cursor-pointer"
                              >
                                ✕ Delete
                              </button>

                              {/* End Round button */}
                              {!isCompleted && (
                                <button
                                  onClick={() => handleInitiateEndRound(rnd)}
                                  className="border border-ok bg-ok/20 px-3 py-1 font-display text-[11px] font-black uppercase text-ok hover:bg-ok hover:text-void transition-colors cursor-pointer"
                                >
                                  End Round
                                </button>
                              )}
                            </div>
                          </div>

                          {/* ROUND DETAILS & WORKFLOW */}
                          {isBR ? (
                            /* ==================== BATTLE ROYALE ROUND WORKFLOW ==================== */
                            <div className="space-y-4">
                              {/* Round-level Credentials Box */}
                              <div className="border border-white/10 bg-void/60 p-3 space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-ink uppercase text-[11px]">Round Lobby Credentials</span>
                                    <span
                                      className={`text-[9px] px-1.5 py-0.2 border uppercase font-bold ${
                                        rnd.credentials_released
                                          ? 'border-ok/40 bg-ok/10 text-ok'
                                          : 'border-warn/40 bg-warn/10 text-warn'
                                      }`}
                                    >
                                      {rnd.credentials_released ? '✓ Sent / Released' : '🔒 Unsent (Draft)'}
                                    </span>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-dim uppercase text-[10px] mb-1">
                                      Room ID <span className="text-warn">* (Required)</span>
                                    </label>
                                    <input
                                      type="text"
                                      placeholder="e.g. AMT-BR-01"
                                      value={creds.room_id}
                                      onChange={(e) =>
                                        setRoundCredsEditing((prev) => ({
                                          ...prev,
                                          [rnd.id]: { ...creds, room_id: e.target.value },
                                        }))
                                      }
                                      disabled={isCompleted}
                                      className="w-full border border-white/15 bg-surface px-2.5 py-1.5 text-xs text-ink outline-none focus:border-cyan font-bold text-cyan"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-dim uppercase text-[10px] mb-1">
                                      Room Password <span className="text-dim text-[9px]">(Optional)</span>
                                    </label>
                                    <input
                                      type="text"
                                      placeholder="e.g. PASS99"
                                      value={creds.room_password}
                                      onChange={(e) =>
                                        setRoundCredsEditing((prev) => ({
                                          ...prev,
                                          [rnd.id]: { ...creds, room_password: e.target.value },
                                        }))
                                      }
                                      disabled={isCompleted}
                                      className="w-full border border-white/15 bg-surface px-2.5 py-1.5 text-xs text-ink outline-none focus:border-cyan font-bold text-warn"
                                    />
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-white/5">
                                  <button
                                    onClick={() => handleSaveRoundCredentials(rnd.id)}
                                    disabled={savingRoundCreds === rnd.id || isCompleted}
                                    className="border border-white/20 bg-surface px-3 py-1 font-display text-[11px] font-bold uppercase text-ink hover:border-cyan transition-colors cursor-pointer"
                                  >
                                    {savingRoundCreds === rnd.id ? 'Saving...' : 'Save Credentials'}
                                  </button>
                                  <button
                                    onClick={() => handleReleaseRoundCredentials(rnd.id)}
                                    disabled={releasingRoundCreds === rnd.id || isCompleted}
                                    className="border border-ok bg-ok px-3 py-1 font-display text-[11px] font-black uppercase text-void hover:bg-ok/90 transition-colors cursor-pointer"
                                  >
                                    {releasingRoundCreds === rnd.id ? 'Sending...' : 'Send Credentials'}
                                  </button>
                                </div>
                              </div>

                              {/* Eligible Contenders, Qualifiers & Champion Selection */}
                              <div className="border border-white/10 bg-void/40 p-3 space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2">
                                  <div>
                                    <span className="font-bold text-ink uppercase text-[11px]">
                                      {rnd.is_final_round ? 'Tournament Champion Selection' : 'Contenders & Qualifiers'}
                                    </span>
                                    <p className="text-[10px] text-dim">
                                      {rnd.is_final_round
                                        ? 'Select the single official Tournament Champion from eligible contenders.'
                                        : 'Select qualifying contenders to advance to the next round.'}
                                    </p>
                                  </div>
                                  <span className="text-[10px] text-cyan font-bold font-mono">
                                    {rnd.eligible_contenders?.length || 0} Eligible {isSoloTournament ? 'Players' : 'Squads'}
                                  </span>
                                </div>

                                {(rnd.eligible_contenders || []).length === 0 ? (
                                  <div className="p-4 border border-dashed border-white/10 text-center text-dim text-xs">
                                    No eligible contenders found for this round. Contenders from registration or previous round qualifiers appear here.
                                  </div>
                                ) : (
                                  <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                                    {rnd.eligible_contenders.map((c) => {
                                      if (rnd.is_final_round) {
                                        const isSelectedChamp = selectedChamp?.id === c.id
                                        return (
                                          <label
                                            key={c.id}
                                            className={`flex items-center justify-between p-2.5 border transition-colors cursor-pointer ${
                                              isSelectedChamp
                                                ? 'border-warn bg-warn/15 text-warn font-bold'
                                                : 'border-white/10 bg-surface/50 hover:border-cyan/40 text-ink'
                                            }`}
                                          >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                              <input
                                                type="radio"
                                                name={`champ_${rnd.id}`}
                                                checked={isSelectedChamp}
                                                onChange={() => {
                                                  setChampionSelectionByRound((prev) => ({
                                                    ...prev,
                                                    [rnd.id]: { id: c.id, name: c.name },
                                                  }))
                                                }}
                                                disabled={isCompleted}
                                                className="accent-warn"
                                              />
                                              <span className="truncate font-display font-black text-xs uppercase">
                                                {c.name} {c.tag && !isSoloTournament ? `[${c.tag}]` : ''}
                                              </span>
                                            </div>
                                            {isSelectedChamp && (
                                              <span className="text-[10px] font-black uppercase text-warn border border-warn/40 px-2 py-0.5 bg-warn/10">
                                                🏆 Champion Selected
                                              </span>
                                            )}
                                          </label>
                                        )
                                      } else {
                                        const isChecked = selectedQuals.includes(c.id)
                                        return (
                                          <label
                                            key={c.id}
                                            className={`flex items-center justify-between p-2.5 border transition-colors cursor-pointer ${
                                              isChecked
                                                ? 'border-cyan bg-cyan/15 text-cyan font-bold'
                                                : 'border-white/10 bg-surface/50 hover:border-cyan/40 text-ink'
                                            }`}
                                          >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                              <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={(e) => {
                                                  const next = e.target.checked
                                                    ? [...selectedQuals, c.id]
                                                    : selectedQuals.filter((id) => id !== c.id)
                                                  setSelectedQualifiersByRound((prev) => ({
                                                    ...prev,
                                                    [rnd.id]: next,
                                                  }))
                                                }}
                                                disabled={isCompleted}
                                                className="accent-cyan"
                                              />
                                              <span className="truncate font-display font-black text-xs uppercase">
                                                {c.name} {c.tag && !isSoloTournament ? `[${c.tag}]` : ''}
                                              </span>
                                            </div>
                                            {isChecked && (
                                              <span className="text-[10px] font-black uppercase text-cyan border border-cyan/40 px-2 py-0.5 bg-cyan/10">
                                                ✓ Qualifier
                                              </span>
                                            )}
                                          </label>
                                        )
                                      }
                                    })}
                                  </div>
                                )}

                                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/5">
                                  {/* Losers / Eliminated toggle */}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setShowEliminatedByRound((prev) => ({
                                        ...prev,
                                        [rnd.id]: !prev[rnd.id],
                                      }))
                                    }
                                    className="text-[11px] text-dim hover:text-ink cursor-pointer underline"
                                  >
                                    {showElim ? 'Hide' : 'Show'} Eliminated / Losers ({rnd.eliminated_ids?.length || 0})
                                  </button>

                                  {rnd.is_final_round ? (
                                    <button
                                      onClick={() => handleSaveRoundQualifiers(rnd)}
                                      disabled={savingQualifiersRoundId === rnd.id || isCompleted}
                                      className="border border-warn bg-warn px-4 py-1.5 font-display text-xs font-black uppercase text-void hover:bg-warn/90 transition-colors cursor-pointer"
                                    >
                                      {savingQualifiersRoundId === rnd.id ? 'Saving...' : 'Save Tournament Champion'}
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleSaveRoundQualifiers(rnd)}
                                      disabled={savingQualifiersRoundId === rnd.id || isCompleted}
                                      className="border border-cyan bg-cyan px-4 py-1.5 font-display text-xs font-black uppercase text-void hover:bg-cyan/90 transition-colors cursor-pointer"
                                    >
                                      {savingQualifiersRoundId === rnd.id
                                        ? 'Saving...'
                                        : `Advance Qualifiers (${selectedQuals.length}) to Next Round`}
                                    </button>
                                  )}
                                </div>

                                {/* Eliminated list dropdown if open */}
                                {showElim && (
                                  <div className="p-2 border border-live/30 bg-live/5 space-y-1 text-[11px]">
                                    <span className="font-bold text-live uppercase block mb-1">Eliminated Contenders:</span>
                                    {rnd.eliminated_ids && rnd.eliminated_ids.length > 0 ? (
                                      rnd.eliminated_ids.map((id) => {
                                        const c = rnd.eligible_contenders?.find((ec) => ec.id === id)
                                        return (
                                          <div key={id} className="text-dim line-through">
                                            • {c?.name || id}
                                          </div>
                                        )
                                      })
                                    ) : (
                                      <div className="text-dim/60">No eliminated contenders recorded.</div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            /* ==================== KNOCKOUT ROUND WORKFLOW ==================== */
                            <div className="space-y-4">
                              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                <span className="font-bold text-ink uppercase text-[11px]">Knockout Matches</span>
                                {!isCompleted && (
                                  <button
                                    onClick={() => handleOpenAddKnockoutMatch(rnd)}
                                    className="border border-cyan/60 bg-cyan/15 px-3 py-1 font-display text-[11px] font-black uppercase text-cyan hover:bg-cyan hover:text-void transition-colors cursor-pointer"
                                  >
                                    + Add Match to {rnd.stage_name}
                                  </button>
                                )}
                              </div>

                              {(!rnd.matches || rnd.matches.length === 0) ? (
                                <div className="p-6 border border-dashed border-white/10 text-center text-dim text-xs">
                                  No knockout matches created in {rnd.stage_name} yet. Click &quot;+ Add Match to {rnd.stage_name}&quot; to pair contenders.
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  {rnd.matches.map((m: any) => {
                                    const matchScore = knockoutScores[m.id] || {
                                      score_a: m.score_a ?? 0,
                                      score_b: m.score_b ?? 0,
                                      winner_id: m.winner_id || '',
                                    }
                                    const isMatchDone = Boolean(m.winner_id)
                                    const winnerName = m.winner_id === m.team_a_id ? m.team_a_name : m.winner_id === m.team_b_id ? m.team_b_name : ''

                                    return (
                                      <div
                                        key={m.id}
                                        className="border border-white/10 bg-void/80 p-3.5 space-y-3 hover:border-cyan/30 transition-colors"
                                      >
                                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2">
                                          <div className="flex items-center gap-2">
                                            <span className="font-display font-black text-xs uppercase text-cyan">
                                              Match #{m.match_number}
                                            </span>
                                            {m.scheduled_time && (
                                              <span className="text-dim text-[10px] font-mono">
                                                Time: {m.scheduled_time}
                                              </span>
                                            )}
                                            <span
                                              className={`border px-1.5 py-0.2 text-[9px] font-bold uppercase ${
                                                m.status === 'COMPLETED'
                                                  ? 'border-ok/40 bg-ok/10 text-ok'
                                                  : m.status === 'LIVE'
                                                  ? 'border-live/40 bg-live/10 text-live'
                                                  : 'border-white/10 bg-void text-dim'
                                              }`}
                                            >
                                              {m.status || 'SCHEDULED'}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-1.5">
                                            {isMatchDone && (
                                              <span className="border border-ok/40 bg-ok/10 text-ok px-2 py-0.5 text-[10px] font-bold uppercase">
                                                Winner: {winnerName}
                                              </span>
                                            )}
                                            <button
                                              type="button"
                                              onClick={() => handleOpenEditMatch(rnd.id, m)}
                                              className="border border-white/15 bg-surface hover:border-cyan hover:text-cyan px-2 py-0.5 text-[10px] font-mono uppercase text-dim transition-colors cursor-pointer"
                                            >
                                              ✎ Edit
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleDeleteRoundMatch(rnd.id, m.id, m.match_number)}
                                              className="border border-live/30 bg-live/5 hover:border-live hover:bg-live/15 px-1.5 py-0.5 text-[10px] font-mono uppercase text-live transition-colors cursor-pointer"
                                              title="Delete Match"
                                            >
                                              ✕
                                            </button>
                                          </div>
                                        </div>

                                        {/* Contender A vs Contender B & Score inputs */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                                          {/* Contender A */}
                                          <div className={`p-2.5 border flex items-center justify-between gap-2 ${matchScore.winner_id === m.team_a_id ? 'border-ok/60 bg-ok/10' : 'border-white/10 bg-surface'}`}>
                                            <span className="font-display font-black text-sm uppercase truncate text-ink">
                                              {m.team_a_name || 'Contender A'}
                                            </span>
                                            <input
                                              type="number"
                                              min="0"
                                              value={matchScore.score_a}
                                              onChange={(e) =>
                                                setKnockoutScores((prev) => ({
                                                  ...prev,
                                                  [m.id]: { ...matchScore, score_a: Number(e.target.value) },
                                                }))
                                              }
                                              disabled={isCompleted}
                                              className="w-14 border border-white/20 bg-void px-2 py-1 text-center font-display font-black text-cyan text-sm outline-none"
                                            />
                                          </div>

                                          {/* Contender B */}
                                          <div className={`p-2.5 border flex items-center justify-between gap-2 ${matchScore.winner_id === m.team_b_id ? 'border-ok/60 bg-ok/10' : 'border-white/10 bg-surface'}`}>
                                            <span className="font-display font-black text-sm uppercase truncate text-ink">
                                              {m.team_b_name || 'Contender B'}
                                            </span>
                                            <input
                                              type="number"
                                              min="0"
                                              value={matchScore.score_b}
                                              onChange={(e) =>
                                                setKnockoutScores((prev) => ({
                                                  ...prev,
                                                  [m.id]: { ...matchScore, score_b: Number(e.target.value) },
                                                }))
                                              }
                                              disabled={isCompleted}
                                              className="w-14 border border-white/20 bg-void px-2 py-1 text-center font-display font-black text-cyan text-sm outline-none"
                                            />
                                          </div>
                                        </div>

                                        {/* Knockout Match Room Credentials */}
                                        <div className="border border-white/10 bg-void/60 p-2.5 rounded space-y-2">
                                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-1.5">
                                            <div className="flex items-center gap-2">
                                              <span className="font-bold text-ink uppercase text-[10px]">Match Room Credentials</span>
                                              <span
                                                className={`text-[9px] px-1.5 py-0.2 border uppercase font-bold ${
                                                  m.credentials_released
                                                    ? 'border-ok/40 bg-ok/10 text-ok'
                                                    : 'border-warn/40 bg-warn/10 text-warn'
                                                }`}
                                              >
                                                {m.credentials_released ? '✓ Sent / Released' : '🔒 Unsent (Draft)'}
                                              </span>
                                            </div>
                                          </div>
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            <div>
                                              <label className="block text-dim uppercase text-[9px] mb-0.5">
                                                Room ID <span className="text-warn">*</span>
                                              </label>
                                              <input
                                                type="text"
                                                placeholder="e.g. ROOM-KO-01"
                                                value={(knockoutMatchCreds[m.id]?.room_id !== undefined ? knockoutMatchCreds[m.id].room_id : m.room_id) || ''}
                                                onChange={(e) => {
                                                  const val = e.target.value
                                                  setKnockoutMatchCreds((prev) => ({
                                                    ...prev,
                                                    [m.id]: {
                                                      ...(prev[m.id] || { room_password: m.room_password || '', custom_instructions: m.custom_instructions || '' }),
                                                      room_id: val,
                                                    },
                                                  }))
                                                }}
                                                disabled={isCompleted}
                                                className="w-full border border-white/15 bg-surface px-2 py-1 text-xs text-ink outline-none focus:border-cyan font-bold text-cyan"
                                              />
                                            </div>
                                            <div>
                                              <label className="block text-dim uppercase text-[9px] mb-0.5">
                                                Room Password <span className="text-dim text-[8px]">(Optional)</span>
                                              </label>
                                              <input
                                                type="text"
                                                placeholder="e.g. PASS123"
                                                value={(knockoutMatchCreds[m.id]?.room_password !== undefined ? knockoutMatchCreds[m.id].room_password : m.room_password) || ''}
                                                onChange={(e) => {
                                                  const val = e.target.value
                                                  setKnockoutMatchCreds((prev) => ({
                                                    ...prev,
                                                    [m.id]: {
                                                      ...(prev[m.id] || { room_id: m.room_id || '', custom_instructions: m.custom_instructions || '' }),
                                                      room_password: val,
                                                    },
                                                  }))
                                                }}
                                                disabled={isCompleted}
                                                className="w-full border border-white/15 bg-surface px-2 py-1 text-xs text-ink outline-none focus:border-cyan font-bold text-warn"
                                              />
                                            </div>
                                          </div>
                                          <div className="flex flex-wrap items-center justify-end gap-2 pt-1 border-t border-white/5">
                                            <button
                                              type="button"
                                              onClick={() => handleSaveKnockoutMatchCreds(rnd.id, m.id)}
                                              disabled={savingKnockoutMatchCreds === m.id || isCompleted}
                                              className="border border-white/20 bg-surface px-2.5 py-0.5 font-display text-[10px] font-bold uppercase text-ink hover:border-cyan transition-colors cursor-pointer"
                                            >
                                              {savingKnockoutMatchCreds === m.id ? 'Saving...' : 'Save Credentials'}
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleReleaseKnockoutMatchCreds(rnd.id, m.id)}
                                              disabled={releasingKnockoutMatchCreds === m.id || isCompleted}
                                              className="border border-ok bg-ok px-2.5 py-0.5 font-display text-[10px] font-black uppercase text-void hover:bg-ok/90 transition-colors cursor-pointer"
                                            >
                                              {releasingKnockoutMatchCreds === m.id ? 'Sending...' : 'Send Credentials'}
                                            </button>
                                          </div>
                                        </div>

                                        {/* Winner Selection & Action Buttons */}
                                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/5">
                                          <div className="flex items-center gap-2">
                                            <span className="text-dim text-[10px] uppercase font-bold">Select Winner:</span>
                                            <select
                                              value={matchScore.winner_id}
                                              onChange={(e) =>
                                                setKnockoutScores((prev) => ({
                                                  ...prev,
                                                  [m.id]: { ...matchScore, winner_id: e.target.value },
                                                }))
                                              }
                                              disabled={isCompleted}
                                              className="border border-white/20 bg-surface px-2 py-1 text-xs text-ink outline-none focus:border-cyan"
                                            >
                                              <option value="">-- Choose Winner --</option>
                                              <option value={m.team_a_id}>{m.team_a_name}</option>
                                              <option value={m.team_b_id}>{m.team_b_name}</option>
                                            </select>
                                          </div>

                                          <div className="flex items-center gap-2">
                                            <button
                                              type="button"
                                              onClick={() =>
                                                handleRecordKnockoutMatchResult(
                                                  rnd.id,
                                                  m.id,
                                                  matchScore.winner_id,
                                                  matchScore.score_a,
                                                  matchScore.score_b
                                                )
                                              }
                                              disabled={savingMatchResultId === m.id || !matchScore.winner_id || isCompleted}
                                              className="border border-white/20 bg-surface hover:border-ok hover:text-ok px-3 py-1 font-display text-[11px] font-bold uppercase text-ink transition-colors cursor-pointer disabled:opacity-50"
                                            >
                                              {savingMatchResultId === m.id ? 'Saving...' : 'Save Result'}
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() =>
                                                handleCompleteKnockoutMatch(
                                                  rnd.id,
                                                  m.id,
                                                  matchScore.winner_id,
                                                  matchScore.score_a,
                                                  matchScore.score_b
                                                )
                                              }
                                              disabled={m.status === 'COMPLETED' || isCompleted || !matchScore.winner_id}
                                              className="border border-ok bg-ok px-3 py-1 font-display text-[11px] font-black uppercase text-void hover:bg-ok/90 transition-colors cursor-pointer disabled:opacity-50"
                                            >
                                              {m.status === 'COMPLETED' ? '✓ Completed' : 'Complete Match'}
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </Panel>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

      {/* ========================================================================= */}
      {/* MODAL 1: 3-FIELD ADD ROUND MODAL */}
      {/* ========================================================================= */}
      {isAddRoundModalOpen && (
        <Portal lockScroll>
          <div role="dialog" aria-modal className="fixed inset-0 z-[100] flex items-center justify-center bg-void/85 p-3 sm:p-6 backdrop-blur-md overflow-hidden select-none">
            <div className="relative w-full max-w-sm border border-cyan/50 bg-graphite p-6 max-h-[min(90vh,calc(100svh-2rem))] overflow-y-auto select-text">
              <Brackets color="border-cyan/50" />
              <h3 className="font-display text-xl font-black uppercase text-ink">Add Tournament Round</h3>
              <p className="text-xs text-dim mt-1">
                Configure a manual round stage. Game Mode is automatically inherited from this tournament.
              </p>
              <form onSubmit={handleCreateRoundSubmit} className="mt-4 space-y-4 font-mono text-xs">
                {/* Field 1: Stage Name */}
                <div>
                  <label className="block text-dim uppercase mb-1">Stage Name</label>
                  <input
                    type="text"
                    list="stage-name-suggestions"
                    required
                    placeholder="e.g. Round 1, Semifinals, Grand Final"
                    value={newRoundStageName}
                    onChange={(e) => setNewRoundStageName(e.target.value)}
                    className="w-full border border-white/20 bg-surface px-3 py-2 text-ink outline-none focus:border-cyan text-xs"
                  />
                  <datalist id="stage-name-suggestions">
                    {DEFAULT_STAGES.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </div>

                {/* Field 2: Competition Format (Battle Royale or Knockout - NO Round Robin) */}
                <div>
                  <label className="block text-dim uppercase mb-1">Competition Format</label>
                  <select
                    value={newRoundFormat}
                    onChange={(e) => setNewRoundFormat(e.target.value as 'Battle Royale' | 'Knockout')}
                    className="w-full border border-white/20 bg-surface px-3 py-2 text-ink outline-none focus:border-cyan text-xs"
                  >
                    <option value="Battle Royale">Battle Royale</option>
                    <option value="Knockout">Knockout</option>
                  </select>
                </div>

                {/* Field 3: This Is the Final Round */}
                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer p-2 border border-white/10 bg-surface/50 hover:border-cyan/40">
                    <input
                      type="checkbox"
                      checked={newRoundIsFinal}
                      onChange={(e) => setNewRoundIsFinal(e.target.checked)}
                      className="accent-cyan"
                    />
                    <div>
                      <span className="font-bold text-ink uppercase text-[11px] block">This Is the Final Round</span>
                      <span className="text-[10px] text-dim block">Enables champion declaration and final results workflow</span>
                    </div>
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsAddRoundModalOpen(false)}
                    className="border border-white/20 px-3 py-1.5 uppercase text-dim hover:text-ink cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingRound}
                    className="border border-cyan bg-cyan px-4 py-1.5 uppercase text-void font-bold hover:bg-cyan/90 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingRound ? 'Creating...' : 'Create Round'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: 3-FIELD KNOCKOUT MATCH MODAL */}
      {/* ========================================================================= */}
      {isAddKnockoutMatchOpen && (
        <Portal lockScroll>
          <div role="dialog" aria-modal className="fixed inset-0 z-[100] flex items-center justify-center bg-void/85 p-3 sm:p-6 backdrop-blur-md overflow-hidden select-none">
            <div className="relative w-full max-w-md border border-cyan/50 bg-graphite p-6 max-h-[min(90vh,calc(100svh-2rem))] overflow-y-auto select-text">
              <Brackets color="border-cyan/50" />
              <h3 className="font-display text-xl font-black uppercase text-ink">Add Knockout Match</h3>
              <p className="text-xs text-dim mt-1">
                Pair two eligible contenders for this round.
              </p>
              {(() => {
                const targetRound = dbRounds.find((r) => r.id === knockoutRoundId)
                const contenders = targetRound?.eligible_contenders || []
                return (
                  <form onSubmit={handleCreateKnockoutMatchSubmit} className="mt-4 space-y-4 font-mono text-xs">
                    {/* Field 1: Match Number */}
                    <div>
                      <label className="block text-dim uppercase mb-1">Match Number</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={knockoutMatchNumber}
                        onChange={(e) => setKnockoutMatchNumber(Number(e.target.value))}
                        className="w-full border border-white/20 bg-surface px-3 py-2 text-ink outline-none focus:border-cyan text-xs"
                      />
                    </div>

                    {/* Field 2: Contender A vs Contender B */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-dim uppercase mb-1">Contender A</label>
                        <select
                          value={knockoutContenderAId}
                          onChange={(e) => setKnockoutContenderAId(e.target.value)}
                          required
                          className="w-full border border-white/20 bg-surface px-3 py-2 text-ink outline-none focus:border-cyan text-xs"
                        >
                          <option value="">-- Select Contender A --</option>
                          {contenders.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} {c.tag && !isSoloTournament ? `[${c.tag}]` : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="text-center text-dim font-bold text-xs uppercase tracking-widest">VS</div>

                      <div>
                        <label className="block text-dim uppercase mb-1">Contender B</label>
                        <select
                          value={knockoutContenderBId}
                          onChange={(e) => setKnockoutContenderBId(e.target.value)}
                          required
                          className="w-full border border-white/20 bg-surface px-3 py-2 text-ink outline-none focus:border-cyan text-xs"
                        >
                          <option value="">-- Select Contender B --</option>
                          {contenders.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} {c.tag && !isSoloTournament ? `[${c.tag}]` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Field 3: Scheduled Time */}
                    <div>
                      <label className="block text-dim uppercase mb-1">Scheduled Time</label>
                      <input
                        type="text"
                        placeholder="e.g. 18:00 or 6:00 PM"
                        value={knockoutScheduledTime}
                        onChange={(e) => setKnockoutScheduledTime(e.target.value)}
                        className="w-full border border-white/20 bg-surface px-3 py-2 text-ink outline-none focus:border-cyan text-xs"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => setIsAddKnockoutMatchOpen(false)}
                        className="border border-white/20 px-3 py-1.5 uppercase text-dim hover:text-ink cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingKnockoutMatch}
                        className="border border-cyan bg-cyan px-4 py-1.5 uppercase text-void font-bold hover:bg-cyan/90 cursor-pointer disabled:opacity-50"
                      >
                        {isSubmittingKnockoutMatch ? 'Adding...' : 'Add Match'}
                      </button>
                    </div>
                  </form>
                )
              })()}
            </div>
          </div>
        </Portal>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT ROUND MODAL */}
      {/* ========================================================================= */}
      {isEditRoundModalOpen && editingRound && (
        <Portal lockScroll>
          <div role="dialog" aria-modal className="fixed inset-0 z-[100] flex items-center justify-center bg-void/85 p-3 sm:p-6 backdrop-blur-md overflow-hidden select-none">
            <div className="relative w-full max-w-md border border-cyan/50 bg-graphite p-6 max-h-[min(90vh,calc(100svh-2rem))] overflow-y-auto select-text shadow-2xl">
              <Brackets color="border-cyan/50" />
              <div className="flex items-center gap-2 mb-2">
                <span className="size-2 rounded-full bg-cyan" />
                <h3 className="font-display text-xl font-black uppercase text-ink">
                  Edit Round: {editingRound.stage_name}
                </h3>
              </div>
              <p className="text-xs text-dim mb-4">
                Update round metadata, format, final round status, and lifecycle state.
              </p>

              <form onSubmit={handleSaveEditRound} className="space-y-4 font-mono text-xs">
                <div>
                  <label className="block text-dim uppercase mb-1">Stage / Round Name *</label>
                  <input
                    type="text"
                    required
                    value={editRoundStageName}
                    onChange={(e) => setEditRoundStageName(e.target.value)}
                    className="w-full border border-white/20 bg-surface px-3 py-2 text-ink outline-none focus:border-cyan text-xs"
                  />
                </div>

                <div>
                  <label className="block text-dim uppercase mb-1">Competition Format</label>
                  <select
                    value={editRoundFormat}
                    onChange={(e) => setEditRoundFormat(e.target.value as 'Battle Royale' | 'Knockout')}
                    className="w-full border border-white/20 bg-surface px-3 py-2 text-ink outline-none focus:border-cyan text-xs"
                  >
                    <option value="Battle Royale">Battle Royale</option>
                    <option value="Knockout">Knockout</option>
                  </select>
                </div>

                <div>
                  <label className="block text-dim uppercase mb-1">Round Status</label>
                  <select
                    value={editRoundStatus}
                    onChange={(e) => setEditRoundStatus(e.target.value)}
                    className="w-full border border-white/20 bg-surface px-3 py-2 text-ink outline-none focus:border-cyan text-xs"
                  >
                    <option value="UPCOMING">UPCOMING</option>
                    <option value="LIVE">LIVE</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>

                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer p-2 border border-white/10 bg-surface/50 hover:border-cyan/40">
                    <input
                      type="checkbox"
                      checked={editRoundIsFinal}
                      onChange={(e) => setEditRoundIsFinal(e.target.checked)}
                      className="accent-cyan"
                    />
                    <div>
                      <span className="font-bold text-ink uppercase text-[11px] block">This Is the Final Round</span>
                      <span className="text-[10px] text-dim block">Enables champion declaration and final results workflow</span>
                    </div>
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditRoundModalOpen(false)
                      setEditingRound(null)
                    }}
                    className="border border-white/20 px-3 py-1.5 uppercase text-dim hover:text-ink cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingEditRound || !editRoundStageName.trim()}
                    className="border border-cyan bg-cyan px-4 py-1.5 uppercase text-void font-bold hover:bg-cyan/90 cursor-pointer disabled:opacity-50"
                  >
                    {isSavingEditRound ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DELETE ROUND CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {roundToDelete && (
        <Portal lockScroll>
          <div role="dialog" aria-modal className="fixed inset-0 z-[100] flex items-center justify-center bg-void/85 p-3 sm:p-6 backdrop-blur-md overflow-hidden select-none">
            <div className="relative w-full max-w-md border border-live/50 bg-graphite p-6 max-h-[min(90vh,calc(100svh-2rem))] overflow-y-auto select-text shadow-2xl">
              <Brackets color="border-live/50" />
              <div className="flex items-center gap-2 mb-2">
                <span className="size-2 rounded-full bg-live" />
                <h3 className="font-display text-xl font-black uppercase text-live">
                  Delete Round: {roundToDelete.stage_name}
                </h3>
              </div>
              <p className="text-xs text-ink/90 leading-relaxed mb-4">
                Are you sure you want to delete <strong>{roundToDelete.stage_name}</strong>? All associated matches and recorded results in this round will be permanently deleted.
              </p>
              <div className="p-3 border border-warn/30 bg-warn/10 text-warn text-xs mb-4">
                ⚠️ This action cannot be undone. Any later rounds that depend on qualifiers from this round will have their qualification lineage removed.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setRoundToDelete(null)}
                  className="border border-white/20 px-3 py-1.5 uppercase text-dim hover:text-ink cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteRound}
                  disabled={isDeletingRound}
                  className="border border-live bg-live px-4 py-1.5 uppercase text-white font-bold hover:bg-live/90 cursor-pointer disabled:opacity-50"
                >
                  {isDeletingRound ? 'Deleting...' : 'Confirm Delete Round'}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT KNOCKOUT MATCH MODAL */}
      {/* ========================================================================= */}
      {isEditMatchModalOpen && editingMatchData && (
        <Portal lockScroll>
          <div role="dialog" aria-modal className="fixed inset-0 z-[100] flex items-center justify-center bg-void/85 p-3 sm:p-6 backdrop-blur-md overflow-hidden select-none">
            <div className="relative w-full max-w-md border border-cyan/50 bg-graphite p-6 max-h-[min(90vh,calc(100svh-2rem))] overflow-y-auto select-text shadow-2xl">
              <Brackets color="border-cyan/50" />
              <div className="flex items-center gap-2 mb-2">
                <span className="size-2 rounded-full bg-cyan" />
                <h3 className="font-display text-xl font-black uppercase text-ink">
                  Edit Match #{editMatchNumber}
                </h3>
              </div>
              <p className="text-xs text-dim mb-4">
                Update contenders, match number, scheduled time, and custom lobby instructions.
              </p>
              {(() => {
                const targetRound = dbRounds.find((r) => r.id === editingMatchData.roundId)
                const contenders = targetRound?.eligible_contenders || []
                return (
                  <form onSubmit={handleSaveEditMatch} className="space-y-4 font-mono text-xs">
                    <div>
                      <label className="block text-dim uppercase mb-1">Match Number</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={editMatchNumber}
                        onChange={(e) => setEditMatchNumber(Number(e.target.value))}
                        className="w-full border border-white/20 bg-surface px-3 py-2 text-ink outline-none focus:border-cyan text-xs"
                      />
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-dim uppercase mb-1">Contender A</label>
                        <select
                          value={editMatchContenderA}
                          onChange={(e) => setEditMatchContenderA(e.target.value)}
                          required
                          className="w-full border border-white/20 bg-surface px-3 py-2 text-ink outline-none focus:border-cyan text-xs"
                        >
                          <option value="">-- Select Contender A --</option>
                          {contenders.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} {c.tag && !isSoloTournament ? `[${c.tag}]` : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="text-center text-dim font-bold text-xs uppercase tracking-widest">VS</div>

                      <div>
                        <label className="block text-dim uppercase mb-1">Contender B</label>
                        <select
                          value={editMatchContenderB}
                          onChange={(e) => setEditMatchContenderB(e.target.value)}
                          required
                          className="w-full border border-white/20 bg-surface px-3 py-2 text-ink outline-none focus:border-cyan text-xs"
                        >
                          <option value="">-- Select Contender B --</option>
                          {contenders.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} {c.tag && !isSoloTournament ? `[${c.tag}]` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-dim uppercase mb-1">Scheduled Time</label>
                      <input
                        type="text"
                        placeholder="e.g. 18:00 or 6:00 PM"
                        value={editMatchTime}
                        onChange={(e) => setEditMatchTime(e.target.value)}
                        className="w-full border border-white/20 bg-surface px-3 py-2 text-ink outline-none focus:border-cyan text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-dim uppercase mb-1">Custom Instructions (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Map: Erangel, Server: Asia"
                        value={editMatchCustomInstructions}
                        onChange={(e) => setEditMatchCustomInstructions(e.target.value)}
                        className="w-full border border-white/20 bg-surface px-3 py-2 text-ink outline-none focus:border-cyan text-xs"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditMatchModalOpen(false)
                          setEditingMatchData(null)
                        }}
                        className="border border-white/20 px-3 py-1.5 uppercase text-dim hover:text-ink cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingEditMatch}
                        className="border border-cyan bg-cyan px-4 py-1.5 uppercase text-void font-bold hover:bg-cyan/90 cursor-pointer disabled:opacity-50"
                      >
                        {isSavingEditMatch ? 'Saving...' : 'Save Match'}
                      </button>
                    </div>
                  </form>
                )
              })()}
            </div>
          </div>
        </Portal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ROUND MVP MODAL */}
      {/* ========================================================================= */}
      {mvpModalOpen && activeEndingRound && (
        <Portal lockScroll>
          <div role="dialog" aria-modal className="fixed inset-0 z-[100] flex items-center justify-center bg-void/85 p-3 sm:p-6 backdrop-blur-md overflow-hidden select-none">
            <div className="relative w-full max-w-md border border-cyan/50 bg-graphite p-6 max-h-[min(90vh,calc(100svh-2rem))] overflow-y-auto select-text">
              <Brackets color="border-cyan/50" />
              <div className="flex items-center gap-2 mb-2">
                <span className="size-2 rounded-full bg-cyan" />
                <h3 className="font-display text-xl font-black uppercase text-ink">
                  Round MVP Selection
                </h3>
              </div>
              <p className="text-xs text-dim">
                Who is the MVP of {activeEndingRound.stage_name}?
              </p>

              <form onSubmit={handleSaveRoundMvpSubmit} className="mt-4 space-y-4 font-mono text-xs">
                <div>
                  <label className="block text-dim uppercase mb-1">MVP Player Name / Handle *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter MVP player name or gamer tag..."
                    value={mvpPlayerName}
                    onChange={(e) => setMvpPlayerName(e.target.value)}
                    className="w-full border border-white/20 bg-surface px-3 py-2 text-ink outline-none focus:border-cyan text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-dim uppercase mb-1">Key Performance Stats (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 18 Kills, 4200 Damage, Clutch Win"
                    value={mvpStats}
                    onChange={(e) => setMvpStats(e.target.value)}
                    className="w-full border border-white/20 bg-surface px-3 py-2 text-ink outline-none focus:border-cyan text-xs"
                  />
                </div>

                <div>
                  <label className="block text-dim uppercase mb-1">Notes / Highlights (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Outstanding 1v3 round defense"
                    value={mvpNotes}
                    onChange={(e) => setMvpNotes(e.target.value)}
                    className="w-full border border-white/20 bg-surface px-3 py-2 text-ink outline-none focus:border-cyan text-xs"
                  />
                </div>

                <div className="flex justify-between items-center gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setMvpModalOpen(false)
                      proceedToFinalResultsOrEnd(activeEndingRound)
                    }}
                    className="border border-white/20 px-3 py-1.5 uppercase text-dim hover:text-ink cursor-pointer"
                  >
                    Skip MVP
                  </button>
                  <button
                    type="submit"
                    disabled={savingMvp || !mvpPlayerName.trim()}
                    className="border border-cyan bg-cyan px-4 py-1.5 uppercase text-void font-bold hover:bg-cyan/90 cursor-pointer disabled:opacity-50"
                  >
                    {savingMvp ? 'Saving...' : 'Save MVP & Continue'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: TOURNAMENT MVP MODAL */}
      {/* ========================================================================= */}
      {tournMvpModalOpen && activeEndingRound && (
        <Portal lockScroll>
          <div role="dialog" aria-modal className="fixed inset-0 z-[100] flex items-center justify-center bg-void/85 p-3 sm:p-6 backdrop-blur-md overflow-hidden select-none">
            <div className="relative w-full max-w-md border border-warn bg-graphite p-6 max-h-[min(90vh,calc(100svh-2rem))] overflow-y-auto select-text">
              <Brackets color="border-warn/60" />
              <div className="flex items-center gap-2 mb-2">
                <span className="size-2 rounded-full bg-warn" />
                <h3 className="font-display text-xl font-black uppercase text-ink">
                  ⭐ Tournament MVP Selection
                </h3>
              </div>
              <p className="text-xs text-dim">
                Who is the overall Most Valuable Player of the tournament?
              </p>

              <form onSubmit={handleSaveTournMvpSubmit} className="mt-4 space-y-4 font-mono text-xs">
                <div>
                  <label className="block text-dim uppercase mb-1">Tournament MVP Player Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter overall MVP player name..."
                    value={tournMvpPlayerName}
                    onChange={(e) => setTournMvpPlayerName(e.target.value)}
                    className="w-full border border-white/20 bg-surface px-3 py-2 text-ink outline-none focus:border-warn text-xs font-bold text-warn"
                  />
                </div>

                <div>
                  <label className="block text-dim uppercase mb-1">Tournament Stats (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 45 Tournament Kills, 2.8 K/D Ratio"
                    value={tournMvpStats}
                    onChange={(e) => setTournMvpStats(e.target.value)}
                    className="w-full border border-white/20 bg-surface px-3 py-2 text-ink outline-none focus:border-warn text-xs"
                  />
                </div>

                <div>
                  <label className="block text-dim uppercase mb-1">Tournament Highlights (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. MVP in 3 of 4 rounds"
                    value={tournMvpNotes}
                    onChange={(e) => setTournMvpNotes(e.target.value)}
                    className="w-full border border-white/20 bg-surface px-3 py-2 text-ink outline-none focus:border-warn text-xs"
                  />
                </div>

                <div className="flex justify-between items-center gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setTournMvpModalOpen(false)
                      openFinalResultsModal(activeEndingRound)
                    }}
                    className="border border-white/20 px-3 py-1.5 uppercase text-dim hover:text-ink cursor-pointer"
                  >
                    Skip
                  </button>
                  <button
                    type="submit"
                    disabled={!tournMvpPlayerName.trim()}
                    className="border border-warn bg-warn px-4 py-1.5 uppercase text-void font-bold hover:bg-warn/90 cursor-pointer disabled:opacity-50"
                  >
                    Save Tournament MVP &amp; Results
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: FINAL TOURNAMENT RESULTS & AWARDS MODAL */}
      {/* ========================================================================= */}
      {finalResultsModalOpen && activeEndingRound && (
        <Portal lockScroll>
          <div role="dialog" aria-modal className="fixed inset-0 z-[100] flex items-center justify-center bg-void/85 p-3 sm:p-6 backdrop-blur-md overflow-hidden select-none">
            <div className="relative w-full max-w-2xl border border-cyan/50 bg-graphite p-6 max-h-[min(90vh,calc(100svh-2rem))] overflow-y-auto select-text shadow-2xl">
              <Brackets color="border-cyan/50" />
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <h3 className="font-display text-2xl font-black uppercase text-ink">
                    🏆 Final Tournament Standings &amp; Awards
                  </h3>
                  <p className="text-xs text-dim mt-0.5">
                    Configure official awards and assign recipients for {currentFormationTourn?.title}.
                  </p>
                </div>
                {activeEndingRound.champion_name && (
                  <span className="border border-warn/40 bg-warn/10 text-warn px-2.5 py-1 text-[11px] font-black uppercase">
                    Champion: {activeEndingRound.champion_name}
                  </span>
                )}
              </div>

              <form onSubmit={handleSaveFinalResultsSubmit} className="mt-4 space-y-4 font-mono text-xs">
                {/* Award Rows Table */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-ink uppercase text-[11px]">Award Placements</span>
                    <button
                      type="button"
                      onClick={() =>
                        setFinalResultRows((prev) => [
                          ...prev,
                          {
                            id: `res_${Date.now()}`,
                            award_name: `Rank ${prev.length + 1}`,
                            recipient_type: isSoloTournament ? 'PLAYER' : 'TEAM',
                            recipient_id: '',
                            recipient_name: '',
                            display_order: prev.length + 1,
                            prize_amount: 0,
                          },
                        ])
                      }
                      className="border border-cyan/60 bg-cyan/15 px-2.5 py-1 text-[10px] uppercase font-bold text-cyan hover:bg-cyan hover:text-void cursor-pointer"
                    >
                      + Add Award Row
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                    {finalResultRows.map((row, idx) => {
                      // Conflict detection: if award name contains "1st" or "first" or "champion" and recipient != activeEndingRound.champion_name
                      const isFirstPlace = /1st|first|champion/i.test(row.award_name)
                      const hasConflict =
                        isFirstPlace &&
                        Boolean(activeEndingRound.champion_name) &&
                        Boolean(row.recipient_name) &&
                        row.recipient_name.trim().toLowerCase() !== (activeEndingRound.champion_name || '').trim().toLowerCase()

                      return (
                        <div
                          key={row.id || idx}
                          className={`p-3 border space-y-2 ${hasConflict ? 'border-warn/60 bg-warn/5' : 'border-white/10 bg-void/70'}`}
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                            {/* Award Name */}
                            <div className="sm:col-span-4">
                              <label className="block text-dim uppercase text-[9px] mb-0.5">Award / Rank Name</label>
                              <input
                                type="text"
                                required
                                value={row.award_name}
                                onChange={(e) => {
                                  const val = e.target.value
                                  setFinalResultRows((prev) => {
                                    const next = [...prev]
                                    next[idx] = { ...next[idx], award_name: val }
                                    return next
                                  })
                                }}
                                className="w-full border border-white/20 bg-surface px-2.5 py-1 text-xs text-ink outline-none focus:border-cyan"
                              />
                            </div>

                            {/* Recipient Picker / Input */}
                            <div className="sm:col-span-5">
                              <label className="block text-dim uppercase text-[9px] mb-0.5">Recipient ({isSoloTournament ? 'Player' : 'Team'})</label>
                              <input
                                type="text"
                                required
                                placeholder={isSoloTournament ? 'Player name / tag' : 'Team / Squad name'}
                                value={row.recipient_name}
                                onChange={(e) => {
                                  const val = e.target.value
                                  setFinalResultRows((prev) => {
                                    const next = [...prev]
                                    next[idx] = { ...next[idx], recipient_name: val }
                                    return next
                                  })
                                }}
                                className="w-full border border-white/20 bg-surface px-2.5 py-1 text-xs text-ink outline-none focus:border-cyan font-bold"
                              />
                            </div>

                            {/* Prize Amount */}
                            <div className="sm:col-span-2">
                              <label className="block text-dim uppercase text-[9px] mb-0.5">Prize (₹)</label>
                              <input
                                type="number"
                                min="0"
                                value={row.prize_amount ?? 0}
                                onChange={(e) => {
                                  const val = Number(e.target.value)
                                  setFinalResultRows((prev) => {
                                    const next = [...prev]
                                    next[idx] = { ...next[idx], prize_amount: val }
                                    return next
                                  })
                                }}
                                className="w-full border border-white/20 bg-surface px-2 py-1 text-xs text-ink outline-none focus:border-cyan text-right font-mono"
                              />
                            </div>

                            {/* Remove button */}
                            <div className="sm:col-span-1 flex items-end justify-center pt-3 sm:pt-0">
                              <button
                                type="button"
                                onClick={() => setFinalResultRows((prev) => prev.filter((_, i) => i !== idx))}
                                disabled={finalResultRows.length <= 1}
                                className="text-live hover:text-white px-2 py-1 border border-live/30 text-xs cursor-pointer disabled:opacity-30"
                                title="Remove row"
                              >
                                ✕
                              </button>
                            </div>
                          </div>

                          {/* Conflict Warning Indicator */}
                          {hasConflict && (
                            <div className="p-2 border border-warn/40 bg-warn/15 text-warn text-[10px] font-mono leading-tight">
                              ⚠️ <strong>Champion Conflict:</strong> Award &quot;{row.award_name}&quot; recipient &quot;{row.recipient_name}&quot; does not match recorded Tournament Champion &quot;{activeEndingRound.champion_name}&quot;. (Warning only — admin may proceed).
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setFinalResultsModalOpen(false)}
                    className="border border-white/20 px-4 py-2 uppercase text-dim hover:text-ink cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingFinalResults}
                    className="border border-ok bg-ok px-5 py-2 uppercase text-xs font-black text-void hover:bg-ok/90 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {savingFinalResults ? 'Finalizing Tournament...' : '🏆 Save & Finalize Tournament'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* EDIT CREDENTIALS MODAL */}
      <EditLobbyCredentialsModal
        isOpen={!!credentialModalMatch}
        match={credentialModalMatch}
        tournamentTitle={
          tournaments.find(
            (t) =>
              t.id === credentialModalMatch?.tournament_id ||
              t.slug === credentialModalMatch?.tournament_id
          )?.title
        }
        onClose={() => setCredentialModalMatch(null)}
        onSave={async (payload) => {
          if (!credentialModalMatch) return
          await updateMatchCredentialsAdmin(credentialModalMatch.id, payload)
          showBanner('✓ Credentials saved in confidential state.')
          setCredentialModalMatch(null)
          fetchMatches()
          if (selectedTournId !== 'ALL') fetchRoundsData(selectedTournId)
        }}
      />

      {/* ROUND REVIEW & QUALIFICATIONS MODAL */}
      {roundReviewTarget && (
        <RoundReviewAndRatingModal
          isOpen={roundReviewModalOpen}
          tournamentId={roundReviewTarget.tournamentId}
          tournamentTitle={roundReviewTarget.tournamentTitle}
          roundName={roundReviewTarget.roundName}
          onClose={() => {
            setRoundReviewModalOpen(false)
            setRoundReviewTarget(null)
          }}
          onFinalized={() => {
            fetchMatches()
            if (selectedTournId !== 'ALL') fetchRoundsData(selectedTournId)
            onMatchesUpdated?.()
          }}
        />
      )}

      {/* BATTLE ROYALE RESULTS & QUALIFIERS MODAL */}
      <BattleRoyaleResultsModal
        isOpen={!!brResultsMatch}
        onClose={() => setBrResultsMatch(null)}
        match={brResultsMatch}
        tournamentTitle={
          tournaments.find((t) => t.id === brResultsMatch?.tournament_id || t.slug === brResultsMatch?.tournament_id)?.title
        }
        onSuccess={(res) => {
          showBanner(res?.message || '✓ Battle Royale results finalized and qualifiers advanced!')
          setBrResultsMatch(null)
          fetchMatches()
          if (selectedTournId !== 'ALL') fetchRoundsData(selectedTournId)
          onMatchesUpdated?.()
        }}
      />

      {/* PARTICIPANT RATINGS MODAL */}
      {ratingsModalMatch && (
        <Portal lockScroll>
          <div role="dialog" aria-modal className="fixed inset-0 z-[100] flex items-center justify-center bg-void/85 p-3 sm:p-6 backdrop-blur-md overflow-hidden select-none">
            <div className="relative w-full max-w-2xl border border-cyan/50 bg-graphite p-6 max-h-[min(90vh,calc(100svh-2rem))] overflow-y-auto select-text shadow-2xl">
              <Brackets color="border-cyan/50" />
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div>
                  <h3 className="font-display text-2xl font-black uppercase text-ink">
                    ★ Post-Match Player Ratings
                  </h3>
                  <p className="text-xs text-dim mt-0.5 font-mono">
                    Match #{ratingsModalMatch.match_number || 1} • {ratingsModalMatch.round_name || ratingsModalMatch.stage || 'Round 1'}
                  </p>
                </div>
                <span className="text-[10px] text-cyan font-bold uppercase font-mono border border-cyan/30 px-2 py-0.5 bg-cyan/10">
                  {ratingsList.length} Player(s)
                </span>
              </div>
              <p className="text-xs text-dim mt-2 font-mono leading-relaxed">
                Assign 1-10 performance ratings and optional skill adjustments (+/- MMR) for each participant who competed in this match.
              </p>

              {loadingRatings ? (
                <div className="p-8 text-center text-dim font-mono text-xs">Loading participants...</div>
              ) : (
                <form onSubmit={handleSubmitRatings} className="mt-4 space-y-4 font-mono text-xs">
                  <div className="max-h-[360px] overflow-y-auto space-y-3 pr-1">
                    {ratingsList.length === 0 ? (
                      <div className="p-6 border border-white/10 text-center text-dim">
                        No individual player roster found for this match.
                      </div>
                    ) : (
                      ratingsList.map((item, idx) => (
                        <div key={item.user_id || idx} className="border border-white/10 bg-void/70 p-3 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            {/* Player Info */}
                            <div className="flex items-center gap-2.5 min-w-0">
                              {item.avatar_url ? (
                                <img
                                  src={item.avatar_url}
                                  alt={item.username || 'Player'}
                                  className="size-8 rounded-full object-cover border border-white/20 shrink-0"
                                />
                              ) : (
                                <div className="size-8 rounded-full bg-cyan/15 border border-cyan/40 text-cyan flex items-center justify-center font-bold uppercase text-xs shrink-0">
                                  {(item.display_name || item.username || 'PL').slice(0, 2)}
                                </div>
                              )}
                              <div className="min-w-0">
                                <span className="font-display font-black text-ink text-sm uppercase block truncate">
                                  {item.display_name || item.username}
                                </span>
                                <span className="text-[10px] text-dim block truncate">
                                  {item.team_name || 'Solo Contender'} • MMR: <span className="text-cyan font-bold">{item.current_rating || 500}</span>
                                </span>
                              </div>
                            </div>

                            {/* Performance Rating (1-10) with +/- buttons */}
                            <div className="flex items-center gap-3 shrink-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-dim text-[11px]">Rating:</span>
                                <div className="flex items-center border border-cyan/40 bg-surface">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const val = Math.max(1, Math.round(((item.rating || 8) - 0.5) * 10) / 10)
                                      setRatingsList((prev) => {
                                        const next = [...prev]
                                        next[idx] = { ...next[idx], rating: val }
                                        return next
                                      })
                                    }}
                                    className="px-2 py-1 text-dim hover:text-cyan font-bold cursor-pointer"
                                    title="Decrease rating"
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    step="0.5"
                                    value={item.rating}
                                    onChange={(e) => {
                                      const val = Math.min(10, Math.max(1, parseFloat(e.target.value) || 1))
                                      setRatingsList((prev) => {
                                        const next = [...prev]
                                        next[idx] = { ...next[idx], rating: val }
                                        return next
                                      })
                                    }}
                                    className="w-12 border-0 bg-transparent text-center font-display font-black text-cyan text-sm outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const val = Math.min(10, Math.round(((item.rating || 8) + 0.5) * 10) / 10)
                                      setRatingsList((prev) => {
                                        const next = [...prev]
                                        next[idx] = { ...next[idx], rating: val }
                                        return next
                                      })
                                    }}
                                    className="px-2 py-1 text-dim hover:text-cyan font-bold cursor-pointer"
                                    title="Increase rating"
                                  >
                                    +
                                  </button>
                                </div>
                                <span className="text-dim text-[10px]">/ 10</span>
                              </div>

                              {/* Skill Adjustment Delta */}
                              <div className="flex items-center gap-1">
                                <select
                                  value={item.skill_adjustment || 0}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value, 10) || 0
                                    setRatingsList((prev) => {
                                      const next = [...prev]
                                      next[idx] = { ...next[idx], skill_adjustment: val }
                                      return next
                                    })
                                  }}
                                  className="border border-white/20 bg-surface px-1.5 py-1 text-ink outline-none focus:border-cyan text-xs font-bold"
                                  title="Skill MMR Adjustment"
                                >
                                  <option value="0">±0 MMR</option>
                                  <option value="25">+25 MMR</option>
                                  <option value="15">+15 MMR</option>
                                  <option value="10">+10 MMR</option>
                                  <option value="5">+5 MMR</option>
                                  <option value="-5">-5 MMR</option>
                                  <option value="-10">-10 MMR</option>
                                  <option value="-15">-15 MMR</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          <div>
                            <input
                              type="text"
                              placeholder="Optional performance review / notes..."
                              value={item.review || ''}
                              onChange={(e) => {
                                const val = e.target.value
                                setRatingsList((prev) => {
                                  const next = [...prev]
                                  next[idx] = { ...next[idx], review: val, notes: val }
                                  return next
                                })
                              }}
                              className="w-full border border-white/10 bg-surface px-3 py-1.5 text-xs text-ink outline-none focus:border-cyan placeholder:text-dim/40"
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setRatingsModalMatch(null)}
                      className="border border-white/20 px-4 py-2 uppercase text-dim hover:text-ink cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingRatings || ratingsList.length === 0}
                      className="border border-cyan bg-cyan px-5 py-2 uppercase text-xs font-bold text-void hover:bg-cyan/90 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {submittingRatings ? 'Saving...' : 'Submit Player Ratings'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </Portal>
      )}
    </div>
  )
}
