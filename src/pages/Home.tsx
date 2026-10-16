import { lazy, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import { useAuthContext } from '../context/AuthContext'
import { slugifyCategory } from '../lib/categories'
import {
  getTournaments,
  getFeaturedTournament,
  normalizeTournament,
  NormalizedTournament,
} from '../services/tournaments'
import { getGames, Game as ApiGame } from '../services/games'
import { getMatches, normalizeMatch, NormalizedMatch } from '../services/matches'
import EsportsHeroVisual from '../components/EsportsHeroVisual'
import {
  CATALOG,
  HERO_SLIDES,
  HERO_SPOTLIGHT,
  TOUR_EXTRA,
  gameBy,
  img,
  inr,
  type Tournament as DesignTournament,
  type CatalogGame,
} from '../lib/data'
import { Hud, Dot, Badge, Cta, SectionHead, Container, TournamentCard, Brackets, Media } from '../components/ui'
import { AdaptiveGrid, Collapse } from '../components/kit'
import { gsap, isMobile, reducedMotion } from '../lib/motion'
import DynamicImage from '../components/DynamicImage'
import { TournamentCardSkeleton } from '../components/Skeleton'
import { resolveMediaUrl } from '../services/apiClient'
import { getPlacements, PlacementConfig } from '../services/admin'

const Scene3D = lazy(() => import('../components/Scene3D'))

export default function Home() {
  const [tournaments, setTournaments] = useState<NormalizedTournament[]>([])
  const [featuredTour, setFeaturedTour] = useState<NormalizedTournament | null>(null)
  const [games, setGames] = useState<ApiGame[]>([])
  const [placements, setPlacements] = useState<PlacementConfig[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    Promise.all([
      getTournaments().catch(() => []),
      getGames().catch(() => []),
      getFeaturedTournament().catch(() => null),
      getPlacements({ page: 'homepage' }).catch(() => []),
    ]).then(([tList, gList, fTour, pList]) => {
      if (!isMounted) return
      setTournaments(tList.map(normalizeTournament))
      setGames(gList)
      if (fTour) {
        setFeaturedTour(normalizeTournament(fTour))
      }
      if (pList) {
        setPlacements(pList)
      }
      setLoading(false)
    })
    return () => {
      isMounted = false
    }
  }, [])

  // 10-second dynamic shuffle interval for homepage sections
  const [shuffleTick, setShuffleTick] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => {
      setShuffleTick((prev) => prev + 1)
    }, 10000)
    return () => clearInterval(timer)
  }, [])

  // Derived lists
  const activeTournaments = useMemo(() => {
    return tournaments.filter(
      (t) => !['CANCELLED', 'COMPLETED'].includes((t.status || '').toUpperCase())
    )
  }, [tournaments])

  const liveCount = tournaments.filter((t) => (t.status || '').toLowerCase() === 'live').length
  const gameCount = games.length > 0 ? games.length : CATALOG.length

  // Lead featured tournament calculation
  const leadTour = featuredTour || tournaments.find((t) => t.isFeatured) || tournaments[0]

  // Upcoming tournaments: all active tournaments so all 4 tournaments are accessible and cycle smoothly
  const eligibleUpcoming = useMemo(() => {
    return activeTournaments.length > 0 ? activeTournaments : tournaments
  }, [activeTournaments, tournaments])

  return (
    <>
      <Hero
        activeCount={activeTournaments.length}
        gameCount={gameCount}
        games={games}
        placements={placements}
      />
      <Featured
        tournaments={tournaments}
        featuredTournament={featuredTour}
        placements={placements}
      />
      <Upcoming tournaments={eligibleUpcoming} loading={loading} />
      <Why />
      <FinalCta liveCount={liveCount} />
    </>
  )
}

