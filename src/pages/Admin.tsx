import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { Container, Hud, Badge, Dot, Cta, SectionHead, Modal, Panel } from '../components/ui'
import { LiveMatchesManager } from '../components/admin/LiveMatchesManager'
import { useAuthContext } from '../context/AuthContext'
import {
  getAdminStats,
  getAdminUsers,
  setUserRole,
  promoteUserToOrganizer,
  getPendingPayments,
  getAdminPayments,
  approvePayment,
  rejectPayment,
  getAdminUpiAccounts,
  createUpiAccount,
  toggleUpiAccountStatus,
  uploadUpiAccountQr,
  getAdminPayouts,
  createWinningPayout,
  completePayout,
  rejectPayout,
  getAdminSupportTickets,
  updateSupportTicket,
  retrySupportTicketEmail,
  getRegulations,
  createRegulation,
  deleteRegulation,
  getEmailSystemStatusAdmin,
  sendTestEmailAdmin,
  sendOfficialEmailAdmin,
  getAllPageMedia,
  updatePageMedia,
  uploadMediaFile,
  getTournamentRegisteredRosters,
  getDisputes,
  resolveDispute,
  getAuditLogs,
  createGame,
  updateGame,
  deleteGame,
  publishGame,
  AdminStats,
  AdminUser,
  PendingPayment,
  PayoutRecord,
  UpiAccount,
  SupportTicket,
  GameRegulation,
  EmailSystemStatus,
  PageMediaConfig,
  AuditLog,
} from '../services/admin'
import { getGames, Game } from '../services/games'
import {
  getTournaments,
  getFeaturedTournament,
  setFeaturedTournament,
  normalizeTournament,
  Tournament,
} from '../services/tournaments'
import {
  getGenres,
  createGenre,
  updateGenre,
  deleteGenre,
  Genre,
  GenreCreatePayload,
} from '../services/genres'
import {
  getAdminReviews,
  moderateReview,
  deleteReview,
  ReviewItem,
} from '../services/reviews'
import {
  createTournamentOrganizer,
  updateTournamentOrganizer,
  deleteTournamentOrganizer,
  publishTournamentOrganizer,
  closeRegistrationOrganizer,
  generateBracketOrganizer,
  cancelTournamentOrganizer,
} from '../services/organizer'
import { getMatches, updateMatch, ApiMatch } from '../services/matches'
import { CANONICAL_CATEGORIES } from '../lib/categories'
import { resolveMediaUrl } from '../services/apiClient'
import { inr } from '../lib/data'

function BannerImageUploader({
  value,
  onChange,
  label = 'Banner Image',
  recommendedRatio = '16:9',
  recommendedRes = '1920x1080',
}: {
  value: string
  onChange: (val: string) => void
  label?: string
  recommendedRatio?: string
  recommendedRes?: string
}) {
  const [isUploading, setIsUploading] = useState(false)
  const [warning, setWarning] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [previewSrc, setPreviewSrc] = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setWarning(null)
    setInfo(null)

    if (file.size > 20 * 1024 * 1024) {
      setWarning('⚠️ File size exceeds maximum limit of 20MB.')
      return
    }

    const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')
    const objectUrl = URL.createObjectURL(file)

    if (isSvg) {
      setInfo('✓ Vector SVG graphic loaded (infinitely sharp at all resolutions)')
      setPreviewSrc(objectUrl)
      setIsUploading(true)
      try {
        const res = await uploadMediaFile(file)
        if (res?.url) {
          onChange(res.url)
        }
      } catch (err: any) {
        alert(err.message || 'SVG upload failed')
      } finally {
        setIsUploading(false)
      }
      return
    }

    const imgObj = new Image()
    imgObj.onload = async () => {
      const width = imgObj.naturalWidth
      const height = imgObj.naturalHeight
      const ratio = width / (height || 1)
      const targetRatio = recommendedRatio === '1:1' ? 1.0 : 16 / 9

      if (recommendedRatio === '1:1') {
        if (Math.abs(ratio - 1.0) > 0.25) {
          setWarning(
            `⚠️ Non-square aspect ratio: ${width}x${height} (${ratio.toFixed(2)}:1). Recommended ratio is 1:1 square (e.g. ${recommendedRes}).`
          )
        } else {
          setInfo(`✓ Verified: 1:1 square aspect ratio (${width}x${height}px)`)
        }
      } else {
        if (Math.abs(ratio - targetRatio) > 0.18) {
          setWarning(
            `⚠️ Non-standard aspect ratio: ${width}x${height} (${ratio.toFixed(2)}:1). Recommended ratio is 16:9 (~1.78:1, e.g. ${recommendedRes}). Image will be fitted/cropped to 16:9.`
          )
        } else {
          setInfo(`✓ Verified: 16:9 aspect ratio (${width}x${height}px)`)
        }

        if (width < 1280 || height < 720) {
          setWarning((prev) =>
            prev
              ? `${prev} | Note: Low resolution (${width}x${height}px). Recommended is ${recommendedRes} for high-DPI displays.`
              : `ℹ️ Note: Resolution is ${width}x${height}px. Recommended is ${recommendedRes} for optimal visual quality.`
          )
        }
      }

      setPreviewSrc(objectUrl)
      setIsUploading(true)
      try {
        const res = await uploadMediaFile(file)
        if (res?.url) {
          onChange(res.url)
        }
      } catch (err: any) {
        alert(err.message || 'Image upload failed')
      } finally {
        setIsUploading(false)
      }
    }

    imgObj.onerror = () => {
      setWarning('Unable to decode image file. Please choose a valid PNG, JPG, WEBP, or SVG image.')
    }

    imgObj.src = objectUrl
  }

  const currentDisplay = previewSrc || (value ? resolveMediaUrl(value) : null)

  return (
    <div className="space-y-1.5 mt-2">
      <div className="flex items-center justify-between">
        <label className="text-dim text-[11px] uppercase tracking-wider">{label}</label>
        <span className="font-mono text-[10px] text-cyan">
          Target: {recommendedRatio} ({recommendedRes})
        </span>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="https://... or upload below"
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setPreviewSrc(null)
          }}
          className="flex-1 border border-white/15 bg-surface p-2.5 font-mono text-xs text-ink outline-none focus:border-cyan"
        />
        <label className="cursor-pointer border border-cyan/40 bg-cyan/10 px-3.5 py-2 font-mono text-xs uppercase tracking-wider text-cyan hover:bg-cyan/20 shrink-0 flex items-center justify-center">
          {isUploading ? 'Uploading...' : 'Upload File'}
          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
            className="hidden"
            disabled={isUploading}
            onChange={handleFileChange}
          />
        </label>
      </div>

      {warning && (
        <div className="border border-warn/30 bg-warn/10 p-2 font-mono text-[11px] text-warn">
          {warning}
        </div>
      )}
      {info && !warning && (
        <div className="border border-ok/30 bg-ok/10 p-1.5 font-mono text-[11px] text-ok">
          {info}
        </div>
      )}

      {/* Card Aspect Ratio Preview */}
      {currentDisplay ? (
        <div className={`relative ${recommendedRatio === '1:1' ? 'aspect-square max-w-[120px]' : 'aspect-[16/9] max-w-sm'} w-full overflow-hidden border border-white/20 bg-surface/50 mt-1`}>
          <img
            src={currentDisplay}
            alt="Preview"
            className="size-full object-cover"
          />
          <div className="absolute bottom-1 right-1 bg-void/85 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-cyan border border-white/10 backdrop-blur-sm">
            {recommendedRatio} Preview
          </div>
          <button
            type="button"
            onClick={() => {
              onChange('')
              setPreviewSrc(null)
              setWarning(null)
              setInfo(null)
            }}
            className="absolute top-1 right-1 bg-void/85 px-2 py-0.5 font-mono text-[10px] text-live hover:text-white border border-white/10"
          >
            Clear
          </button>
        </div>
      ) : (
        <div className={`flex ${recommendedRatio === '1:1' ? 'aspect-square max-w-[120px]' : 'aspect-[16/9] max-w-sm'} w-full items-center justify-center border border-dashed border-white/15 bg-surface/20 text-dim font-mono text-[10px] mt-1 text-center p-2`}>
          No {recommendedRatio === '1:1' ? 'Logo' : 'Banner'} Set
        </div>
      )}
    </div>
  )
}

const TABS = [
  'OVERVIEW',
  'TOURNAMENTS',
  'LIVE MATCHES',
  'FEATURED TOURNAMENT',
  'GAMES CATALOG',
  'GENRES & CATEGORIES',
  'PAGE MEDIA',
  'REVIEWS MODERATION',
  'USERS & ROLES',
  'PENDING PAYMENTS',
  'UPI & QR ACCOUNTS',
  'PAYOUTS LEDGER',
  'SUPPORT TICKETS',
  'RULES & REGULATIONS',
  'EMAIL & SMTP',
  'DISPUTES & QUEUE',
  'AUDIT LOGS',
] as const

