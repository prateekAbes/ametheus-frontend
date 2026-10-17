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
} from '../../services/matches'
import { type Tournament } from '../../services/tournaments'
import { resolveMediaUrl } from '../../services/apiClient'
import { Panel, Hud, Badge, Brackets } from '../ui'
import { Portal } from '../Modal'

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
  lobby_code?: string
  lobby_password?: string
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
      setActiveTab('FORMATION')
    }
  }, [initialTournamentId])

  // Banner message
  const [bannerMsg, setBannerMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const showBanner = (text: string, type: 'ok' | 'err' = 'ok') => {
    setBannerMsg({ type, text })
    setTimeout(() => setBannerMsg(null), 5000)
  }

  // -------------------------------------------------------------
  // CLOSED TOURNAMENTS ONLY FILTER (Excludes open, upcoming, completed, cancelled)
  // -------------------------------------------------------------
  const closedTournaments = useMemo(() => {
    return tournaments.filter((t) => {
      const regStatus = (t.registration_status || '').toUpperCase()
      const status = (t.status || '').toUpperCase()
      const isRegClosed = regStatus === 'CLOSED' || status === 'REGISTRATION_CLOSED'
      const isCompletedOrCancelled = status === 'COMPLETED' || status === 'CANCELLED'
      return isRegClosed && !isCompletedOrCancelled
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
                lobby_code: m.lobby_code,
                lobby_password: m.lobby_password,
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

  // Re-fetch when target tournament in formation workspace changes
  useEffect(() => {
    if (formationTournId) {
      loadFormationData(formationTournId)
    }
  }, [formationTournId, loadFormationData])

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

    setFormationMatchRound(roundName)
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

    if (formationMatchFormData.format === 'Battle Royale') {
      if (formationMatchFormData.selected_team_ids.length < 2) {
        alert('Please select at least 2 contender squads for a Battle Royale match.')
        return
      }
      teamsList = formationRosters
        .filter((r) => formationMatchFormData.selected_team_ids.includes(r.team_id))
        .map((r) => ({ id: r.team_id, name: r.team_name, tag: r.team_tag }))
    } else {
      if (formationMatchFormData.team_a_mode === 'ROSTER') {
        const t = formationRosters.find((r) => r.team_id === formationMatchFormData.team_a_id)
        teamAName = t?.team_name
      } else {
        teamAName = formationMatchFormData.team_a_placeholder.trim() || 'TBD (Team A)'
      }

      if (formationMatchFormData.team_b_mode === 'ROSTER') {
        const t = formationRosters.find((r) => r.team_id === formationMatchFormData.team_b_id)
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
    lobby_code: '',
    lobby_password: '',
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
    lobby_code: '',
    lobby_password: '',
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
      room_id: m.room_id || m.lobby_code || '',
      room_password: m.room_password || m.lobby_password || '',
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
        `Release room credentials and open check-in for Match #${m.match_number || 1}? Registered participants will receive in-app alerts and access room credentials immediately.`
      )
    )
      return
    try {
      await releaseMatchCredentialsAdmin(m.id)
      showBanner('✓ Credentials released to participants! Check-in is now OPEN.')
      fetchMatches()
      if (selectedTournId !== 'ALL') fetchRoundsData(selectedTournId)
      onMatchesUpdated?.()
    } catch (err: any) {
      showBanner(err?.message || 'Failed to release credentials', 'err')
    }
  }

  // Battle Royale Modal State & Handlers
  const [brResultsMatch, setBrResultsMatch] = useState<ApiMatch | null>(null)
  const [brTeamResults, setBrTeamResults] = useState<BattleRoyaleTeamResultInput[]>([])
  const [brScoringMatrix, setBrScoringMatrix] = useState<Record<string, number>>({
    '1': 10,
    '2': 6,
    '3': 5,
    '4': 4,
    '5': 3,
    '6': 2,
    '7': 1,
    '8': 1,
  })
  const [submittingBrResults, setSubmittingBrResults] = useState(false)

  const handleOpenBrResultsModal = (m: ApiMatch) => {
    setBrResultsMatch(m)
    const squads: BattleRoyaleTeamResultInput[] = []
    if (Array.isArray(m.teams) && m.teams.length > 0) {
      m.teams.forEach((t: any, idx: number) => {
        const place = idx + 1
        const pts = brScoringMatrix[String(place)] ?? 0
        squads.push({
          team_id: String(t.id || t._id || `squad-${idx}`),
          team_name: t.name || `Squad ${idx + 1}`,
          placement: place,
          kills: 0,
          placement_points: pts,
          elimination_points: 0,
          total_points: pts,
        })
      })
    } else if (Array.isArray(m.team_ids) && m.team_ids.length > 0) {
      m.team_ids.forEach((tid: string, idx: number) => {
        const found = tournRosters.find((r) => r.team_id === tid)
        const place = idx + 1
        const pts = brScoringMatrix[String(place)] ?? 0
        squads.push({
          team_id: tid,
          team_name: found?.team_name || `Squad ${idx + 1}`,
          placement: place,
          kills: 0,
          placement_points: pts,
          elimination_points: 0,
          total_points: pts,
        })
      })
    } else {
      if (m.team_a_id) {
        squads.push({
          team_id: m.team_a_id,
          team_name: m.team_a?.name || m.team_a_name || 'Squad A',
          placement: 1,
          kills: 0,
          placement_points: 10,
          elimination_points: 0,
          total_points: 10,
        })
      }
      if (m.team_b_id) {
        squads.push({
          team_id: m.team_b_id,
          team_name: m.team_b?.name || m.team_b_name || 'Squad B',
          placement: 2,
          kills: 0,
          placement_points: 6,
          elimination_points: 0,
          total_points: 6,
        })
      }
    }
    setBrTeamResults(squads)
  }

  const handleUpdateBrRow = (index: number, field: 'placement' | 'kills', val: number) => {
    setBrTeamResults((prev) => {
      const copy = [...prev]
      const row = { ...copy[index] }
      if (field === 'placement') row.placement = val
      if (field === 'kills') row.kills = val

      const placementPts = brScoringMatrix[String(row.placement)] ?? 0
      const elimPts = Number(row.kills || 0) * 1
      row.placement_points = placementPts
      row.elimination_points = elimPts
      row.total_points = placementPts + elimPts

      copy[index] = row
      return copy
    })
  }

  const handleSubmitBrResults = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!brResultsMatch) return
    setSubmittingBrResults(true)
    try {
      const res = await submitBattleRoyaleResultsAdmin(brResultsMatch.id, {
        team_results: brTeamResults,
        scoring_matrix: brScoringMatrix,
      })
      showBanner(`✓ Battle Royale match finalized! Winner: ${res.winner_team_name}`)
      setBrResultsMatch(null)
      fetchMatches()
      if (selectedTournId !== 'ALL') fetchRoundsData(selectedTournId)
      onMatchesUpdated?.()
    } catch (err: any) {
      alert(err?.message || 'Failed to submit Battle Royale results')
    } finally {
      setSubmittingBrResults(false)
    }
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
      if (existing?.ratings && existing.ratings.length > 0) {
        setRatingsList(existing.ratings)
      } else {
        const items: ParticipantRatingItem[] = []
        if (m.team_a_details?.members) {
          m.team_a_details.members.forEach((mem: any) => {
            if (mem.id) {
              items.push({
                user_id: mem.id,
                username: mem.name || mem.handle || 'Player',
                team_id: m.team_a_id,
                rating: 8,
                review: '',
              })
            }
          })
        }
        if (m.team_b_details?.members) {
          m.team_b_details.members.forEach((mem: any) => {
            if (mem.id) {
              items.push({
                user_id: mem.id,
                username: mem.name || mem.handle || 'Player',
                team_id: m.team_b_id,
                rating: 8,
                review: '',
              })
            }
          })
        }
        if (items.length === 0) {
          if (m.team_a_id) {
            items.push({
              user_id: m.team_a_id,
              username: m.team_a?.name || m.team_a_name || 'Team A',
              team_id: m.team_a_id,
              rating: 8,
              review: '',
            })
          }
          if (m.team_b_id) {
            items.push({
              user_id: m.team_b_id,
              username: m.team_b?.name || m.team_b_name || 'Team B',
              team_id: m.team_b_id,
              rating: 8,
              review: '',
            })
          }
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
      await submitMatchRatingsAdmin(ratingsModalMatch.id, ratingsList)
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
      const data = await getMatches()
      if (Array.isArray(data)) {
        setMatches(data)
      }
    } catch (err: any) {
      console.warn('Failed to load matches:', err)
    } finally {
      setLoading(false)
    }
  }, [])

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
        lobby_code: addMatchData.lobby_code.trim() || undefined,
        lobby_password: addMatchData.lobby_password.trim() || undefined,
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
        lobby_code: editForm.lobby_code.trim() || undefined,
        lobby_password: editForm.lobby_password.trim() || undefined,
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
      {/* VIEW SWITCHER TABS: Live Operations vs Manual Formation Builder */}
      <div className="flex border-b border-white/10 bg-void/80 p-1 gap-2">
        <button
          onClick={() => setActiveTab('OPERATIONS')}
          className={`px-4 py-2 font-display text-xs font-black uppercase tracking-wider transition-colors cursor-pointer border ${
            activeTab === 'OPERATIONS'
              ? 'border-cyan bg-cyan/15 text-cyan'
              : 'border-white/10 bg-surface/50 text-dim hover:text-ink'
          }`}
        >
          ⚡ Live Matches &amp; Operations
        </button>
        <button
          onClick={() => {
            setActiveTab('FORMATION')
            if (!formationTournId && closedTournaments.length > 0) {
              const defaultClosedId = closedTournaments[0].id || closedTournaments[0].slug || ''
              setFormationTournId(defaultClosedId)
            }
          }}
          className={`px-4 py-2 font-display text-xs font-black uppercase tracking-wider transition-colors cursor-pointer border ${
            activeTab === 'FORMATION'
              ? 'border-cyan bg-cyan/15 text-cyan'
              : 'border-white/10 bg-surface/50 text-dim hover:text-ink'
          }`}
        >
          🎯 Create Match &amp; Formation Workspace
        </button>
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
      {/* VIEW 1: CREATE MATCH & FORMATION WORKSPACE (Strict Zero Default Rounds/Matches) */}
      {/* ========================================================================= */}
      {activeTab === 'FORMATION' && (
        <div className="space-y-6">
          {/* Target Tournament Dropdown (ONLY Registration Closed tournaments) */}
          <Panel className="p-4 md:p-5 border-white/15 bg-surface/50 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <Hud className="text-cyan">Create Match Formation</Hud>
                <h3 className="font-display text-xl font-black uppercase text-ink mt-1">
                  Target Tournament Selector
                </h3>
                <p className="text-xs text-dim">
                  Select a tournament whose registration is closed to build its round rosters and manual progression.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-dim uppercase font-bold text-[11px] shrink-0">Closed Tournaments:</span>
                <select
                  value={formationTournId}
                  onChange={(e) => setFormationTournId(e.target.value)}
                  className="border border-white/20 bg-void px-3 py-2 text-xs text-ink outline-none focus:border-cyan min-w-[260px]"
                >
                  <option value="">-- Select Closed Tournament --</option>
                  {closedTournaments.map((t) => (
                    <option key={t.id || t.slug} value={t.id || t.slug}>
                      {t.title} [REGISTRATION CLOSED]
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {closedTournaments.length === 0 && (
              <div className="p-3 border border-warn/40 bg-warn/10 text-warn text-xs">
                ⚠️ No tournaments currently have closed registrations. Tournament registration must be CLOSED before match formation can begin.
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
                    <Hud className="text-cyan">Contender Squads</Hud>
                    <span className="border border-white/20 bg-void px-1.5 py-0.5 text-[10px] text-ink font-bold">
                      {formationRosters.length} Teams
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-dim px-0.5">
                    <span>
                      Paired:{' '}
                      <strong className="text-ok">
                        {formationRosters.filter((t) => pairedFormationTeamIds.has(String(t.team_id))).length}
                      </strong>
                    </span>
                    <span>
                      Unpaired:{' '}
                      <strong className="text-warn">
                        {formationRosters.filter((t) => !pairedFormationTeamIds.has(String(t.team_id))).length}
                      </strong>
                    </span>
                  </div>

                  {/* Filter search */}
                  <input
                    type="text"
                    placeholder="Filter squads..."
                    value={formationSquadSearch}
                    onChange={(e) => setFormationSquadSearch(e.target.value)}
                    className="w-full border border-white/15 bg-void px-2 py-1 text-[11px] text-ink placeholder:text-dim/50 outline-none focus:border-cyan"
                  />

                  {/* Squad List */}
                  {formationRosters.length === 0 ? (
                    <div className="p-4 border border-dashed border-white/10 text-center text-dim text-[11px]">
                      No teams registered for this tournament yet.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[540px] overflow-y-auto pr-1">
                      {formationRosters
                        .filter(
                          (t) =>
                            !formationSquadSearch.trim() ||
                            t.team_name.toLowerCase().includes(formationSquadSearch.toLowerCase()) ||
                            t.team_tag.toLowerCase().includes(formationSquadSearch.toLowerCase()) ||
                            (t.captain?.username || '').toLowerCase().includes(formationSquadSearch.toLowerCase())
                        )
                        .map((team, idx) => {
                          const isPaired = pairedFormationTeamIds.has(String(team.team_id))
                          return (
                            <div
                              key={team.team_id}
                              className="border border-white/10 bg-void/80 p-2 space-y-1 hover:border-cyan/40 transition-colors"
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span
                                  className="font-display font-black uppercase text-ink truncate text-[11px]"
                                  title={team.team_name}
                                >
                                  <span className="text-cyan mr-1 font-mono">#{idx + 1}</span>
                                  {team.team_name} [{team.team_tag}]
                                </span>
                                <span
                                  className={`text-[8px] px-1 py-0.2 border uppercase shrink-0 font-bold ${
                                    isPaired
                                      ? 'border-ok/40 text-ok bg-ok/10'
                                      : 'border-warn/40 text-warn bg-warn/10'
                                  }`}
                                >
                                  {isPaired ? 'Paired' : 'Unpaired'}
                                </span>
                              </div>
                              <div className="text-[10px] text-dim flex items-center justify-between">
                                <span className="truncate max-w-[150px]">
                                  Capt: @{team.captain?.username || team.captain_username || 'TBD'}
                                </span>
                                {team.members && team.members.length > 0 && (
                                  <span className="text-dim/70 shrink-0 font-mono">
                                    ({team.members.length}p)
                                  </span>
                                )}
                              </div>
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
                    <span className="font-bold text-ink uppercase tracking-wider">Formation Structure:</span>
                    <span className="border border-cyan/40 bg-cyan/10 px-2 py-0.5 text-cyan font-bold text-[11px]">
                      {formationRounds.length} Rounds Created
                    </span>
                    <span className="border border-white/20 bg-void px-2 py-0.5 text-dim font-bold text-[11px]">
                      {formationMatches.length} Matches Formed
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setNewRoundInputName(`Round ${formationRounds.length + 1}`)
                      setIsAddRoundModalOpen(true)
                    }}
                    className="border border-cyan bg-cyan px-3 py-1.5 font-display text-xs font-black uppercase tracking-wider text-void hover:bg-cyan/90 transition-all cursor-pointer"
                  >
                    + Add Round
                  </button>
                </div>

                {/* ZERO ROUNDS INITIAL STATE */}
                {formationRounds.length === 0 ? (
                  <Panel className="border border-dashed border-white/20 p-12 text-center space-y-3 bg-surface/30">
                    <div className="text-2xl">📋</div>
                    <h3 className="font-display text-2xl font-black uppercase text-ink">
                      Formation: No rounds created
                    </h3>
                    <p className="text-xs text-dim max-w-md mx-auto">
                      Matches: 0. The initial match structure is completely empty. The admin decides how many rounds,
                      their names, and matchups manually.
                    </p>
                    <div className="pt-2">
                      <button
                        onClick={() => {
                          setNewRoundInputName('Round 1')
                          setIsAddRoundModalOpen(true)
                        }}
                        className="border border-cyan bg-cyan px-5 py-2 font-display text-xs font-black uppercase text-void hover:bg-cyan/90 transition-all cursor-pointer"
                      >
                        + Add Round
                      </button>
                    </div>
                  </Panel>
                ) : (
                  /* ROUND CONTAINERS */
                  <div className="space-y-6">
                    {formationRounds.map((rnd) => {
                      const matchesInRound = formationMatches.filter(
                        (m) => m.round_name === rnd.round_name
                      )

                      return (
                        <Panel
                          key={rnd.round_name}
                          className="border border-white/15 bg-surface/40 p-4 space-y-4"
                        >
                          {/* Round Container Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                            <div className="flex items-center gap-3">
                              <span className="size-2 rounded-full bg-cyan" />
                              <h3 className="font-display text-xl font-black uppercase text-cyan">
                                {rnd.round_name}
                              </h3>
                              <span className="border border-white/20 bg-void px-2 py-0.5 text-[10px] text-ink font-bold uppercase">
                                Matches: {matchesInRound.length}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleOpenAddMatchForRound(rnd.round_name)}
                                className="border border-cyan/60 bg-cyan/15 px-3 py-1 font-display text-[11px] font-black uppercase text-cyan hover:bg-cyan hover:text-void transition-colors cursor-pointer"
                              >
                                + Add Match to {rnd.round_name}
                              </button>
                              <button
                                onClick={() => handleDeleteRoundFromFormation(rnd.round_name)}
                                className="border border-live/30 px-2 py-1 text-[11px] uppercase text-live hover:bg-live hover:text-white transition-colors cursor-pointer"
                                title="Delete Round and its matches"
                              >
                                Delete Round
                              </button>
                            </div>
                          </div>

                          {/* Matches in Round */}
                          {matchesInRound.length === 0 ? (
                            <div className="p-6 border border-dashed border-white/10 text-center text-dim text-xs">
                              No matches formed in {rnd.round_name} yet. Click &quot;+ Add Match to {rnd.round_name}&quot; to pair contenders.
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {matchesInRound.map((m, mIdx) => {
                                const teamAName =
                                  m.team_a_name || m.team_a_placeholder || 'TBD (Team A)'
                                const teamBName =
                                  m.team_b_name || m.team_b_placeholder || 'TBD (Team B)'

                                return (
                                  <div
                                    key={mIdx}
                                    className="border border-white/10 bg-void/80 p-3.5 space-y-2 hover:border-cyan/30 transition-colors"
                                  >
                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2">
                                      <div className="flex items-center gap-2">
                                        <span className="font-display font-black text-xs uppercase text-cyan">
                                          Match #{m.match_number || mIdx + 1}
                                        </span>
                                        <span className="text-white/20">|</span>
                                        <span className="border border-white/20 px-1.5 py-0.2 text-[9px] uppercase text-dim">
                                          Format: {m.format} ({m.series_format})
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={() => handleDeleteMatchFromFormation(rnd.round_name, mIdx)}
                                          className="text-live/70 hover:text-live text-[11px] uppercase cursor-pointer"
                                        >
                                          Delete Match
                                        </button>
                                      </div>
                                    </div>

                                    {/* VISUAL WHO IS PLAYING WHOM */}
                                    {m.format === 'Battle Royale' ? (
                                      <div className="py-1">
                                        <div className="text-[11px] text-cyan font-bold uppercase mb-1">
                                          Battle Royale Contenders ({m.teams?.length || m.team_ids?.length || 0} Squads):
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                          {m.teams?.map((tm) => (
                                            <span
                                              key={tm.id}
                                              className="border border-white/15 bg-surface px-2 py-0.5 text-[10px] text-ink font-bold uppercase"
                                            >
                                              {tm.name} [{tm.tag || 'TEAM'}]
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex items-center justify-between gap-3 py-1">
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                          <div className="size-6 rounded bg-surface border border-white/10 flex items-center justify-center font-display font-black text-[10px] text-ink shrink-0">
                                            A
                                          </div>
                                          <span className="font-display text-sm font-black uppercase truncate text-ink">
                                            {teamAName}
                                          </span>
                                        </div>

                                        <div className="font-display font-black text-dim text-xs tracking-wider shrink-0 px-2">
                                          VS
                                        </div>

                                        <div className="flex items-center justify-end gap-2 min-w-0 flex-1 text-right">
                                          <span className="font-display text-sm font-black uppercase truncate text-ink">
                                            {teamBName}
                                          </span>
                                          <div className="size-6 rounded bg-surface border border-white/10 flex items-center justify-center font-display font-black text-[10px] text-ink shrink-0">
                                            B
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* Schedule & Advancement routing */}
                                    <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-dim border-t border-white/5 pt-1.5">
                                      <div className="flex flex-wrap items-center gap-3">
                                        {(m.scheduled_date || m.scheduled_time) && (
                                          <span>
                                            Schedule:{' '}
                                            <strong className="text-cyan">
                                              {[m.scheduled_date, m.scheduled_time].filter(Boolean).join(' ')}
                                            </strong>
                                          </span>
                                        )}
                                        {m.server_region && (
                                          <span>Region: <strong className="text-ink">{m.server_region}</strong></span>
                                        )}
                                      </div>

                                      {m.next_match_slot && (
                                        <div className="text-cyan font-mono">
                                          ──► Winner Advances to: <strong>{m.next_match_slot}</strong>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
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
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: OPERATIONS DASHBOARD (Total Matches, Live Now, Go Live, Score/Complete) */}
      {/* ========================================================================= */}
      {activeTab === 'OPERATIONS' && (
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-3xl font-black uppercase text-ink">
                  Match Engine &amp; Operations
                </h2>
                <span className="border border-cyan/40 bg-cyan/10 px-2 py-0.5 text-[10px] text-cyan font-bold uppercase">
                  Live Operations
                </span>
              </div>
              <p className="text-xs text-dim">
                Real-time match progression: review rosters, launch broadcasts, score matches, and advance winners.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  setActiveTab('FORMATION')
                  if (!formationTournId && closedTournaments.length > 0) {
                    setFormationTournId(closedTournaments[0].id || closedTournaments[0].slug || '')
                  }
                }}
                className="border border-cyan bg-cyan px-4 py-2 font-display text-xs font-black uppercase tracking-wider text-void hover:bg-cyan/90 transition-all cursor-pointer shadow-xs"
              >
                + Create Match / Formation
              </button>
              <button
                onClick={() => {
                  fetchMatches()
                  if (selectedTournId !== 'ALL') fetchRoundsData(selectedTournId)
                }}
                disabled={loading}
                className="border border-white/20 bg-surface px-3 py-2 uppercase text-dim hover:text-ink hover:border-white/40 cursor-pointer"
              >
                {loading ? 'Refreshing...' : '↻ Refresh'}
              </button>
            </div>
          </div>

          {/* Stats KPI Bar (Preserving Total Matches and Live Now) */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <Panel className="p-3 text-center">
              <Hud className="text-dim">Total Matches</Hud>
              <p className="font-display text-2xl font-black text-ink">{matches.length}</p>
            </Panel>
            <Panel className="p-3 text-center border-warn/40 bg-warn/[0.03]">
              <Hud className="text-warn">Draft Rosters</Hud>
              <p className="font-display text-2xl font-black text-warn">{totalDraftCount}</p>
            </Panel>
            <Panel className="p-3 text-center border-live/40 bg-live/[0.03]">
              <Hud className="text-live">🔴 Live Now</Hud>
              <p className="font-display text-2xl font-black text-live">{liveCount}</p>
            </Panel>
            <Panel className="p-3 text-center">
              <Hud className="text-cyan">Scheduled</Hud>
              <p className="font-display text-2xl font-black text-cyan">{scheduledCount}</p>
            </Panel>
            <Panel className="p-3 text-center">
              <Hud className="text-ok">Completed</Hud>
              <p className="font-display text-2xl font-black text-ok">{completedCount}</p>
            </Panel>
          </div>

          {/* Scope Selector Bar */}
          <Panel className="p-4 md:p-5 space-y-4 border-white/15 bg-surface/50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                {/* Level 1: Competition (Tournament) */}
                <div className="flex items-center gap-2">
                  <span className="font-bold text-ink uppercase tracking-wider text-[11px]">Competition:</span>
                  <select
                    value={selectedTournId}
                    onChange={(e) => setSelectedTournId(e.target.value)}
                    className="border border-white/20 bg-void px-3 py-1.5 text-xs text-ink outline-none focus:border-cyan min-w-[220px]"
                  >
                    <option value="ALL">All Competitions (Global)</option>
                    {tournaments.map((t) => (
                      <option key={t.id || t.slug} value={t.id || t.slug}>
                        {t.title} ({t.status || 'ACTIVE'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Level 2: Game Filter */}
                <div className="flex items-center gap-2">
                  <span className="font-bold text-dim uppercase tracking-wider text-[11px]">Game:</span>
                  <select
                    value={selectedGameFilter}
                    onChange={(e) => setSelectedGameFilter(e.target.value)}
                    className="border border-white/20 bg-void px-3 py-1.5 text-xs text-ink outline-none focus:border-cyan min-w-[160px]"
                  >
                    <option value="ALL">All Games</option>
                    {availableGames.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedTournId !== 'ALL' && currentTournament && (
                <div className="flex flex-wrap items-center gap-2">
                  {!isRegistrationClosed ? (
                    <button
                      onClick={handleCloseRegistration}
                      disabled={closingReg}
                      className="border border-warn/40 bg-warn/15 px-3 py-1.5 text-[11px] font-bold text-warn hover:bg-warn hover:text-void transition-colors cursor-pointer"
                    >
                      {closingReg ? 'Closing...' : '🔒 Close Reg & Finalize Rosters'}
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="border border-dim bg-dim/10 px-2.5 py-1 text-[10px] text-dim font-bold uppercase">
                        ✓ Registrations Closed
                      </span>
                      <button
                        onClick={handleReopenRegistration}
                        disabled={reopeningReg}
                        className="border border-cyan/40 bg-cyan/10 px-3 py-1.5 text-[11px] font-bold text-cyan hover:bg-cyan hover:text-void transition-colors cursor-pointer"
                      >
                        {reopeningReg ? 'Reopening...' : '🔓 Reopen Registration'}
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() => setShowRostersDrawer(!showRostersDrawer)}
                    className="border border-cyan/40 bg-cyan/10 px-3 py-1.5 text-[11px] font-bold text-cyan hover:bg-cyan hover:text-void transition-colors cursor-pointer"
                  >
                    {showRostersDrawer ? 'Hide Rosters' : `View Contenders (${tournRosters.length})`}
                  </button>
                </div>
              )}
            </div>

            {/* Round Broadcast Stream Bar (One URL Per Round) */}
            {selectedTournId !== 'ALL' && currentTournament && (
              <div className="pt-3 border-t border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-void/50 p-3">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-live font-bold uppercase tracking-wider shrink-0 text-[11px]">
                    🔴 Round Broadcast ({selectedRoundTab !== 'ALL' ? selectedRoundTab : (availableRoundTabs[0] || 'Round 1')}):
                  </span>
                  <input
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=... or /live/..."
                    value={roundStreamUrl}
                    onChange={(e) => setRoundStreamUrl(e.target.value)}
                    className="w-full border border-white/15 bg-surface px-3 py-1 text-xs text-ink outline-none focus:border-cyan"
                  />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleSaveRoundStream}
                    disabled={savingRoundStream}
                    className="border border-live bg-live/20 px-3 py-1 text-[11px] font-bold text-live hover:bg-live hover:text-white transition-colors cursor-pointer"
                  >
                    {savingRoundStream ? 'Saving...' : 'Save Round Broadcast'}
                  </button>
                  {roundStreamUrl && (
                    <a
                      href={normalizeStreamUrl(roundStreamUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border border-white/20 px-2.5 py-1 text-[11px] text-dim hover:text-ink"
                    >
                      Watch ↗
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Roster Drawer */}
            {showRostersDrawer && selectedTournId !== 'ALL' && (
              <div className="pt-3 border-t border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <Hud className="text-cyan">
                    Registered Contenders &amp; Rosters ({tournRosters.length} Teams)
                  </Hud>
                  {loadingRosters && <span className="text-dim">Loading rosters...</span>}
                </div>

                {tournRosters.length === 0 ? (
                  <div className="p-4 border border-dashed border-white/10 text-center text-dim">
                    No teams have registered for this tournament yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[280px] overflow-y-auto">
                    {tournRosters.map((team) => (
                      <div
                        key={team.team_id}
                        className="border border-white/10 bg-void/80 p-2.5 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-display font-black uppercase text-ink truncate max-w-[180px]">
                            {team.team_name} [{team.team_tag}]
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 border uppercase ${
                              team.is_paired
                                ? 'border-ok/40 text-ok bg-ok/10'
                                : 'border-warn/40 text-warn bg-warn/10'
                            }`}
                          >
                            {team.is_paired ? 'Paired' : 'Unpaired'}
                          </span>
                        </div>
                        <div className="text-[10px] text-dim">
                          Captain: @{team.captain?.username || team.captain_username || 'TBD'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Panel>

          {/* Round Tabs & Status Filters */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 border border-white/10 bg-graphite p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-dim uppercase font-bold mr-1">Rounds:</span>
                <button
                  onClick={() => setSelectedRoundTab('ALL')}
                  className={`px-3 py-1 font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer ${
                    selectedRoundTab === 'ALL'
                      ? 'border border-cyan bg-cyan text-void font-bold'
                      : 'border border-white/10 bg-surface text-dim hover:text-ink'
                  }`}
                >
                  All Rounds ({filteredMatches.length})
                </button>
                {availableRoundTabs.map((r) => {
                  const rMatches = matches.filter((m) => {
                    const tourMatch =
                      selectedTournId === 'ALL' ||
                      m.tournament_id === selectedTournId ||
                      (currentTournament?.slug && m.tournament_id === currentTournament.slug)
                    const isRound =
                      m.round_name === r ||
                      m.stage === r ||
                      (m.round_number && `Round ${m.round_number}` === r)
                    return tourMatch && isRound
                  })
                  return (
                    <button
                      key={r}
                      onClick={() => setSelectedRoundTab(r)}
                      className={`px-3 py-1 font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 ${
                        selectedRoundTab === r
                          ? 'border border-cyan bg-cyan text-void font-bold'
                          : 'border border-white/10 bg-surface text-dim hover:text-ink'
                      }`}
                    >
                      <span>{r}</span>
                      <span className="text-[10px] opacity-75">({rMatches.length})</span>
                    </button>
                  )
                })}

              </div>

              {draftMatchesInScope.length > 0 && selectedTournId !== 'ALL' && (
                <button
                  onClick={() => setIsBatchPublishOpen(true)}
                  className="border border-warn bg-warn/15 px-3 py-1 font-mono text-xs font-bold uppercase text-warn hover:bg-warn hover:text-void transition-colors cursor-pointer"
                >
                  📢 Publish All Drafts ({draftMatchesInScope.length})
                </button>
              )}
            </div>

            {/* Lifecycle Status Filter */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-dim uppercase font-bold text-[11px] mr-1">Status:</span>
                {['ALL', 'LIVE', 'CHECK_IN_OPEN', 'SCHEDULED', 'COMPLETED'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wider transition-colors cursor-pointer ${
                      statusFilter === s
                        ? 'border border-cyan text-cyan font-bold bg-cyan/10'
                        : 'text-dim hover:text-ink'
                    }`}
                  >
                    {s === 'LIVE' ? '🔴 LIVE' : s}
                  </button>
                ))}
              </div>
              <Hud className="text-cyan">{filteredMatches.length} Match Formations Listed</Hud>
            </div>
          </div>

          {/* MATCHES LIST */}
          <div className="space-y-4">
            {filteredMatches.map((m) => {
              const isLive = (m.status || '').toUpperCase() === 'LIVE'
              const isCheckIn = (m.status || '').toUpperCase() === 'CHECK_IN_OPEN'
              const isDone = (m.status || '').toUpperCase() === 'COMPLETED'
              const isDraft = (m.roster_status || '').toUpperCase() === 'DRAFT'
              const isUpdated = (m.roster_status || '').toUpperCase() === 'UPDATED'

              const isBattleRoyale =
                m.format === 'Battle Royale' ||
                (Array.isArray(m.teams) && m.teams.length > 2) ||
                (Array.isArray(m.team_ids) && m.team_ids.length > 2)

              const teamAName = m.team_a?.name || m.team_a_name || m.team_a_placeholder || 'TBD (Team A)'
              const teamBName = m.team_b?.name || m.team_b_name || m.team_b_placeholder || 'TBD (Team B)'
              const isTeamAPlaceholder = !m.team_a_id && Boolean(m.team_a_placeholder)
              const isTeamBPlaceholder = !m.team_b_id && Boolean(m.team_b_placeholder)

              const scoreA = m.team_a?.score ?? m.score_a ?? 0
              const scoreB = m.team_b?.score ?? m.score_b ?? 0
              const streamUrl = normalizeStreamUrl(m.youtube_live_url || m.live_link || roundStreamUrl)
              const roundTitle = m.round_name || m.stage || `Round ${m.round_number || 1}`
              const matchNum = m.match_number || m.order || 1

              // Battle Royale squad list
              const brSquads: Array<{ id: string; name: string; tag?: string; checkedIn: boolean; alive: boolean }> = []
              if (isBattleRoyale) {
                if (Array.isArray(m.teams) && m.teams.length > 0) {
                  m.teams.forEach((t: any, idx: number) => {
                    const tid = String(t.id || t._id || `squad-${idx}`)
                    const isAlive = m.alive_status?.[tid] !== false
                    const hasCheckedIn = Boolean(m.check_ins?.[tid])
                    brSquads.push({
                      id: tid,
                      name: t.name || `Squad ${idx + 1}`,
                      tag: t.tag || '',
                      checkedIn: hasCheckedIn,
                      alive: isAlive,
                    })
                  })
                } else if (Array.isArray(m.team_ids) && m.team_ids.length > 0) {
                  m.team_ids.forEach((tid: string, idx: number) => {
                    const found = tournRosters.find((r) => r.team_id === tid)
                    const isAlive = m.alive_status?.[tid] !== false
                    const hasCheckedIn = Boolean(m.check_ins?.[tid])
                    brSquads.push({
                      id: tid,
                      name: found?.team_name || `Squad ${idx + 1}`,
                      tag: found?.team_tag || '',
                      checkedIn: hasCheckedIn,
                      alive: isAlive,
                    })
                  })
                }
              }

              return (
                <Panel
                  key={m.id}
                  className={`p-4 md:p-5 transition-colors relative ${
                    isLive
                      ? 'border-live/60 bg-live/[0.04]'
                      : isDraft
                      ? 'border-warn/40 bg-warn/[0.02]'
                      : isCheckIn
                      ? 'border-cyan/40 bg-cyan/[0.02]'
                      : 'border-white/10 bg-surface/50'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-2.5 flex-1 min-w-0">
                      {/* Round Header & Status Badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-display font-black text-sm uppercase text-cyan tracking-wider">
                          {roundTitle} · MATCH {matchNum}
                        </span>
                        <span className="text-white/20">|</span>
                        <span className="text-dim text-[11px] truncate max-w-[200px]">
                          {m.tournament_title || currentTournament?.title || 'Tournament'}
                        </span>
                        <span className="text-white/20">|</span>

                        {isDraft ? (
                          <span className="border border-warn bg-warn/15 px-2 py-0.5 text-[10px] font-bold uppercase text-warn">
                            ⚠️ DRAFT (HIDDEN)
                          </span>
                        ) : isUpdated ? (
                          <span className="border border-cyan bg-cyan/15 px-2 py-0.5 text-[10px] font-bold uppercase text-cyan">
                            🔄 UPDATED
                          </span>
                        ) : (
                          <span className="border border-ok/40 bg-ok/10 px-2 py-0.5 text-[10px] font-bold uppercase text-ok">
                            ✓ PUBLISHED
                          </span>
                        )}

                        <Badge
                          s={
                            isLive
                              ? 'live'
                              : isDone
                              ? 'completed'
                              : isCheckIn
                              ? 'warn'
                              : 'upcoming'
                          }
                          label={m.status || 'SCHEDULED'}
                        />

                        {streamUrl && (
                          <a
                            href={streamUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded bg-live/20 px-2 py-0.5 text-[10px] font-bold text-live border border-live/30 hover:bg-live/30"
                          >
                            🔴 Stream Active ↗
                          </a>
                        )}
                      </div>

                      {/* BATTLE ROYALE MULTI-SQUAD LOBBY OR 1v1 CONFRONTATION */}
                      {isBattleRoyale ? (
                        <div className="py-2 border-y border-white/5 my-1 space-y-2">
                          <div className="flex items-center justify-between text-[11px] text-dim">
                            <span className="font-bold uppercase text-ink">
                              Battle Royale Lobby ({brSquads.length} Squads)
                            </span>
                            <span className="text-cyan">Shared Room Lobby</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {brSquads.map((sq) => (
                              <div
                                key={sq.id}
                                className={`p-2 border flex items-center justify-between gap-2 ${
                                  !sq.alive
                                    ? 'border-live/30 bg-live/5 opacity-60'
                                    : 'border-white/10 bg-void/60'
                                }`}
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="font-display font-black text-ink uppercase truncate text-xs">
                                    {sq.name} {sq.tag ? `[${sq.tag}]` : ''}
                                  </div>
                                  <div className="text-[10px]">
                                    {sq.checkedIn ? (
                                      <span className="text-ok">✓ Checked In</span>
                                    ) : (
                                      <span className="text-dim">Check-in Pending</span>
                                    )}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleToggleSquadAlive(m.id, sq.id, sq.alive)}
                                  className={`px-2 py-0.5 text-[10px] font-bold uppercase transition-colors cursor-pointer border ${
                                    sq.alive
                                      ? 'border-ok/40 bg-ok/10 text-ok hover:bg-live hover:text-white hover:border-live'
                                      : 'border-live/40 bg-live/15 text-live hover:bg-ok hover:text-void hover:border-ok'
                                  }`}
                                  title="Toggle Alive / Eliminated operational status"
                                >
                                  {sq.alive ? '● ALIVE' : '✕ ELIMINATED'}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        /* VISUAL WHO IS PLAYING WHOM (1v1) */
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 py-2 border-y border-white/5 my-1">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="size-8 rounded bg-void border border-white/10 flex items-center justify-center font-display font-black text-xs text-ink shrink-0">
                              A
                            </div>
                            <div className="min-w-0 flex-1">
                              <span
                                className={`font-display text-base md:text-lg font-black uppercase truncate ${
                                  isTeamAPlaceholder ? 'italic text-dim' : 'text-ink'
                                }`}
                              >
                                {teamAName}
                              </span>
                              {isTeamAPlaceholder && (
                                <span className="text-[9px] text-dim block">Advancement Placeholder</span>
                              )}
                            </div>
                            <span className="font-display text-lg font-black text-cyan px-2 py-0.5 bg-void border border-white/10 tabular-nums shrink-0">
                              {scoreA}
                            </span>
                          </div>

                          <div className="flex sm:flex-col items-center justify-center px-3 py-1 font-display font-black text-dim text-xs tracking-wider shrink-0">
                            <span>─── VS ───</span>
                          </div>

                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <span className="font-display text-lg font-black text-cyan px-2 py-0.5 bg-void border border-white/10 tabular-nums shrink-0">
                              {scoreB}
                            </span>
                            <div className="min-w-0 flex-1">
                              <span
                                className={`font-display text-base md:text-lg font-black uppercase truncate ${
                                  isTeamBPlaceholder ? 'italic text-dim' : 'text-ink'
                                }`}
                              >
                                {teamBName}
                              </span>
                              {isTeamBPlaceholder && (
                                <span className="text-[9px] text-dim block">Advancement Placeholder</span>
                              )}
                            </div>
                            <div className="size-8 rounded bg-void border border-white/10 flex items-center justify-center font-display font-black text-xs text-ink shrink-0">
                              B
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Credentials & Check-In Bar */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                        <span className="text-dim font-bold uppercase">Room Credentials:</span>
                        {m.credentials_released ? (
                          <span className="border border-ok/40 bg-ok/10 text-ok px-2 py-0.5 font-bold uppercase text-[10px]">
                            ✓ Credentials Released (Check-In Open)
                          </span>
                        ) : (
                          <span className="border border-warn/40 bg-warn/10 text-warn px-2 py-0.5 font-bold uppercase text-[10px]">
                            🔒 Confidential (Hidden from players)
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleOpenCredentialsModal(m)}
                          className="border border-cyan/40 bg-cyan/10 px-2 py-0.5 text-cyan hover:bg-cyan hover:text-void uppercase text-[10px] font-bold cursor-pointer"
                        >
                          🔑 Edit Room / Password
                        </button>

                        {!m.credentials_released && (
                          <button
                            type="button"
                            onClick={() => handleReleaseCredentialsClick(m)}
                            className="border border-ok/50 bg-ok/20 px-2.5 py-0.5 text-ok hover:bg-ok hover:text-void uppercase text-[10px] font-bold cursor-pointer"
                          >
                            📢 Release Credentials &amp; Open Check-In
                          </button>
                        )}
                      </div>

                      {/* Metadata & Advancement */}
                      <div className="flex flex-wrap items-center gap-4 text-[11px] text-dim">
                        <span>Format: <strong className="text-ink">{m.format || m.series_format || 'BO1'}</strong></span>
                        <span>Region: <strong className="text-ink">{m.server_region || 'AWS Mumbai'}</strong></span>
                        {(m.scheduled_date || m.scheduled_time) && (
                          <span>
                            Schedule:{' '}
                            <strong className="text-cyan">
                              {[m.scheduled_date, m.scheduled_time].filter(Boolean).join(' ')}
                            </strong>
                          </span>
                        )}
                        {m.lobby_code && (
                          <span className="text-ink">Lobby: <strong className="text-cyan">{m.lobby_code}</strong></span>
                        )}
                      </div>

                      {(m.next_match_slot || isDone) && (
                        <div className="pt-1 flex flex-wrap items-center gap-2 text-[11px]">
                          {isDone && m.winner_team_id && (
                            <span className="border border-ok/50 bg-ok/10 text-ok px-2 py-0.5 font-bold">
                              🏆 Winner: {m.winner_team_id === m.team_a_id ? teamAName : (m.winner_team_id === m.team_b_id ? teamBName : 'Winner Decided')}
                            </span>
                          )}
                          {m.next_match_slot && (
                            <span className="text-cyan font-mono">
                              ──► Destination Slot: <strong>{m.next_match_slot}</strong>
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Operational Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-white/10">
                      {isDraft && (
                        <button
                          onClick={() => {
                            setPublishModalMatch(m)
                            setPublishNotifyLeaders(true)
                            setPublishMatchNotes('')
                          }}
                          className="border border-warn bg-warn/20 px-3 py-1.5 uppercase text-xs font-bold text-warn hover:bg-warn hover:text-void transition-all cursor-pointer"
                        >
                          📢 Publish Roster
                        </button>
                      )}

                      {!isLive && !isDone && (
                        <button
                          onClick={() => handleQuickStatus(m.id, 'LIVE')}
                          className="border border-live bg-live/20 px-3 py-1.5 uppercase text-xs font-bold text-live hover:bg-live hover:text-white transition-all cursor-pointer"
                        >
                          🔴 Go Live
                        </button>
                      )}

                      {isBattleRoyale ? (
                        <button
                          onClick={() => handleOpenBrResultsModal(m)}
                          className="border border-ok bg-ok/20 px-3 py-1.5 uppercase text-xs font-bold text-ok hover:bg-ok hover:text-void transition-all cursor-pointer"
                        >
                          🏆 Submit BR Results
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setScoreMatch(m)
                            setScoreForm({
                              score_a: m.team_a?.score ?? m.score_a ?? 0,
                              score_b: m.team_b?.score ?? m.score_b ?? 0,
                              winner_team_id: m.winner_team_id || '',
                            })
                          }}
                          className="border border-ok/40 bg-ok/10 px-3 py-1.5 uppercase text-xs font-bold text-ok hover:bg-ok hover:text-void transition-all cursor-pointer"
                        >
                          🏁 Score / Complete
                        </button>
                      )}

                      {isDone && (
                        <button
                          onClick={() => handleOpenRatingsModal(m)}
                          className="border border-cyan bg-cyan/20 px-3 py-1.5 uppercase text-xs font-bold text-cyan hover:bg-cyan hover:text-void transition-all cursor-pointer"
                        >
                          ★ Rate Players
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setEditMatch(m)
                          setEditForm({
                            status: m.status || 'SCHEDULED',
                            roster_status: m.roster_status || 'PUBLISHED',
                            round_name: m.round_name || m.stage || 'Round 1',
                            round_number: m.round_number || 1,
                            match_number: m.match_number || 1,
                            scheduled_time: m.scheduled_time || '',
                            scheduled_date: m.scheduled_date || '',
                            next_match_slot: m.next_match_slot || '',
                            youtube_live_url: m.youtube_live_url || m.live_link || '',
                            lobby_code: m.lobby_code || m.room_id || '',
                            lobby_password: m.lobby_password || m.room_password || '',
                            server_region: m.server_region || 'AWS Mumbai (ap-south-1)',
                            score_a: m.team_a?.score ?? m.score_a ?? 0,
                            score_b: m.team_b?.score ?? m.score_b ?? 0,
                            winner_team_id: m.winner_team_id || '',
                          })
                        }}
                        className="border border-cyan bg-cyan/15 px-3 py-1.5 uppercase text-xs font-bold text-cyan hover:bg-cyan hover:text-void transition-all cursor-pointer"
                      >
                        Edit Lobby
                      </button>

                      {!isBattleRoyale && (
                        <button
                          onClick={() => handleSwapTeams(m.id)}
                          title="Swap Team A and Team B sides"
                          className="border border-white/20 px-2 py-1.5 uppercase text-xs text-dim hover:text-ink cursor-pointer"
                        >
                          ⇄ Swap
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteMatch(m.id)}
                        title="Delete Match"
                        className="border border-live/30 px-2 py-1.5 uppercase text-xs text-live/80 hover:bg-live hover:text-white cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </Panel>
              )
            })}

            {filteredMatches.length === 0 && (
              <div className="border border-white/10 p-12 text-center text-dim bg-surface/30">
                No matches found for the selected round and criteria. Use &quot;+ Create Match / Formation&quot; above to configure round formations.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD ROUND CONTAINER (Formation Workspace) */}
      {/* ========================================================================= */}
      {isAddRoundModalOpen && (
        <Portal lockScroll>
          <div role="dialog" aria-modal className="fixed inset-0 z-[100] flex items-center justify-center bg-void/85 p-3 sm:p-6 backdrop-blur-md overflow-hidden select-none">
            <div className="relative w-full max-w-sm border border-cyan/50 bg-graphite p-6 max-h-[min(90vh,calc(100svh-2rem))] overflow-y-auto select-text">
              <Brackets color="border-cyan/50" />
              <h3 className="font-display text-xl font-black uppercase text-ink">Add New Round Container</h3>
              <p className="text-xs text-dim mt-1">
                Add a named round stage (e.g. Round 1, Quarter Finals, Group A) to this formation.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleAddRoundToFormation(newRoundInputName)
                }}
                className="mt-4 space-y-4 font-mono text-xs"
              >
                <div>
                  <label className="block text-dim uppercase mb-1">Round Stage Name</label>
                  <input
                    type="text"
                    list="formation-stages-suggestions"
                    required
                    placeholder="e.g. Round 1 or Quarter Finals"
                    value={newRoundInputName}
                    onChange={(e) => setNewRoundInputName(e.target.value)}
                    className="w-full border border-white/20 bg-surface px-3 py-2 text-ink outline-none focus:border-cyan text-xs"
                  />
                  <datalist id="formation-stages-suggestions">
                    {DEFAULT_STAGES.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
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
                    className="border border-cyan bg-cyan px-4 py-1.5 uppercase text-void font-bold hover:bg-cyan/90 cursor-pointer"
                  >
                    Create Container
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD MATCH TO SPECIFIC ROUND (Formation Workspace) */}
      {/* ========================================================================= */}
      {isAddFormationMatchOpen && (
        <Portal lockScroll>
          <div role="dialog" aria-modal className="fixed inset-0 z-[100] flex items-center justify-center bg-void/85 p-3 sm:p-6 backdrop-blur-md overflow-hidden select-none">
            <div className="relative w-full max-w-lg border border-white/20 bg-graphite p-6 max-h-[min(90vh,calc(100svh-2rem))] overflow-y-auto select-text">
            <Brackets color="border-cyan/50" />
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="font-display text-xl font-black uppercase text-ink">
                Add Match to {formationMatchRound}
              </h3>
              <span className="text-[10px] text-cyan font-bold uppercase">{currentFormationTourn?.title}</span>
            </div>

            <form onSubmit={handleSaveMatchToFormation} className="mt-4 space-y-4 font-mono text-xs">
              {/* Competition Format Selector */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-dim uppercase mb-1">Competition Format</label>
                  <select
                    value={formationMatchFormData.format}
                    onChange={(e) =>
                      setFormationMatchFormData({
                        ...formationMatchFormData,
                        format: e.target.value as any,
                      })
                    }
                    className="w-full border border-white/20 bg-surface px-3 py-2 text-ink outline-none focus:border-cyan text-xs"
                  >
                    {COMPETITION_FORMATS.map((fmt) => (
                      <option key={fmt} value={fmt}>
                        {fmt}
                      </option>
                    ))}
                  </select>
                </div>
                {formationMatchFormData.format !== 'Battle Royale' ? (
                  <div>
                    <label className="block text-dim uppercase mb-1">Series Format</label>
                    <select
                      value={formationMatchFormData.series_format}
                      onChange={(e) =>
                        setFormationMatchFormData({
                          ...formationMatchFormData,
                          series_format: e.target.value,
                        })
                      }
                      className="w-full border border-white/20 bg-surface px-3 py-2 text-ink outline-none focus:border-cyan text-xs"
                    >
                      <option value="BO1">Best of 1 (BO1)</option>
                      <option value="BO3">Best of 3 (BO3)</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-dim uppercase mb-1">Series Format</label>
                    <div className="w-full border border-white/10 bg-void/50 px-3 py-2 text-dim text-xs font-mono">
                      Single Match Lobby (Battle Royale)
                    </div>
                  </div>
                )}
              </div>

              {/* BATTLE ROYALE MULTI-TEAM CHECKBOXES */}
              {formationMatchFormData.format === 'Battle Royale' ? (
                <div className="border border-white/10 bg-void/60 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-ink uppercase">Select Contender Squads</span>
                    <span className="text-[10px] text-cyan font-bold">
                      {formationMatchFormData.selected_team_ids.length} Selected
                    </span>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 border border-white/10 p-2 bg-surface">
                    {formationRosters.map((tm) => {
                      const checked = formationMatchFormData.selected_team_ids.includes(tm.team_id)
                      return (
                        <label
                          key={tm.team_id}
                          className="flex items-center gap-2 p-1 hover:bg-void/40 cursor-pointer text-[11px]"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormationMatchFormData({
                                  ...formationMatchFormData,
                                  selected_team_ids: [
                                    ...formationMatchFormData.selected_team_ids,
                                    tm.team_id,
                                  ],
                                })
                              } else {
                                setFormationMatchFormData({
                                  ...formationMatchFormData,
                                  selected_team_ids: formationMatchFormData.selected_team_ids.filter(
                                    (id) => id !== tm.team_id
                                  ),
                                })
                              }
                            }}
                            className="accent-cyan"
                          />
                          <span className="text-ink font-bold">
                            {tm.team_name} [{tm.team_tag}]
                          </span>
                          <span className="text-dim text-[10px]">
                            (Capt: @{tm.captain?.username || tm.captain_username || 'TBD'})
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              ) : (
                /* 2-TEAM PAIRING (Team A vs Team B) */
                <div className="space-y-3">
                  {/* Team A */}
                  <div className="border border-white/10 bg-void/50 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-ink uppercase">Team A</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setFormationMatchFormData({
                              ...formationMatchFormData,
                              team_a_mode: 'ROSTER',
                            })
                          }
                          className={`px-2 py-0.5 text-[10px] uppercase cursor-pointer ${
                            formationMatchFormData.team_a_mode === 'ROSTER'
                              ? 'border border-cyan bg-cyan text-void font-bold'
                              : 'text-dim hover:text-ink'
                          }`}
                        >
                          Registered Squad
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setFormationMatchFormData({
                              ...formationMatchFormData,
                              team_a_mode: 'PLACEHOLDER',
                            })
                          }
                          className={`px-2 py-0.5 text-[10px] uppercase cursor-pointer ${
                            formationMatchFormData.team_a_mode === 'PLACEHOLDER'
                              ? 'border border-cyan bg-cyan text-void font-bold'
                              : 'text-dim hover:text-ink'
                          }`}
                        >
                          Placeholder
                        </button>
                      </div>
                    </div>

                    {formationMatchFormData.team_a_mode === 'ROSTER' ? (
                      <select
                        value={formationMatchFormData.team_a_id}
                        onChange={(e) =>
                          setFormationMatchFormData({
                            ...formationMatchFormData,
                            team_a_id: e.target.value,
                          })
                        }
                        className="w-full border border-white/20 bg-surface px-3 py-1.5 text-xs text-ink outline-none focus:border-cyan"
                      >
                        <option value="">Select Registered Squad...</option>
                        {formationRosters.map((r) => (
                          <option key={r.team_id} value={r.team_id}>
                            {r.team_name} [{r.team_tag}] (Capt: @{r.captain?.username || r.captain_username || 'TBD'})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder="e.g. Winner of Match 1 or Alpha Squad"
                        value={formationMatchFormData.team_a_placeholder}
                        onChange={(e) =>
                          setFormationMatchFormData({
                            ...formationMatchFormData,
                            team_a_placeholder: e.target.value,
                          })
                        }
                        className="w-full border border-white/20 bg-surface px-3 py-1.5 text-xs text-ink outline-none focus:border-cyan"
                      />
                    )}
                  </div>

                  {/* Team B */}
                  <div className="border border-white/10 bg-void/50 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-ink uppercase">Team B</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setFormationMatchFormData({
                              ...formationMatchFormData,
                              team_b_mode: 'ROSTER',
                            })
                          }
                          className={`px-2 py-0.5 text-[10px] uppercase cursor-pointer ${
                            formationMatchFormData.team_b_mode === 'ROSTER'
                              ? 'border border-cyan bg-cyan text-void font-bold'
                              : 'text-dim hover:text-ink'
                          }`}
                        >
                          Registered Squad
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setFormationMatchFormData({
                              ...formationMatchFormData,
                              team_b_mode: 'PLACEHOLDER',
                            })
                          }
                          className={`px-2 py-0.5 text-[10px] uppercase cursor-pointer ${
                            formationMatchFormData.team_b_mode === 'PLACEHOLDER'
                              ? 'border border-cyan bg-cyan text-void font-bold'
                              : 'text-dim hover:text-ink'
                          }`}
                        >
                          Placeholder
                        </button>
                      </div>
                    </div>

                    {formationMatchFormData.team_b_mode === 'ROSTER' ? (
                      <select
                        value={formationMatchFormData.team_b_id}
                        onChange={(e) =>
                          setFormationMatchFormData({
                            ...formationMatchFormData,
                            team_b_id: e.target.value,
                          })
                        }
                        className="w-full border border-white/20 bg-surface px-3 py-1.5 text-xs text-ink outline-none focus:border-cyan"
                      >
                        <option value="">Select Registered Squad...</option>
                        {formationRosters.map((r) => (
                          <option key={r.team_id} value={r.team_id}>
                            {r.team_name} [{r.team_tag}] (Capt: @{r.captain?.username || r.captain_username || 'TBD'})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder="e.g. Winner of Match 2 or Beta Squad"
                        value={formationMatchFormData.team_b_placeholder}
                        onChange={(e) =>
                          setFormationMatchFormData({
                            ...formationMatchFormData,
                            team_b_placeholder: e.target.value,
                          })
                        }
                        className="w-full border border-white/20 bg-surface px-3 py-1.5 text-xs text-ink outline-none focus:border-cyan"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Match Order & Schedule */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-dim uppercase mb-1">Match Number in Round</label>
                  <input
                    type="number"
                    min="1"
                    value={formationMatchFormData.match_number}
                    onChange={(e) =>
                      setFormationMatchFormData({
                        ...formationMatchFormData,
                        match_number: Number(e.target.value),
                      })
                    }
                    className="w-full border border-white/20 bg-surface px-3 py-1.5 text-xs text-ink outline-none focus:border-cyan"
                  />
                </div>
                <div>
                  <label className="block text-dim uppercase mb-1">Advancement Destination Slot</label>
                  <input
                    type="text"
                    placeholder="e.g. Semifinals Match 1"
                    value={formationMatchFormData.next_match_slot}
                    onChange={(e) =>
                      setFormationMatchFormData({
                        ...formationMatchFormData,
                        next_match_slot: e.target.value,
                      })
                    }
                    className="w-full border border-white/20 bg-surface px-3 py-1.5 text-xs text-ink outline-none focus:border-cyan"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-dim uppercase mb-1">Scheduled Date</label>
                  <input
                    type="date"
                    value={formationMatchFormData.scheduled_date}
                    onChange={(e) =>
                      setFormationMatchFormData({
                        ...formationMatchFormData,
                        scheduled_date: e.target.value,
                      })
                    }
                    className="w-full border border-white/20 bg-surface px-3 py-1.5 text-xs text-ink outline-none focus:border-cyan"
                  />
                </div>
                <div>
                  <label className="block text-dim uppercase mb-1">Scheduled Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 7:00 PM IST"
                    value={formationMatchFormData.scheduled_time}
                    onChange={(e) =>
                      setFormationMatchFormData({
                        ...formationMatchFormData,
                        scheduled_time: e.target.value,
                      })
                    }
                    className="w-full border border-white/20 bg-surface px-3 py-1.5 text-xs text-ink outline-none focus:border-cyan"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddFormationMatchOpen(false)}
                  className="border border-white/20 px-4 py-2 uppercase text-dim hover:text-ink cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="border border-cyan bg-cyan px-5 py-2 font-display text-xs font-black uppercase text-void hover:bg-cyan/90 cursor-pointer"
                >
                  Add Match to {formationMatchRound}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Portal>
    )}

      {/* ========================================================================= */}
      {/* OPERATIONS MODALS (Single Publish, Batch Publish, Go Live, Score, Edit) */}
      {/* ========================================================================= */}

      {/* SINGLE ROSTER PUBLISH REVIEW MODAL */}
      {publishModalMatch && (
        <Portal lockScroll>
          <div role="dialog" aria-modal className="fixed inset-0 z-[100] flex items-center justify-center bg-void/85 p-3 sm:p-6 backdrop-blur-md overflow-hidden select-none">
            <div className="relative w-full max-w-lg border border-warn bg-graphite p-6 max-h-[min(90vh,calc(100svh-2rem))] overflow-y-auto select-text">
              <Brackets color="border-warn/60" />
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-warn/20 border border-warn/40 text-warn text-[10px] font-bold uppercase mb-2">
                ⚠️ ROSTER REVIEW &amp; PUBLICATION
              </div>
              <h3 className="font-display text-2xl font-black uppercase text-ink">
                Publish Match Roster
              </h3>
              <p className="text-xs text-dim mt-1">
                Confirm lineup for {publishModalMatch.round_name || publishModalMatch.stage} · Match {publishModalMatch.match_number || 1}.
              </p>

              <form onSubmit={handlePublishRosterSubmit} className="mt-4 space-y-4 font-mono text-xs">
                <div className="border border-white/10 bg-void/60 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-base font-black uppercase text-cyan">
                      {publishModalMatch.team_a?.name || publishModalMatch.team_a_name || 'Team A'}
                    </span>
                    <span className="text-dim font-bold">VS</span>
                    <span className="font-display text-base font-black uppercase text-cyan">
                      {publishModalMatch.team_b?.name || publishModalMatch.team_b_name || 'Team B'}
                    </span>
                  </div>
                  <div className="text-[11px] text-dim flex flex-wrap gap-3 border-t border-white/10 pt-2">
                    <span>Schedule: {publishModalMatch.scheduled_time || 'TBD'}</span>
                    <span>Format: {publishModalMatch.series_format || publishModalMatch.format || 'BO1'}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-dim uppercase mb-1">Optional Match Notes for Captains</label>
                  <input
                    type="text"
                    placeholder="e.g. Please join lobby 15 minutes before match time"
                    value={publishMatchNotes}
                    onChange={(e) => setPublishMatchNotes(e.target.value)}
                    className="w-full border border-white/20 bg-surface px-3 py-1.5 text-xs text-ink outline-none focus:border-cyan"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={publishNotifyLeaders}
                    onChange={(e) => setPublishNotifyLeaders(e.target.checked)}
                    className="accent-cyan"
                  />
                  <span className="text-ink font-bold">
                    Notify Team Captains (In-App Alert &amp; Official Email)
                  </span>
                </label>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setPublishModalMatch(null)}
                    className="border border-white/20 px-4 py-2 uppercase text-dim hover:text-ink cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={submittingPublish}
                    className="border border-warn bg-warn px-5 py-2 font-display text-xs font-black uppercase text-void hover:bg-warn/90 transition-colors cursor-pointer"
                  >
                    {submittingPublish ? 'Publishing...' : 'Confirm & Publish Roster'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* BATCH PUBLISH MODAL */}
      {isBatchPublishOpen && (
        <Portal lockScroll>
          <div role="dialog" aria-modal className="fixed inset-0 z-[100] flex items-center justify-center bg-void/85 p-3 sm:p-6 backdrop-blur-md overflow-hidden select-none">
            <div className="relative w-full max-w-lg border border-warn bg-graphite p-6 max-h-[min(90vh,calc(100svh-2rem))] overflow-y-auto select-text">
              <Brackets color="border-warn/60" />
              <h3 className="font-display text-2xl font-black uppercase text-ink">
                Batch Publish Draft Rosters
              </h3>
              <p className="text-xs text-dim mt-1">
                You are about to publish {draftMatchesInScope.length} draft match(es) for{' '}
                {selectedRoundTab === 'ALL' ? 'all rounds' : selectedRoundTab}.
              </p>

              <form onSubmit={handleBatchPublishSubmit} className="mt-4 space-y-4 font-mono text-xs">
                <div className="max-h-[220px] overflow-y-auto space-y-2 border border-white/10 bg-void/60 p-3">
                  {draftMatchesInScope.map((m) => (
                    <div key={m.id} className="flex items-center justify-between text-[11px] border-b border-white/5 pb-1">
                      <span className="text-cyan font-bold">
                        {m.round_name || m.stage} · M{m.match_number || 1}
                      </span>
                      <span className="text-ink">
                        {m.team_a?.name || m.team_a_name || 'Team A'} vs {m.team_b?.name || m.team_b_name || 'Team B'}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsBatchPublishOpen(false)}
                    className="border border-white/20 px-4 py-2 uppercase text-dim hover:text-ink cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingBatchPublish}
                    className="border border-warn bg-warn px-5 py-2 font-display text-xs font-black uppercase text-void hover:bg-warn/90 transition-colors cursor-pointer"
                  >
                    {submittingBatchPublish ? 'Publishing All...' : 'Confirm & Publish All'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* GO LIVE MODAL */}
      {goLiveMatch && (
        <Portal lockScroll>
          <div role="dialog" aria-modal className="fixed inset-0 z-[100] flex items-center justify-center bg-void/85 p-3 sm:p-6 backdrop-blur-md overflow-hidden select-none">
            <div className="relative w-full max-w-md border border-live/60 bg-graphite p-6 max-h-[min(90vh,calc(100svh-2rem))] overflow-y-auto select-text">
              <Brackets color="border-live/60" />
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-live/20 border border-live/40 text-live text-[10px] font-bold uppercase mb-2">
                <span className="size-1.5 rounded-full bg-live animate-ping" />
                BROADCAST CONTROL
              </div>
              <h3 className="font-display text-2xl font-black uppercase text-ink">Mark Match Live</h3>
              <p className="text-xs text-dim mt-1">
                {goLiveMatch.tournament_title} · {goLiveMatch.team_a?.name || 'Team A'} VS {goLiveMatch.team_b?.name || 'Team B'}
              </p>

              <form onSubmit={handleGoLiveSubmit} className="mt-4 space-y-4 font-mono text-xs">
                <div>
                  <label className="block text-dim uppercase mb-1">YouTube Live Stream URL</label>
                  <input
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=... or /live/..."
                    value={goLiveUrl}
                    onChange={(e) => setGoLiveUrl(e.target.value)}
                    required
                    className="w-full border border-white/20 bg-surface px-3 py-2 text-xs text-ink outline-none focus:border-live"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setGoLiveMatch(null)}
                    className="border border-white/20 px-3 py-1.5 uppercase text-dim hover:text-ink cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingLive}
                    className="border border-live bg-live px-4 py-1.5 uppercase text-xs font-bold text-white hover:bg-live/90 transition-colors cursor-pointer"
                  >
                    {submittingLive ? 'Broadcasting...' : '🔴 Start Broadcast'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* SCORE & COMPLETE MODAL (With winner auto-advancement) */}
      {scoreMatch && (
        <Portal lockScroll>
          <div role="dialog" aria-modal className="fixed inset-0 z-[100] flex items-center justify-center bg-void/85 p-3 sm:p-6 backdrop-blur-md overflow-hidden select-none">
            <div className="relative w-full max-w-md border border-white/20 bg-graphite p-6 max-h-[min(90vh,calc(100svh-2rem))] overflow-y-auto select-text">
              <Brackets color="border-ok/50" />
              <h3 className="font-display text-2xl font-black uppercase text-ink">Score &amp; Complete Match</h3>
              <p className="text-xs text-dim mt-1">
                Record official scores. Declaring a winner will record this team as a qualified contender for manual subsequent round progression.
              </p>

              <form onSubmit={handleScoreSubmit} className="mt-4 space-y-4 font-mono text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="border border-white/10 bg-void/50 p-3">
                    <label className="block text-dim uppercase mb-1 truncate">
                      {scoreMatch.team_a?.name || scoreMatch.team_a_name || 'Team A'} Score
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={scoreForm.score_a}
                      onChange={(e) => setScoreForm({ ...scoreForm, score_a: Number(e.target.value) })}
                      className="w-full border border-white/20 bg-surface px-3 py-2 text-xl font-display font-black text-cyan outline-none"
                    />
                  </div>
                  <div className="border border-white/10 bg-void/50 p-3">
                    <label className="block text-dim uppercase mb-1 truncate">
                      {scoreMatch.team_b?.name || scoreMatch.team_b_name || 'Team B'} Score
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={scoreForm.score_b}
                      onChange={(e) => setScoreForm({ ...scoreForm, score_b: Number(e.target.value) })}
                      className="w-full border border-white/20 bg-surface px-3 py-2 text-xl font-display font-black text-cyan outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-dim uppercase mb-1">Declared Winner</label>
                  <select
                    value={scoreForm.winner_team_id}
                    onChange={(e) => setScoreForm({ ...scoreForm, winner_team_id: e.target.value })}
                    className="w-full border border-white/20 bg-surface px-3 py-2 text-xs text-ink outline-none focus:border-cyan"
                  >
                    <option value="">Auto-Determine from Highest Score</option>
                    {(scoreMatch.team_a?.id || scoreMatch.team_a_id) && (
                      <option value={scoreMatch.team_a?.id || scoreMatch.team_a_id}>
                        {scoreMatch.team_a?.name || scoreMatch.team_a_name || 'Team A'}
                      </option>
                    )}
                    {(scoreMatch.team_b?.id || scoreMatch.team_b_id) && (
                      <option value={scoreMatch.team_b?.id || scoreMatch.team_b_id}>
                        {scoreMatch.team_b?.name || scoreMatch.team_b_name || 'Team B'}
                      </option>
                    )}
                  </select>
                </div>

                <div className="border border-ok/30 bg-ok/[0.05] p-2.5 text-[11px] text-ok">
                  ⚡ Winner will be recorded as a qualified contender for manual round selection (no automated match creation).
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setScoreMatch(null)}
                    className="border border-white/20 px-3 py-1.5 uppercase text-dim hover:text-ink cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingScore}
                    className="border border-ok bg-ok px-4 py-1.5 uppercase text-xs font-bold text-void hover:bg-ok/90 transition-colors cursor-pointer"
                  >
                    {submittingScore ? 'Saving...' : 'Confirm & Complete'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* EDIT MATCH DETAILS & LOBBY MODAL */}
      {editMatch && (
        <Portal lockScroll>
          <div role="dialog" aria-modal className="fixed inset-0 z-[100] flex items-center justify-center bg-void/85 p-3 sm:p-6 backdrop-blur-md overflow-hidden select-none">
            <div className="relative w-full max-w-lg border border-white/20 bg-graphite p-6 max-h-[min(90vh,calc(100svh-2rem))] overflow-y-auto select-text">
              <Brackets color="border-cyan/50" />
              <h3 className="font-display text-2xl font-black uppercase text-ink">
                Edit Match &amp; Lobby Credentials
              </h3>
              <p className="text-xs text-dim mt-1 font-mono">
                {editMatch.tournament_title || 'Tournament'} · {editMatch.stage || 'Round'}
              </p>

              <form onSubmit={handleEditSubmit} className="mt-4 space-y-3 font-mono text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-dim uppercase mb-1">Status</label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      className="w-full border border-white/20 bg-surface px-3 py-1.5 text-xs text-ink outline-none focus:border-cyan"
                    >
                      <option value="SCHEDULED">SCHEDULED</option>
                      <option value="CHECK_IN_OPEN">CHECK_IN_OPEN</option>
                      <option value="LIVE">LIVE</option>
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="DISPUTED">DISPUTED</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-dim uppercase mb-1">Roster Visibility</label>
                    <select
                      value={editForm.roster_status}
                      onChange={(e) => setEditForm({ ...editForm, roster_status: e.target.value })}
                      className="w-full border border-white/20 bg-surface px-3 py-1.5 text-xs text-ink outline-none focus:border-cyan"
                    >
                      <option value="DRAFT">DRAFT (Hidden from Public)</option>
                      <option value="PUBLISHED">PUBLISHED (Public)</option>
                      <option value="UPDATED">UPDATED (Rescheduled)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-dim uppercase mb-1">Round / Stage Name</label>
                    <input
                      type="text"
                      value={editForm.round_name}
                      onChange={(e) => setEditForm({ ...editForm, round_name: e.target.value })}
                      className="w-full border border-white/20 bg-surface px-3 py-1.5 text-xs text-ink outline-none focus:border-cyan"
                    />
                  </div>
                  <div>
                    <label className="block text-dim uppercase mb-1">Next Match Slot</label>
                    <input
                      type="text"
                      placeholder="e.g. Semifinals Match 1"
                      value={editForm.next_match_slot}
                      onChange={(e) => setEditForm({ ...editForm, next_match_slot: e.target.value })}
                      className="w-full border border-white/20 bg-surface px-3 py-1.5 text-xs text-ink outline-none focus:border-cyan"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-dim uppercase mb-1">Scheduled Date</label>
                    <input
                      type="date"
                      value={editForm.scheduled_date}
                      onChange={(e) => setEditForm({ ...editForm, scheduled_date: e.target.value })}
                      className="w-full border border-white/20 bg-surface px-3 py-1.5 text-xs text-ink outline-none focus:border-cyan"
                    />
                  </div>
                  <div>
                    <label className="block text-dim uppercase mb-1">Scheduled Time</label>
                    <input
                      type="text"
                      value={editForm.scheduled_time}
                      onChange={(e) => setEditForm({ ...editForm, scheduled_time: e.target.value })}
                      className="w-full border border-white/20 bg-surface px-3 py-1.5 text-xs text-ink outline-none focus:border-cyan"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-dim uppercase mb-1">YouTube Live Stream URL</label>
                  <input
                    type="url"
                    placeholder="https://youtube.com/live/..."
                    value={editForm.youtube_live_url}
                    onChange={(e) => setEditForm({ ...editForm, youtube_live_url: e.target.value })}
                    className="w-full border border-white/20 bg-surface px-3 py-1.5 text-xs text-ink outline-none focus:border-cyan"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-dim uppercase mb-1">Lobby Room Code</label>
                    <input
                      type="text"
                      placeholder="e.g. AMT-ROOM-01"
                      value={editForm.lobby_code}
                      onChange={(e) => setEditForm({ ...editForm, lobby_code: e.target.value })}
                      className="w-full border border-white/20 bg-surface px-3 py-1.5 text-xs text-ink outline-none focus:border-cyan font-bold text-cyan"
                    />
                  </div>
                  <div>
                    <label className="block text-dim uppercase mb-1">Lobby Password</label>
                    <input
                      type="text"
                      placeholder="e.g. PASS99"
                      value={editForm.lobby_password}
                      onChange={(e) => setEditForm({ ...editForm, lobby_password: e.target.value })}
                      className="w-full border border-white/20 bg-surface px-3 py-1.5 text-xs text-ink outline-none focus:border-cyan font-bold text-warn"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
                  <div>
                    <label className="block text-dim uppercase mb-1">
                      {editMatch.team_a?.name || editMatch.team_a_name || 'Team A'} Score
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editForm.score_a}
                      onChange={(e) => setEditForm({ ...editForm, score_a: Number(e.target.value) })}
                      className="w-full border border-white/20 bg-surface px-3 py-1.5 text-xs text-ink outline-none focus:border-cyan"
                    />
                  </div>
                  <div>
                    <label className="block text-dim uppercase mb-1">
                      {editMatch.team_b?.name || editMatch.team_b_name || 'Team B'} Score
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editForm.score_b}
                      onChange={(e) => setEditForm({ ...editForm, score_b: Number(e.target.value) })}
                      className="w-full border border-white/20 bg-surface px-3 py-1.5 text-xs text-ink outline-none focus:border-cyan"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setEditMatch(null)}
                    className="border border-white/20 px-3 py-1.5 uppercase text-dim hover:text-ink cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingEdit}
                    className="border border-cyan bg-cyan px-4 py-1.5 uppercase text-xs font-bold text-void hover:bg-cyan/90 transition-colors cursor-pointer"
                  >
                    {submittingEdit ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* EDIT CREDENTIALS MODAL */}
      {credentialModalMatch && (
        <Portal lockScroll>
          <div role="dialog" aria-modal className="fixed inset-0 z-[100] flex items-center justify-center bg-void/85 p-3 sm:p-6 backdrop-blur-md overflow-hidden select-none">
            <div className="relative w-full max-w-md border border-cyan/50 bg-graphite p-6 max-h-[min(90vh,calc(100svh-2rem))] overflow-y-auto select-text">
              <Brackets color="border-cyan/50" />
              <h3 className="font-display text-2xl font-black uppercase text-ink">
                Room Credentials (Confidential)
              </h3>
              <p className="text-xs text-dim mt-1">
                Enter room ID and password. Credentials remain strictly confidential until you explicitly click &quot;Release Credentials&quot;.
              </p>

              <form onSubmit={handleSaveCredentialsSubmit} className="mt-4 space-y-4 font-mono text-xs">
                <div>
                  <label className="block text-dim uppercase mb-1">Room ID / Lobby Code</label>
                  <input
                    type="text"
                    placeholder="e.g. AMT-LOBBY-01"
                    value={credentialForm.room_id}
                    onChange={(e) => setCredentialForm({ ...credentialForm, room_id: e.target.value })}
                    className="w-full border border-white/20 bg-surface px-3 py-2 text-ink outline-none focus:border-cyan font-bold text-cyan"
                  />
                </div>
                <div>
                  <label className="block text-dim uppercase mb-1">Room Password / PIN</label>
                  <input
                    type="text"
                    placeholder="e.g. 7894"
                    value={credentialForm.room_password}
                    onChange={(e) => setCredentialForm({ ...credentialForm, room_password: e.target.value })}
                    className="w-full border border-white/20 bg-surface px-3 py-2 text-ink outline-none focus:border-cyan font-bold text-warn"
                  />
                </div>
                <div>
                  <label className="block text-dim uppercase mb-1">Custom Join Instructions (Optional)</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Map: Erangel, Slot 1-4 for Squad A, check in within 10 mins"
                    value={credentialForm.custom_instructions}
                    onChange={(e) => setCredentialForm({ ...credentialForm, custom_instructions: e.target.value })}
                    className="w-full border border-white/20 bg-surface px-3 py-2 text-ink outline-none focus:border-cyan text-xs"
                  />
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setCredentialModalMatch(null)}
                    className="border border-white/20 px-3 py-1.5 uppercase text-dim hover:text-ink cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingCredentials}
                    className="border border-cyan bg-cyan px-4 py-1.5 uppercase text-xs font-bold text-void hover:bg-cyan/90 transition-colors cursor-pointer"
                  >
                    {submittingCredentials ? 'Saving...' : 'Save Credentials'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* BATTLE ROYALE RESULTS MODAL */}
      {brResultsMatch && (
        <Portal lockScroll>
          <div role="dialog" aria-modal className="fixed inset-0 z-[100] flex items-center justify-center bg-void/85 p-3 sm:p-6 backdrop-blur-md overflow-hidden select-none">
            <div className="relative w-full max-w-2xl border border-cyan/50 bg-graphite p-6 max-h-[min(90vh,calc(100svh-2rem))] overflow-y-auto select-text">
              <Brackets color="border-cyan/50" />
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div>
                  <h3 className="font-display text-2xl font-black uppercase text-ink">
                    Battle Royale Scoring &amp; Finalization
                  </h3>
                  <p className="text-xs text-dim mt-0.5">
                    {brResultsMatch.tournament_title || 'Tournament'} · {brResultsMatch.round_name || brResultsMatch.stage} · Match #{brResultsMatch.match_number || 1}
                  </p>
                </div>
                <span className="border border-cyan/40 bg-cyan/10 px-2.5 py-1 text-[10px] text-cyan font-bold uppercase">
                  Battle Royale
                </span>
              </div>

              <form onSubmit={handleSubmitBrResults} className="mt-4 space-y-4 font-mono text-xs">
                {/* Scoring Matrix reference */}
                <div className="p-2.5 border border-white/10 bg-void/60 text-[11px] text-dim flex flex-wrap items-center gap-3">
                  <span className="font-bold text-ink">Matrix:</span>
                  <span>#1: 10pts</span>
                  <span>#2: 6pts</span>
                  <span>#3: 5pts</span>
                  <span>#4: 4pts</span>
                  <span>#5: 3pts</span>
                  <span>#6: 2pts</span>
                  <span>#7-#8: 1pt</span>
                  <span className="text-cyan font-bold">1 Elimination = 1pt</span>
                </div>

                {/* Team Results Table */}
                <div className="border border-white/10 bg-surface/50 max-h-[340px] overflow-y-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 bg-void/80 text-[10px] uppercase text-dim">
                        <th className="p-2">Squad / Team</th>
                        <th className="p-2 w-20">Placement</th>
                        <th className="p-2 w-20">Kills</th>
                        <th className="p-2 w-20">Place Pts</th>
                        <th className="p-2 w-20">Elim Pts</th>
                        <th className="p-2 w-20 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {brTeamResults.map((team, idx) => (
                        <tr key={team.team_id || idx} className="hover:bg-white/[0.02]">
                          <td className="p-2 font-display font-black text-ink text-xs uppercase">
                            {team.team_name}
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="1"
                              max="100"
                              value={team.placement}
                              onChange={(e) => handleUpdateBrRow(idx, 'placement', Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-16 border border-white/20 bg-void px-2 py-1 text-xs text-ink outline-none focus:border-cyan text-center font-bold"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={team.kills}
                              onChange={(e) => handleUpdateBrRow(idx, 'kills', Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-16 border border-white/20 bg-void px-2 py-1 text-xs text-ink outline-none focus:border-cyan text-center font-bold text-live"
                            />
                          </td>
                          <td className="p-2 text-dim tabular-nums font-bold">
                            {team.placement_points}
                          </td>
                          <td className="p-2 text-dim tabular-nums font-bold">
                            {team.elimination_points}
                          </td>
                          <td className="p-2 text-right font-display font-black text-cyan tabular-nums text-sm">
                            {team.total_points}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setBrResultsMatch(null)}
                    className="border border-white/20 px-4 py-2 uppercase text-dim hover:text-ink cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingBrResults}
                    className="border border-cyan bg-cyan px-5 py-2 uppercase text-xs font-bold text-void hover:bg-cyan/90 transition-colors cursor-pointer"
                  >
                    {submittingBrResults ? 'Finalizing...' : '🏆 Finalize Battle Royale Match'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* PARTICIPANT RATINGS MODAL */}
      {ratingsModalMatch && (
        <Portal lockScroll>
          <div role="dialog" aria-modal className="fixed inset-0 z-[100] flex items-center justify-center bg-void/85 p-3 sm:p-6 backdrop-blur-md overflow-hidden select-none">
            <div className="relative w-full max-w-xl border border-cyan/50 bg-graphite p-6 max-h-[min(90vh,calc(100svh-2rem))] overflow-y-auto select-text">
              <Brackets color="border-cyan/50" />
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <h3 className="font-display text-2xl font-black uppercase text-ink">
                  ★ Post-Match Player Ratings
                </h3>
                <span className="text-[10px] text-cyan font-bold uppercase">
                  Match #{ratingsModalMatch.match_number || 1}
                </span>
              </div>
              <p className="text-xs text-dim mt-1">
                Authorized organizers can assign 1-10 performance ratings and optional feedback for participants.
              </p>

              {loadingRatings ? (
                <div className="p-8 text-center text-dim font-mono">Loading participants...</div>
              ) : (
                <form onSubmit={handleSubmitRatings} className="mt-4 space-y-4 font-mono text-xs">
                  <div className="max-h-[320px] overflow-y-auto space-y-3 pr-1">
                    {ratingsList.length === 0 ? (
                      <div className="p-4 border border-white/10 text-center text-dim">
                        No individual player roster found for this match.
                      </div>
                    ) : (
                      ratingsList.map((item, idx) => (
                        <div key={item.user_id || idx} className="border border-white/10 bg-void/60 p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-display font-black text-ink text-sm uppercase">
                              {item.username}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-dim text-[11px]">Rating:</span>
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
                                className="w-16 border border-cyan/40 bg-surface px-2 py-1 text-center font-display font-black text-cyan text-sm outline-none"
                              />
                              <span className="text-dim text-[10px]">/ 10</span>
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
                                  next[idx] = { ...next[idx], review: val }
                                  return next
                                })
                              }}
                              className="w-full border border-white/10 bg-surface px-3 py-1.5 text-xs text-ink outline-none focus:border-cyan"
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
                      className="border border-cyan bg-cyan px-5 py-2 uppercase text-xs font-bold text-void hover:bg-cyan/90 transition-colors cursor-pointer"
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