function Hero({
  activeCount,
  gameCount,
  games = [],
  placements = [],
}: {
  activeCount: number
  gameCount: number
  games?: ApiGame[]
  placements?: PlacementConfig[]
}) {
  const { isSignedIn } = useAuthContext()
  const ref = useRef<HTMLElement>(null)
  const scene = !reducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!el || reducedMotion() || matchMedia('(pointer: coarse)').matches) return
    let raf = 0,
      x = 0,
      y = 0
    const move = (e: PointerEvent) => {
      x = e.clientX
      y = e.clientY
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const px = x / innerWidth,
          py = y / innerHeight
        el.style.setProperty('--px', (px * 2 - 1).toFixed(3))
        el.style.setProperty('--py', (py * 2 - 1).toFixed(3))
        el.style.setProperty('--lx', `${(px * 100).toFixed(1)}%`)
        el.style.setProperty('--ly', `${(py * 100).toFixed(1)}%`)
      })
    }
    el.addEventListener('pointermove', move, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      el.removeEventListener('pointermove', move)
    }
  }, [])

  useLayoutEffect(() => {
    if (reducedMotion()) return
    const ctx = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: 'expo.out' }, delay: 0.15 })
        .from('[data-h="title"]', { yPercent: 30, scale: 1.12, opacity: 0, duration: 1.6 })
        .from('[data-h="tag"]', { y: 18, opacity: 0, duration: 1 }, '<0.2')
        .from('[data-h="cta"]', { y: 24, opacity: 0, stagger: 0.08, duration: 0.9 }, '<0.15')
      if (!isMobile()) {
        const st = { trigger: ref.current, start: 'top top', end: 'bottom top', scrub: true }
        gsap.to('[data-h="stage"]', { yPercent: 18, opacity: 0.25, ease: 'none', scrollTrigger: st })
        gsap.to('[data-h="bg"]', { yPercent: 10, scale: 1.08, ease: 'none', scrollTrigger: st })
      }
    }, ref)
    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={ref}
      className="relative isolate h-[100svh] min-h-[720px] overflow-hidden bg-void [--px:0] [--py:0]"
    >
      <div data-h="bg" className="absolute inset-0">
        <EsportsHeroVisual variant="home" />
        <div className="grid-floor absolute -inset-x-1/2 bottom-0 h-[55%]" />
      </div>

      <div className="pointer-events-none absolute inset-0 hidden md:block [background:radial-gradient(520px_circle_at_var(--lx,50%)_var(--ly,40%),rgb(62_242_255/.09),transparent_60%)]" />
      {scene && (
        <Suspense fallback={null}>
          <Scene3D particles={isMobile() ? 500 : 1200} />
        </Suspense>
      )}

      <div data-h="stage" className="relative z-10 flex h-full w-full max-w-full flex-col items-center justify-center px-4 text-center overflow-x-hidden">
        <h1
          data-h="title"
          className="relative w-full max-w-[96vw] select-none text-balance font-display font-black uppercase leading-[0.85] sm:leading-[0.8] tracking-[-0.01em] text-[clamp(2.5rem,15vw,22rem)] sm:text-[clamp(3.5rem,18vw,22rem)]"
          style={{ translate: 'calc(var(--px) * -8px) calc(var(--py) * -6px)', transition: 'translate .8s cubic-bezier(.2,.7,.1,1)' }}
        >
          <span className="absolute inset-0 text-magenta/35 mix-blend-screen" style={{ translate: 'calc(3px + var(--px) * 3px) 0' }} aria-hidden>
            AMETHEUS
          </span>
          <span className="absolute inset-0 text-cyan/35 mix-blend-screen" style={{ translate: 'calc(-3px - var(--px) * 3px) 0' }} aria-hidden>
            AMETHEUS
          </span>
          <span className="relative bg-gradient-to-b from-white via-white to-white/30 bg-clip-text text-transparent">
            AMETHEUS
          </span>
        </h1>
        <p data-h="tag" className="mt-4 font-display text-base font-bold uppercase tracking-[0.2em] sm:text-xl sm:tracking-[0.35em] md:text-4xl md:tracking-[0.45em]">
          India's Gaming Battleground
        </p>
        <div data-h="cta" className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Cta to="/tournaments">Explore Tournaments</Cta>
          <Cta ghost to="/games">Explore Games</Cta>
        </div>

        {!isSignedIn && (
          <div data-h="cta" className="mt-6">
            <Link
              to="/sign-in"
              className="group inline-flex items-center gap-2.5 rounded-full border border-cyan/40 bg-void/80 px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] text-cyan backdrop-blur-md transition-all duration-300 hover:border-cyan hover:bg-cyan/15 hover:shadow-[0_0_24px_rgba(62,242,255,0.3)]"
            >
              <span className="size-1.5 rounded-full bg-cyan animate-pulse" />
              Sign in to join tournaments
              <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
            </Link>
          </div>
        )}
      </div>

      <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2">
        <Hud>DESCEND</Hud>
        <span className="descend h-10 w-px origin-top bg-gradient-to-b from-cyan to-transparent" />
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-void" />
    </section>
  )
}

