import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import { QRCodeSVG } from 'qrcode.react'
import { Container, Hud, Dot, Cta, Crest, Avatar, Media, Badge } from '../components/ui'
import { Modal, useLoadMore, LoadMore } from '../components/kit'
import DynamicImage from '../components/DynamicImage'
import { resolveMediaUrl } from '../services/apiClient'
import {
  getTournamentBySlug,
  getTournamentMatches,
  registerTeamForTournament,
  registerTournamentDirectUpi,
  submitTournamentUpiUtr,
  normalizeTournament,
  NormalizedTournament,
  DirectUpiInitResponse,
} from '../services/tournaments'
import { getGames, Game, normalizeGame, NormalizedGame } from '../services/games'
import { getMyTeams, Team } from '../services/teams'
import { useAuthContext } from '../context/AuthContext'
import { gameBy, img, inr, MATCHES, TOUR_EXTRA, teamNames, type Match, type Stage } from '../lib/data'
import { gsap, isMobile, reducedMotion } from '../lib/motion'

const NAV = ['Overview', 'Rules', 'Teams', 'Matches', 'Standings', 'Schedule', 'Live', 'Results'] as const
type NavId = (typeof NAV)[number]
const anchor = (n: string) => `t-${n.toLowerCase()}`

const RULES: { cat: string; items: [string, string][] }[] = [
  {
    cat: 'General',
    items: [
      ['Verified accounts', 'Every player must hold a verified AMETHEUS account linked to their in-game ID.'],
      ['Admin authority', 'Tournament admins have final say on disputes, reschedules and rulings.'],
      ['Rule changes', 'Rules may be updated up to 24 hours before the first match. Registered captains are notified.'],
    ],
  },
  {
    cat: 'Registration',
    items: [
      ['Deadline', 'Registration closes 24 hours before the first match or when slots fill.'],
      ['Entry fee', 'Deducted from your wallet at confirmation. Refunded only if the event is cancelled.'],
      ['One entry', 'A player may appear on one roster per tournament.'],
    ],
  },
  {
    cat: 'Team',
    items: [
      ['Roster size', 'Full squad plus one optional substitute.'],
      ['Captain', 'The captain registers the team and must be reachable on match day.'],
      ['Roster lock', 'Rosters lock once check-in opens for the first match.'],
    ],
  },
  {
    cat: 'Match',
    items: [
      ['Check-in', 'Check in 30 minutes before your slot from the match room.'],
      ['Lobby', 'Room ID and password are shared 10 minutes before start.'],
      ['No-shows', 'Teams absent 10 minutes after start forfeit the match.'],
    ],
  },
  {
    cat: 'Scoring',
    items: [
      ['Points', 'Placement points plus elimination points per map, published before day one.'],
      ['Tiebreaks', 'Total eliminations, then best single-map placement, then last-map placement.'],
    ],
  },
  {
    cat: 'Disqualification',
    items: [
      ['Third-party tools', 'Hacks, emulators, macros or modified clients mean immediate disqualification.'],
      ['Account sharing', 'Playing on another player’s account voids the team’s results.'],
      ['Teaming', 'Cooperating with opponents results in removal of both teams.'],
    ],
  },
  {
    cat: 'Conduct',
    items: [
      ['Respect', "Respect opponents, casters and admins. Toxicity isn't tolerated."],
      ['Hate speech', 'Results in an immediate permanent platform ban.'],
    ],
  },
]

const STATUS_LABEL: Record<string, [string, string]> = {
  open: ['Registration open', 'bg-ok'],
  registration_open: ['Registration open', 'bg-ok'],
  upcoming: ['Coming soon', 'bg-cyan'],
  live: ['Live now', 'bg-live'],
  ongoing: ['Live now', 'bg-live'],
  completed: ['Completed', 'bg-dim'],
  cancelled: ['Cancelled', 'bg-white/30'],
  draft: ['Draft', 'bg-warn'],
  registration_closed: ['Registration closed', 'bg-dim'],
}

