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
  getRequiredTeamSizeDisplay,
  getTournamentRegistrationStatus,
  getTournamentCommunityLink,
  type TournamentRegistrationStatusResponse,
  type TournamentCommunityLinkResponse,
} from '../services/tournaments'
import { getGames, Game, normalizeGame, NormalizedGame } from '../services/games'
import { getMyTeams, Team } from '../services/teams'
import { uploadMediaFile } from '../services/admin'
import { useAuthContext } from '../context/AuthContext'
import { gameBy, img, inr, MATCHES, TOUR_EXTRA, teamNames, type Match, type Stage } from '../lib/data'
import { gsap, isMobile, reducedMotion } from '../lib/motion'

const NAV = ['Overview', 'Prizes', 'Rules', 'Teams', 'Bracket', 'Standings', 'Schedule'] as const
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
  const [regStatus, setRegStatus] = useState<TournamentRegistrationStatusResponse | null>(null)
  const [communityInfo, setCommunityInfo] = useState<TournamentCommunityLinkResponse | null>(null)
  const [loadingStatus, setLoadingStatus] = useState(false)

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

  const fetchStatus = async (slugOrId: string) => {
    if (!isSignedIn) {
      setRegStatus(null)
      setCommunityInfo(null)
      return
    }
    setLoadingStatus(true)
    try {
      const statusRes = await getTournamentRegistrationStatus(slugOrId)
      setRegStatus(statusRes)
      if (statusRes.is_registered) {
        setIsRegistered(true)
        const pStatus = statusRes.registration?.payment_status || statusRes.payment_status
        if (pStatus === 'PAID' || pStatus === 'FREE') {
          try {
            const comm = await getTournamentCommunityLink(slugOrId)
            setCommunityInfo(comm)
          } catch {
            // Unconfirmed or unauthorized
          }
        }
      }
    } catch {
      // Ignore
    } finally {
      setLoadingStatus(false)
    }
  }

  useEffect(() => {
    fetchTour()
    fetchStatus(id)
  }, [id, isSignedIn])

  const paymentStatus = regStatus?.registration?.payment_status || regStatus?.payment_status
  const isConfirmedParticipant = Boolean(regStatus?.is_registered && (paymentStatus === 'PAID' || paymentStatus === 'FREE'))
  const isPendingParticipant = Boolean(regStatus?.is_registered && ['PENDING', 'PENDING_VERIFICATION'].includes(paymentStatus || ''))
  const isRejectedParticipant = Boolean(regStatus?.is_registered && paymentStatus === 'REJECTED')

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

  // Authoritative check: Registration is closed when capacity is reached, deadline passes, or admin closed it
  const isRegistrationClosed = useMemo(() => {
    if (!tourData) return false
    const status = (tourData.status || '').toLowerCase()
    if (['registration_closed', 'closed', 'ongoing', 'live', 'completed'].includes(status)) {
      return true
    }
    if (tourData.availableSlots !== undefined && tourData.availableSlots <= 0) {
      return true
    }
    if (tourData.registrationDeadline) {
      try {
        const deadline = new Date(tourData.registrationDeadline)
        if (!isNaN(deadline.getTime()) && Date.now() >= deadline.getTime()) {
          return true
        }
      } catch {}
    }
    return !isRegOpen
  }, [tourData, isRegOpen])

  useEffect(() => {
    if (isConfirmedParticipant && isRegistrationClosed && !communityInfo && id) {
      getTournamentCommunityLink(id).then(setCommunityInfo).catch(() => {})
    }
  }, [isConfirmedParticipant, isRegistrationClosed, communityInfo, id])

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

  const mediaCfg = (tourData as any)?.mediaConfig || (tourData as any)?.media_config
  const heroCfg = mediaCfg?.hero

  const heroFocalPoint =
    heroCfg && typeof heroCfg.focal_x === 'number' && typeof heroCfg.focal_y === 'number'
      ? { x: heroCfg.focal_x, y: heroCfg.focal_y }
      : undefined

  return (
    <div className="bg-void text-ink pb-36" style={{ ['--acc' as string]: accent }}>
      {/* Hero */}
      <section id={anchor('Overview')} className="relative isolate flex min-h-[520px] md:min-h-[600px] max-h-[820px] items-end overflow-hidden bg-void">
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 70% 20%, ${accent}30, transparent 60%)` }} />
        <div className="absolute inset-0">
          <DynamicImage
            src={resolveMediaUrl(
              heroCfg?.asset_url ||
              tourData?.heroBannerUrl ||
              tourData?.hero_banner_url ||
              tourData?.bannerTabletUrl ||
              tourData?.bannerUrl ||
              tourData?.bannerMobileUrl ||
              ''
            )}
            alt={`${title} banner`}
            eager
            mode={heroCfg?.fit_mode || "cover"}
            focalPoint={heroFocalPoint}
            zoom={heroCfg?.zoom}
            className="size-full opacity-65 object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-void via-void/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-void via-transparent to-void/30" />
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
            {isConfirmedParticipant ? (
              <span className="inline-flex items-center gap-1.5 border border-ok/40 bg-ok/10 px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.22em] text-ok">
                <span className="size-1.5 rounded-full bg-ok animate-pulse" />
                Confirmed Entry · #{regStatus?.position ?? 1}
              </span>
            ) : isPendingParticipant ? (
              <span className="inline-flex items-center gap-1.5 border border-warn/40 bg-warn/10 px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.22em] text-warn">
                <span className="size-1.5 rounded-full bg-warn" />
                Seat Reserved · Pending Verification
              </span>
            ) : isRejectedParticipant ? (
              <span className="inline-flex items-center gap-1.5 border border-live/40 bg-live/10 px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.22em] text-live">
                <span className="size-1.5 rounded-full bg-live" />
                Payment Rejected · Re-registration Required
              </span>
            ) : isRegistered ? (
              <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-ok">✓ You're registered</span>
            ) : null}
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
                <Hud>Team Size</Hud>
                <p className="mt-1 font-display text-2xl font-extrabold uppercase text-ink">
                  {getRequiredTeamSizeDisplay(tourData)}
                </p>
              </div>
              <div>
                <Hud>Confirmed Teams</Hud>
                <p className="mt-1 font-display text-2xl font-extrabold uppercase text-cyan tabular-nums">
                  {tourData?.confirmedTeams !== undefined ? tourData.confirmedTeams : registeredCount} / {maxTeams}
                </p>
              </div>
              <div>
                <Hud>Available Slots</Hud>
                <p className="mt-1 font-display text-2xl font-extrabold uppercase text-ok tabular-nums">
                  {tourData?.availableSlots !== undefined ? tourData.availableSlots : Math.max(0, maxTeams - registeredCount)}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-wrap items-center gap-3">
            {isConfirmedParticipant ? (
              <Cta onClick={() => document.getElementById('participant-hub')?.scrollIntoView({ behavior: 'smooth' })}>
                View Participant Hub
              </Cta>
            ) : isPendingParticipant ? (
              <Cta onClick={() => document.getElementById('participant-hub')?.scrollIntoView({ behavior: 'smooth' })}>
                View Reserved Seat
              </Cta>
            ) : isRejectedParticipant ? (
              <Cta onClick={() => setRegModalOpen(true)}>
                Re-Register With Valid Proof
              </Cta>
            ) : isRegOpen ? (
              <Cta onClick={() => setRegModalOpen(true)}>
                Register Now
              </Cta>
            ) : (
              <Cta disabled>
                {tourStatus === 'upcoming'
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
            {isRegOpen && !isConfirmedParticipant && !isPendingParticipant && !isRejectedParticipant && (
              <Hud className="ml-2">
                {tourData?.availableSlots !== undefined ? tourData.availableSlots : Math.max(0, maxTeams - registeredCount)} slots remaining
              </Hud>
            )}
          </div>
        </Container>
      </section>

      {/* Sticky Subnav */}
      <div className="sticky top-16 z-30 border-y border-white/10 bg-void/90 backdrop-blur-md">
        <Container>
          <div className="flex items-center gap-2 overflow-x-auto py-3 no-scrollbar text-xs font-mono uppercase tracking-wider">
            {NAV.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => {
                  const target = document.getElementById(anchor(n))
                  if (target) {
                    target.scrollIntoView({ behavior: 'smooth' })
                  }
                }}
                className="px-3.5 py-1.5 text-dim hover:text-cyan hover:bg-white/5 transition-colors whitespace-nowrap cursor-pointer rounded-sm"
              >
                {n}
              </button>
            ))}
          </div>
        </Container>
      </div>

      {/* Confirmed Participant Hub */}
      {isConfirmedParticipant && (
        <section id="participant-hub" className="scroll-mt-24 border-b border-white/10 bg-graphite/40 py-16">
          <Container>
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <span className="size-2.5 rounded-full bg-ok animate-pulse" />
                  <Hud className="text-ok">Confirmed Competitor Hub</Hud>
                </div>
                <h2 className="mt-2 font-display text-4xl font-black uppercase text-ink md:text-5xl">
                  Participant Headquarters
                </h2>
                <p className="mt-1 font-mono text-xs uppercase tracking-wider text-dim">
                  Your entry is officially confirmed. Review your roster, tournament schedule, and join the official communication channel.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="border border-ok/30 bg-ok/10 px-4 py-2 font-display text-lg font-bold text-ok uppercase">
                  Confirmed #{regStatus?.position ?? 1}
                </span>
              </div>
            </div>

            {/* Official Announcement Banner if exists */}
            {tourData?.announcementText && (
              <div className="mb-8 border border-cyan/40 bg-cyan/10 p-5 md:p-6">
                <div className="flex items-start gap-4">
                  <span className="text-2xl text-cyan">📢</span>
                  <div>
                    <Hud className="text-cyan">Official Tournament Announcement</Hud>
                    <p className="mt-1 font-mono text-sm leading-relaxed text-ink/90">
                      {tourData.announcementText}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Official WhatsApp Group Card — Visible Only After Registration Closes */}
            {isRegistrationClosed ? (
              <div className="mb-8 border-2 border-emerald-500/50 bg-emerald-950/30 p-6 md:p-8">
                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="grid size-12 shrink-0 place-items-center rounded bg-emerald-500 font-display text-xl font-black text-void">
                      WA
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="font-display text-2xl font-black uppercase text-ink">
                          Official Tournament WhatsApp Group
                        </h3>
                        <span className="border border-emerald-500/50 bg-emerald-500/20 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-emerald-400">
                          Registration Closed • Channel Unlocked
                        </span>
                      </div>
                      <p className="mt-1 max-w-2xl text-sm leading-relaxed text-dim">
                        {communityInfo?.instructions ||
                          'Custom Lobby Room ID, Password, Bracket calls, Coin toss, and real-time referee communications are coordinated exclusively in this channel.'}
                      </p>
                      <p className="mt-2 font-mono text-xs text-emerald-400/90">
                        Registration is officially closed. All squad captains and players must join the WhatsApp channel now for match coordination.
                      </p>
                    </div>
                  </div>
                  {communityInfo?.whatsapp_group_url || communityInfo?.community_link ? (
                    <a
                      href={communityInfo.whatsapp_group_url || communityInfo.community_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex shrink-0 items-center justify-center gap-3 bg-emerald-500 px-8 py-3.5 font-display text-base font-black uppercase tracking-wider text-void shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-400 active:scale-95 cursor-pointer"
                    >
                      <span>Join WhatsApp Group</span>
                      <span>→</span>
                    </a>
                  ) : (
                    <div className="border border-white/10 bg-void/50 px-4 py-2 font-mono text-xs text-dim">
                      Connecting to group channel...
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="mb-8 border border-amber-500/40 bg-amber-950/20 p-6 md:p-8">
                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="grid size-12 shrink-0 place-items-center rounded bg-amber-500/20 border border-amber-500/40 font-display text-xl font-black text-amber-400">
                      🔒
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="font-display text-2xl font-black uppercase text-ink">
                          Official Tournament WhatsApp Group
                        </h3>
                        <span className="border border-amber-500/50 bg-amber-500/20 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-amber-400">
                          Locked While Registration Is Open
                        </span>
                      </div>
                      <p className="mt-1 max-w-2xl text-sm leading-relaxed text-dim">
                        Tournament registration is currently open. To preserve bracket integrity and prevent premature room access, the official WhatsApp group link will unlock automatically for confirmed participants once registration officially closes.
                      </p>
                      <p className="mt-2 font-mono text-xs text-amber-400/90">
                        {tourData?.registrationDeadline
                          ? `Scheduled Registration Close: ${new Date(tourData.registrationDeadline).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST (or when slots fill).`
                          : 'Unlocks automatically when all tournament slots fill or registration is marked closed.'}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col items-center sm:items-end gap-1.5">
                    <button
                      type="button"
                      disabled
                      className="inline-flex cursor-not-allowed items-center justify-center gap-2 border border-amber-500/40 bg-amber-500/10 px-6 py-3 font-mono text-xs uppercase tracking-wider text-amber-400/80 select-none"
                    >
                      <span>🔒 Locked Until Registration Closes</span>
                    </button>
                    <span className="font-mono text-[10px] text-dim">
                      {tourData?.availableSlots !== undefined && tourData.availableSlots > 0
                        ? `${tourData.availableSlots} slot${tourData.availableSlots === 1 ? '' : 's'} remaining open`
                        : 'Registration in progress'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Match Lobby Credentials (Gated for Confirmed Participants) */}
            <div className="mb-8 border border-cyan/30 bg-surface p-6 md:p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="size-2 rounded-full bg-cyan animate-pulse" />
                  <Hud className="text-cyan">Match Lobby Credentials</Hud>
                </div>
                <span className="font-mono text-[10px] uppercase text-cyan border border-cyan/40 bg-cyan/10 px-2 py-0.5">
                  Exclusive Participant Access
                </span>
              </div>
              
              {((tourData as any)?.customRoomId || (tourData as any)?.custom_room_id || (communityInfo as any)?.room_id) ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                  <div className="border border-white/10 bg-void/60 p-4">
                    <span className="font-mono text-[10px] text-dim uppercase">Room ID</span>
                    <p className="mt-1 font-mono text-lg font-bold text-cyan select-all">
                      {(tourData as any)?.customRoomId || (tourData as any)?.custom_room_id || (communityInfo as any)?.room_id}
                    </p>
                  </div>
                  <div className="border border-white/10 bg-void/60 p-4">
                    <span className="font-mono text-[10px] text-dim uppercase">Room Password</span>
                    <p className="mt-1 font-mono text-lg font-bold text-cyan select-all">
                      {(tourData as any)?.customRoomPassword || (tourData as any)?.custom_room_password || (communityInfo as any)?.room_password || 'Shared in WhatsApp'}
                    </p>
                  </div>
                  <div className="border border-white/10 bg-void/60 p-4">
                    <span className="font-mono text-[10px] text-dim uppercase">Server / Region</span>
                    <p className="mt-1 font-display text-lg font-bold uppercase text-ink">
                      {tourData?.serverRegion || 'South Asia'}
                    </p>
                  </div>
                  <div className="border border-white/10 bg-void/60 p-4">
                    <span className="font-mono text-[10px] text-dim uppercase">Reporting Time</span>
                    <p className="mt-1 font-display text-lg font-bold uppercase text-ok">
                      15 Min Before Start
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-4 border border-dashed border-white/15 bg-void/40 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <p className="font-display text-lg font-bold uppercase text-ink">
                      Credentials Scheduled for Match Day
                    </p>
                    <p className="mt-1 text-xs text-dim">
                      Custom Room ID and Password will appear here and in the official WhatsApp group exactly 15 minutes before the match start time.
                    </p>
                  </div>
                  <span className="border border-white/20 bg-white/5 px-3 py-1 font-mono text-[11px] text-dim uppercase whitespace-nowrap">
                    Lobby Ready 15m Prior
                  </span>
                </div>
              )}
            </div>

            {/* 3 Core Cards Grid */}
            <div className="grid gap-6 md:grid-cols-3">
              {/* Card A: Registration Status */}
              <div className="flex flex-col justify-between border border-white/10 bg-surface p-6">
                <div>
                  <div className="flex items-center justify-between">
                    <Hud className="text-cyan">Registration Record</Hud>
                    <span className="font-mono text-[10px] uppercase text-ok">Verified</span>
                  </div>
                  <h4 className="mt-2 font-display text-2xl font-black uppercase text-ink truncate">
                    {regStatus?.team?.name || 'Registered Entry'}
                  </h4>
                  <dl className="mt-4 space-y-3 font-mono text-xs">
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <dt className="text-dim">Position in Field</dt>
                      <dd className="font-bold text-ink">#{regStatus?.position ?? 1} / {maxTeams}</dd>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <dt className="text-dim">Entry Fee Paid</dt>
                      <dd className="font-bold text-ok">{entryFee ? inr(entryFee) : 'FREE'}</dd>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <dt className="text-dim">Payment Status</dt>
                      <dd className="font-bold uppercase text-ok">{paymentStatus}</dd>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <dt className="text-dim">Registered At</dt>
                      <dd className="text-ink">
                        {regStatus?.registration?.registered_at
                          ? new Date(regStatus.registration.registered_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Confirmed'}
                      </dd>
                    </div>
                    <div className="flex justify-between pt-1">
                      <dt className="text-dim">Registration ID</dt>
                      <dd className="text-[10px] text-dim truncate max-w-[140px]">
                        {regStatus?.registration?.id || 'VERIFIED'}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Card B: My Team & Roster */}
              <div className="flex flex-col justify-between border border-white/10 bg-surface p-6">
                <div>
                  <div className="flex items-center justify-between">
                    <Hud className="text-cyan">Squad & Roster</Hud>
                    <span className="border border-cyan/40 bg-cyan/10 px-2 py-0.5 font-mono text-[10px] uppercase text-cyan">
                      {regStatus?.team?.my_role === 'CAPTAIN' ? '⭐ Squad Captain' : '🛡️ Roster Player'}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <Crest name={regStatus?.team?.name || 'Squad'} size={38} color={accent} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-xl font-black uppercase text-ink">
                        {regStatus?.team?.name || 'Registered Squad'}
                      </p>
                      <p className="font-mono text-xs text-dim truncate">
                        Tag: [{regStatus?.team?.tag || 'SQUAD'}] · Captain: {regStatus?.team?.captain_name || regStatus?.team?.captain_handle || 'Leader'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-white/10 pt-3">
                    <p className="font-mono text-[11px] uppercase tracking-wider text-dim">Roster Members</p>
                    <div className="mt-2 max-h-48 space-y-2 overflow-y-auto pr-1">
                      {(regStatus?.team?.roster || regStatus?.team?.members || []).map((m, idx) => (
                        <div key={m.user_id || idx} className="flex items-center justify-between rounded bg-void/50 p-2 text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <Avatar id={m.equipped_avatar_url || m.avatar_url || m.username || 'PL'} size={24} />
                            <div className="min-w-0">
                              <p className="font-bold text-ink truncate max-w-[110px]">{m.display_name || m.username}</p>
                              <span className="text-[10px] font-mono text-dim block truncate">@{m.username}</span>
                            </div>
                          </div>
                          <span className={`font-mono text-[10px] uppercase px-1.5 py-0.5 shrink-0 ${
                            m.user_id === regStatus?.team?.captain_id || m.role === 'CAPTAIN'
                              ? 'border border-cyan/30 text-cyan bg-cyan/10'
                              : 'text-dim'
                          }`}>
                            {m.user_id === regStatus?.team?.captain_id || m.role === 'CAPTAIN' ? 'Captain' : 'Player'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card C: Participation Statistics */}
              <div className="flex flex-col justify-between border border-white/10 bg-surface p-6">
                <div>
                  <div className="flex items-center justify-between">
                    <Hud className="text-cyan">Field & Capacity</Hud>
                    <span className="font-mono text-[10px] uppercase text-cyan">Live Stats</span>
                  </div>
                  <h4 className="mt-2 font-display text-2xl font-black uppercase text-ink">
                    Tournament Capacity
                  </h4>
                  <dl className="mt-4 space-y-3 font-mono text-xs">
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <dt className="text-dim">Confirmed Squads</dt>
                      <dd className="font-bold text-cyan">{tourData?.confirmedTeams || registeredCount}</dd>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <dt className="text-dim">Reserved / Pending</dt>
                      <dd className="font-bold text-warn">{tourData?.reservedTeams || 0}</dd>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <dt className="text-dim">Available Remaining</dt>
                      <dd className="font-bold text-ok">
                        {tourData?.availableSlots !== undefined ? tourData.availableSlots : Math.max(0, maxTeams - registeredCount)}
                      </dd>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <dt className="text-dim">Total Field Size</dt>
                      <dd className="font-bold text-ink">{maxTeams} Teams</dd>
                    </div>
                  </dl>

                  {/* Visual Capacity Bar */}
                  <div className="mt-4 pt-2">
                    <div className="flex justify-between font-mono text-[10px] text-dim mb-1">
                      <span>Field Fill Rate</span>
                      <span>{Math.round(((tourData?.confirmedTeams || registeredCount) / maxTeams) * 100)}%</span>
                    </div>
                    <div className="h-2 w-full bg-void overflow-hidden flex">
                      <div
                        className="bg-cyan transition-all"
                        style={{ width: `${Math.min(100, (((tourData?.confirmedTeams || registeredCount) / maxTeams) * 100))}%` }}
                      />
                      <div
                        className="bg-warn/60 transition-all"
                        style={{ width: `${Math.min(100, (((tourData?.reservedTeams || 0) / maxTeams) * 100))}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card D: Schedule & Custom Lobby Instructions */}
            <div className="mt-8 border border-white/10 bg-surface p-6 md:p-8">
              <div className="flex items-center gap-3">
                <Hud className="text-cyan">Match Day Protocol</Hud>
                <span className="h-px flex-1 bg-white/10" />
              </div>
              <h3 className="mt-3 font-display text-2xl font-black uppercase text-ink">
                Lobby Credentials & Match Instructions
              </h3>
              <div className="mt-6 grid gap-6 md:grid-cols-3">
                <div className="border border-white/5 bg-void/50 p-4">
                  <p className="font-mono text-xs uppercase tracking-wider text-cyan">01 · Match Start</p>
                  <p className="mt-2 font-display text-xl font-bold uppercase text-ink">
                    {tourData?.startsAt
                      ? new Date(tourData.startsAt).toLocaleString('en-IN', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Check Stage Schedule'}
                  </p>
                  <p className="mt-1 text-xs text-dim">Official match commencement time.</p>
                </div>
                <div className="border border-white/5 bg-void/50 p-4">
                  <p className="font-mono text-xs uppercase tracking-wider text-cyan">02 · Roster Lock</p>
                  <p className="mt-2 font-display text-xl font-bold uppercase text-ink">
                    {tourData?.rosterLockTime
                      ? new Date(tourData.rosterLockTime).toLocaleString('en-IN', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '2 Hours Before Match'}
                  </p>
                  <p className="mt-1 text-xs text-dim">No roster modifications allowed after this point.</p>
                </div>
                <div className="border border-white/5 bg-void/50 p-4">
                  <p className="font-mono text-xs uppercase tracking-wider text-cyan">03 · Server & Region</p>
                  <p className="mt-2 font-display text-xl font-bold uppercase text-ink">
                    {tourData?.serverRegion || 'India / South Asia'}
                  </p>
                  <p className="mt-1 text-xs text-dim">Authoritative match server region.</p>
                </div>
              </div>

              <div className="mt-6 border-t border-white/10 pt-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <p className="text-xs text-dim max-w-2xl leading-relaxed">
                  <strong className="text-ink">Lobby Delivery:</strong> Custom Room ID and Password will be posted 15 minutes before match start in the Official WhatsApp Group and sent via platform notification. Teams that fail to enter within 10 minutes of scheduled start will receive a forfeit loss.
                </p>
                <Cta small ghost onClick={() => document.getElementById(anchor('Rules'))?.scrollIntoView({ behavior: 'smooth' })}>
                  Review Full Rulebook ↓
                </Cta>
              </div>
            </div>
          </Container>
        </section>
      )}

      {/* Pending Reservation Notice */}
      {isPendingParticipant && (
        <section id="participant-hub" className="scroll-mt-24 border-b border-warn/30 bg-warn/5 py-12">
          <Container>
            <div className="border-2 border-warn/40 bg-surface p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-warn animate-ping" />
                    <Hud className="text-warn">Seat Reserved — Verification Pending</Hud>
                  </div>
                  <h3 className="mt-2 font-display text-3xl font-black uppercase text-ink">
                    Squad Seat Is Held
                  </h3>
                  <p className="mt-2 text-sm text-dim max-w-2xl leading-relaxed">
                    Your registration has been received and your seat in this tournament is reserved. Our admin team is verifying your payment record (UTR: <strong className="text-cyan font-mono">{regStatus?.registration?.utr || 'Under Review'}</strong>).
                  </p>
                  <div className="mt-4 flex flex-wrap gap-4 text-xs font-mono text-dim">
                    <span>Squad: <strong className="text-ink">{regStatus?.team?.name || 'Your Team'}</strong></span>
                    <span>•</span>
                    <span>Concurrency Status: <strong className="text-ok">Slot Protected</strong></span>
                    <span>•</span>
                    <span>Fee: <strong className="text-ink">{entryFee ? inr(entryFee) : 'FREE'}</strong></span>
                    {regStatus?.position && (
                      <>
                        <span>•</span>
                        <span>Reserved Position: <strong className="text-cyan font-bold">#{regStatus.position}</strong></span>
                      </>
                    )}
                  </div>
                </div>

                {regStatus?.registration?.screenshot_url && (
                  <div className="shrink-0 border border-white/10 bg-void/50 p-3 text-center">
                    <p className="font-mono text-[10px] uppercase text-dim mb-1.5">Submitted Proof</p>
                    <a
                      href={resolveMediaUrl(regStatus.registration.screenshot_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block overflow-hidden border border-white/20 hover:border-cyan transition-colors"
                    >
                      <img
                        src={resolveMediaUrl(regStatus.registration.screenshot_url)}
                        alt="Submitted Payment Proof"
                        className="size-24 object-contain bg-black/40"
                      />
                    </a>
                  </div>
                )}

                <div className="border border-warn/30 bg-warn/10 p-4 text-center shrink-0">
                  <p className="font-mono text-xs uppercase text-warn font-bold">Awaiting Admin Approval</p>
                  <p className="mt-1 text-[11px] text-dim max-w-[200px]">
                    Once approved, WhatsApp channel access and room credentials unlock automatically.
                  </p>
                </div>
              </div>
            </div>
          </Container>
        </section>
      )}

      {/* Rejected Registration Notice */}
      {isRejectedParticipant && (
        <section id="participant-hub" className="scroll-mt-24 border-b border-live/30 bg-live/5 py-12">
          <Container>
            <div className="border-2 border-live/40 bg-surface p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-live" />
                    <Hud className="text-live">Registration Payment Rejected</Hud>
                  </div>
                  <h3 className="mt-2 font-display text-3xl font-black uppercase text-ink">
                    Payment Verification Failed
                  </h3>
                  <p className="mt-2 text-sm text-dim max-w-2xl leading-relaxed">
                    Your previous payment record could not be verified by tournament admins.
                    {regStatus?.rejection_reason && (
                      <span className="block mt-2 font-mono text-xs text-live bg-live/10 border border-live/30 p-2.5">
                        Admin Note: {regStatus.rejection_reason}
                      </span>
                    )}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-4 text-xs font-mono text-dim">
                    <span>Squad: <strong className="text-ink">{regStatus?.team?.name || 'Your Team'}</strong></span>
                    <span>•</span>
                    <span>Previous UTR: <strong className="text-cyan font-mono">{regStatus?.registration?.utr || 'N/A'}</strong></span>
                    <span>•</span>
                    <span>Status: <strong className="text-live uppercase font-bold">REJECTED</strong></span>
                  </div>
                </div>
                <div className="shrink-0 flex flex-col sm:flex-row gap-3">
                  <Cta small onClick={() => setRegModalOpen(true)}>
                    Re-Register With Valid Proof
                  </Cta>
                  <Link
                    to="/support"
                    className="inline-flex items-center justify-center border border-white/20 bg-void/50 px-4 py-2 font-mono text-xs text-dim hover:text-ink hover:border-white/40 transition-colors"
                  >
                    Contact Support
                  </Link>
                </div>
              </div>
            </div>
          </Container>
        </section>
      )}

      {/* Prize Pool Breakdown */}
      <Block
        id="Prizes"
        idx="01"
        kicker="Prize Distribution"
        title="Prizes & Rewards"
        aside={
          <div className="text-right">
            <Hud>Total Guaranteed Purse</Hud>
            <p className="font-display text-4xl md:text-5xl font-black text-cyan tabular-nums">
              {inr(prizePool)}
            </p>
          </div>
        }
      >
        <div className="grid gap-6 md:grid-cols-3">
          {/* 1st Place */}
          <div className="relative overflow-hidden border border-amber-400/40 bg-gradient-to-b from-amber-400/10 via-surface to-surface p-6">
            <div className="flex items-center justify-between">
              <span className="border border-amber-400/50 bg-amber-400/20 px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider text-amber-300">
                1st Place · Champion
              </span>
              <span className="font-display text-2xl">🏆</span>
            </div>
            <p className="mt-6 font-display text-4xl md:text-5xl font-black text-ink tabular-nums">
              {inr(Math.round(prizePool * 0.5))}
            </p>
            <p className="mt-2 font-mono text-xs text-dim">
              50% of total prize pool + Verified Champion Badge & Platform Trophy
            </p>
          </div>

          {/* 2nd Place */}
          <div className="relative overflow-hidden border border-slate-300/40 bg-gradient-to-b from-slate-300/10 via-surface to-surface p-6">
            <div className="flex items-center justify-between">
              <span className="border border-slate-300/50 bg-slate-300/20 px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider text-slate-200">
                2nd Place · Runner Up
              </span>
              <span className="font-display text-2xl">🥈</span>
            </div>
            <p className="mt-6 font-display text-4xl md:text-5xl font-black text-ink tabular-nums">
              {inr(Math.round(prizePool * 0.3))}
            </p>
            <p className="mt-2 font-mono text-xs text-dim">
              30% of total prize pool + Runner-up Podium recognition
            </p>
          </div>

          {/* 3rd Place */}
          <div className="relative overflow-hidden border border-amber-700/40 bg-gradient-to-b from-amber-700/10 via-surface to-surface p-6">
            <div className="flex items-center justify-between">
              <span className="border border-amber-700/50 bg-amber-700/20 px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider text-amber-500">
                3rd Place · 2nd Runner Up
              </span>
              <span className="font-display text-2xl">🥉</span>
            </div>
            <p className="mt-6 font-display text-4xl md:text-5xl font-black text-ink tabular-nums">
              {inr(Math.round(prizePool * 0.2))}
            </p>
            <p className="mt-2 font-mono text-xs text-dim">
              20% of total prize pool + Semifinalist Podium recognition
            </p>
          </div>
        </div>

        <div className="mt-6 border border-white/10 bg-void/50 p-4 font-mono text-xs text-dim flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p>
            Prize settlements are audited and disbursed directly to the winning captain's UPI VPA within 24 hours of tournament conclusion.
          </p>
          <span className="text-ok font-bold uppercase shrink-0">100% Guaranteed Payout</span>
        </div>
      </Block>

      {/* Rules */}
      <Block id="Rules" idx="02" kicker="Rulebook" title="The Rules" tone="graphite">
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
        idx="03"
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

      {/* Bracket & Pairings */}
      <Block id="Bracket" idx="04" kicker="Bracket & Pairings" title="The Bracket" tone="graphite">
        {matchesData.length > 0 ? (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {matchesData.map((m, idx) => (
                <div key={m.id || idx} className="border border-white/10 bg-void p-5 space-y-3">
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="text-cyan font-bold">{m.round_name || `Match 0${idx + 1}`}</span>
                    <span className="text-dim uppercase">{m.format || 'BO1'}</span>
                  </div>
                  <div className="space-y-2 border-y border-white/10 py-3 font-display">
                    <div className="flex items-center justify-between">
                      <span className="font-black uppercase text-ink">{m.team_a_name || 'Team 1'}</span>
                      <span className="text-sm font-bold text-cyan">{m.team_a_score ?? '-'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-black uppercase text-ink">{m.team_b_name || 'Team 2'}</span>
                      <span className="text-sm font-bold text-cyan">{m.team_b_score ?? '-'}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-dim">
                    <span>{m.scheduled_time || 'TBD'}</span>
                    <span className={`uppercase font-bold ${m.status === 'COMPLETED' ? 'text-ok' : m.status === 'LIVE' ? 'text-live' : 'text-dim'}`}>
                      {m.status || 'SCHEDULED'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="border border-dashed border-white/15 bg-void p-8 md:p-12 text-center">
            <div className="mx-auto max-w-xl space-y-4">
              <span className="grid size-14 mx-auto place-items-center border border-cyan/40 bg-cyan/10 font-display text-2xl text-cyan">
                ⚔️
              </span>
              <h3 className="font-display text-3xl font-black uppercase text-ink">
                Automated Bracket Seeding
              </h3>
              <p className="text-sm text-dim leading-relaxed">
                Bracket trees and custom match pairings generate automatically upon tournament registration close. Competing squads will be seeded into single-elimination brackets based on authoritative player ratings and registration order.
              </p>
              <div className="pt-2 flex flex-wrap justify-center gap-3 font-mono text-xs text-dim">
                <span className="border border-white/10 bg-white/5 px-3 py-1">Format: {tourData?.format || 'Single Elimination'}</span>
                <span className="border border-white/10 bg-white/5 px-3 py-1">Series: BO1 Qualifiers · BO3 Finals</span>
                <span className="border border-white/10 bg-white/5 px-3 py-1">Slots: {maxTeams} Squads</span>
              </div>
            </div>
          </div>
        )}
      </Block>

      {/* Standings & Results */}
      <Block id="Standings" idx="05" kicker="Leaderboard" title="Standings">
        {tourStatus === 'completed' && tourData?.standings && tourData.standings.length > 0 ? (
          <div className="border border-white/10 bg-surface overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="border-b border-white/10 bg-void/50 uppercase text-dim">
                <tr>
                  <th className="p-4">Rank</th>
                  <th className="p-4">Team</th>
                  <th className="p-4">Matches</th>
                  <th className="p-4">Wins</th>
                  <th className="p-4">Eliminations</th>
                  <th className="p-4 text-right">Prize Awarded</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {tourData.standings.map((st: any, idx: number) => (
                  <tr key={st.team_id || idx} className="hover:bg-white/5">
                    <td className="p-4 font-bold text-cyan">#{idx + 1}</td>
                    <td className="p-4 font-display font-black uppercase text-ink">{st.team_name}</td>
                    <td className="p-4 text-dim">{st.played ?? '-'}</td>
                    <td className="p-4 text-ok font-bold">{st.won ?? '-'}</td>
                    <td className="p-4 text-ink font-bold">{st.eliminations ?? '-'}</td>
                    <td className="p-4 text-right font-bold text-ok">{st.prize ? inr(st.prize) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="border border-dashed border-white/15 bg-graphite/40 p-8 md:p-12 text-center">
            <div className="mx-auto max-w-xl space-y-4">
              <span className="grid size-14 mx-auto place-items-center border border-white/20 bg-white/5 font-display text-2xl text-dim">
                📊
              </span>
              <h3 className="font-display text-3xl font-black uppercase text-ink">
                Standings Awaiting Match Results
              </h3>
              <p className="text-sm text-dim leading-relaxed">
                Leaderboards, elimination tallies, and prize awards will update live as match scores are reported and verified by the referee team on match day.
              </p>
              <div className="pt-2 font-mono text-xs text-cyan">
                {registeredCount} of {maxTeams} squads confirmed on the board
              </div>
            </div>
          </div>
        )}
      </Block>

      {/* Schedule */}
      <Block id="Schedule" idx="06" kicker="Timeline" title="Road to Final" tone="graphite">
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
            fetchStatus(id)
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
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null)
  const [screenshotUrl, setScreenshotUrl] = useState<string>('')
  const [screenshotUploading, setScreenshotUploading] = useState(false)
  const [screenshotError, setScreenshotError] = useState<string>('')
  const [copiedUpi, setCopiedUpi] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const copyUpiId = () => {
    if (upiData?.upi_id) {
      navigator.clipboard.writeText(upiData.upi_id)
      setCopiedUpi(true)
      setTimeout(() => setCopiedUpi(false), 2000)
    }
  }

  const handleScreenshotChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setScreenshotFile(file)
    setScreenshotError('')
    setScreenshotUploading(true)
    try {
      const resp = await uploadMediaFile(file)
      const url = resp?.url
      if (url) {
        setScreenshotUrl(url)
      } else {
        throw new Error('No media URL returned from server')
      }
    } catch (err: any) {
      setScreenshotError(err.message || 'Failed to upload screenshot proof')
    } finally {
      setScreenshotUploading(false)
    }
  }

  const isSolo =
    (tournament?.format || '').toLowerCase().includes('solo') ||
    ((tournament as any)?.minTeamSize === 1 && (tournament as any)?.maxTeamSize === 1) ||
    ((tournament as any)?.min_team_size === 1 && (tournament as any)?.max_team_size === 1)

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
    if (!isSolo && !selectedTeamId) {
      alert('Please select a team first')
      return
    }
    setLoading(true)
    try {
      const resp = await registerTournamentDirectUpi(tournament.id, {
        team_id: selectedTeamId || undefined,
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
        screenshot_url: screenshotUrl || undefined,
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
              <Hud className="text-cyan">Step 1 · {isSolo ? 'Solo Contender' : 'Choose Your Squad'}</Hud>
              {isSolo ? (
                <div className="mt-3 border border-cyan/40 bg-cyan/5 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-display text-lg font-black uppercase text-ink">
                      {profile?.display_name || profile?.username || 'Player Entry'}
                    </p>
                    <span className="font-mono text-[10px] uppercase text-cyan border border-cyan/30 px-2 py-0.5">
                      1v1 Solo Entry
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-mono text-dim">
                    This is a solo competition. You will register and compete as an individual contender linked to your verified account.
                  </p>
                </div>
              ) : teams.length === 0 ? (
                <div className="mt-3 border border-dashed border-white/15 p-6 text-center">
                  <p className="text-sm text-dim">You don't have any created teams yet.</p>
                  <p className="mt-1 font-mono text-xs text-cyan">
                    Required roster: {getRequiredTeamSizeDisplay(tournament)}
                  </p>
                  <Link to="/teams/create" className="mt-4 inline-block font-mono text-xs text-cyan uppercase hover:underline">
                    Create Team First →
                  </Link>
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  <p className="font-mono text-xs text-dim mb-2">
                    Required roster: <span className="font-bold text-cyan">{getRequiredTeamSizeDisplay(tournament)}</span>
                  </p>
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
                  disabled={loading || (fee > 0 && !hasEnoughWallet) || (!isSolo && !selectedTeamId)}
                  className="px-6 py-2 bg-ink text-void font-bold text-xs uppercase hover:bg-cyan transition-colors disabled:opacity-40"
                >
                  {loading ? 'Registering...' : fee === 0 ? 'Confirm Free Entry' : 'Pay & Register'}
                </button>
              ) : (
                <button
                  onClick={handleInitUpi}
                  disabled={loading || (!isSolo && !selectedTeamId)}
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
                <div className="p-3 bg-white rounded shadow-lg">
                  <QRCodeSVG value={upiData.qr_code_data} size={180} />
                </div>
              </div>
              <p className="mt-3 font-display text-3xl font-black text-ink">{inr(upiData.amount_inr)}</p>
              {upiData.payee_name && (
                <p className="font-mono text-xs text-dim">Payee: <strong className="text-ink">{upiData.payee_name}</strong></p>
              )}
              
              {/* Copyable UPI ID */}
              <div className="mt-2 inline-flex items-center gap-2 rounded border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs">
                <span className="text-dim">UPI ID:</span>
                <span className="text-cyan font-bold select-all">{upiData.upi_id}</span>
                <button
                  type="button"
                  onClick={copyUpiId}
                  className="border border-cyan/40 bg-cyan/10 px-2 py-0.5 text-[10px] uppercase text-cyan hover:bg-cyan/20 transition-colors cursor-pointer"
                >
                  {copiedUpi ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              <p className="mt-2 text-[11px] text-dim">
                Pay the exact amount from Google Pay, PhonePe, Paytm, or BHIM.
              </p>
            </div>

            <div>
              <Hud>12-Digit UTR / Transaction Reference</Hud>
              <input
                type="text"
                required
                maxLength={24}
                placeholder="e.g. 428198841029"
                value={utr}
                onChange={(e) => setUtr(e.target.value.replace(/\s+/g, ''))}
                className="mt-2 w-full border border-white/20 bg-surface px-4 py-3 font-mono text-base tracking-widest text-cyan outline-none focus:border-cyan"
              />
              <p className="mt-1 text-[11px] text-dim">
                Found in your payment app under "UPI Ref No" or "UTR".
              </p>
            </div>

            {/* Payment Screenshot Proof Upload */}
            <div className="border border-white/10 bg-surface p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Hud className="text-cyan">Payment Screenshot Proof</Hud>
                <span className="font-mono text-[10px] text-dim uppercase">Recommended</span>
              </div>
              <p className="text-xs text-dim">
                Attach a screenshot showing successful transfer and UTR for expedited admin approval.
              </p>

              {screenshotUrl ? (
                <div className="flex items-center justify-between border border-ok/30 bg-ok/5 p-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={resolveMediaUrl(screenshotUrl)}
                      alt="Proof preview"
                      className="size-14 object-cover rounded border border-white/20"
                    />
                    <div>
                      <span className="text-xs font-bold text-ok block">✓ Screenshot Attached</span>
                      <span className="font-mono text-[10px] text-dim">{screenshotFile?.name || 'receipt.jpg'}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setScreenshotUrl('')
                      setScreenshotFile(null)
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }}
                    className="border border-white/20 px-2 py-1 font-mono text-[10px] uppercase text-dim hover:text-live hover:border-live transition-colors cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleScreenshotChange}
                    className="hidden"
                    id="payment-screenshot-input"
                  />
                  <label
                    htmlFor="payment-screenshot-input"
                    className="flex flex-col items-center justify-center border-2 border-dashed border-white/15 hover:border-cyan/50 p-4 text-center cursor-pointer transition-colors bg-void/50"
                  >
                    {screenshotUploading ? (
                      <span className="font-mono text-xs text-cyan animate-pulse">Uploading screenshot...</span>
                    ) : (
                      <>
                        <span className="text-xl">📸</span>
                        <span className="mt-1 font-mono text-xs uppercase text-ink">Upload Payment Screenshot</span>
                        <span className="mt-0.5 text-[10px] text-dim">PNG, JPG or WebP up to 5MB</span>
                      </>
                    )}
                  </label>
                  {screenshotError && (
                    <p className="mt-1 text-xs text-live font-mono">{screenshotError}</p>
                  )}
                </div>
              )}
            </div>

            <div className="pt-4 flex justify-between items-center border-t border-white/10">
              <button
                type="button"
                onClick={() => setStep(0)}
                disabled={loading}
                className="text-xs text-dim hover:text-ink cursor-pointer"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={loading || !utr.trim() || utr.trim().length < 6 || screenshotUploading}
                className="px-6 py-2.5 bg-ink text-void font-bold text-xs uppercase hover:bg-cyan transition-colors disabled:opacity-40 cursor-pointer"
              >
                {loading ? 'Submitting...' : 'Submit Payment & Confirm'}
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