export default function Admin() {
  const { profile, isSuperAdmin, isLoading: authLoading } = useAuthContext()
  const [tab, setTab] = useState<(typeof TABS)[number]>('OVERVIEW')

  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [payments, setPayments] = useState<PendingPayment[]>([])
  const [games, setGames] = useState<Game[]>([])
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [featuredTour, setFeaturedTour] = useState<Tournament | null>(null)
  const [selectedFeaturedId, setSelectedFeaturedId] = useState<string>('')
  const [isSavingFeatured, setIsSavingFeatured] = useState(false)

  // Additional Datasets
  const [upiAccounts, setUpiAccounts] = useState<UpiAccount[]>([])
  const [payouts, setPayouts] = useState<PayoutRecord[]>([])
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [regulations, setRegulations] = useState<GameRegulation[]>([])
  const [emailStatus, setEmailStatus] = useState<EmailSystemStatus | null>(null)
  const [mediaConfigs, setMediaConfigs] = useState<PageMediaConfig[]>([])
  const [disputes, setDisputes] = useState<any[]>([])

  const [loading, setLoading] = useState(true)
  const [actionMsg, setActionMsg] = useState<string | null>(null)

  // Payment Rejection Modal
  const [rejectPaymentId, setRejectPaymentId] = useState<string | null>(null)
  const [rejectNotes, setRejectNotes] = useState('')

  // UPI Modal & QR States
  const [isNewUpiOpen, setIsNewUpiOpen] = useState(false)
  const [newUpi, setNewUpi] = useState({ code: '', upi_id: '', payee_name: '', display_name: '', qr_url: '' })
  const [uploadingQrAccId, setUploadingQrAccId] = useState<string | null>(null)
  const [isUploadingNewUpiQr, setIsUploadingNewUpiQr] = useState(false)

  // Payout Modals
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false)
  const [newPayout, setNewPayout] = useState({ user_id: '', game_id: '', rank_or_placement: '1st Place', amount_inr: 5000, destination: 'WALLET' })
  const [completePayoutId, setCompletePayoutId] = useState<string | null>(null)
  const [outgoingUtr, setOutgoingUtr] = useState('')

  // Support Ticket Modal
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [ticketStatusVal, setTicketStatusVal] = useState('IN_PROGRESS')
  const [ticketNotes, setTicketNotes] = useState('')

  // Email System
  const [testEmailTo, setTestEmailTo] = useState('admin@ametheus.gg')
  const [isSendingTestMail, setIsSendingTestMail] = useState(false)
  const [isOfficialMailOpen, setIsOfficialMailOpen] = useState(false)
  const [officialMail, setOfficialMail] = useState({ recipient_type: 'ALL_USERS', subject: '', message: '' })

  // Regulations Modal
  const [isNewRegOpen, setIsNewRegOpen] = useState(false)
  const [newReg, setNewReg] = useState({ game_name: 'VALORANT', chapter_code: 'VAL-SEC-01', title: 'Tournament Regulations', format: '5v5 Tactical', server: 'AWS Mumbai', rules: 'Anti-cheat verification mandatory.\nRespect referee rulings.' })

  // TOURNAMENTS Interactive States
  const [tournamentFilter, setTournamentFilter] = useState('ALL')
  const [tournamentSearch, setTournamentSearch] = useState('')
  const [isCreateTourOpen, setIsCreateTourOpen] = useState(false)
  const [newTour, setNewTour] = useState({
    title: '',
    game_id: 'valorant',
    format: 'Single Elimination · BO3',
    prize_pool_inr: 25000,
    entry_fee_inr: 100,
    max_teams: 16,
    min_team_size: 5,
    max_team_size: 5,
    start_date: new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 16),
    banner_url: '',
    whatsapp_group_url: '',
    description: 'Official Sanctioned Competitive Esports Tournament on AMETHEUS.',
  })
  const [editingTour, setEditingTour] = useState<Tournament | null>(null)
  const [rosterTour, setRosterTour] = useState<Tournament | null>(null)
  const [rostersList, setRostersList] = useState<any[]>([])
  const [loadingRosters, setLoadingRosters] = useState(false)

  // GAMES CATALOG Interactive States
  const [isCreateGameOpen, setIsCreateGameOpen] = useState(false)
  const [newGame, setNewGame] = useState({
    slug: '',
    name: '',
    category: 'FPS',
    platform: 'PC',
    tag: 'TACTICAL',
    is_team_game: true,
    min_team_size: 5,
    max_team_size: 5,
    max_substitutes: 2,
    entry_fee_inr: 0,
    prize_pool_inr: 50000,
    play_url: '',
    banner_url: '',
    logo_url: '',
    description: '',
    server_region: 'Mumbai, India',
    anti_cheat: 'Vanguard / EAC',
    match_protocol: 'Official Competitive Ruleset',
    accent_color: '#3ef2ff',
    status: 'ACTIVE',
  })
  const [editingGame, setEditingGame] = useState<Game | null>(null)
  const [isUploadingGameLogo, setIsUploadingGameLogo] = useState(false)

  // GENRES & CATEGORIES Interactive States
  const [genres, setGenres] = useState<Genre[]>([])
  const [isCreateGenreOpen, setIsCreateGenreOpen] = useState(false)
  const [newGenre, setNewGenre] = useState<GenreCreatePayload>({
    name: '',
    slug: '',
    description: '',
    banner_url: '',
    icon_url: '',
    rotation_interval_seconds: 4,
    display_order: 0,
    is_active: true,
  })
  const [editingGenre, setEditingGenre] = useState<Genre | null>(null)

  // PAGE MEDIA Interactive States
  const [editingMedia, setEditingMedia] = useState<PageMediaConfig | null>(null)
  const [isUploadingMediaFile, setIsUploadingMediaFile] = useState(false)

  // REVIEWS MODERATION Interactive States
  const [adminReviews, setAdminReviews] = useState<ReviewItem[]>([])
  const [reviewStatusFilter, setReviewStatusFilter] = useState('ALL')
  const [reviewSearch, setReviewSearch] = useState('')
  const [selectedReviewForMod, setSelectedReviewForMod] = useState<ReviewItem | null>(null)
  const [modStatus, setModStatus] = useState<'APPROVED' | 'FEATURED' | 'PENDING' | 'HIDDEN'>('APPROVED')
  const [modNotes, setModNotes] = useState('')

  // LIVE MATCHES Interactive States
  const [adminMatches, setAdminMatches] = useState<ApiMatch[]>([])
  const [matchesLoading, setMatchesLoading] = useState(false)
  const [matchStatusFilter, setMatchStatusFilter] = useState('ALL')
  const [matchTourFilter, setMatchTourFilter] = useState('ALL')
  const [editingMatch, setEditingMatch] = useState<ApiMatch | null>(null)
  const [editMatchForm, setEditMatchForm] = useState({
    status: 'SCHEDULED',
    youtube_live_url: '',
    live_link: '',
    lobby_code: '',
    lobby_password: '',
    server_region: 'AWS Mumbai (ap-south-1)',
    score_a: 0,
    score_b: 0,
    winner_team_id: '',
  })

  const fetchAdminMatches = async () => {
    setMatchesLoading(true)
    try {
      const data = await getMatches()
      if (Array.isArray(data)) setAdminMatches(data)
    } catch (err) {
      console.warn('Failed to load matches:', err)
    } finally {
      setMatchesLoading(false)
    }
  }

  const handleQuickMatchStatus = async (matchId: string, newStatus: string) => {
    try {
      await updateMatch(matchId, { status: newStatus })
      setActionMsg(`Match status updated to ${newStatus}`)
      setTimeout(() => setActionMsg(null), 3000)
      fetchAdminMatches()
    } catch (err: any) {
      alert(err.message || 'Failed to update match status')
    }
  }

  const handleOpenEditMatch = (m: ApiMatch) => {
    setEditingMatch(m)
    setEditMatchForm({
      status: m.status || 'SCHEDULED',
      youtube_live_url: m.youtube_live_url || '',
      live_link: m.live_link || '',
      lobby_code: m.lobby_code || '',
      lobby_password: m.lobby_password || '',
      server_region: m.server_region || 'AWS Mumbai (ap-south-1)',
      score_a: m.team_a?.score ?? 0,
      score_b: m.team_b?.score ?? 0,
      winner_team_id: m.winner_team_id || '',
    })
  }

  const handleSaveMatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingMatch) return
    try {
      await updateMatch(editingMatch.id, {
        status: editMatchForm.status,
        youtube_live_url: editMatchForm.youtube_live_url,
        live_link: editMatchForm.live_link,
        lobby_code: editMatchForm.lobby_code,
        lobby_password: editMatchForm.lobby_password,
        server_region: editMatchForm.server_region,
        score_a: Number(editMatchForm.score_a),
        score_b: Number(editMatchForm.score_b),
        winner_team_id: editMatchForm.winner_team_id || undefined,
      })
      setActionMsg('Match credentials, stream & score updated successfully')
      setTimeout(() => setActionMsg(null), 3500)
      setEditingMatch(null)
      fetchAdminMatches()
    } catch (err: any) {
      alert(err.message || 'Failed to update match')
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const [s, u, p, g, l, tList, fTour, upiList, payList, tixList, regList, eStat, mList, dispList, mAll, genreList, revList] = await Promise.all([
        getAdminStats().catch(() => null),
        getAdminUsers().catch(() => []),
        getPendingPayments().catch(() => []),
        getGames().catch(() => []),
        getAuditLogs().catch(() => []),
        getTournaments().catch(() => []),
        getFeaturedTournament().catch(() => null),
        getAdminUpiAccounts().catch(() => []),
        getAdminPayouts().catch(() => []),
        getAdminSupportTickets().then((r) => r.tickets).catch(() => []),
        getRegulations().catch(() => []),
        getEmailSystemStatusAdmin().catch(() => null),
        getAllPageMedia().catch(() => []),
        getDisputes().catch(() => []),
        getMatches().catch(() => []),
        getGenres(true).catch(() => []),
        getAdminReviews().catch(() => []),
      ])

      if (s) setStats(s)
      setUsers(u)
      setPayments(p)
      setGames(g)
      setLogs(l)
      setTournaments(tList)
      setFeaturedTour(fTour)
      setUpiAccounts(upiList)
      setPayouts(payList)
      setTickets(tixList)
      setRegulations(regList)
      setEmailStatus(eStat)
      setMediaConfigs(mList)
      setDisputes(dispList)
      if (Array.isArray(mAll)) setAdminMatches(mAll)
      setGenres(genreList)
      setAdminReviews(revList)

      if (fTour) {
        setSelectedFeaturedId(fTour.id || fTour.slug)
      } else if (tList.length > 0) {
        setSelectedFeaturedId(tList[0].id || tList[0].slug)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isSuperAdmin) {
      loadData()
    }
  }, [isSuperAdmin])

  const showToast = (msg: string) => {
    setActionMsg(msg)
    setTimeout(() => setActionMsg(null), 4000)
  }

  const handleSetFeatured = async (idToSet?: string) => {
    const targetId = idToSet !== undefined ? idToSet : selectedFeaturedId
    if (!targetId) return
    setIsSavingFeatured(true)
    try {
      await setFeaturedTournament(targetId)
      showToast(`Homepage Featured Tournament set: ${targetId === 'none' ? 'None (Spotlight Cleared)' : targetId}`)
      const updated = await getFeaturedTournament()
      setFeaturedTour(updated)
      if (idToSet !== undefined) setSelectedFeaturedId(idToSet)
    } catch (err: any) {
      alert(err.message || 'Failed to update featured tournament')
    } finally {
      setIsSavingFeatured(false)
    }
  }

  const handleApprovePayment = async (id: string) => {
    try {
      await approvePayment(id)
      showToast('Payment verified and approved! Funds credited.')
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to approve payment')
    }
  }

  const handleRejectPayment = async () => {
    if (!rejectPaymentId) return
    try {
      await rejectPayment(rejectPaymentId, rejectNotes)
      showToast('Payment rejected.')
      setRejectPaymentId(null)
      setRejectNotes('')
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to reject payment')
    }
  }

  const handleCreateUpi = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createUpiAccount(newUpi)
      showToast(`UPI Account ${newUpi.code} registered!`)
      setIsNewUpiOpen(false)
      setNewUpi({ code: '', upi_id: '', payee_name: '', display_name: '', qr_url: '' })
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to create UPI account')
    }
  }

  const handleToggleUpi = async (id: string) => {
    try {
      await toggleUpiAccountStatus(id)
      showToast('UPI Account status updated.')
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to toggle UPI account status')
    }
  }

  const handleCreatePayout = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createWinningPayout(newPayout)
      showToast('Winning payout record created.')
      setIsPayoutModalOpen(false)
      setNewPayout({ user_id: '', game_id: '', rank_or_placement: '1st Place', amount_inr: 5000, destination: 'WALLET' })
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to create payout')
    }
  }

  const handleCompletePayout = async () => {
    if (!completePayoutId || !outgoingUtr) return
    try {
      await completePayout(completePayoutId, outgoingUtr)
      showToast('Payout marked COMPLETED with UTR reference.')
      setCompletePayoutId(null)
      setOutgoingUtr('')
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to complete payout')
    }
  }

  const handleUpdateTicket = async () => {
    if (!selectedTicket) return
    try {
      await updateSupportTicket(selectedTicket.id, {
        status: ticketStatusVal,
        internal_notes: ticketNotes,
      })
      showToast('Support ticket updated.')
      setSelectedTicket(null)
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to update ticket')
    }
  }

  const handleSendTestMail = async () => {
    setIsSendingTestMail(true)
    try {
      await sendTestEmailAdmin({ service: 'support', to_email: testEmailTo })
      showToast(`Diagnostic email dispatched to ${testEmailTo}!`)
    } catch (err: any) {
      alert(err.message || 'Failed to send test email')
    } finally {
      setIsSendingTestMail(false)
    }
  }

  const handleSendOfficialMail = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await sendOfficialEmailAdmin(officialMail)
      showToast('Official platform notification email sent to users!')
      setIsOfficialMailOpen(false)
      setOfficialMail({ recipient_type: 'ALL_USERS', subject: '', message: '' })
    } catch (err: any) {
      alert(err.message || 'Failed to send official mail')
    }
  }

  const handleCreateReg = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createRegulation({
        ...newReg,
        rules: newReg.rules.split('\n').filter(Boolean),
        map_pool: ['Haven', 'Bind', 'Ascent', 'Sunset'],
      })
      showToast('Game regulation chapter published!')
      setIsNewRegOpen(false)
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to create regulation')
    }
  }

  const handleDeleteReg = async (id: string) => {
    if (!confirm('Are you sure you want to delete this regulation chapter?')) return
    try {
      await deleteRegulation(id)
      showToast('Regulation chapter removed.')
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to delete regulation')
    }
  }

  // Tournament Action Handlers
  const handlePublishTour = async (id: string) => {
    try {
      await publishTournamentOrganizer(id)
      showToast('Tournament published successfully!')
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to publish tournament')
    }
  }

  const handleCloseRegTour = async (id: string) => {
    try {
      await closeRegistrationOrganizer(id)
      showToast('Registration locked and closed for tournament!')
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to close registration')
    }
  }

  const handleGenerateBracketTour = async (id: string) => {
    try {
      await generateBracketOrganizer(id)
      showToast('Match bracket generated successfully!')
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to generate bracket')
    }
  }

  const handleCancelTour = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this tournament? Registrations will be refunded.')) return
    try {
      await cancelTournamentOrganizer(id)
      showToast('Tournament cancelled.')
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to cancel tournament')
    }
  }

  const handleViewRosters = async (t: Tournament) => {
    setRosterTour(t)
    setLoadingRosters(true)
    try {
      const res = await getTournamentRegisteredRosters(t.id || t.slug)
      const list = Array.isArray(res) ? res : res.teams || res.rosters || []
      setRostersList(list)
    } catch {
      setRostersList([])
    } finally {
      setLoadingRosters(false)
    }
  }

  const handleCreateTourSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createTournamentOrganizer({
        ...newTour,
        prize_pool_inr: Number(newTour.prize_pool_inr),
        entry_fee_inr: Number(newTour.entry_fee_inr),
        max_teams: Number(newTour.max_teams),
        min_team_size: Number(newTour.min_team_size),
        max_team_size: Number(newTour.max_team_size),
      })
      showToast('Tournament created successfully!')
      setIsCreateTourOpen(false)
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to create tournament')
    }
  }

  const handleUpdateTourSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTour) return
    try {
      await updateTournamentOrganizer(editingTour.id || editingTour.slug, {
        title: editingTour.title,
        game_id: editingTour.game_id,
        format: editingTour.format,
        prize_pool_inr: Number(editingTour.prize_pool_inr),
        entry_fee_inr: Number(editingTour.entry_fee_inr),
        max_teams: Number(editingTour.max_teams),
        start_date: editingTour.start_date,
        banner_url: editingTour.banner_url,
        whatsapp_group_url: editingTour.whatsapp_group_url,
        description: editingTour.description,
      })
      showToast('Tournament updated successfully!')
      setEditingTour(null)
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to update tournament')
    }
  }

  // Games Action Handlers
  const handleCreateGameSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createGame({
        ...newGame,
        min_team_size: Number(newGame.min_team_size),
        max_team_size: Number(newGame.max_team_size),
        max_substitutes: Number(newGame.max_substitutes),
        entry_fee_inr: Number(newGame.entry_fee_inr),
        prize_pool_inr: Number(newGame.prize_pool_inr),
      })
      showToast(`Game title ${newGame.name} created!`)
      setIsCreateGameOpen(false)
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to create game')
    }
  }

  const handleUpdateGameSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingGame) return
    try {
      await updateGame(editingGame.id || editingGame.slug, {
        name: editingGame.name,
        category: editingGame.category,
        platform: editingGame.platform,
        tag: editingGame.tag,
        is_team_game: editingGame.is_team_game,
        min_team_size: Number(editingGame.min_team_size),
        max_team_size: Number(editingGame.max_team_size),
        entry_fee_inr: Number(editingGame.entry_fee_inr || 0),
        prize_pool_inr: Number(editingGame.prize_pool_inr || 0),
        banner_url: editingGame.banner_url,
        logo_url: editingGame.logo_url,
        description: editingGame.description,
        server_region: editingGame.server_region,
        anti_cheat: editingGame.anti_cheat,
        status: editingGame.status,
      })
      showToast(`Game title ${editingGame.name} updated!`)
      setEditingGame(null)
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to update game')
    }
  }

  const handleDeleteGameAction = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the game title "${name}"?`)) return
    try {
      await deleteGame(id)
      showToast(`Game title "${name}" deleted.`)
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to delete game')
    }
  }

  const handlePublishGameAction = async (id: string) => {
    try {
      await publishGame(id)
      showToast('Game published as active.')
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to publish game')
    }
  }

  // Genres Action Handlers
  const handleCreateGenreSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createGenre({
        ...newGenre,
        rotation_interval_seconds: Number(newGenre.rotation_interval_seconds || 4),
        display_order: Number(newGenre.display_order || 0),
      })
      showToast(`Genre category "${newGenre.name}" created!`)
      setIsCreateGenreOpen(false)
      setNewGenre({
        name: '',
        slug: '',
        description: '',
        banner_url: '',
        icon_url: '',
        rotation_interval_seconds: 4,
        display_order: 0,
        is_active: true,
      })
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to create genre')
    }
  }

  const handleUpdateGenreSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingGenre) return
    try {
      await updateGenre(editingGenre.id || (editingGenre as any)._id, {
        name: editingGenre.name,
        slug: editingGenre.slug,
        description: editingGenre.description,
        banner_url: editingGenre.banner_url,
        icon_url: editingGenre.icon_url,
        rotation_interval_seconds: Number(editingGenre.rotation_interval_seconds || 4),
        display_order: Number(editingGenre.display_order || 0),
        is_active: editingGenre.is_active,
      })
      showToast(`Genre category "${editingGenre.name}" updated!`)
      setEditingGenre(null)
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to update genre')
    }
  }

  const handleDeleteGenreAction = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the genre "${name}"?`)) return
    try {
      await deleteGenre(id)
      showToast(`Genre "${name}" removed.`)
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to delete genre')
    }
  }

  const handleToggleGenreActive = async (g: Genre) => {
    try {
      await updateGenre(g.id || (g as any)._id, {
        is_active: !g.is_active,
      })
      showToast(`Genre "${g.name}" ${!g.is_active ? 'activated' : 'deactivated'}.`)
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to toggle genre status')
    }
  }

  // Reviews Action Handlers
  const handleModerateReviewAction = async (
    id: string,
    status: 'APPROVED' | 'FEATURED' | 'PENDING' | 'HIDDEN',
    notes?: string
  ) => {
    try {
      await moderateReview(id, { status, admin_notes: notes })
      showToast(`Review updated to ${status}!`)
      setSelectedReviewForMod(null)
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to update review status')
    }
  }

  const handleDeleteReviewAction = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this contender review?')) return
    try {
      await deleteReview(id)
      showToast('Review permanently deleted.')
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to delete review')
    }
  }

  // Media Config Handler
  const handleSaveMediaConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingMedia) return
    try {
      await updatePageMedia(editingMedia.page_id, {
        title: editingMedia.title,
        media_type: editingMedia.media_type,
        media_url: editingMedia.media_url,
        fallback_url: editingMedia.fallback_url,
        opacity: Number(editingMedia.opacity || 0.35),
        is_active: editingMedia.is_active,
      })
      showToast(`Page media for "${editingMedia.title || editingMedia.page_id}" updated!`)
      setEditingMedia(null)
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to update page media')
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-void">
        <Hud className="text-cyan animate-pulse">CHECKING ADMIN AUTHORIZATION...</Hud>
      </div>
    )
  }

  if (!isSuperAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-void px-6 text-center">
        <span className="font-mono text-5xl text-live">403</span>
        <h1 className="mt-4 font-display text-4xl font-black uppercase">Restricted Terminal</h1>
        <p className="mt-2 max-w-md text-dim">You must have Super Admin privileges to enter the command console.</p>
        <div className="mt-8">
          <Cta to="/">Return to Safety</Cta>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-void pb-32 pt-28">
      <Container>
        {/* Terminal Header */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-white/10 pb-8">
          <div>
            <div className="flex items-center gap-3">
              <span className="size-2 rounded-full bg-live animate-pulse" />
              <Hud className="text-live">SUPER ADMIN TERMINAL</Hud>
              <span className="border border-live/40 bg-live/10 px-2 py-0.5 font-mono text-[9px] uppercase text-live">
                ROOT PRIVILEGES
              </span>
            </div>
            <h1 className="mt-2 font-display text-[clamp(2.5rem,6vw,5.5rem)] font-black uppercase leading-none">
              Platform Command Center
            </h1>
            <p className="mt-2 text-dim">Master operations console: manage tournaments, games, users, verify payments, disburse payouts, arbitrate disputes, and configure platform media.</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={loadData}
              className="border border-white/20 bg-surface px-4 py-2 font-mono text-xs uppercase hover:border-cyan hover:text-cyan transition-colors"
            >
              Sync Live State
            </button>
          </div>
        </div>

        {actionMsg && (
          <div className="mt-6 border border-ok/40 bg-ok/10 p-4 text-ok font-mono text-xs uppercase tracking-[0.16em]">
            ✓ {actionMsg}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="no-scrollbar mt-8 flex gap-1 overflow-x-auto border-b border-white/10 pb-px">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`shrink-0 border-b-2 px-4 py-3 font-mono text-xs uppercase tracking-[0.18em] transition-colors ${
                tab === t
                  ? 'border-cyan bg-cyan/10 text-cyan'
                  : 'border-transparent text-dim hover:text-ink hover:bg-white/[0.02]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW */}
        {tab === 'OVERVIEW' && (
          <div className="mt-8 space-y-8">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Panel className="p-5">
                <Hud className="text-dim">TOTAL USERS</Hud>
                <p className="mt-2 font-display text-4xl font-black">{stats?.total_users ?? users.length}</p>
              </Panel>
              <Panel className="p-5">
                <Hud className="text-cyan">ACTIVE TOURNAMENTS</Hud>
                <p className="mt-2 font-display text-4xl font-black text-cyan">{stats?.active_tournaments ?? tournaments.length}</p>
              </Panel>
              <Panel className="p-5">
                <Hud className="text-warn">PENDING PAYMENTS</Hud>
                <p className="mt-2 font-display text-4xl font-black text-warn">{payments.length}</p>
              </Panel>
              <Panel className="p-5">
                <Hud className="text-ok">ESCROW VAULT</Hud>
                <p className="mt-2 font-display text-4xl font-black text-ok">{inr(stats?.platform_escrow_vault ?? 50000)}</p>
              </Panel>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid gap-4 md:grid-cols-3">
              <Panel className="p-6">
                <Hud className="text-cyan">TOURNAMENTS HUB</Hud>
                <h3 className="mt-2 font-display text-2xl font-black uppercase truncate">
                  {tournaments.length} Tournaments
                </h3>
                <p className="text-xs text-dim mt-1 font-mono">Create, lock rosters, generate brackets, publish.</p>
                <div className="mt-4">
                  <button onClick={() => setTab('TOURNAMENTS')} className="border border-cyan/40 bg-cyan/10 px-3 py-1.5 font-mono text-xs uppercase text-cyan hover:bg-cyan/20 transition-colors">
                    Manage Tournaments →
                  </button>
                </div>
              </Panel>

              <Panel className="p-6">
                <Hud className="text-warn">PAYMENT APPROVALS</Hud>
                <h3 className="mt-2 font-display text-2xl font-black uppercase text-warn">{payments.length} Pending</h3>
                <p className="text-xs text-dim mt-1 font-mono">UTRs requiring manual bank reconciliation.</p>
                <div className="mt-4">
                  <button onClick={() => setTab('PENDING PAYMENTS')} className="border border-warn/40 bg-warn/10 px-3 py-1.5 font-mono text-xs uppercase text-warn hover:bg-warn/20 transition-colors">
                    Review Transactions →
                  </button>
                </div>
              </Panel>

              <Panel className="p-6">
                <Hud className="text-ok">SUPPORT TICKETS</Hud>
                <h3 className="mt-2 font-display text-2xl font-black uppercase text-ok">{tickets.length} Active</h3>
                <p className="text-xs text-dim mt-1 font-mono">Customer inquiries and payment disputes.</p>
                <div className="mt-4">
                  <button onClick={() => setTab('SUPPORT TICKETS')} className="border border-ok/40 bg-ok/10 px-3 py-1.5 font-mono text-xs uppercase text-ok hover:bg-ok/20 transition-colors">
                    View Helpdesk →
                  </button>
                </div>
              </Panel>
            </div>
          </div>
        )}

        {/* TAB: TOURNAMENTS */}
        {tab === 'TOURNAMENTS' && (
          <div className="mt-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h2 className="font-display text-3xl font-black uppercase">Tournaments Management</h2>
                <p className="text-xs text-dim">Authoritative control: create, edit, lock rosters, generate brackets, publish or cancel tournaments.</p>
              </div>
              <button
                onClick={() => setIsCreateTourOpen(true)}
                className="border border-cyan bg-cyan px-4 py-2 font-mono text-xs uppercase text-void font-bold hover:brightness-110 transition-all shrink-0"
              >
                + Create Tournament
              </button>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="flex flex-wrap gap-1.5">
                {['ALL', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'LIVE', 'UPCOMING', 'COMPLETED', 'CANCELLED'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setTournamentFilter(f)}
                    className={`px-3 py-1 font-mono text-[11px] uppercase border transition-colors ${
                      tournamentFilter === f ? 'border-cyan bg-cyan/15 text-cyan' : 'border-white/10 text-dim hover:text-ink'
                    }`}
                  >
                    {f.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="Search tournaments..."
                value={tournamentSearch}
                onChange={(e) => setTournamentSearch(e.target.value)}
                className="w-full sm:w-64 border border-white/15 bg-surface px-3 py-1.5 text-xs text-ink outline-none focus:border-cyan font-mono"
              />
            </div>

            {/* Tournaments Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tournaments
                .filter((t) => {
                  if (tournamentFilter !== 'ALL' && t.status !== tournamentFilter) return false
                  if (tournamentSearch && !t.title.toLowerCase().includes(tournamentSearch.toLowerCase())) return false
                  return true
                })
                .map((t) => {
                  const norm = normalizeTournament(t)
                  const isFeatured = featuredTour?.id === t.id || featuredTour?.slug === t.slug
                  return (
                    <Panel key={t.id || t.slug} className="p-5 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
                          <span className="font-mono text-xs text-cyan font-bold uppercase">{norm.gameName}</span>
                          <span
                            className={`border px-2 py-0.5 font-mono text-[9px] uppercase ${
                              t.status === 'LIVE'
                                ? 'border-live bg-live/10 text-live'
                                : t.status === 'REGISTRATION_OPEN'
                                ? 'border-cyan bg-cyan/10 text-cyan'
                                : t.status === 'REGISTRATION_CLOSED'
                                ? 'border-warn bg-warn/10 text-warn'
                                : 'border-white/20 text-dim'
                            }`}
                          >
                            {t.status}
                          </span>
                        </div>

                        <h3 className="mt-3 font-display text-xl font-black uppercase text-ink line-clamp-1">{t.title}</h3>
                        <p className="mt-1 font-mono text-xs text-dim">Format: {t.format}</p>
                        <p className="font-mono text-xs text-dim">Prize Pool: {inr(norm.prizePoolInr)}</p>
                        <p className="font-mono text-xs text-dim">Entry Fee: {inr(norm.entryFeeInr)}</p>

                        <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2 text-xs font-mono">
                          <span className="text-dim">Registered Teams:</span>
                          <span className="text-cyan font-bold">
                            {norm.registeredTeams} / {norm.maxTeams}
                          </span>
                        </div>
                      </div>

                      {/* Tournament Operations */}
                      <div className="space-y-2 border-t border-white/10 pt-3">
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            onClick={() => handleViewRosters(t)}
                            className="border border-white/20 bg-surface px-2.5 py-1.5 font-mono text-[10px] uppercase text-ink hover:border-cyan hover:text-cyan transition-colors"
                          >
                            Rosters ({norm.registeredTeams})
                          </button>
                          <button
                            onClick={() => setEditingTour(t)}
                            className="border border-white/20 bg-surface px-2.5 py-1.5 font-mono text-[10px] uppercase text-ink hover:border-cyan hover:text-cyan transition-colors"
                          >
                            Edit
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {t.status === 'DRAFT' && (
                            <button
                              onClick={() => handlePublishTour(t.id || t.slug)}
                              className="border border-cyan bg-cyan/15 px-2 py-1 font-mono text-[10px] uppercase text-cyan hover:bg-cyan/30"
                            >
                              Publish
                            </button>
                          )}
                          {t.status === 'REGISTRATION_OPEN' && (
                            <button
                              onClick={() => handleCloseRegTour(t.id || t.slug)}
                              className="border border-warn bg-warn/15 px-2 py-1 font-mono text-[10px] uppercase text-warn hover:bg-warn/30"
                            >
                              Lock Rosters
                            </button>
                          )}
                          {t.status === 'REGISTRATION_CLOSED' && (
                            <button
                              onClick={() => handleGenerateBracketTour(t.id || t.slug)}
                              className="border border-ok bg-ok/15 px-2 py-1 font-mono text-[10px] uppercase text-ok hover:bg-ok/30"
                            >
                              Generate Bracket
                            </button>
                          )}
                          <button
                            onClick={() => handleSetFeatured(isFeatured ? 'none' : t.id || t.slug)}
                            className={`border px-2 py-1 font-mono text-[10px] uppercase ${
                              isFeatured ? 'border-magenta bg-magenta/20 text-magenta' : 'border-white/15 text-dim hover:text-ink'
                            }`}
                          >
                            {isFeatured ? '★ Featured' : '☆ Spotlight'}
                          </button>
                          {t.status !== 'CANCELLED' && t.status !== 'COMPLETED' && (
                            <button
                              onClick={() => handleCancelTour(t.id || t.slug)}
                              className="border border-live/40 bg-live/10 px-2 py-1 font-mono text-[10px] uppercase text-live hover:bg-live/20"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </Panel>
                  )
                })}
            </div>
          </div>
        )}

        {/* TAB: LIVE MATCHES */}
        {tab === 'LIVE MATCHES' && (
          <div className="mt-8">
            <LiveMatchesManager tournaments={tournaments} onMatchesUpdated={loadData} />
          </div>
        )}

        {/* TAB 2: FEATURED TOURNAMENT */}
        {tab === 'FEATURED TOURNAMENT' && (
          <div className="mt-8 space-y-6">
            <Panel className="p-6 md:p-8">
              <Hud className="text-cyan">MAIN HOMEPAGE FEATURED SPOTLIGHT</Hud>
              <h2 className="mt-2 font-display text-3xl font-black uppercase">Main Homepage Featured Tournament</h2>
              <p className="mt-1 text-sm text-dim max-w-2xl">
                The tournament selected below receives the largest screen and visual allocation in the hero section on the homepage.
              </p>

              {featuredTour ? (
                <div className="mt-6 border border-cyan/40 bg-surface/80 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-cyan animate-pulse" />
                      <span className="font-mono text-xs uppercase text-cyan font-bold">Currently Featured on Homepage</span>
                    </div>
                    <h3 className="mt-2 font-display text-3xl font-black uppercase text-ink">{featuredTour.title}</h3>
                    <p className="mt-1 font-mono text-xs text-dim">
                      {featuredTour.game_name || featuredTour.game_id} · Prize: {inr(featuredTour.prize_pool_inr)} · Teams: {featuredTour.registered_teams ?? 0} / {featuredTour.max_teams}
                    </p>
                  </div>
                  <button
                    onClick={() => handleSetFeatured('none')}
                    disabled={isSavingFeatured}
                    className="border border-live/50 bg-live/10 px-4 py-2 font-mono text-xs uppercase text-live hover:bg-live/20 transition-colors"
                  >
                    Clear Spotlight
                  </button>
                </div>
              ) : (
                <div className="mt-6 border border-dashed border-white/15 p-6 font-mono text-xs text-dim">
                  NO FEATURED TOURNAMENT CURRENTLY ACTIVE. SELECT ONE BELOW.
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-white/10">
                <Hud>Quick Spotlight Switcher</Hud>
                <div className="mt-3 flex flex-col sm:flex-row gap-3 max-w-xl">
                  <select
                    value={selectedFeaturedId}
                    onChange={(e) => setSelectedFeaturedId(e.target.value)}
                    className="w-full border border-white/15 bg-surface px-4 py-2.5 text-sm text-ink outline-none focus:border-cyan font-mono"
                  >
                    <option value="none">-- None (Unset Spotlight) --</option>
                    {tournaments.map((t) => (
                      <option key={t.id || t.slug} value={t.id || t.slug}>
                        {t.title} ({t.game_name || t.game_id}) — {inr(t.prize_pool_inr)}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleSetFeatured(selectedFeaturedId)}
                    disabled={isSavingFeatured || !selectedFeaturedId}
                    className="border border-cyan bg-cyan px-6 py-2.5 font-mono text-xs uppercase text-void font-bold hover:brightness-110 disabled:opacity-50 shrink-0"
                  >
                    {isSavingFeatured ? 'Saving...' : 'Apply Spotlight'}
                  </button>
                </div>
              </div>
            </Panel>
          </div>
        )}

        {/* TAB: GAMES CATALOG */}
        {tab === 'GAMES CATALOG' && (
          <div className="mt-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="font-display text-3xl font-black uppercase">Sanctioned Game Titles</h2>
                <p className="text-xs text-dim">Full title catalog with platform parameters, server locations, and anti-cheat credentials.</p>
              </div>
              <div className="flex items-center gap-3">
                <Hud className="text-cyan">{games.length} GAMES</Hud>
                <button
                  onClick={() => setIsCreateGameOpen(true)}
                  className="border border-cyan bg-cyan px-4 py-2 font-mono text-xs uppercase text-void font-bold hover:brightness-110 transition-all"
                >
                  + Add Game Title
                </button>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {games.map((g) => (
                <Panel key={g.id || g.slug} className="p-5 flex flex-col justify-between space-y-4">
                  <div>
                    {g.banner_url && (
                      <div className="relative aspect-video w-full overflow-hidden border border-white/10 bg-surface mb-3">
                        <img
                          src={resolveMediaUrl(g.banner_url)}
                          alt={g.name}
                          className="size-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <span className="font-mono text-xs text-cyan font-bold">{g.tag || 'ESPORTS'}</span>
                      <span className="border border-cyan/40 bg-cyan/10 px-2 py-0.5 font-mono text-[9px] uppercase text-cyan">{g.status || 'ACTIVE'}</span>
                    </div>
                    <h3 className="mt-2 font-display text-2xl font-black uppercase">{g.name}</h3>
                    <p className="font-mono text-xs text-dim">Slug: {g.slug}</p>
                    <p className="font-mono text-xs text-dim">Platform: {g.platform || 'PC'}</p>
                    <p className="font-mono text-xs text-dim">Team Size: {g.min_team_size || 1} - {g.max_team_size || 5} Players</p>
                    <p className="font-mono text-xs text-dim">Server: {g.server_region || 'India'}</p>
                    <p className="font-mono text-xs text-dim">Anti-Cheat: {g.anti_cheat || 'Verified'}</p>
                  </div>

                  <div className="flex items-center justify-end gap-2 border-t border-white/10 pt-3">
                    <button
                      onClick={() => setEditingGame(g)}
                      className="border border-white/20 bg-surface px-3 py-1 font-mono text-xs uppercase text-ink hover:border-cyan hover:text-cyan"
                    >
                      Edit
                    </button>
                    {g.status !== 'ACTIVE' && (
                      <button
                        onClick={() => handlePublishGameAction(g.id || g.slug)}
                        className="border border-cyan bg-cyan/15 px-3 py-1 font-mono text-xs uppercase text-cyan hover:bg-cyan/25"
                      >
                        Publish
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteGameAction(g.id || g.slug, g.name)}
                      className="border border-live/40 bg-live/10 px-3 py-1 font-mono text-xs uppercase text-live hover:bg-live/20"
                    >
                      Delete
                    </button>
                  </div>
                </Panel>
              ))}
            </div>
          </div>
        )}

        {/* TAB: GENRES & CATEGORIES */}
        {tab === 'GENRES & CATEGORIES' && (
          <div className="mt-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h2 className="font-display text-3xl font-black uppercase">Dynamic Genres & Categories Hub</h2>
                <p className="text-xs text-dim">
                  Centralized genres aggregate multiple game titles. Public genre cards cycle member game logos automatically.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Hud className="text-cyan">{genres.length} REGISTERED GENRES</Hud>
                <button
                  onClick={() => setIsCreateGenreOpen(true)}
                  className="border border-cyan bg-cyan px-4 py-2 font-mono text-xs uppercase text-void font-bold hover:brightness-110 transition-all shrink-0"
                >
                  + Add Genre Category
                </button>
              </div>
            </div>

            {/* Image Presets & Guidelines Panel */}
            <Panel className="p-5 border-cyan/30 bg-cyan/[0.03]">
              <div className="flex items-center gap-2 mb-2">
                <span className="size-2 bg-cyan rounded-full animate-pulse" />
                <span className="font-mono text-xs uppercase font-bold text-cyan tracking-wider">
                  Standardized Media Presets & Aspect Ratios
                </span>
              </div>
              <p className="text-xs text-dim mb-4">
                Genre artwork and rotating title assets dynamically adapt across responsive viewports. Use the official presets below for pristine sharpness and zero distortion:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 font-mono text-xs">
                <div className="border border-white/10 bg-surface/70 p-3">
                  <div className="text-cyan font-bold text-sm">16:9 DESKTOP</div>
                  <div className="text-ink font-semibold mt-0.5">1920 × 1080 px</div>
                  <div className="text-dim text-[10px] mt-1">Hero banners & widescreen cards</div>
                </div>
                <div className="border border-white/10 bg-surface/70 p-3">
                  <div className="text-cyan font-bold text-sm">4:3 TABLET</div>
                  <div className="text-ink font-semibold mt-0.5">1200 × 900 px</div>
                  <div className="text-dim text-[10px] mt-1">Medium grid tiles & catalog cards</div>
                </div>
                <div className="border border-white/10 bg-surface/70 p-3">
                  <div className="text-cyan font-bold text-sm">9:16 MOBILE</div>
                  <div className="text-ink font-semibold mt-0.5">1080 × 1920 px</div>
                  <div className="text-dim text-[10px] mt-1">Vertical feed cards & mobile stories</div>
                </div>
                <div className="border border-white/10 bg-surface/70 p-3">
                  <div className="text-cyan font-bold text-sm">1:1 SQUARE</div>
                  <div className="text-ink font-semibold mt-0.5">800 × 800 px</div>
                  <div className="text-dim text-[10px] mt-1">Genre badge icons & avatar marks</div>
                </div>
                <div className="border border-white/10 bg-surface/70 p-3">
                  <div className="text-cyan font-bold text-sm">VECTOR SVG</div>
                  <div className="text-ink font-semibold mt-0.5">Scale-Free</div>
                  <div className="text-dim text-[10px] mt-1">Infinitely sharp vector emblems</div>
                </div>
              </div>
            </Panel>

            {/* Genres Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {genres.map((g) => {
                const genreId = g.id || (g as any)._id
                const connectedGames = g.games || []
                return (
                  <Panel key={genreId || g.slug} className="p-5 flex flex-col justify-between space-y-4">
                    <div>
                      {/* Banner / Media Preview */}
                      <div className="relative aspect-video w-full overflow-hidden border border-white/10 bg-surface mb-3">
                        {g.banner_url ? (
                          <img
                            src={resolveMediaUrl(g.banner_url)}
                            alt={g.name}
                            className="size-full object-cover"
                          />
                        ) : (
                          <div className="grid size-full place-items-center font-mono text-xs text-dim">
                            NO BANNER ARTWORK
                          </div>
                        )}
                        {g.icon_url && (
                          <div className="absolute bottom-2 left-2 size-10 overflow-hidden border border-white/20 bg-void/85 p-1 backdrop-blur-sm">
                            <img
                              src={resolveMediaUrl(g.icon_url)}
                              alt={`${g.name} icon`}
                              className="size-full object-contain"
                            />
                          </div>
                        )}
                        <div className="absolute top-2 right-2 border border-white/20 bg-void/85 px-2 py-0.5 font-mono text-[9px] uppercase backdrop-blur-sm text-cyan">
                          {g.rotation_interval_seconds}s CYCLE
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <span className="font-mono text-xs text-cyan font-bold uppercase">{g.slug}</span>
                        <span
                          className={`border px-2 py-0.5 font-mono text-[9px] uppercase ${
                            g.is_active ? 'border-ok/40 bg-ok/10 text-ok' : 'border-white/20 text-dim'
                          }`}
                        >
                          {g.is_active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>

                      <h3 className="mt-2 font-display text-2xl font-black uppercase text-ink">{g.name}</h3>
                      {g.description && (
                        <p className="mt-1 font-mono text-xs text-dim line-clamp-2">{g.description}</p>
                      )}

                      {/* Member games connected */}
                      <div className="mt-4 border-t border-white/5 pt-3">
                        <div className="flex items-center justify-between font-mono text-[11px] mb-2">
                          <span className="text-dim">Connected Games:</span>
                          <span className="text-cyan font-bold">
                            {g.game_count ?? connectedGames.length} Titles
                          </span>
                        </div>
                        {connectedGames.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {connectedGames.map((gm) => (
                              <span
                                key={gm.id || gm.slug}
                                className="inline-flex items-center gap-1 border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] text-ink"
                              >
                                {gm.logo_url && (
                                  <img
                                    src={resolveMediaUrl(gm.logo_url)}
                                    alt=""
                                    className="size-3 object-contain"
                                  />
                                )}
                                {gm.title}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className="font-mono text-[10px] text-dim/60 italic">
                            No games currently assigned to this category
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 border-t border-white/10 pt-3">
                      <button
                        onClick={() => setEditingGenre(g)}
                        className="border border-white/20 bg-surface px-3 py-1 font-mono text-xs uppercase text-ink hover:border-cyan hover:text-cyan"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleGenreActive(g)}
                        className={`border px-2.5 py-1 font-mono text-xs uppercase ${
                          g.is_active
                            ? 'border-warn/40 bg-warn/10 text-warn hover:bg-warn/20'
                            : 'border-ok/40 bg-ok/10 text-ok hover:bg-ok/20'
                        }`}
                      >
                        {g.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDeleteGenreAction(genreId, g.name)}
                        className="border border-live/40 bg-live/10 px-3 py-1 font-mono text-xs uppercase text-live hover:bg-live/20"
                      >
                        Delete
                      </button>
                    </div>
                  </Panel>
                )
              })}
            </div>
          </div>
        )}

        {/* TAB: PAGE MEDIA */}
        {tab === 'PAGE MEDIA' && (
          <div className="mt-8 space-y-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="font-display text-3xl font-black uppercase">Page Visual Media</h2>
                <p className="text-xs text-dim">Configure visual media and background imagery across platform hub pages.</p>
              </div>
              <Hud className="text-cyan">{mediaConfigs.filter((m) => m.page_id !== 'home').length} ACTIVE PAGES</Hud>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {mediaConfigs
                .filter((m) => m.page_id !== 'home')
                .map((m) => (
                  <Panel key={m.page_id} className="p-6 space-y-4">
                    <div className="relative aspect-video w-full overflow-hidden border border-white/10 bg-void">
                      {m.media_url ? (
                        <img
                          src={resolveMediaUrl(m.media_url)}
                          alt={m.title || m.page_id}
                          className="size-full object-cover"
                          style={{ opacity: m.opacity ?? 0.35 }}
                        />
                      ) : (
                        <div className="grid size-full place-items-center font-mono text-xs text-dim">
                          NO ACTIVE MEDIA CONFIGURED
                        </div>
                      )}
                      <div className="absolute top-2 right-2 border border-white/20 bg-void/80 px-2 py-0.5 font-mono text-[9px] uppercase backdrop-blur-sm">
                        {m.media_type || 'IMAGE'}
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <span className="font-mono text-xs text-cyan font-bold">{m.page_id.toUpperCase()}</span>
                      <span className={`border px-2 py-0.5 font-mono text-[9px] uppercase ${m.is_active ? 'border-ok/40 bg-ok/10 text-ok' : 'border-white/20 text-dim'}`}>
                        {m.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-display text-2xl font-black uppercase">{m.title || m.page_id}</h3>
                      <p className="text-xs text-dim font-mono truncate mt-1">
                        URL: {m.media_url || 'None'}
                      </p>
                      <p className="text-xs text-dim font-mono">Opacity: {Math.round((m.opacity ?? 0.35) * 100)}%</p>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => setEditingMedia(m)}
                        className="border border-cyan bg-cyan/15 px-4 py-1.5 font-mono text-xs uppercase text-cyan hover:bg-cyan/30 transition-colors"
                      >
                        Configure / Upload Media
                      </button>
                    </div>
                  </Panel>
                ))}
            </div>
          </div>
        )}

        {/* TAB: REVIEWS MODERATION */}
        {tab === 'REVIEWS MODERATION' && (
          <div className="mt-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h2 className="font-display text-3xl font-black uppercase">Contender Reviews Moderation</h2>
                <p className="text-xs text-dim">
                  Audit, verify, feature, or remove community reviews submitted by registered platform players.
                </p>
              </div>
              <Hud className="text-cyan">{adminReviews.length} TOTAL REVIEWS</Hud>
            </div>

            {/* Metrics Overview */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Panel className="p-4">
                <Hud className="text-dim">TOTAL REVIEWS</Hud>
                <p className="mt-2 font-display text-3xl font-black">{adminReviews.length}</p>
              </Panel>
              <Panel className="p-4">
                <Hud className="text-ok">AVERAGE RATING</Hud>
                <p className="mt-2 font-display text-3xl font-black text-ok">
                  {adminReviews.length > 0
                    ? (adminReviews.reduce((acc, r) => acc + r.rating, 0) / adminReviews.length).toFixed(1)
                    : '5.0'}{' '}
                  ★
                </p>
              </Panel>
              <Panel className="p-4">
                <Hud className="text-warn">PENDING AUDIT</Hud>
                <p className="mt-2 font-display text-3xl font-black text-warn">
                  {adminReviews.filter((r) => r.status === 'PENDING').length}
                </p>
              </Panel>
              <Panel className="p-4">
                <Hud className="text-magenta">FEATURED SPOTLIGHTS</Hud>
                <p className="mt-2 font-display text-3xl font-black text-magenta">
                  {adminReviews.filter((r) => r.status === 'FEATURED').length}
                </p>
              </Panel>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="flex flex-wrap gap-1.5">
                {['ALL', 'PENDING', 'APPROVED', 'FEATURED', 'HIDDEN'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setReviewStatusFilter(f)}
                    className={`px-3 py-1 font-mono text-[11px] uppercase border transition-colors ${
                      reviewStatusFilter === f
                        ? 'border-cyan bg-cyan/15 text-cyan'
                        : 'border-white/10 text-dim hover:text-ink'
                    }`}
                  >
                    {f} ({f === 'ALL' ? adminReviews.length : adminReviews.filter((r) => r.status === f).length})
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="Search by reviewer or text..."
                value={reviewSearch}
                onChange={(e) => setReviewSearch(e.target.value)}
                className="w-full sm:w-72 border border-white/15 bg-surface px-3 py-1.5 text-xs text-ink outline-none focus:border-cyan font-mono"
              />
            </div>

            {/* Reviews List */}
            {adminReviews.length === 0 ? (
              <div className="border border-dashed border-white/15 p-12 text-center font-mono text-xs text-dim">
                NO REVIEWS FOUND IN DATABASE.
              </div>
            ) : (
              <div className="space-y-3">
                {adminReviews
                  .filter((r) => {
                    if (reviewStatusFilter !== 'ALL' && r.status !== reviewStatusFilter) return false
                    if (reviewSearch) {
                      const q = reviewSearch.toLowerCase()
                      const matchesUser = r.user_name?.toLowerCase().includes(q)
                      const matchesText = r.review_text?.toLowerCase().includes(q)
                      if (!matchesUser && !matchesText) return false
                    }
                    return true
                  })
                  .map((r) => (
                    <Panel key={r.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-2 max-w-3xl">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-display font-black uppercase text-ink text-base">
                            {r.user_name || 'Anonymous Contender'}
                          </span>
                          <span className="border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] text-cyan">
                            {r.category || 'PLATFORM'}
                          </span>
                          <span
                            className={`border px-2 py-0.5 font-mono text-[10px] uppercase font-bold ${
                              r.status === 'FEATURED'
                                ? 'border-magenta bg-magenta/20 text-magenta'
                                : r.status === 'APPROVED'
                                ? 'border-ok/40 bg-ok/10 text-ok'
                                : r.status === 'PENDING'
                                ? 'border-warn/40 bg-warn/10 text-warn'
                                : 'border-white/20 text-dim'
                            }`}
                          >
                            {r.status}
                          </span>
                          <div className="flex text-cyan text-xs">
                            {'★'.repeat(r.rating)}
                            {'☆'.repeat(5 - r.rating)}
                          </div>
                        </div>

                        <p className="font-mono text-xs text-ink/90 italic">"{r.review_text}"</p>

                        <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-dim">
                          <span>Submitted: {r.created_at ? new Date(r.created_at).toLocaleString() : 'N/A'}</span>
                          {r.admin_notes && (
                            <span className="text-warn">
                              Admin Notes: {r.admin_notes}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Moderation Controls */}
                      <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                        {r.status !== 'APPROVED' && (
                          <button
                            onClick={() => handleModerateReviewAction(r.id, 'APPROVED')}
                            className="border border-ok/40 bg-ok/10 px-2.5 py-1 font-mono text-[11px] uppercase text-ok hover:bg-ok/20 transition-colors"
                          >
                            Approve
                          </button>
                        )}
                        {r.status !== 'FEATURED' && (
                          <button
                            onClick={() => handleModerateReviewAction(r.id, 'FEATURED')}
                            className="border border-magenta/40 bg-magenta/15 px-2.5 py-1 font-mono text-[11px] uppercase text-magenta hover:bg-magenta/25 transition-colors"
                          >
                            ★ Feature
                          </button>
                        )}
                        {r.status !== 'HIDDEN' && (
                          <button
                            onClick={() => handleModerateReviewAction(r.id, 'HIDDEN')}
                            className="border border-white/20 bg-surface px-2.5 py-1 font-mono text-[11px] uppercase text-dim hover:text-ink transition-colors"
                          >
                            Hide
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedReviewForMod(r)
                            setModStatus(r.status)
                            setModNotes(r.admin_notes || '')
                          }}
                          className="border border-cyan/40 bg-cyan/10 px-2.5 py-1 font-mono text-[11px] uppercase text-cyan hover:bg-cyan/20 transition-colors"
                        >
                          Notes
                        </button>
                        <button
                          onClick={() => handleDeleteReviewAction(r.id)}
                          className="border border-live/40 bg-live/10 px-2.5 py-1 font-mono text-[11px] uppercase text-live hover:bg-live/20 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </Panel>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: USERS & ROLES */}
        {tab === 'USERS & ROLES' && (
          <div className="mt-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="font-display text-3xl font-black uppercase">Directory & Role Delegation</h2>
              <Hud className="text-dim">{users.length} REGISTERED CONTENDERS</Hud>
            </div>

            <div className="overflow-x-auto border border-white/15 bg-graphite">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-surface/50 text-dim">
                    <th className="p-4">USER / EMAIL</th>
                    <th className="p-4">ROLE</th>
                    <th className="p-4">BALANCE</th>
                    <th className="p-4">CREATED</th>
                    <th className="p-4 text-right">DELEGATION ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="p-4">
                        <div className="font-bold text-ink">{u.display_name || u.username}</div>
                        <div className="text-dim text-[11px]">{u.email}</div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 border ${u.role === 'SUPER_ADMIN' ? 'border-magenta text-magenta' : u.role === 'ORGANIZER' ? 'border-cyan text-cyan' : 'border-white/20 text-dim'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4 text-ink">{inr(Number(u.inr_balance || 0))}</td>
                      <td className="p-4 text-dim">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="p-4 text-right space-x-2">
                        {u.role !== 'ORGANIZER' && u.role !== 'SUPER_ADMIN' && (
                          <button
                            onClick={async () => {
                              try {
                                await promoteUserToOrganizer(u.id)
                                showToast(`User promoted to ORGANIZER!`)
                                loadData()
                              } catch (err: any) {
                                alert(err.message || 'Promotion failed')
                              }
                            }}
                            className="border border-cyan/40 bg-cyan/10 px-2.5 py-1 text-[10px] text-cyan hover:bg-cyan/20 uppercase"
                          >
                            Promote Organizer
                          </button>
                        )}
                        <select
                          value={u.role}
                          onChange={async (e) => {
                            try {
                              await setUserRole(u.id, e.target.value)
                              showToast(`Role updated to ${e.target.value}`)
                              loadData()
                            } catch (err: any) {
                              alert(err.message || 'Role change failed')
                            }
                          }}
                          className="border border-white/15 bg-surface p-1 text-[10px] text-ink outline-none"
                        >
                          <option value="PLAYER">PLAYER</option>
                          <option value="ORGANIZER">ORGANIZER</option>
                          <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: PENDING PAYMENTS */}
        {tab === 'PENDING PAYMENTS' && (
          <div className="mt-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="font-display text-3xl font-black uppercase">Pending Payment Reconciliations</h2>
                <p className="text-xs text-dim">Review player UTR deposits and authorize bank ledger deposits.</p>
              </div>
              <Hud className="text-warn">{payments.length} AWAITING APPROVAL</Hud>
            </div>

            {payments.length === 0 ? (
              <div className="border border-dashed border-white/15 p-12 text-center font-mono text-xs text-dim">
                NO PENDING PAYMENTS. ALL PLAYER DEPOSITS ARE AUDITED & VERIFIED.
              </div>
            ) : (
              <div className="space-y-4">
                {payments.map((p) => (
                  <Panel key={p.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 border-l-4 border-l-warn">
                    <div className="space-y-1 font-mono text-xs">
                      <div className="text-sm font-bold text-ink">Payment #{p.id.slice(0, 8)}</div>
                      <div className="text-dim">User: {p.user_email || p.user_id}</div>
                      <div className="text-dim">Amount: <span className="text-ok font-bold">{inr(p.amount_inr)}</span></div>
                      <div className="text-dim">UTR Reference: <span className="text-cyan font-bold">{p.utr}</span></div>
                      <div className="text-dim">Sender VPA: {p.sender_upi_id || 'Not Specified'}</div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleApprovePayment(p.id)}
                        className="border border-ok bg-ok/20 px-4 py-2 font-mono text-xs uppercase text-ok hover:bg-ok/30 transition-colors"
                      >
                        Approve & Credit
                      </button>
                      <button
                        onClick={() => setRejectPaymentId(p.id)}
                        className="border border-live bg-live/20 px-4 py-2 font-mono text-xs uppercase text-live hover:bg-live/30 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </Panel>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: UPI & QR ACCOUNTS */}
        {tab === 'UPI & QR ACCOUNTS' && (
          <div className="mt-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="font-display text-3xl font-black uppercase">Receiving UPI & QR Accounts</h2>
                <p className="text-xs text-dim">Corporate banking handles presented during tournament fee checkout.</p>
              </div>
              <button
                onClick={() => setIsNewUpiOpen(true)}
                className="border border-cyan bg-cyan px-4 py-2 font-mono text-xs uppercase text-void font-bold hover:brightness-110 transition-all"
              >
                + Add Account
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {upiAccounts.map((a) => (
                <Panel key={a.id} className="p-6 space-y-4 font-mono text-xs">
                  <div className="flex justify-between items-center border-b border-white/10 pb-2">
                    <span className="font-bold text-ink">{a.code}</span>
                    <span className={`px-2 py-0.5 border ${a.status === 'ACTIVE' ? 'border-ok text-ok' : 'border-dim text-dim'}`}>
                      {a.status}
                    </span>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="size-24 shrink-0 border border-white/15 bg-white p-1 rounded flex items-center justify-center overflow-hidden">
                      {a.qr_url ? (
                        <img
                          src={resolveMediaUrl(a.qr_url)}
                          alt={`QR for ${a.code}`}
                          className="size-full object-contain"
                        />
                      ) : (
                        <span className="text-[10px] text-gray-500 font-sans text-center">No QR Uploaded</span>
                      )}
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <div>UPI VPA: <span className="text-cyan font-bold break-all">{a.upi_id}</span></div>
                      <div>Payee Name: <span className="text-dim">{a.payee_name}</span></div>
                      <div>Usage Count: <span className="text-dim">{a.payment_count || 0} checkouts</span></div>
                      <div className="pt-2">
                        <label className="inline-block cursor-pointer border border-cyan/40 bg-cyan/10 px-2.5 py-1 text-[10px] uppercase text-cyan hover:bg-cyan/20">
                          {uploadingQrAccId === a.id ? 'Uploading QR...' : a.qr_url ? 'Replace QR Image' : 'Upload QR Image'}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={uploadingQrAccId === a.id}
                            onChange={async (e) => {
                              const f = e.target.files?.[0]
                              if (!f) return
                              setUploadingQrAccId(a.id)
                              try {
                                await uploadUpiAccountQr(a.id, f)
                                showToast(`QR uploaded for ${a.code}`)
                                loadData()
                              } catch (err: any) {
                                alert(err.message || 'QR upload failed')
                              } finally {
                                setUploadingQrAccId(null)
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/10 flex justify-end">
                    <button
                      onClick={() => handleToggleUpi(a.id)}
                      className="border border-white/20 px-3 py-1 text-dim hover:text-ink hover:border-cyan"
                    >
                      Toggle Active State
                    </button>
                  </div>
                </Panel>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: PAYOUTS LEDGER */}
        {tab === 'PAYOUTS LEDGER' && (
          <div className="mt-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="font-display text-3xl font-black uppercase">Tournament Winnings & Payouts</h2>
                <p className="text-xs text-dim">Track prize disbursement audit trail and certify bank outgoing IMPS UTRs.</p>
              </div>
              <button
                onClick={() => setIsPayoutModalOpen(true)}
                className="border border-ok bg-ok px-4 py-2 font-mono text-xs uppercase text-void font-bold hover:brightness-110 transition-all"
              >
                + Issue Prize Payout
              </button>
            </div>

            <div className="overflow-x-auto border border-white/15 bg-graphite">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-surface/50 text-dim">
                    <th className="p-4">WINNER</th>
                    <th className="p-4">AMOUNT</th>
                    <th className="p-4">DESTINATION</th>
                    <th className="p-4">STATUS</th>
                    <th className="p-4 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {payouts.map((pay) => (
                    <tr key={pay.id}>
                      <td className="p-4">
                        <div className="font-bold text-ink">{pay.user_name || pay.user_id}</div>
                        <div className="text-dim text-[11px]">{pay.game_name || 'Tournament'}</div>
                      </td>
                      <td className="p-4 font-bold text-ok">{inr(pay.amount_inr)}</td>
                      <td className="p-4 text-dim">{pay.destination} {pay.upi_id ? `(${pay.upi_id})` : ''}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 border ${pay.status === 'PAID' ? 'border-ok text-ok' : pay.status === 'PENDING' ? 'border-warn text-warn' : 'border-live text-live'}`}>
                          {pay.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {pay.status === 'PENDING' && (
                          <button
                            onClick={() => setCompletePayoutId(pay.id)}
                            className="border border-ok/50 bg-ok/10 px-3 py-1 font-mono text-xs text-ok hover:bg-ok/20 transition-colors uppercase"
                          >
                            Disburse IMPS
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 7: SUPPORT TICKETS */}
        {tab === 'SUPPORT TICKETS' && (
          <div className="mt-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="font-display text-3xl font-black uppercase">Helpdesk & Support Inquiries</h2>
              <Hud className="text-dim">{tickets.length} TICKETS</Hud>
            </div>

            <div className="space-y-4">
              {tickets.map((t) => (
                <Panel key={t.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-cyan font-bold">{t.ticket_id}</span>
                      <span className="border border-white/20 px-2 py-0.5 font-mono text-[9px] uppercase">{t.status}</span>
                      <span className="font-mono text-[10px] text-dim">{t.category}</span>
                    </div>
                    <h3 className="font-bold text-ink text-sm mt-1">{t.name} ({t.email})</h3>
                    <p className="text-xs text-dim max-w-xl">{t.description}</p>
                    {t.internal_notes && <p className="text-xs text-cyan/80 font-mono mt-1">Notes: {t.internal_notes}</p>}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedTicket(t)
                        setTicketStatusVal(t.status)
                        setTicketNotes(t.internal_notes || '')
                      }}
                      className="border border-white/20 bg-surface px-3 py-1.5 font-mono text-xs uppercase text-ink hover:border-cyan"
                    >
                      Update Ticket
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await retrySupportTicketEmail(t.id)
                          showToast('Confirmation email dispatched.')
                        } catch (err: any) {
                          alert(err.message || 'Email dispatch failed')
                        }
                      }}
                      className="border border-white/10 px-2.5 py-1.5 font-mono text-xs uppercase text-dim hover:text-cyan"
                    >
                      Retry Mail
                    </button>
                  </div>
                </Panel>
              ))}
            </div>
          </div>
        )}

        {/* TAB 8: RULES & REGULATIONS */}
        {tab === 'RULES & REGULATIONS' && (
          <div className="mt-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="font-display text-3xl font-black uppercase">Esports Rulebook & Sanctions</h2>
                <p className="text-xs text-dim">Define tournament rule chapters, anti-cheat terms, and official match protocols.</p>
              </div>
              <button
                onClick={() => setIsNewRegOpen(true)}
                className="border border-cyan bg-cyan px-4 py-2 font-mono text-xs uppercase text-void font-bold hover:brightness-110 transition-all"
              >
                + Add Rule Chapter
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {regulations.map((r) => (
                <Panel key={r.id} className="p-6 space-y-3">
                  <div className="flex justify-between items-center border-b border-white/10 pb-2">
                    <span className="font-mono text-xs text-cyan font-bold">{r.chapter_code}</span>
                    <button onClick={() => handleDeleteReg(r.id)} className="text-live text-xs hover:underline uppercase">Delete</button>
                  </div>
                  <h3 className="font-display text-xl font-black uppercase">{r.title}</h3>
                  <div className="font-mono text-xs text-dim">Game: {r.game_name} · Format: {r.format}</div>
                  <ul className="list-disc pl-4 space-y-1 font-mono text-xs text-ink/75">
                    {r.rules.map((rule, idx) => (
                      <li key={idx}>{rule}</li>
                    ))}
                  </ul>
                </Panel>
              ))}
            </div>
          </div>
        )}

        {/* TAB 9: EMAIL & SMTP */}
        {tab === 'EMAIL & SMTP' && (
          <div className="mt-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="font-display text-3xl font-black uppercase">Email Service & SMTP Relay Status</h2>
                <p className="text-xs text-dim">Inspect mail relays, trigger diagnostic emails, or broadcast official updates.</p>
              </div>
              <button
                onClick={() => setIsOfficialMailOpen(true)}
                className="border border-cyan bg-cyan px-4 py-2 font-mono text-xs uppercase text-void font-bold hover:brightness-110 transition-all"
              >
                + Broadcast Platform Email
              </button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Panel className="p-6 space-y-4">
                <Hud className="text-cyan">SMTP STATUS</Hud>
                <h3 className="font-display text-2xl font-black uppercase">System Mail Relays</h3>
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-dim">Support Mail:</span>
                    <span className="text-ok font-bold">{emailStatus?.services.support.status || 'Configured'}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-dim">Automated Noreply:</span>
                    <span className="text-ok font-bold">{emailStatus?.services.noreply.status || 'Configured'}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-dim">Official Dispatch:</span>
                    <span className="text-ok font-bold">{emailStatus?.services.official.status || 'Configured'}</span>
                  </div>
                </div>
              </Panel>

              <Panel className="p-6 space-y-4">
                <Hud className="text-cyan">TEST SMTP RELAY</Hud>
                <h3 className="font-display text-2xl font-black uppercase">Send Diagnostic Mail</h3>
                <div className="space-y-3">
                  <input
                    type="email"
                    value={testEmailTo}
                    onChange={(e) => setTestEmailTo(e.target.value)}
                    placeholder="Recipient email"
                    className="w-full border border-white/15 bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-cyan"
                  />
                  <button
                    onClick={handleSendTestMail}
                    disabled={isSendingTestMail}
                    className="border border-cyan/40 bg-cyan/10 px-4 py-2 font-mono text-xs uppercase text-cyan hover:bg-cyan/20 transition-colors"
                  >
                    {isSendingTestMail ? 'Dispatching...' : 'Dispatch Test Email'}
                  </button>
                </div>
              </Panel>
            </div>
          </div>
        )}

        {/* TAB: DISPUTES & QUEUE */}
        {tab === 'DISPUTES & QUEUE' && (
          <div className="mt-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="font-display text-3xl font-black uppercase">Disputes & Match Verification Queue</h2>
                <p className="text-xs text-dim">Arbitrate match results with contested evidence submissions.</p>
              </div>
              <Hud className="text-live">{disputes.length} DISPUTES</Hud>
            </div>

            {disputes.length === 0 ? (
              <div className="border border-dashed border-white/15 p-12 text-center font-mono text-xs text-dim">
                ALL MATCH RESULTS ARE FULLY CERTIFIED. NO ACTIVE DISPUTES IN QUEUE.
              </div>
            ) : (
              <div className="space-y-4">
                {disputes.map((d, i) => (
                  <Panel key={d.id || i} className="p-6 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-sm text-ink">{d.title || `Dispute #${i + 1}`}</p>
                      <p className="font-mono text-xs text-dim">{d.reason || 'Evidence mismatch'}</p>
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          await resolveDispute(d.id, { resolution: 'RESOLVED_BY_ADMIN' })
                          showToast('Dispute resolved!')
                          loadData()
                        } catch (err: any) {
                          alert(err.message || 'Resolution failed')
                        }
                      }}
                      className="border border-ok/50 bg-ok/10 px-3 py-1 font-mono text-xs text-ok hover:bg-ok/20 transition-colors uppercase"
                    >
                      Resolve Dispute
                    </button>
                  </Panel>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: AUDIT LOGS */}
        {tab === 'AUDIT LOGS' && (
          <div className="mt-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="font-display text-3xl font-black uppercase">System Audit Trails</h2>
              <Hud className="text-dim">{logs.length} RECORDS</Hud>
            </div>

            <div className="overflow-x-auto border border-white/15 bg-graphite">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-surface/50 text-dim">
                    <th className="p-4">OPERATOR</th>
                    <th className="p-4">ACTION</th>
                    <th className="p-4">TARGET</th>
                    <th className="p-4">TIMESTAMP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {logs.map((l) => (
                    <tr key={l.id}>
                      <td className="p-4 font-bold text-ink">{l.operator}</td>
                      <td className="p-4 text-cyan">{l.action}</td>
                      <td className="p-4 text-dim">{l.target}</td>
                      <td className="p-4 text-dim">{new Date(l.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Container>

      {/* MODALS */}

      {/* Reject Payment Modal */}
      {rejectPaymentId && (
        <div role="dialog" aria-modal className="fixed inset-0 z-50 flex items-center justify-center bg-void/85 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md border border-white/20 bg-graphite p-6">
            <h3 className="font-display text-2xl font-black uppercase text-live">Reject Payment</h3>
            <p className="text-xs text-dim mt-1">Specify rejection reason to notify the player.</p>
            <textarea
              rows={3}
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              placeholder="e.g. UTR not matching bank statement"
              className="mt-4 w-full border border-white/15 bg-surface p-3 text-xs text-ink outline-none focus:border-live"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setRejectPaymentId(null)} className="border border-white/20 px-3 py-1.5 font-mono text-xs uppercase text-dim">Cancel</button>
              <button onClick={handleRejectPayment} className="border border-live bg-live px-4 py-1.5 font-mono text-xs uppercase text-white">Confirm Rejection</button>
            </div>
          </div>
        </div>
      )}

      {/* Add UPI Account Modal */}
      {isNewUpiOpen && (
        <div role="dialog" aria-modal className="fixed inset-0 z-50 flex items-center justify-center bg-void/85 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md border border-white/20 bg-graphite p-6">
            <h3 className="font-display text-2xl font-black uppercase text-ink">New UPI Account</h3>
            <form onSubmit={handleCreateUpi} className="mt-4 space-y-3 font-mono text-xs">
              <input required placeholder="Account Code (e.g. UPI_PRIMARY)" value={newUpi.code} onChange={(e) => setNewUpi({ ...newUpi, code: e.target.value })} className="w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan" />
              <input required placeholder="UPI VPA (e.g. company@kotak)" value={newUpi.upi_id} onChange={(e) => setNewUpi({ ...newUpi, upi_id: e.target.value })} className="w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan" />
              <input required placeholder="Payee Name (e.g. AMETHEUS ESPORTS PRIVATE LIMITED)" value={newUpi.payee_name} onChange={(e) => setNewUpi({ ...newUpi, payee_name: e.target.value })} className="w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan" />
              <div>
                <label className="text-dim">QR Image (Optional)</label>
                <div className="flex gap-2 mt-1">
                  <input
                    placeholder="QR image URL (or upload)"
                    value={newUpi.qr_url || ''}
                    onChange={(e) => setNewUpi({ ...newUpi, qr_url: e.target.value })}
                    className="flex-1 border border-white/15 bg-surface p-2 text-ink outline-none"
                  />
                  <label className="cursor-pointer border border-cyan/40 bg-cyan/10 px-3 py-2 uppercase text-cyan hover:bg-cyan/20 shrink-0">
                    {isUploadingNewUpiQr ? '...' : 'Upload'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={isUploadingNewUpiQr}
                      onChange={async (e) => {
                        const f = e.target.files?.[0]
                        if (!f) return
                        setIsUploadingNewUpiQr(true)
                        try {
                          const res = await uploadMediaFile(f)
                          if (res?.url) setNewUpi((prev) => ({ ...prev, qr_url: res.url }))
                        } catch (err: any) {
                          alert(err.message || 'QR upload failed')
                        } finally {
                          setIsUploadingNewUpiQr(false)
                        }
                      }}
                    />
                  </label>
                </div>
                {newUpi.qr_url && (
                  <div className="mt-2 flex items-center gap-3 bg-void p-2 border border-white/10">
                    <img src={resolveMediaUrl(newUpi.qr_url)} alt="QR Preview" className="size-12 object-contain bg-white p-0.5 rounded" />
                    <span className="text-[10px] text-ok truncate">QR Code attached</span>
                  </div>
                )}
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsNewUpiOpen(false)} className="border border-white/20 px-3 py-1.5 uppercase text-dim">Cancel</button>
                <button type="submit" className="border border-cyan bg-cyan px-4 py-1.5 uppercase text-void font-bold">Register Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Payout Modal */}
      {completePayoutId && (
        <div role="dialog" aria-modal className="fixed inset-0 z-50 flex items-center justify-center bg-void/85 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md border border-white/20 bg-graphite p-6">
            <h3 className="font-display text-2xl font-black uppercase text-ok">Disburse Payout</h3>
            <p className="text-xs text-dim mt-1">Enter bank outgoing IMPS/UPI UTR reference number.</p>
            <input required placeholder="Outgoing UTR (e.g. 523412399999)" value={outgoingUtr} onChange={(e) => setOutgoingUtr(e.target.value)} className="mt-4 w-full border border-white/15 bg-surface p-2.5 font-mono text-xs text-ink outline-none focus:border-ok" />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setCompletePayoutId(null)} className="border border-white/20 px-3 py-1.5 font-mono text-xs uppercase text-dim">Cancel</button>
              <button onClick={handleCompletePayout} className="border border-ok bg-ok px-4 py-1.5 font-mono text-xs uppercase text-void font-bold">Certify Disbursed</button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Details Modal */}
      {selectedTicket && (
        <div role="dialog" aria-modal className="fixed inset-0 z-50 flex items-center justify-center bg-void/85 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg border border-white/20 bg-graphite p-6">
            <h3 className="font-display text-2xl font-black uppercase text-ink">Manage Ticket {selectedTicket.ticket_id}</h3>
            <p className="text-xs text-dim mt-1 font-mono">{selectedTicket.name} ({selectedTicket.email})</p>
            <div className="mt-4 space-y-3 font-mono text-xs">
              <select value={ticketStatusVal} onChange={(e) => setTicketStatusVal(e.target.value)} className="w-full border border-white/15 bg-surface p-2.5 text-ink outline-none">
                <option value="OPEN">OPEN</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="WAITING_FOR_USER">WAITING_FOR_USER</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="CLOSED">CLOSED</option>
              </select>
              <textarea rows={3} value={ticketNotes} onChange={(e) => setTicketNotes(e.target.value)} placeholder="Internal resolution notes..." className="w-full border border-white/15 bg-surface p-2.5 text-ink outline-none" />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setSelectedTicket(null)} className="border border-white/20 px-3 py-1.5 font-mono text-xs uppercase text-dim">Cancel</button>
              <button onClick={handleUpdateTicket} className="border border-cyan bg-cyan px-4 py-1.5 font-mono text-xs uppercase text-void font-bold">Save Ticket</button>
            </div>
          </div>
        </div>
      )}

      {/* Dispatch Official Mail Modal */}
      {isOfficialMailOpen && (
        <div role="dialog" aria-modal className="fixed inset-0 z-50 flex items-center justify-center bg-void/85 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg border border-white/20 bg-graphite p-6">
            <h3 className="font-display text-2xl font-black uppercase text-ink">Dispatch Official Platform Email</h3>
            <form onSubmit={handleSendOfficialMail} className="mt-4 space-y-3 font-mono text-xs">
              <select value={officialMail.recipient_type} onChange={(e) => setOfficialMail({ ...officialMail, recipient_type: e.target.value })} className="w-full border border-white/15 bg-surface p-2.5 text-ink outline-none">
                <option value="ALL_USERS">All Platform Users</option>
                <option value="ORGANIZERS">Registered Organizers Only</option>
              </select>
              <input required placeholder="Subject Line" value={officialMail.subject} onChange={(e) => setOfficialMail({ ...officialMail, subject: e.target.value })} className="w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan" />
              <textarea rows={4} required placeholder="Email message content..." value={officialMail.message} onChange={(e) => setOfficialMail({ ...officialMail, message: e.target.value })} className="w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan" />
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsOfficialMailOpen(false)} className="border border-white/20 px-3 py-1.5 uppercase text-dim">Cancel</button>
                <button type="submit" className="border border-cyan bg-cyan px-4 py-1.5 uppercase text-void font-bold">Dispatch Email</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Regulation Chapter Modal */}
      {isNewRegOpen && (
        <div role="dialog" aria-modal className="fixed inset-0 z-50 flex items-center justify-center bg-void/85 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg border border-white/20 bg-graphite p-6">
            <h3 className="font-display text-2xl font-black uppercase text-ink">New Regulation Chapter</h3>
            <form onSubmit={handleCreateReg} className="mt-4 space-y-3 font-mono text-xs">
              <input required placeholder="Game Title (e.g. VALORANT)" value={newReg.game_name} onChange={(e) => setNewReg({ ...newReg, game_name: e.target.value })} className="w-full border border-white/15 bg-surface p-2.5 text-ink outline-none" />
              <input required placeholder="Chapter Code (e.g. SEC-01-INTEGRITY)" value={newReg.chapter_code} onChange={(e) => setNewReg({ ...newReg, chapter_code: e.target.value })} className="w-full border border-white/15 bg-surface p-2.5 text-ink outline-none" />
              <input required placeholder="Chapter Title" value={newReg.title} onChange={(e) => setNewReg({ ...newReg, title: e.target.value })} className="w-full border border-white/15 bg-surface p-2.5 text-ink outline-none" />
              <textarea rows={4} required placeholder="Rule items (one per line)" value={newReg.rules} onChange={(e) => setNewReg({ ...newReg, rules: e.target.value })} className="w-full border border-white/15 bg-surface p-2.5 text-ink outline-none" />
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsNewRegOpen(false)} className="border border-white/20 px-3 py-1.5 uppercase text-dim">Cancel</button>
                <button type="submit" className="border border-cyan bg-cyan px-4 py-1.5 uppercase text-void font-bold">Publish Chapter</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issue Prize Payout Modal */}
      {isPayoutModalOpen && (
        <div role="dialog" aria-modal className="fixed inset-0 z-50 flex items-center justify-center bg-void/85 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md border border-white/20 bg-graphite p-6">
            <h3 className="font-display text-2xl font-black uppercase text-ink">Issue Prize Payout</h3>
            <form onSubmit={handleCreatePayout} className="mt-4 space-y-3 font-mono text-xs">
              <div>
                <label className="text-dim">Player User ID / Username</label>
                <input required placeholder="User ID" value={newPayout.user_id} onChange={(e) => setNewPayout({ ...newPayout, user_id: e.target.value })} className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none" />
              </div>
              <div>
                <label className="text-dim">Placement</label>
                <input required placeholder="e.g. 1st Place Champion" value={newPayout.rank_or_placement} onChange={(e) => setNewPayout({ ...newPayout, rank_or_placement: e.target.value })} className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none" />
              </div>
              <div>
                <label className="text-dim">Prize Amount (₹)</label>
                <input required type="number" min="1" value={newPayout.amount_inr} onChange={(e) => setNewPayout({ ...newPayout, amount_inr: Number(e.target.value) })} className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none" />
              </div>
              <div>
                <label className="text-dim">Disbursement Method</label>
                <select value={newPayout.destination} onChange={(e) => setNewPayout({ ...newPayout, destination: e.target.value })} className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none">
                  <option value="WALLET">Player Platform Wallet</option>
                  <option value="UPI">Direct UPI IMPS</option>
                </select>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsPayoutModalOpen(false)} className="border border-white/20 px-3 py-1.5 uppercase text-dim">Cancel</button>
                <button type="submit" className="border border-cyan bg-cyan px-4 py-1.5 uppercase text-void font-bold">Issue Payout</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE TOURNAMENT MODAL */}
      {isCreateTourOpen && (
        <div role="dialog" aria-modal className="fixed inset-0 z-50 flex items-center justify-center bg-void/85 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-xl border border-white/20 bg-graphite p-6 my-8">
            <h3 className="font-display text-2xl font-black uppercase text-cyan">Create Sanctioned Tournament</h3>
            <p className="text-xs text-dim mt-1">Configure competition parameters, rules, and entry structure.</p>
            <form onSubmit={handleCreateTourSubmit} className="mt-4 space-y-3 font-mono text-xs">
              <div>
                <label className="text-dim">Tournament Title</label>
                <input required placeholder="e.g. Ascent Championship Series" value={newTour.title} onChange={(e) => setNewTour({ ...newTour, title: e.target.value })} className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-dim">Sanctioned Game</label>
                  <select value={newTour.game_id} onChange={(e) => setNewTour({ ...newTour, game_id: e.target.value })} className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none">
                    {games.map((g) => (
                      <option key={g.id || g.slug} value={g.slug || g.id}>{g.name}</option>
                    ))}
                    {games.length === 0 && (
                      <>
                        <option value="valorant">VALORANT</option>
                        <option value="bgmi">BGMI</option>
                        <option value="free-fire">Free Fire</option>
                        <option value="codm">COD Mobile</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="text-dim">Match Format</label>
                  <input required placeholder="e.g. Single Elim · BO3" value={newTour.format} onChange={(e) => setNewTour({ ...newTour, format: e.target.value })} className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-dim">Prize Pool (₹)</label>
                  <input required type="number" min="0" value={newTour.prize_pool_inr} onChange={(e) => setNewTour({ ...newTour, prize_pool_inr: Number(e.target.value) })} className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none" />
                </div>
                <div>
                  <label className="text-dim">Entry Fee per Squad (₹)</label>
                  <input required type="number" min="0" value={newTour.entry_fee_inr} onChange={(e) => setNewTour({ ...newTour, entry_fee_inr: Number(e.target.value) })} className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-dim">Max Teams</label>
                  <input required type="number" min="2" max="128" value={newTour.max_teams} onChange={(e) => setNewTour({ ...newTour, max_teams: Number(e.target.value) })} className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none" />
                </div>
                <div>
                  <label className="text-dim">Min Team Size</label>
                  <input required type="number" min="1" max="10" value={newTour.min_team_size} onChange={(e) => setNewTour({ ...newTour, min_team_size: Number(e.target.value) })} className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none" />
                </div>
                <div>
                  <label className="text-dim">Max Team Size</label>
                  <input required type="number" min="1" max="10" value={newTour.max_team_size} onChange={(e) => setNewTour({ ...newTour, max_team_size: Number(e.target.value) })} className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none" />
                </div>
              </div>
              <div>
                <label className="text-dim">Start Date & Time (UTC/Local)</label>
                <input required type="datetime-local" value={newTour.start_date} onChange={(e) => setNewTour({ ...newTour, start_date: e.target.value })} className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none" />
              </div>
              <BannerImageUploader
                label="Banner Image (16:9)"
                value={newTour.banner_url}
                onChange={(val) => setNewTour({ ...newTour, banner_url: val })}
              />
              <div>
                <label className="text-dim">Official WhatsApp Group / Community Link</label>
                <input
                  placeholder="https://chat.whatsapp.com/... (optional)"
                  value={newTour.whatsapp_group_url || ''}
                  onChange={(e) => setNewTour({ ...newTour, whatsapp_group_url: e.target.value })}
                  className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan"
                />
                <p className="mt-1 text-[10px] text-dim font-mono">Enrolled squad captains receive this link upon registration confirmation.</p>
              </div>
              <div>
                <label className="text-dim">Description</label>
                <textarea rows={3} value={newTour.description} onChange={(e) => setNewTour({ ...newTour, description: e.target.value })} className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none" />
              </div>
              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setIsCreateTourOpen(false)} className="border border-white/20 px-3 py-1.5 uppercase text-dim">Cancel</button>
                <button type="submit" className="border border-cyan bg-cyan px-5 py-1.5 uppercase text-void font-bold">Create Tournament</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT TOURNAMENT MODAL */}
      {editingTour && (
        <div role="dialog" aria-modal className="fixed inset-0 z-50 flex items-center justify-center bg-void/85 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-xl border border-white/20 bg-graphite p-6 my-8">
            <h3 className="font-display text-2xl font-black uppercase text-cyan">Edit Tournament {editingTour.title}</h3>
            <form onSubmit={handleUpdateTourSubmit} className="mt-4 space-y-3 font-mono text-xs">
              <div>
                <label className="text-dim">Title</label>
                <input required value={editingTour.title} onChange={(e) => setEditingTour({ ...editingTour, title: e.target.value })} className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-dim">Format</label>
                  <input required value={editingTour.format} onChange={(e) => setEditingTour({ ...editingTour, format: e.target.value })} className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none" />
                </div>
                <div>
                  <label className="text-dim">Max Teams</label>
                  <input required type="number" value={editingTour.max_teams} onChange={(e) => setEditingTour({ ...editingTour, max_teams: Number(e.target.value) })} className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-dim">Prize Pool (₹)</label>
                  <input required type="number" value={editingTour.prize_pool_inr} onChange={(e) => setEditingTour({ ...editingTour, prize_pool_inr: Number(e.target.value) })} className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none" />
                </div>
                <div>
                  <label className="text-dim">Entry Fee (₹)</label>
                  <input required type="number" value={editingTour.entry_fee_inr} onChange={(e) => setEditingTour({ ...editingTour, entry_fee_inr: Number(e.target.value) })} className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none" />
                </div>
              </div>
              <BannerImageUploader
                label="Banner Image (16:9)"
                value={editingTour.banner_url || ''}
                onChange={(val) => setEditingTour({ ...editingTour, banner_url: val })}
              />
              <div>
                <label className="text-dim">Official WhatsApp Group / Community Link</label>
                <input
                  placeholder="https://chat.whatsapp.com/... (optional)"
                  value={editingTour.whatsapp_group_url || ''}
                  onChange={(e) => setEditingTour({ ...editingTour, whatsapp_group_url: e.target.value })}
                  className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan"
                />
                <p className="mt-1 text-[10px] text-dim font-mono">Enrolled squad captains receive this link upon registration confirmation.</p>
              </div>
              <div>
                <label className="text-dim">Description</label>
                <textarea rows={3} value={editingTour.description || ''} onChange={(e) => setEditingTour({ ...editingTour, description: e.target.value })} className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none" />
              </div>
              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setEditingTour(null)} className="border border-white/20 px-3 py-1.5 uppercase text-dim">Cancel</button>
                <button type="submit" className="border border-cyan bg-cyan px-5 py-1.5 uppercase text-void font-bold">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW REGISTERED ROSTERS MODAL */}
      {rosterTour && (
        <div role="dialog" aria-modal className="fixed inset-0 z-50 flex items-center justify-center bg-void/85 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl border border-white/20 bg-graphite p-6 my-8 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="font-display text-2xl font-black uppercase text-ink">{rosterTour.title}</h3>
                <p className="font-mono text-xs text-dim">Authoritative Registered Rosters & Squad Status</p>
              </div>
              <button onClick={() => setRosterTour(null)} className="font-mono text-xs uppercase text-dim hover:text-ink">✕ Close</button>
            </div>

            <div className="mt-4 flex-1 overflow-y-auto space-y-3 pr-1">
              {loadingRosters ? (
                <div className="p-8 text-center font-mono text-xs text-cyan animate-pulse">
                  FETCHING REGISTERED ROSTERS FROM SECURE BACKEND...
                </div>
              ) : rostersList.length === 0 ? (
                <div className="border border-dashed border-white/15 p-8 text-center font-mono text-xs text-dim">
                  NO REGISTERED TEAMS (0 TEAMS REGISTERED FOR THIS TOURNAMENT).
                </div>
              ) : (
                rostersList.map((team, idx) => (
                  <div key={team.id || team.team_id || idx} className="border border-white/10 bg-surface p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-cyan font-bold">[{team.tag || 'TEAM'}]</span>
                        <span className="font-display text-lg font-black uppercase text-ink">{team.name || team.team_name}</span>
                      </div>
                      <span className={`px-2 py-0.5 font-mono text-[9px] uppercase border ${
                        team.payment_status === 'COMPLETED' || team.payment_status === 'PAID'
                          ? 'border-ok text-ok bg-ok/10'
                          : 'border-warn text-warn bg-warn/10'
                      }`}>
                        {team.payment_status || 'CONFIRMED'}
                      </span>
                    </div>

                    <div className="font-mono text-xs text-dim">
                      Captain: <span className="text-ink">{team.captain_username || team.captain_name || team.captain || 'N/A'}</span>
                    </div>

                    {team.members && team.members.length > 0 && (
                      <div className="font-mono text-xs text-dim">
                        <span>Squad: </span>
                        <span className="text-ink">
                          {team.members.map((m: any) => typeof m === 'string' ? m : m.username || m.name).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE GAME MODAL */}
      {isCreateGameOpen && (
        <div role="dialog" aria-modal className="fixed inset-0 z-50 flex items-center justify-center bg-void/85 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-xl border border-white/20 bg-graphite p-6 my-8">
            <h3 className="font-display text-2xl font-black uppercase text-cyan">Add Sanctioned Game Title</h3>
            <form onSubmit={handleCreateGameSubmit} className="mt-4 space-y-3 font-mono text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-dim">Game Slug (Unique ID)</label>
                  <input required placeholder="e.g. apex-legends" value={newGame.slug} onChange={(e) => setNewGame({ ...newGame, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan" />
                </div>
                <div>
                  <label className="text-dim">Game Name</label>
                  <input required placeholder="e.g. Apex Legends" value={newGame.name} onChange={(e) => setNewGame({ ...newGame, name: e.target.value })} className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-dim">Category</label>
                  <select
                    value={newGame.category}
                    onChange={(e) => setNewGame({ ...newGame, category: e.target.value })}
                    className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none"
                  >
                    {CANONICAL_CATEGORIES.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-dim">Platform</label>
                  <select value={newGame.platform} onChange={(e) => setNewGame({ ...newGame, platform: e.target.value })} className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none">
                    <option value="PC">PC</option>
                    <option value="Mobile">Mobile</option>
                    <option value="Console">Console</option>
                    <option value="Cross-Platform">Cross-Platform</option>
                  </select>
                </div>
                <div>
                  <label className="text-dim">Tag</label>
                  <input required placeholder="e.g. BATTLE ROYALE" value={newGame.tag} onChange={(e) => setNewGame({ ...newGame, tag: e.target.value.toUpperCase() })} className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-dim">Min Squad Size</label>
                  <input required type="number" min="1" max="10" value={newGame.min_team_size} onChange={(e) => setNewGame({ ...newGame, min_team_size: Number(e.target.value) })} className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none" />
                </div>
                <div>
                  <label className="text-dim">Max Squad Size</label>
                  <input required type="number" min="1" max="10" value={newGame.max_team_size} onChange={(e) => setNewGame({ ...newGame, max_team_size: Number(e.target.value) })} className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none" />
                </div>
                <div>
                  <label className="text-dim">Substitutes</label>
                  <input required type="number" min="0" max="5" value={newGame.max_substitutes} onChange={(e) => setNewGame({ ...newGame, max_substitutes: Number(e.target.value) })} className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none" />
                </div>
              </div>
              <div>
                <label className="text-dim">Server Region</label>
                <input required placeholder="e.g. Mumbai, India / Singapore" value={newGame.server_region} onChange={(e) => setNewGame({ ...newGame, server_region: e.target.value })} className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none" />
              </div>
              <div>
                <label className="text-dim">Anti-Cheat System</label>
                <input required placeholder="e.g. Easy Anti-Cheat" value={newGame.anti_cheat} onChange={(e) => setNewGame({ ...newGame, anti_cheat: e.target.value })} className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none" />
              </div>
              <BannerImageUploader
                label="Game Banner Image (16:9)"
                value={newGame.banner_url}
                onChange={(val) => setNewGame({ ...newGame, banner_url: val })}
              />
              <BannerImageUploader
                label="Game Logo / Icon (1:1 SVG or PNG)"
                recommendedRatio="1:1"
                recommendedRes="512x512"
                value={newGame.logo_url}
                onChange={(val) => setNewGame({ ...newGame, logo_url: val })}
              />
              <div>
                <label className="text-dim">Description</label>
                <textarea rows={3} value={newGame.description} onChange={(e) => setNewGame({ ...newGame, description: e.target.value })} className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none" />
              </div>
              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setIsCreateGameOpen(false)} className="border border-white/20 px-3 py-1.5 uppercase text-dim">Cancel</button>
                <button type="submit" className="border border-cyan bg-cyan px-5 py-1.5 uppercase text-void font-bold">Register Game</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT GAME MODAL */}
      {editingGame && (
        <div role="dialog" aria-modal className="fixed inset-0 z-50 flex items-center justify-center bg-void/85 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-xl border border-white/20 bg-graphite p-6 my-8">
            <h3 className="font-display text-2xl font-black uppercase text-cyan">Edit Game {editingGame.name}</h3>
            <form onSubmit={handleUpdateGameSubmit} className="mt-4 space-y-3 font-mono text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-dim">Game Name</label>
                  <input required value={editingGame.name} onChange={(e) => setEditingGame({ ...editingGame, name: e.target.value })} className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none" />
                </div>
                <div>
                  <label className="text-dim">Tag</label>
                  <input required value={editingGame.tag} onChange={(e) => setEditingGame({ ...editingGame, tag: e.target.value })} className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-dim">Platform</label>
                  <input required value={editingGame.platform} onChange={(e) => setEditingGame({ ...editingGame, platform: e.target.value })} className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none" />
                </div>
                <div>
                  <label className="text-dim">Category</label>
                  <select
                    value={editingGame.category}
                    onChange={(e) => setEditingGame({ ...editingGame, category: e.target.value })}
                    className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none"
                  >
                    {CANONICAL_CATEGORIES.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                    {!CANONICAL_CATEGORIES.some((c) => c.slug === editingGame.category) && (
                      <option value={editingGame.category}>{editingGame.category}</option>
                    )}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-dim">Min Squad Size</label>
                  <input required type="number" value={editingGame.min_team_size} onChange={(e) => setEditingGame({ ...editingGame, min_team_size: Number(e.target.value) })} className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none" />
                </div>
                <div>
                  <label className="text-dim">Max Squad Size</label>
                  <input required type="number" value={editingGame.max_team_size} onChange={(e) => setEditingGame({ ...editingGame, max_team_size: Number(e.target.value) })} className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none" />
                </div>
              </div>
              <div>
                <label className="text-dim">Server Region</label>
                <input required value={editingGame.server_region} onChange={(e) => setEditingGame({ ...editingGame, server_region: e.target.value })} className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none" />
              </div>
              <div>
                <label className="text-dim">Anti-Cheat</label>
                <input required value={editingGame.anti_cheat} onChange={(e) => setEditingGame({ ...editingGame, anti_cheat: e.target.value })} className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none" />
              </div>
              <BannerImageUploader
                label="Game Banner Image (16:9)"
                value={editingGame.banner_url || ''}
                onChange={(val) => setEditingGame((prev) => prev ? { ...prev, banner_url: val } : null)}
              />
              <BannerImageUploader
                label="Game Logo / Icon (1:1 SVG or PNG)"
                recommendedRatio="1:1"
                recommendedRes="512x512"
                value={editingGame.logo_url || ''}
                onChange={(val) => setEditingGame((prev) => prev ? { ...prev, logo_url: val } : null)}
              />
              <div>
                <label className="text-dim">Description</label>
                <textarea rows={3} value={editingGame.description || ''} onChange={(e) => setEditingGame({ ...editingGame, description: e.target.value })} className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none" />
              </div>
              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setEditingGame(null)} className="border border-white/20 px-3 py-1.5 uppercase text-dim">Cancel</button>
                <button type="submit" className="border border-cyan bg-cyan px-5 py-1.5 uppercase text-void font-bold">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PAGE MEDIA MODAL */}
      {editingMedia && (
        <div role="dialog" aria-modal className="fixed inset-0 z-50 flex items-center justify-center bg-void/85 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg border border-white/20 bg-graphite p-6 my-8">
            <h3 className="font-display text-2xl font-black uppercase text-cyan">Configure Page Media: {editingMedia.title || editingMedia.page_id}</h3>
            <p className="text-xs text-dim mt-1 font-mono">Page ID: {editingMedia.page_id}</p>
            <form onSubmit={handleSaveMediaConfig} className="mt-4 space-y-3 font-mono text-xs">
              <div>
                <label className="text-dim">Page Title Label</label>
                <input required value={editingMedia.title || ''} onChange={(e) => setEditingMedia({ ...editingMedia, title: e.target.value })} className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-dim">Media Type</label>
                  <select value={editingMedia.media_type} onChange={(e) => setEditingMedia({ ...editingMedia, media_type: e.target.value as any })} className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none">
                    <option value="image">Static Image</option>
                    <option value="gif">Animated GIF / Video Backing</option>
                  </select>
                </div>
                <div>
                  <label className="text-dim">Active Status</label>
                  <select value={editingMedia.is_active ? 'true' : 'false'} onChange={(e) => setEditingMedia({ ...editingMedia, is_active: e.target.value === 'true' })} className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none">
                    <option value="true">Active & Visible</option>
                    <option value="false">Disabled / Hidden</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-dim">Media Asset URL (Image / GIF / Web)</label>
                <div className="flex gap-2 mt-1">
                  <input required placeholder="https://..." value={editingMedia.media_url} onChange={(e) => setEditingMedia({ ...editingMedia, media_url: e.target.value })} className="flex-1 border border-white/15 bg-surface p-2.5 text-ink outline-none" />
                  <label className="cursor-pointer border border-cyan/40 bg-cyan/10 px-3 py-2 uppercase text-cyan hover:bg-cyan/20 shrink-0">
                    {isUploadingMediaFile ? '...' : 'Upload File'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={isUploadingMediaFile}
                      onChange={async (e) => {
                        const f = e.target.files?.[0]
                        if (!f) return
                        setIsUploadingMediaFile(true)
                        try {
                          const res = await uploadMediaFile(f)
                          if (res?.url) setEditingMedia((prev) => prev ? { ...prev, media_url: res.url } : null)
                        } catch (err: any) {
                          alert(err.message || 'Media upload failed')
                        } finally {
                          setIsUploadingMediaFile(false)
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
              <div>
                <label className="text-dim">Fallback Image URL</label>
                <input placeholder="https://..." value={editingMedia.fallback_url || ''} onChange={(e) => setEditingMedia({ ...editingMedia, fallback_url: e.target.value })} className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none" />
              </div>
              <div>
                <div className="flex justify-between">
                  <label className="text-dim">Visual Background Opacity</label>
                  <span className="text-cyan font-bold">{Math.round((editingMedia.opacity ?? 0.35) * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="1.0"
                  step="0.05"
                  value={editingMedia.opacity ?? 0.35}
                  onChange={(e) => setEditingMedia({ ...editingMedia, opacity: parseFloat(e.target.value) })}
                  className="mt-2 w-full accent-cyan"
                />
              </div>
              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setEditingMedia(null)} className="border border-white/20 px-3 py-1.5 uppercase text-dim">Cancel</button>
                <button type="submit" className="border border-cyan bg-cyan px-5 py-1.5 uppercase text-void font-bold">Save Media Config</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE GENRE MODAL */}
      {isCreateGenreOpen && (
        <div role="dialog" aria-modal className="fixed inset-0 z-50 flex items-center justify-center bg-void/85 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-xl border border-white/20 bg-graphite p-6 my-8">
            <h3 className="font-display text-2xl font-black uppercase text-cyan">Create Dynamic Genre</h3>
            <p className="text-xs text-dim mt-1">Configure parent genre category that will aggregate multiple game titles.</p>
            <form onSubmit={handleCreateGenreSubmit} className="mt-4 space-y-3 font-mono text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-dim">Genre Name</label>
                  <input
                    required
                    placeholder="e.g. Battle Royale"
                    value={newGenre.name}
                    onChange={(e) => {
                      const name = e.target.value
                      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                      setNewGenre({ ...newGenre, name, slug: newGenre.slug ? newGenre.slug : slug })
                    }}
                    className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan"
                  />
                </div>
                <div>
                  <label className="text-dim">Unique Slug</label>
                  <input
                    required
                    placeholder="e.g. battle-royale"
                    value={newGenre.slug || ''}
                    onChange={(e) => setNewGenre({ ...newGenre, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-dim">Rotation Interval (Seconds)</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={newGenre.rotation_interval_seconds ?? 4}
                    onChange={(e) => setNewGenre({ ...newGenre, rotation_interval_seconds: Number(e.target.value) })}
                    className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan"
                  />
                  <p className="text-[10px] text-dim mt-0.5">Speed for cycling logos on public card</p>
                </div>
                <div>
                  <label className="text-dim">Display Order</label>
                  <input
                    type="number"
                    min="0"
                    value={newGenre.display_order ?? 0}
                    onChange={(e) => setNewGenre({ ...newGenre, display_order: Number(e.target.value) })}
                    className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan"
                  />
                  <p className="text-[10px] text-dim mt-0.5">Priority in public grid (lower = first)</p>
                </div>
              </div>

              <div>
                <label className="text-dim">Description</label>
                <textarea
                  rows={2}
                  placeholder="Tactical high-stakes survivals, battle zones and drop ins..."
                  value={newGenre.description || ''}
                  onChange={(e) => setNewGenre({ ...newGenre, description: e.target.value })}
                  className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan"
                />
              </div>

              <BannerImageUploader
                label="Genre Banner Art (16:9 Desktop 1920x1080 / 4:3 Tablet 1200x900)"
                recommendedRatio="16:9"
                recommendedRes="1920x1080"
                value={newGenre.banner_url || ''}
                onChange={(val) => setNewGenre({ ...newGenre, banner_url: val })}
              />

              <BannerImageUploader
                label="Genre Badge / Icon (1:1 Square 800x800 or SVG)"
                recommendedRatio="1:1"
                recommendedRes="800x800"
                value={newGenre.icon_url || ''}
                onChange={(val) => setNewGenre({ ...newGenre, icon_url: val })}
              />

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateGenreOpen(false)}
                  className="border border-white/20 px-3 py-1.5 uppercase text-dim"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="border border-cyan bg-cyan px-5 py-1.5 uppercase text-void font-bold"
                >
                  Create Genre
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT GENRE MODAL */}
      {editingGenre && (
        <div role="dialog" aria-modal className="fixed inset-0 z-50 flex items-center justify-center bg-void/85 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-xl border border-white/20 bg-graphite p-6 my-8">
            <h3 className="font-display text-2xl font-black uppercase text-cyan">Edit Genre: {editingGenre.name}</h3>
            <p className="text-xs text-dim mt-1">Update parameters, artwork presets, or public visibility.</p>
            <form onSubmit={handleUpdateGenreSubmit} className="mt-4 space-y-3 font-mono text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-dim">Genre Name</label>
                  <input
                    required
                    value={editingGenre.name}
                    onChange={(e) => setEditingGenre({ ...editingGenre, name: e.target.value })}
                    className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan"
                  />
                </div>
                <div>
                  <label className="text-dim">Unique Slug</label>
                  <input
                    required
                    value={editingGenre.slug}
                    onChange={(e) => setEditingGenre({ ...editingGenre, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-dim">Rotation Interval (Seconds)</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={editingGenre.rotation_interval_seconds ?? 4}
                    onChange={(e) => setEditingGenre({ ...editingGenre, rotation_interval_seconds: Number(e.target.value) })}
                    className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan"
                  />
                </div>
                <div>
                  <label className="text-dim">Display Order</label>
                  <input
                    type="number"
                    min="0"
                    value={editingGenre.display_order ?? 0}
                    onChange={(e) => setEditingGenre({ ...editingGenre, display_order: Number(e.target.value) })}
                    className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan"
                  />
                </div>
              </div>

              <div>
                <label className="text-dim">Visibility Status</label>
                <select
                  value={editingGenre.is_active ? 'true' : 'false'}
                  onChange={(e) => setEditingGenre({ ...editingGenre, is_active: e.target.value === 'true' })}
                  className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none"
                >
                  <option value="true">Active & Visible in Catalog</option>
                  <option value="false">Inactive / Hidden</option>
                </select>
              </div>

              <div>
                <label className="text-dim">Description</label>
                <textarea
                  rows={2}
                  value={editingGenre.description || ''}
                  onChange={(e) => setEditingGenre({ ...editingGenre, description: e.target.value })}
                  className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan"
                />
              </div>

              <BannerImageUploader
                label="Genre Banner Art (16:9 Desktop / 4:3 Tablet)"
                recommendedRatio="16:9"
                recommendedRes="1920x1080"
                value={editingGenre.banner_url || ''}
                onChange={(val) => setEditingGenre((prev) => prev ? { ...prev, banner_url: val } : null)}
              />

              <BannerImageUploader
                label="Genre Badge / Icon (1:1 Square 800x800 or SVG)"
                recommendedRatio="1:1"
                recommendedRes="800x800"
                value={editingGenre.icon_url || ''}
                onChange={(val) => setEditingGenre((prev) => prev ? { ...prev, icon_url: val } : null)}
              />

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingGenre(null)}
                  className="border border-white/20 px-3 py-1.5 uppercase text-dim"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="border border-cyan bg-cyan px-5 py-1.5 uppercase text-void font-bold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODERATE REVIEW MODAL */}
      {selectedReviewForMod && (
        <div role="dialog" aria-modal className="fixed inset-0 z-50 flex items-center justify-center bg-void/85 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg border border-white/20 bg-graphite p-6 my-8">
            <h3 className="font-display text-2xl font-black uppercase text-cyan">
              Moderate Review: {selectedReviewForMod.user_name || 'Contender'}
            </h3>
            <p className="font-mono text-xs text-dim mt-1">
              Rating: {'★'.repeat(selectedReviewForMod.rating)} ({selectedReviewForMod.rating}/5) · Category: {selectedReviewForMod.category}
            </p>
            <div className="mt-3 p-3 border border-white/10 bg-surface/50 font-mono text-xs italic text-ink/90">
              "{selectedReviewForMod.review_text}"
            </div>

            <div className="mt-4 space-y-3 font-mono text-xs">
              <div>
                <label className="text-dim">Moderation Status</label>
                <select
                  value={modStatus}
                  onChange={(e) => setModStatus(e.target.value as any)}
                  className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none"
                >
                  <option value="APPROVED">APPROVED (Publicly Visible)</option>
                  <option value="FEATURED">FEATURED (Spotlight Hero Badge)</option>
                  <option value="PENDING">PENDING (Under Audit)</option>
                  <option value="HIDDEN">HIDDEN (Moderated Out)</option>
                </select>
              </div>

              <div>
                <label className="text-dim">Internal Admin Notes / Audit Rationale</label>
                <textarea
                  rows={3}
                  value={modNotes}
                  onChange={(e) => setModNotes(e.target.value)}
                  placeholder="e.g. Verified champion feedback; featured on public reviews wall."
                  className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedReviewForMod(null)}
                  className="border border-white/20 px-3 py-1.5 uppercase text-dim"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleModerateReviewAction(selectedReviewForMod.id, modStatus, modNotes)}
                  className="border border-cyan bg-cyan px-5 py-1.5 uppercase text-void font-bold"
                >
                  Apply Moderation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