function Featured({
  tournaments,
  featuredTournament,
  placements = [],
}: {
  tournaments: NormalizedTournament[]
  featuredTournament?: NormalizedTournament | null
  placements?: PlacementConfig[]
}) {
  if (!tournaments.length && !featuredTournament) return null

  // The lead is strictly the admin-designated featured tournament if available!
  const lead: NormalizedTournament =
    featuredTournament ||
    tournaments.find((t) => t.isFeatured) ||
    tournaments[0]

  // The side tournaments should never repeat the lead tournament
  const side = tournaments.filter((t) => t.id !== lead.id && t.slug !== lead.slug)

  const leadGame = gameBy(lead.gameId)
  const displayGameName = lead.gameName || leadGame.name || 'Esports'

  // Lead tournament artwork directly from tournament's own canonical mediaConfig
  const leadMedia = (lead as any).mediaConfig || (lead as any).media_config
  const leadFeaturedCfg = leadMedia?.featured_banner || leadMedia?.card
  const featuredPlacement = placements.find((p) => p.placement_key === 'homepage_featured_tournament')

  const leadAssetUrl =
    leadFeaturedCfg?.asset_url ||
    featuredPlacement?.asset_url ||
    lead.heroBannerUrl ||
    lead.bannerUrl
  const leadFocalPoint =
    leadFeaturedCfg && typeof leadFeaturedCfg.focal_x === 'number' && typeof leadFeaturedCfg.focal_y === 'number'
      ? { x: leadFeaturedCfg.focal_x, y: leadFeaturedCfg.focal_y }
      : featuredPlacement && typeof featuredPlacement.focal_x === 'number' && typeof featuredPlacement.focal_y === 'number'
      ? { x: featuredPlacement.focal_x, y: featuredPlacement.focal_y }
      : undefined
  const leadZoom = leadFeaturedCfg?.zoom || featuredPlacement?.zoom
  const leadFitMode = leadFeaturedCfg?.fit_mode || featuredPlacement?.fit_mode || 'cover'

  return (
    <section className="py-24 md:py-32">
      <Container>
        <SectionHead
          className="in-view"
          idx="01"
          kicker={`Featured · ${tournaments.length}`}
          title={<>Featured<br /><span className="outline-text">Tournaments</span></>}
          right={<Cta ghost small to="/tournaments">All tournaments</Cta>}
        />
        <div className={`mt-12 grid gap-12 lg:gap-14 ${side.length ? 'lg:grid-cols-12' : ''}`}>
          <div className={`in-view ${side.length ? 'lg:col-span-7' : ''}`}>
            <Link to={`/tournaments/${lead.slug || lead.id}`} className="group block">
              <div className="relative aspect-video overflow-hidden bg-void">
                <DynamicImage
                  src={resolveMediaUrl(leadAssetUrl)}
                  alt={`${lead.title} featured`}
                  eager
                  mode={leadFitMode === 'contain' ? 'contain' : 'cover'}
                  focalPoint={leadFocalPoint}
                  zoom={leadZoom}
                  className="size-full object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(to top, #05060a 0%, transparent 45%), linear-gradient(120deg, ${leadGame.accent}25, transparent 50%)` }} />
                <div className="absolute left-5 top-5 flex items-center gap-3 md:left-7 md:top-7">
                  <Badge s={lead.status} />
                  <span className="border border-white/20 bg-void/80 px-2 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                    {displayGameName}
                  </span>
                </div>
                <span className="absolute bottom-5 right-5 font-mono text-[11px] uppercase tracking-[0.22em] text-ink/80 md:bottom-7 md:right-7 bg-void/80 px-2.5 py-1 backdrop-blur-sm border border-white/10">
                  {lead.registeredTeams} / {lead.maxTeams} TEAMS
                </span>
              </div>
              <div className="mt-7 grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
                <div className="min-w-0">
                  <h3 className="line-clamp-2 text-balance font-display text-5xl font-black uppercase leading-[0.86] md:text-7xl">
                    {lead.title}
                  </h3>
                  <Hud className="mt-3 block">
                    {lead.format} · {lead.startDate ? new Date(lead.startDate).toLocaleDateString('en-GB') : 'India'}
                  </Hud>
                </div>
                <div className="flex items-end gap-6 sm:gap-8">
                  <div className="hidden sm:block">
                    <Hud>Entry fee</Hud>
                    <p className="font-mono text-lg font-bold leading-none text-ink/80">
                      {lead.entryFeeInr ? inr(lead.entryFeeInr) : 'Free'}
                    </p>
                  </div>
                  <div>
                    <Hud>Prize pool</Hud>
                    <p className="font-display text-4xl font-black leading-none md:text-5xl" style={{ color: leadGame.accent }}>
                      {inr(lead.prizePoolInr)}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-2 pb-1 font-display text-base font-extrabold uppercase tracking-[0.1em] transition-[gap,color] group-hover:gap-4 group-hover:text-cyan">
                    View <span>→</span>
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {side.length > 0 && (
            <div className="in-view lg:col-span-5">
              <Hud className="mb-5 block border-b border-white/10 pb-4">Also on the circuit</Hud>
              {side.map((t, idx) => {
                const g = gameBy(t.gameId)
                const sideGameName = t.gameName || g.short
                const sideMedia = (t as any).mediaConfig || (t as any).media_config
                const sideCfg = sideMedia?.also_on_circuit || sideMedia?.card
                const sideFocal =
                  sideCfg && typeof sideCfg.focal_x === 'number' && typeof sideCfg.focal_y === 'number'
                    ? { x: sideCfg.focal_x, y: sideCfg.focal_y }
                    : undefined

                return (
                  <Link
                    key={t.id}
                    to={`/tournaments/${t.slug || t.id}`}
                    className="group grid grid-cols-[100px_1fr] gap-5 border-t border-white/10 py-5 transition-colors first:border-t-0 first:pt-0 sm:grid-cols-[140px_1fr]"
                  >
                    <div className="relative aspect-video overflow-hidden bg-void">
                      <DynamicImage
                        src={resolveMediaUrl(sideCfg?.asset_url || t.bannerUrl)}
                        alt={`${t.title} thumbnail`}
                        mode={sideCfg?.fit_mode === 'contain' ? 'contain' : 'cover'}
                        focalPoint={sideFocal}
                        zoom={sideCfg?.zoom}
                        className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="flex min-w-0 flex-col justify-between gap-3">
                      <div>
                        <div className="flex items-center justify-between gap-3">
                          <Hud className="text-ink/70">0{idx + 2} · {sideGameName}</Hud>
                          <Badge s={t.status} />
                        </div>
                        <p className="mt-2 line-clamp-2 text-balance font-display text-2xl font-black uppercase leading-[0.9] transition-transform duration-300 group-hover:translate-x-1">
                          {t.title}
                        </p>
                      </div>
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="font-display text-xl font-black" style={{ color: g.accent }}>
                          {inr(t.prizePoolInr)}
                        </span>
                        <Hud>{t.registeredTeams} Teams</Hud>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </Container>
    </section>
  )
}


function Upcoming({
  tournaments,
  loading = false,
}: {
  tournaments: NormalizedTournament[]
  loading?: boolean
}) {
  const [page, setPage] = useState(0)
  const pageSize = 4
  const total = tournaments.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  // Auto-advance sliding window every 8 seconds if more than 1 page
  useEffect(() => {
    if (totalPages <= 1) return
    const interval = setInterval(() => {
      setPage((prev) => (prev + 1) % totalPages)
    }, 8000)
    return () => clearInterval(interval)
  }, [totalPages])

  const startIndex = page * pageSize
  const visible = tournaments.slice(startIndex, startIndex + pageSize)
  const list = visible.map((t): Partial<DesignTournament> & Pick<DesignTournament, 'id' | 'name'> => ({
    id: t.slug || t.id,
    name: t.title,
    game: t.gameId,
    prize: t.prizePoolInr,
    entry: t.entryFeeInr,
    status: t.status.toLowerCase() as any,
    date: t.startDate ? new Date(t.startDate).toLocaleDateString('en-GB') : 'TBD',
    teams: t.registeredTeams,
    max: t.maxTeams,
    region: 'India',
    format: t.format,
    bannerUrl: t.bannerUrl,
    mediaConfig: t.mediaConfig || (t as any).media_config,
  }))

  return (
    <section className="relative py-24 md:py-32">
      <Container>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <SectionHead
            className="in-view"
            idx="02"
            kicker="On the horizon"
            title="Upcoming"
            size="md"
            right={<Hud>{total} events</Hud>}
          />
          {total > pageSize && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="font-mono text-xs text-dim mr-2">
                {startIndex + 1}–{Math.min(startIndex + pageSize, total)} of {total}
              </span>
              <button
                onClick={() => setPage((p) => (p - 1 + totalPages) % totalPages)}
                className="border border-white/10 bg-surface px-3 py-1 font-mono text-xs text-dim hover:text-ink hover:border-cyan transition-colors cursor-pointer"
                aria-label="Previous page"
              >
                ←
              </button>
              <button
                onClick={() => setPage((p) => (p + 1) % totalPages)}
                className="border border-white/10 bg-surface px-3 py-1 font-mono text-xs text-dim hover:text-ink hover:border-cyan transition-colors cursor-pointer"
                aria-label="Next page"
              >
                →
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((n) => (
              <TournamentCardSkeleton key={n} />
            ))}
          </div>
        ) : total === 0 ? (
          <div className="mt-12 border border-white/10 bg-surface/30 p-16 text-center">
            <Hud className="text-cyan">No Upcoming Tournaments</Hud>
            <p className="mt-2 font-mono text-sm text-dim">
              No new tournaments are scheduled on the horizon right now. New brackets drop weekly.
            </p>
            <Link
              to="/tournaments"
              className="mt-6 inline-block border border-cyan/40 bg-cyan/10 px-5 py-2 font-mono text-xs uppercase font-bold text-cyan hover:bg-cyan/20 transition-colors"
            >
              Browse All Tournaments
            </Link>
          </div>
        ) : (
          <AdaptiveGrid count={list.length} className="mt-12">
            {list.map((t) => (
              <div key={t.id} className="in-view">
                <TournamentCard t={t} />
              </div>
            ))}
          </AdaptiveGrid>
        )}
      </Container>
    </section>
  )
}

const WHY = [
  ['Multiple games', 'BGMI, Valorant, Free Fire, and COD Mobile today, with new worlds unlocking regularly.'],
  ['Multiple tournaments', 'Daily scrims, weekly cups, and seasonal leagues with transparent prize pools.'],
  ['Competitive ecosystem', 'Automated brackets, arbiter result verification, and reliable anti-cheat protocols.'],
  ['Team-based competition', 'Build your squad, invite by team code, manage rosters, and register together.'],
  ['Instant settlements', 'Direct UPI wallet, verified payouts, and a platform built for players.'],
]

function Why() {
  return (
    <section className="relative overflow-hidden bg-graphite py-24 md:py-36">
      <Container>
        <SectionHead idx="03" kicker="Why Ametheus" title={<>Built for<br /><span className="text-cyan">competitors.</span></>} />
        <ol className="mt-16">
          {WHY.map(([t, b], i) => (
            <li key={t} className={`group grid items-baseline gap-4 border-t border-white/10 py-8 md:grid-cols-12 md:py-10 ${i % 2 ? 'md:pl-[12%]' : ''}`}>
              <span className="outline-text font-display text-7xl font-black leading-none transition-colors group-hover:text-cyan md:col-span-2 md:text-9xl">0{i + 1}</span>
              <h3 className="font-display text-4xl font-black uppercase leading-[0.9] md:col-span-5 md:text-6xl">{t}</h3>
              <p className="max-w-md text-lg text-dim md:col-span-5">{b}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  )
}

function FinalCta({ liveCount }: { liveCount: number }) {
  return (
    <section className="relative overflow-hidden py-32 pb-40 md:py-44">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,#8b5cff40,transparent_60%)]" />
      <div className="grid-floor absolute -inset-x-1/2 bottom-0 h-1/2" />
      <Container className="relative text-center">
        <Hud className="text-cyan"><Dot pulse /> &nbsp;{liveCount} tournaments active now</Hud>
        <h2 className="mt-6 text-balance font-display text-[clamp(3.5rem,11vw,11rem)] font-black uppercase leading-[0.82]">
          Find your next<br /><span className="outline-text">battleground</span>
        </h2>
        <div className="mt-12 flex flex-col justify-center gap-3 sm:flex-row">
          <Cta to="/tournaments">Explore Tournaments</Cta>
          <Cta ghost to="/teams/create">Build a Team</Cta>
        </div>
      </Container>
    </section>
  )
}
