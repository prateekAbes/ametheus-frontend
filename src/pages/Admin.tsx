import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { Container, Hud, Badge, Dot, Cta, SectionHead, Modal, Panel } from '../components/ui'
import { useAuthContext } from '../context/AuthContext'
import {
  getAdminStats,
  getAdminUsers,
  setUserRole,
  promoteUserToOrganizer,
  getPendingPayments,
  approvePayment,
  rejectPayment,
  getAdminUpiAccounts,
  createUpiAccount,
  toggleUpiAccountStatus,
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
  getDisputes,
  resolveDispute,
  getAuditLogs,
  createGame,
  updateGame,
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
  Tournament,
} from '../services/tournaments'
import { inr } from '../lib/data'

const TABS = [
  'OVERVIEW',
  'FEATURED TOURNAMENT',
  'USERS & ROLES',
  'PENDING PAYMENTS',
  'UPI & QR ACCOUNTS',
  'PAYOUTS LEDGER',
  'SUPPORT TICKETS',
  'RULES & REGULATIONS',
  'EMAIL & SMTP',
  'HERO & PAGE MEDIA',
  'GAMES CATALOG',
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

  // Additional Restored Datasets
  const [upiAccounts, setUpiAccounts] = useState<UpiAccount[]>([])
  const [payouts, setPayouts] = useState<PayoutRecord[]>([])
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [regulations, setRegulations] = useState<GameRegulation[]>([])
  const [emailStatus, setEmailStatus] = useState<EmailSystemStatus | null>(null)
  const [mediaConfigs, setMediaConfigs] = useState<PageMediaConfig[]>([])
  const [disputes, setDisputes] = useState<any[]>([])

  const [loading, setLoading] = useState(true)
  const [actionMsg, setActionMsg] = useState<string | null>(null)

  // Modals & Interactive States
  const [rejectPaymentId, setRejectPaymentId] = useState<string | null>(null)
  const [rejectNotes, setRejectNotes] = useState('')

  const [isNewUpiOpen, setIsNewUpiOpen] = useState(false)
  const [newUpi, setNewUpi] = useState({ code: '', upi_id: '', payee_name: '', display_name: '' })

  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false)
  const [newPayout, setNewPayout] = useState({ user_id: '', game_id: '', rank_or_placement: '1st Place', amount_inr: 5000, destination: 'WALLET' })

  const [completePayoutId, setCompletePayoutId] = useState<string | null>(null)
  const [outgoingUtr, setOutgoingUtr] = useState('')

  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [ticketStatusVal, setTicketStatusVal] = useState('IN_PROGRESS')
  const [ticketNotes, setTicketNotes] = useState('')

  const [testEmailTo, setTestEmailTo] = useState('admin@ametheus.gg')
  const [isSendingTestMail, setIsSendingTestMail] = useState(false)

  const [isOfficialMailOpen, setIsOfficialMailOpen] = useState(false)
  const [officialMail, setOfficialMail] = useState({ recipient_type: 'ALL_USERS', subject: '', message: '' })

  const [isNewRegOpen, setIsNewRegOpen] = useState(false)
  const [newReg, setNewReg] = useState({ game_name: 'VALORANT', chapter_code: 'VAL-SEC-01', title: 'Tournament Regulations', format: '5v5 Tactical', server: 'AWS Mumbai', rules: 'Anti-cheat verification mandatory.\nRespect referee rulings.' })

  const loadData = async () => {
    setLoading(true)
    try {
      const [s, u, p, g, l, tList, fTour, upiList, payList, tixList, regList, eStat, mList, dispList] = await Promise.all([
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
      setNewUpi({ code: '', upi_id: '', payee_name: '', display_name: '' })
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
      showToast('Winning payout disbursement logged!')
      setIsPayoutModalOpen(false)
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
            <p className="mt-2 text-dim">Master operations console: manage users, verify payments, disburse payouts, arbitrate disputes, and configure platform media.</p>
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
                <Hud className="text-cyan">HOMEPAGE SPOTLIGHT</Hud>
                <h3 className="mt-2 font-display text-2xl font-black uppercase truncate">
                  {featuredTour ? featuredTour.title : 'None Selected'}
                </h3>
                <p className="text-xs text-dim mt-1 font-mono">{featuredTour ? `${featuredTour.game_name || featuredTour.game_id} · ${inr(featuredTour.prize_pool_inr)}` : 'No tournament currently highlighted'}</p>
                <div className="mt-4">
                  <button onClick={() => setTab('FEATURED TOURNAMENT')} className="border border-cyan/40 bg-cyan/10 px-3 py-1.5 font-mono text-xs uppercase text-cyan hover:bg-cyan/20 transition-colors">
                    Configure Spotlight →
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
                    className="w-full border border-white/15 bg-surface px-4 py-2.5 text-sm text-ink outline-none focus:border-cyan"
                  >
                    <option value="none">-- None (Unset Spotlight) --</option>
                    {tournaments.map((t) => (
                      <option key={t.id || t.slug} value={t.id || t.slug}>
                        {t.title} ({t.game_name || t.game_id}) — {inr(t.prize_pool_inr)}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleSetFeatured()}
                    disabled={isSavingFeatured}
                    className="shrink-0 border border-cyan bg-cyan px-6 py-2.5 font-mono text-xs font-bold uppercase text-void hover:bg-white transition-colors"
                  >
                    {isSavingFeatured ? 'Saving...' : 'Apply Selection'}
                  </button>
                </div>
              </div>
            </Panel>
          </div>
        )}

        {/* TAB 3: USERS & ROLES */}
        {tab === 'USERS & ROLES' && (
          <div className="mt-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="font-display text-3xl font-black uppercase">Platform Users & Permissions</h2>
              <Hud className="text-cyan">{users.length} REGISTERED</Hud>
            </div>

            <div className="overflow-x-auto border border-white/15 bg-graphite">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-surface/50 text-dim">
                    <th className="p-4">USER</th>
                    <th className="p-4">EMAIL</th>
                    <th className="p-4">CURRENT ROLE</th>
                    <th className="p-4">WALLET</th>
                    <th className="p-4">PROMOTE / ASSIGN ROLE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map((u) => (
                    <tr key={u.id || u.email} className="hover:bg-white/[0.02]">
                      <td className="p-4 font-bold text-ink">{u.username || u.display_name || 'Gamer'}</td>
                      <td className="p-4 text-dim">{u.email}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 border text-[10px] ${
                          u.role === 'SUPER_ADMIN' ? 'border-live/40 bg-live/10 text-live' :
                          u.role === 'ORGANIZER' ? 'border-warn/40 bg-warn/10 text-warn' : 'border-cyan/40 bg-cyan/10 text-cyan'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4 text-ok font-bold">{inr(Number(u.inr_balance) || 0)}</td>
                      <td className="p-4 flex items-center gap-2">
                        <select
                          value={u.role}
                          onChange={async (e) => {
                            try {
                              await setUserRole(u.id, e.target.value)
                              showToast(`Role updated to ${e.target.value} for ${u.username}`)
                              loadData()
                            } catch (err: any) {
                              alert(err.message || 'Failed to update role')
                            }
                          }}
                          className="border border-white/15 bg-surface px-2.5 py-1 text-ink outline-none text-xs"
                        >
                          <option value="PLAYER">PLAYER</option>
                          <option value="ORGANIZER">ORGANIZER</option>
                          <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                          <option value="TOURNAMENT_ADMIN">TOURNAMENT_ADMIN</option>
                          <option value="MATCH_ARBITER">MATCH_ARBITER</option>
                          <option value="COMMUNITY_MODERATOR">COMMUNITY_MODERATOR</option>
                        </select>
                        {u.role !== 'ORGANIZER' && u.role !== 'SUPER_ADMIN' && (
                          <button
                            onClick={async () => {
                              try {
                                await promoteUserToOrganizer(u.id)
                                showToast(`User ${u.username} promoted to Organizer!`)
                                loadData()
                              } catch (err: any) {
                                alert(err.message || 'Promotion failed')
                              }
                            }}
                            className="border border-warn/40 bg-warn/10 px-2 py-1 text-[10px] text-warn hover:bg-warn/20"
                          >
                            Promote
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

        {/* TAB 4: PENDING PAYMENTS */}
        {tab === 'PENDING PAYMENTS' && (
          <div className="mt-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="font-display text-3xl font-black uppercase">Payment Verifications</h2>
                <p className="text-xs text-dim">Review incoming UPI transactions and reconcile bank UTR numbers.</p>
              </div>
              <Hud className="text-warn">{payments.length} PENDING</Hud>
            </div>

            {payments.length === 0 ? (
              <div className="border border-dashed border-white/15 p-12 text-center font-mono text-xs text-dim">
                ALL INCOMING TRANSACTIONS ARE RECONCILED. NO PENDING PAYMENTS.
              </div>
            ) : (
              <div className="overflow-x-auto border border-white/15 bg-graphite">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-white/10 bg-surface/50 text-dim">
                      <th className="p-4">USER / EMAIL</th>
                      <th className="p-4">UTR NUMBER</th>
                      <th className="p-4">AMOUNT</th>
                      <th className="p-4">SENDER UPI</th>
                      <th className="p-4">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {payments.map((p) => (
                      <tr key={p.id}>
                        <td className="p-4 font-bold text-ink">{p.user_email || p.user_id}</td>
                        <td className="p-4 text-cyan font-bold">{p.utr}</td>
                        <td className="p-4 text-ok font-bold">{inr(p.amount_inr)}</td>
                        <td className="p-4 text-dim">{p.sender_upi_id || 'N/A'}</td>
                        <td className="p-4 flex gap-2">
                          <button
                            onClick={() => handleApprovePayment(p.id)}
                            className="border border-ok/50 bg-ok/10 px-3 py-1 text-ok hover:bg-ok/20 transition-colors uppercase"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => setRejectPaymentId(p.id)}
                            className="border border-live/40 bg-live/10 px-3 py-1 text-live hover:bg-live/20 transition-colors uppercase"
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: UPI & QR ACCOUNTS */}
        {tab === 'UPI & QR ACCOUNTS' && (
          <div className="mt-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="font-display text-3xl font-black uppercase">Platform UPI Accounts</h2>
                <p className="text-xs text-dim">Manage corporate merchant accounts and receiving QR destinations.</p>
              </div>
              <button
                onClick={() => setIsNewUpiOpen(true)}
                className="border border-cyan bg-cyan px-4 py-2 font-mono text-xs uppercase text-void font-bold hover:bg-white transition-colors"
              >
                + Add UPI Account
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {upiAccounts.map((a) => (
                <Panel key={a.id} className="p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <span className="font-mono text-xs text-cyan font-bold">{a.code}</span>
                    <span className={`px-2 py-0.5 border font-mono text-[10px] ${a.status === 'ACTIVE' ? 'border-ok/40 bg-ok/10 text-ok' : 'border-white/20 text-dim'}`}>
                      {a.status}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-display text-2xl font-black uppercase">{a.payee_name}</h3>
                    <p className="font-mono text-xs text-ink mt-1">UPI ID: {a.upi_id}</p>
                    <p className="font-mono text-xs text-dim mt-1">Total Payments Received: {a.payment_count}</p>
                  </div>
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => handleToggleUpi(a.id)}
                      className="border border-white/20 px-3 py-1 font-mono text-xs uppercase text-dim hover:text-ink transition-colors"
                    >
                      Toggle {a.status === 'ACTIVE' ? 'Inactive' : 'Active'}
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
                <h2 className="font-display text-3xl font-black uppercase">Payouts & Prize Distribution</h2>
                <p className="text-xs text-dim">Review tournament prize withdrawals and disburse player winnings.</p>
              </div>
              <button
                onClick={() => setIsPayoutModalOpen(true)}
                className="border border-cyan bg-cyan px-4 py-2 font-mono text-xs uppercase text-void font-bold hover:bg-white transition-colors"
              >
                + Issue Prize Payout
              </button>
            </div>

            <div className="overflow-x-auto border border-white/15 bg-graphite">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-surface/50 text-dim">
                    <th className="p-4">PLAYER</th>
                    <th className="p-4">TYPE</th>
                    <th className="p-4">AMOUNT</th>
                    <th className="p-4">DESTINATION</th>
                    <th className="p-4">STATUS</th>
                    <th className="p-4">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {payouts.map((pay) => (
                    <tr key={pay.id}>
                      <td className="p-4 font-bold text-ink">{pay.user_name || pay.user_id}</td>
                      <td className="p-4 text-dim">{pay.payout_type}</td>
                      <td className="p-4 text-ok font-bold">{inr(pay.amount_inr)}</td>
                      <td className="p-4 text-dim">{pay.destination} {pay.upi_id ? `(${pay.upi_id})` : ''}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 border text-[10px] ${
                          pay.status === 'PAID' ? 'border-ok/40 bg-ok/10 text-ok' :
                          pay.status === 'REJECTED' ? 'border-live/40 bg-live/10 text-live' : 'border-warn/40 bg-warn/10 text-warn'
                        }`}>
                          {pay.status}
                        </span>
                      </td>
                      <td className="p-4">
                        {pay.status === 'PENDING' && (
                          <button
                            onClick={() => setCompletePayoutId(pay.id)}
                            className="border border-ok/50 bg-ok/10 px-3 py-1 text-ok hover:bg-ok/20 transition-colors uppercase"
                          >
                            Mark Paid
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
              <div>
                <h2 className="font-display text-3xl font-black uppercase">Support Tickets & Inquiries</h2>
                <p className="text-xs text-dim">Customer tickets, payment issues, and dispute resolutions.</p>
              </div>
              <Hud className="text-ok">{tickets.length} TICKETS</Hud>
            </div>

            <div className="space-y-4">
              {tickets.map((tix) => (
                <Panel key={tix.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-cyan font-bold">{tix.ticket_id}</span>
                      <span className="border border-white/15 px-2 py-0.5 font-mono text-[10px] text-dim uppercase">{tix.category}</span>
                      <span className="border border-ok/40 bg-ok/10 px-2 py-0.5 font-mono text-[10px] text-ok uppercase">{tix.status}</span>
                    </div>
                    <h3 className="mt-2 font-display text-2xl font-black uppercase text-ink">{tix.name}</h3>
                    <p className="text-xs text-dim mt-1 font-mono">Contact: {tix.email}</p>
                    <p className="text-xs text-dim mt-2 bg-surface/60 p-3 border border-white/5 font-mono">{tix.description}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setSelectedTicket(tix)
                        setTicketStatusVal(tix.status)
                        setTicketNotes(tix.internal_notes || '')
                      }}
                      className="border border-cyan/40 bg-cyan/10 px-4 py-2 font-mono text-xs uppercase text-cyan hover:bg-cyan/20 transition-colors"
                    >
                      Manage Ticket
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await retrySupportTicketEmail(tix.id)
                          showToast('Email confirmation dispatched!')
                        } catch (err: any) {
                          alert(err.message || 'Retry failed')
                        }
                      }}
                      className="border border-white/20 px-3 py-2 font-mono text-xs uppercase text-dim hover:text-ink transition-colors"
                    >
                      Retry Email
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
                <h2 className="font-display text-3xl font-black uppercase">Platform Rulebooks & Regulations</h2>
                <p className="text-xs text-dim">Sanctioned game rules, anti-cheat mandates, and codes of conduct.</p>
              </div>
              <button
                onClick={() => setIsNewRegOpen(true)}
                className="border border-cyan bg-cyan px-4 py-2 font-mono text-xs uppercase text-void font-bold hover:bg-white transition-colors"
              >
                + Add Regulation Chapter
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {regulations.map((reg) => (
                <Panel key={reg.id} className="p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <span className="font-mono text-xs text-cyan font-bold">{reg.chapter_code}</span>
                    <span className="font-mono text-xs text-dim uppercase">{reg.game_name}</span>
                  </div>
                  <h3 className="font-display text-2xl font-black uppercase">{reg.title}</h3>
                  <div className="space-y-1 font-mono text-xs text-dim">
                    {reg.rules.slice(0, 4).map((r, i) => (
                      <p key={i}>• {r}</p>
                    ))}
                  </div>
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => handleDeleteReg(reg.id)}
                      className="border border-live/40 bg-live/10 px-3 py-1 font-mono text-xs uppercase text-live hover:bg-live/20 transition-colors"
                    >
                      Delete Chapter
                    </button>
                  </div>
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
                <h2 className="font-display text-3xl font-black uppercase">Email Infrastructure & Dispatcher</h2>
                <p className="text-xs text-dim">SMTP server connectivity, transactional identities, and broadcast notifications.</p>
              </div>
              <button
                onClick={() => setIsOfficialMailOpen(true)}
                className="border border-cyan bg-cyan px-4 py-2 font-mono text-xs uppercase text-void font-bold hover:bg-white transition-colors"
              >
                + Dispatch Official Mail
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

        {/* TAB 10: HERO & PAGE MEDIA */}
        {tab === 'HERO & PAGE MEDIA' && (
          <div className="mt-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="font-display text-3xl font-black uppercase">Hero Backgrounds & Page Media</h2>
                <p className="text-xs text-dim">Manage cinematic video backgrounds, GIFs, and imagery across platform pages.</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {[
                { id: 'home', title: 'Homepage Hero', current: 'Cinematic Gaming Backing' },
                { id: 'tournaments', title: 'Tournaments Arena', current: 'Esports Stage Background' },
                { id: 'matches', title: 'Live Matches Hub', current: 'Broadcast Grid' },
                { id: 'teams', title: 'Squads & Teams', current: 'Cyber Grid' },
              ].map((m) => (
                <Panel key={m.id} className="p-6 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="font-mono text-xs text-cyan font-bold">{m.id.toUpperCase()}</span>
                    <span className="border border-ok/40 bg-ok/10 px-2 py-0.5 font-mono text-[9px] uppercase text-ok">ACTIVE</span>
                  </div>
                  <h3 className="font-display text-2xl font-black uppercase">{m.title}</h3>
                  <p className="text-xs text-dim font-mono">{m.current}</p>
                </Panel>
              ))}
            </div>
          </div>
        )}

        {/* TAB 11: GAMES CATALOG */}
        {tab === 'GAMES CATALOG' && (
          <div className="mt-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="font-display text-3xl font-black uppercase">Sanctioned Game Titles</h2>
              <Hud className="text-cyan">{games.length} GAMES</Hud>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {games.map((g) => (
                <Panel key={g.id || g.slug} className="p-6 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="font-mono text-xs text-cyan font-bold">{g.tag || 'ESPORTS'}</span>
                    <span className="border border-cyan/40 bg-cyan/10 px-2 py-0.5 font-mono text-[9px] uppercase text-cyan">ACTIVE</span>
                  </div>
                  <h3 className="font-display text-2xl font-black uppercase">{g.name}</h3>
                  <p className="font-mono text-xs text-dim">Slug: {g.slug}</p>
                  <p className="font-mono text-xs text-dim">Team Size: {g.min_team_size || 1} - {g.max_team_size || 5} Players</p>
                </Panel>
              ))}
            </div>
          </div>
        )}

        {/* TAB 12: DISPUTES & QUEUE */}
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

        {/* TAB 13: AUDIT LOGS */}
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
    </div>
  )
}