function Status({ s }: { s: string }) {
  const normKey = s.toLowerCase()
  const [label, dot] = STATUS_LABEL[normKey] ?? ['Upcoming', 'bg-cyan']
  return (
    <span className="inline-flex items-center gap-2.5 border-l border-white/20 pl-3 font-mono text-[11px] uppercase tracking-[0.22em] text-ink/85">
      <span className="relative flex size-2">
        {normKey === 'live' && <span className={`absolute inset-0 animate-ping rounded-full ${dot} opacity-60`} />}
        <span className={`relative size-2 rounded-full ${dot}`} />
      </span>
      {label}
    </span>
  )
}

function Block({
  id,
  idx,
  kicker,
  title,
  aside,
  children,
  tone,
}: {
  id: NavId
  idx: string
  kicker: string
  title: ReactNode
  aside?: ReactNode
  children: ReactNode
  tone?: 'graphite'
}) {
  return (
    <section id={anchor(id)} data-section={id} className={`scroll-mt-36 py-20 md:py-28 ${tone === 'graphite' ? 'bg-graphite' : ''}`}>
      <Container>
        <div className="in-view mb-12 flex flex-col gap-6 md:mb-16 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-4 flex items-center gap-4">
              <Hud className="text-ink">{idx}</Hud>
              <span className="h-px w-10 bg-white/25" />
              <Hud>{kicker}</Hud>
            </div>
            <h2 className="text-balance font-display text-[clamp(2.75rem,7vw,6.5rem)] font-black uppercase leading-[0.84]">
              {title}
            </h2>
          </div>
          {aside}
        </div>
        {children}
      </Container>
    </section>
  )
}

function Pending({ glyph = '◇', title, body, cta }: { glyph?: string; title: string; body: string; cta?: ReactNode }) {
  return (
    <div className="in-view flex flex-col items-start gap-6 border border-dashed border-white/15 p-8 md:flex-row md:items-center md:p-10">
      <span className="grid size-14 shrink-0 place-items-center border border-white/15 font-display text-2xl text-dim">
        {glyph}
      </span>
      <div className="flex-1">
        <p className="font-display text-3xl font-black uppercase leading-none">{title}</p>
        <p className="mt-2 max-w-lg text-dim">{body}</p>
      </div>
      {cta}
    </div>
  )
}

export default function TournamentDetail() {
  const { id = '' } = useParams()
  const { isSignedIn, profile } = useAuthContext()

  const [tourData, setTourData] = useState<NormalizedTournament | null>(null)
  const [matchesData, setMatchesData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [regModalOpen, setRegModalOpen] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)

  const fetchTour = async () => {
    try {
      const data = await getTournamentBySlug(id)
      if (data) {
        const norm = normalizeTournament(data)
        setTourData(norm)
        if (norm.isRegistered) {
          setIsRegistered(true)
        }
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false)
    }

    try {
      const mList = await getTournamentMatches(id)
      if (Array.isArray(mList)) {
        setMatchesData(mList)
      }
    } catch {}
  }

  useEffect(() => {
    fetchTour()
  }, [id])

  // Resolve visual metadata
  const gameSlug = tourData?.gameId || tourData?.gameName || ''
  const g = gameBy(gameSlug)
  const accent = g.accent || '#3ef2ff'

  // Exact registered count from authoritative backend record
  const registeredCount = tourData ? tourData.registeredTeams : 0
  const maxTeams = tourData ? tourData.maxTeams : 16
  const entryFee = tourData ? tourData.entryFeeInr : 0
  const prizePool = tourData ? tourData.prizePoolInr : 50000
  const title = tourData ? tourData.title : 'Tournament'
  const tourStatus = tourData ? tourData.status.toLowerCase() : 'open'
  const isRegOpen = tourStatus === 'open' || tourStatus === 'registration_open'

  // Registered rosters
  const rosterList = tourData?.registeredRosters || []

  const long = title.length > 22
  const words = title.split(' ')
  const mid = Math.ceil(words.length / 2)
  const lines = long ? [words.slice(0, mid).join(' '), words.slice(mid).join(' ')] : [title]

  const stages: Stage[] = [
    { name: 'Registration', date: 'Open now', time: 'Closes 24h before start' },
    { name: maxTeams > 16 ? 'Qualifiers' : 'Group Stage', date: tourData?.startDate ? new Date(tourData.startDate).toLocaleDateString('en-GB') : 'TBD', time: '18:00 IST' },
    ...(maxTeams > 8 ? [{ name: 'Semifinal', date: tourData?.startDate ? new Date(tourData.startDate).toLocaleDateString('en-GB') : 'TBD', time: '20:00 IST' }] : []),
    { name: 'Grand Final', date: tourData?.startDate ? new Date(tourData.startDate).toLocaleDateString('en-GB') : 'TBD', time: '21:30 IST' },
  ]

  const renderedRules = useMemo(() => {
    if (!tourData?.rules || tourData.rules.length === 0) {
      return RULES
    }
    const first = tourData.rules[0] as any
    if (typeof first === 'object' && first !== null && first.cat && Array.isArray(first.items)) {
      return tourData.rules as unknown as { cat: string; items: [string, string][] }[]
    }
    const items: [string, string][] = tourData.rules.map((r: any, idx: number) => {
      if (typeof r === 'string') {
        const parts = r.split(/[:\.]\s+/)
        if (parts.length > 1) {
          return [parts[0].replace(/^\d+[\.\)]\s*/, '').trim() || `Rule ${idx + 1}`, parts.slice(1).join('. ').trim()]
        }
        return [`Rule 0${idx + 1}`, r.trim()]
      }
      if (typeof r === 'object' && r !== null) {
        return [r.title || r.name || `Rule ${idx + 1}`, r.description || r.desc || r.text || '']
      }
      return [`Rule ${idx + 1}`, String(r)]
    })
    return [
      {
        cat: 'Official Regulations',
        items,
      },
    ]
  }, [tourData?.rules])

  return (
    <div className="bg-void text-ink pb-36" style={{ ['--acc' as string]: accent }}>
      {/* Hero */}
      <section className="relative isolate flex min-h-[100svh] items-end overflow-hidden bg-void md:min-h-[92svh]">
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 70% 20%, ${accent}30, transparent 60%)` }} />
        <div className="absolute inset-0">
          <DynamicImage
            src={resolveMediaUrl(tourData?.bannerUrl)}
            alt={`${title} banner`}
            eager
            mode="ambient"
            className="h-full w-full opacity-70 object-contain object-center md:object-[75%_center]"
            backdropClassName="opacity-30"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-void via-void/75 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-void via-void/30 to-void/40" />
        <div className="grid-floor absolute -inset-x-1/2 bottom-0 h-1/3 opacity-40" />

        <Container className="relative w-full pb-16 pt-36 md:pb-24">
          <div className="flex flex-wrap items-center gap-5">
            <Link to={`/games/${g.slug}`} className="flex items-center gap-3">
              <span className="grid size-10 place-items-center border font-display text-xs font-black" style={{ borderColor: accent + '88', color: accent }}>
                {g.short.slice(0, 2)}
              </span>
              <span className="font-display text-lg font-black tracking-[0.18em]" style={{ color: accent }}>
                {tourData?.gameName || g.short}
              </span>
            </Link>
            <Status s={tourStatus} />
            {isRegistered && <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-ok">✓ You're registered</span>}
          </div>

          <h1 className={`mt-8 max-w-6xl font-display font-black uppercase leading-[0.84] ${long ? 'text-[clamp(2.75rem,7.5vw,7.5rem)]' : 'text-[clamp(3.5rem,11vw,11rem)]'}`}>
            {lines.map((l) => (
              <span key={l} className="block overflow-hidden pb-[0.04em]">
                <span className="block text-balance break-words">{l}</span>
              </span>
            ))}
          </h1>

          <div className="mt-10 flex flex-wrap items-end gap-x-12 gap-y-6">
            <div>
              <Hud>Prize pool</Hud>
              <p className="font-display text-6xl font-black leading-none tabular-nums md:text-7xl" style={{ color: accent }}>
                {inr(prizePool)}
              </p>
            </div>
            <div className="flex flex-wrap gap-x-10 gap-y-4 pb-1">
              <div>
                <Hud>Entry</Hud>
                <p className="mt-1 font-display text-2xl font-extrabold uppercase">{entryFee ? inr(entryFee) : 'Free'}</p>
              </div>
              <div>
                <Hud>Format</Hud>
                <p className="mt-1 font-display text-2xl font-extrabold uppercase">{tourData?.format || 'Single Elimination'}</p>
              </div>
              <div>
                <Hud>Registered Teams</Hud>
                <p className="mt-1 font-display text-2xl font-extrabold uppercase text-cyan tabular-nums">
                  {registeredCount} / {maxTeams}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-wrap items-center gap-3">
            {isRegOpen ? (
              <Cta onClick={() => setRegModalOpen(true)}>
                {isRegistered ? 'Already Registered' : 'Register Now'}
              </Cta>
            ) : (
              <Cta disabled>
                {isRegistered
                  ? 'Registered'
                  : tourStatus === 'upcoming'
                  ? 'Registration soon'
                  : tourStatus === 'live'
                  ? 'In progress'
                  : registeredCount >= maxTeams
                  ? 'Slots full'
                  : 'Registration closed'}
              </Cta>
            )}
            <Cta ghost onClick={() => document.getElementById(anchor('Rules'))?.scrollIntoView({ behavior: 'smooth' })}>
              View Rules
            </Cta>
            {isRegOpen && (
              <Hud className="ml-2">
                {Math.max(0, maxTeams - registeredCount)} slots remaining
              </Hud>
            )}
          </div>
        </Container>
      </section>

      {/* Rules */}
      <Block id="Rules" idx="01" kicker="Rulebook" title="The Rules" tone="graphite">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {renderedRules.map((cat) => (
            <div key={cat.cat} className="border border-white/10 bg-void p-6 flex flex-col justify-between">
              <div>
                <Hud className="text-cyan">{cat.cat}</Hud>
                <ul className="mt-4 space-y-3 text-sm text-dim">
                  {cat.items.map(([rtitle, desc]) => (
                    <li key={rtitle}>
                      <strong className="text-ink block font-display text-base uppercase">{rtitle}</strong>
                      <span className="text-xs font-mono leading-relaxed">{desc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </Block>

      {/* Teams Field */}
      <Block
        id="Teams"
        idx="02"
        kicker="Registered Field"
        title="The Teams"
        aside={
          <p className="font-display text-5xl font-black tabular-nums">
            {registeredCount}
            <span className="text-dim">/{maxTeams}</span>
          </p>
        }
      >
        {registeredCount === 0 || rosterList.length === 0 ? (
          <Pending
            glyph="⬡"
            title="0 Teams Registered"
            body="Be the first squad on the board. Zero valid teams registered so far."
            cta={isRegOpen ? <Cta small onClick={() => setRegModalOpen(true)}>Register Squad</Cta> : undefined}
          />
        ) : (
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))' }}>
            {rosterList.map((roster, idx) => (
              <div key={roster.tag + idx} className="border border-white/10 bg-graphite p-4 flex items-center gap-4">
                <Crest name={roster.name} size={40} color={accent} />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-xl font-black uppercase truncate">{roster.name}</p>
                  <Hud>Captain · {roster.captain}</Hud>
                </div>
              </div>
            ))}
          </div>
        )}
      </Block>

      {/* Schedule */}
      <Block id="Schedule" idx="03" kicker="Timeline" title="Road to Final" tone="graphite">
        <ol className="grid gap-6 md:grid-cols-4">
          {stages.map((s, idx) => (
            <li key={s.name} className="border-t border-cyan/40 pt-4">
              <Hud className="text-cyan">0{idx + 1} · {s.name}</Hud>
              <p className="mt-2 font-display text-2xl font-black uppercase">{s.date}</p>
              {s.time && <Hud className="mt-1 block">{s.time}</Hud>}
            </li>
          ))}
        </ol>
      </Block>

      {/* Registration Modal */}
      {regModalOpen && (
        <RegistrationModal
          open={regModalOpen}
          onClose={() => setRegModalOpen(false)}
          tournament={tourData}
          accent={accent}
          onSuccess={() => {
            setIsRegistered(true)
            fetchTour()
          }}
        />
      )}
    </div>
  )
}

function RegistrationModal({
  open,
  onClose,
  tournament,
  accent,
  onSuccess,
}: {
  open: boolean
  onClose: () => void
  tournament: NormalizedTournament | null
  accent: string
  onSuccess: () => void
}) {
  const { profile } = useAuthContext()
  const [step, setStep] = useState<0 | 1 | 2>(0)
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<string>('')
  const [paymentMode, setPaymentMode] = useState<'WALLET' | 'UPI'>('WALLET')
  const [loading, setLoading] = useState(false)
  const [upiData, setUpiData] = useState<DirectUpiInitResponse | null>(null)
  const [utr, setUtr] = useState('')
  const [utrSubmitted, setUtrSubmitted] = useState(false)

  useEffect(() => {
    getMyTeams().then((res) => {
      setTeams(res)
      if (res.length > 0) {
        setSelectedTeamId(res[0].id || (res[0] as any)._id)
      }
    }).catch(() => {})
  }, [])

  if (!open || !tournament) return null

  const fee = tournament.entryFeeInr || 0
  const walletBalance = Number(profile?.inr_balance || 0)
  const hasEnoughWallet = walletBalance >= fee

  const handleWalletSubmit = async () => {
    setLoading(true)
    try {
      await registerTeamForTournament(tournament.id, {
        team_id: selectedTeamId || undefined,
      })
      setStep(2)
      onSuccess()
    } catch (err: any) {
      alert(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleInitUpi = async () => {
    if (!selectedTeamId) {
      alert('Please select a team first')
      return
    }
    setLoading(true)
    try {
      const resp = await registerTournamentDirectUpi(tournament.id, {
        team_id: selectedTeamId,
      })
      setUpiData(resp)
      setStep(1)
    } catch (err: any) {
      alert(err.message || 'Failed to initialize UPI payment')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitUtr = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!upiData || !utr.trim()) return
    setLoading(true)
    try {
      await submitTournamentUpiUtr(tournament.id, {
        payment_id: upiData.payment_id,
        utr: utr.trim(),
        sender_name: profile?.display_name || profile?.username,
      })
      setUtrSubmitted(true)
      setStep(2)
      onSuccess()
    } catch (err: any) {
      alert(err.message || 'Failed to submit UTR')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={step === 2 ? (utrSubmitted ? 'Registration Received' : 'Registration Confirmed') : 'Register for Tournament'}
      maxWidth="max-w-lg"
    >

        {step === 0 && (
          <div className="space-y-6">
            <div>
              <Hud className="text-cyan">Step 1 · Choose Your Squad</Hud>
              {teams.length === 0 ? (
                <div className="mt-3 border border-dashed border-white/15 p-6 text-center">
                  <p className="text-sm text-dim">You don't have any created teams yet.</p>
                  <Link to="/teams/create" className="mt-4 inline-block font-mono text-xs text-cyan uppercase hover:underline">
                    Create Team First →
                  </Link>
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  {teams.map((t) => (
                    <label
                      key={t.id || (t as any)._id}
                      className={`flex items-center justify-between p-3 border cursor-pointer transition-colors ${
                        selectedTeamId === (t.id || (t as any)._id)
                          ? 'border-cyan bg-cyan/5 text-ink'
                          : 'border-white/10 hover:border-white/30 text-dim'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="selectedTeam"
                          checked={selectedTeamId === (t.id || (t as any)._id)}
                          onChange={() => setSelectedTeamId(t.id || (t as any)._id)}
                          className="accent-cyan"
                        />
                        <span className="font-display text-lg font-black uppercase text-ink">{t.name}</span>
                      </div>
                      <span className="font-mono text-xs">{t.members?.length || 0} Members</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-white/10 pt-4">
              <Hud className="text-cyan">Step 2 · Payment Method</Hud>
              <div className="mt-3 flex justify-between items-center p-3 border border-white/10 bg-surface">
                <div>
                  <span className="font-mono text-xs text-dim block">Entry Fee</span>
                  <span className="font-display text-2xl font-black text-ink">{fee ? inr(fee) : 'FREE'}</span>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xs text-dim block">Wallet Balance</span>
                  <span className="font-display text-xl font-bold text-ok">{inr(walletBalance)}</span>
                </div>
              </div>

              {fee > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMode('WALLET')}
                    className={`p-3 border text-left font-mono text-xs uppercase ${
                      paymentMode === 'WALLET' ? 'border-cyan bg-cyan/10 text-cyan' : 'border-white/10 text-dim'
                    }`}
                  >
                    Wallet Balance
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode('UPI')}
                    className={`p-3 border text-left font-mono text-xs uppercase ${
                      paymentMode === 'UPI' ? 'border-cyan bg-cyan/10 text-cyan' : 'border-white/10 text-dim'
                    }`}
                  >
                    Direct UPI QR
                  </button>
                </div>
              )}
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
              <button onClick={onClose} className="px-4 py-2 border border-white/20 text-xs text-dim hover:text-ink">
                Cancel
              </button>
              {paymentMode === 'WALLET' || fee === 0 ? (
                <button
                  onClick={handleWalletSubmit}
                  disabled={loading || (fee > 0 && !hasEnoughWallet) || !selectedTeamId}
                  className="px-6 py-2 bg-ink text-void font-bold text-xs uppercase hover:bg-cyan transition-colors disabled:opacity-40"
                >
                  {loading ? 'Registering...' : fee === 0 ? 'Confirm Free Entry' : 'Pay & Register'}
                </button>
              ) : (
                <button
                  onClick={handleInitUpi}
                  disabled={loading || !selectedTeamId}
                  className="px-6 py-2 bg-cyan text-void font-bold text-xs uppercase hover:brightness-110 transition-colors disabled:opacity-40"
                >
                  {loading ? 'Generating QR...' : 'Proceed to UPI'}
                </button>
              )}
            </div>
          </div>
        )}

        {step === 1 && upiData && (
          <form onSubmit={handleSubmitUtr} className="space-y-6">
            <div className="text-center">
              <Hud className="text-cyan">Scan & Pay via any UPI App</Hud>
              <div className="mt-4 flex justify-center">
                <div className="p-3 bg-white rounded">
                  <QRCodeSVG value={upiData.qr_code_data} size={180} />
                </div>
              </div>
              <p className="mt-3 font-display text-2xl font-black text-ink">{inr(upiData.amount_inr)}</p>
              <p className="mt-1 font-mono text-xs text-dim select-all">UPI ID: {upiData.upi_id}</p>
            </div>

            <div>
              <Hud>Enter 12-Digit UTR / Transaction Ref</Hud>
              <input
                type="text"
                required
                placeholder="e.g. 428198841029"
                value={utr}
                onChange={(e) => setUtr(e.target.value)}
                className="mt-2 w-full border border-white/20 bg-surface px-4 py-3 font-mono text-sm tracking-wider text-cyan outline-none focus:border-cyan"
              />
              <p className="mt-1 text-[11px] text-dim">
                Found in your GPay / PhonePe / Paytm payment receipt under "UPI Ref No" or "UTR".
              </p>
            </div>

            <div className="pt-4 flex justify-between items-center border-t border-white/10">
              <button type="button" onClick={() => setStep(0)} className="text-xs text-dim hover:text-ink">
                ← Back
              </button>
              <button
                type="submit"
                disabled={loading || !utr.trim()}
                className="px-6 py-2 bg-ink text-void font-bold text-xs uppercase hover:bg-cyan transition-colors disabled:opacity-40"
              >
                {loading ? 'Submitting...' : 'Submit UTR'}
              </button>
            </div>
          </form>
        )}

        {step === 2 && (
          <div className="text-center py-6">
            <span className="inline-block size-16 rounded-full border border-ok/40 bg-ok/10 text-ok text-3xl leading-[60px]">
              ✓
            </span>
            <h3 className="mt-4 font-display text-3xl font-black uppercase text-ink">
              {utrSubmitted ? 'UTR Submitted For Verification' : 'Registration Confirmed!'}
            </h3>
            <p className="mt-2 text-sm text-dim max-w-sm mx-auto">
              {utrSubmitted
                ? 'Your payment record is queued for admin approval. Once confirmed, your squad will be verified on the bracket.'
                : 'Your squad is officially registered. Check your notifications for match lobby credentials.'}
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Cta small to="/my/registrations">View Registrations</Cta>
              <Cta small ghost onClick={onClose}>Done</Cta>
            </div>
          </div>
        )}
    </Modal>
  )
}
