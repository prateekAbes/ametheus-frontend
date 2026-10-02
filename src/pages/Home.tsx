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
import { getGames, Game as ApiGame, normalizeGame } from '../services/games'
import { getMatches, normalizeMatch, NormalizedMatch } from '../services/matches'
import { getPageMedia, PageMediaConfig } from '../services/admin'
import { resolveMediaUrl } from '../services/apiClient'
import {
  GAMES,
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

const Scene3D = lazy(() => import('../components/Scene3D'))

const SLOTS = [
  { cls: 'left-[4%] top-[18%] w-[22vw] h-[30vh] [clip-path:polygon(0_8%,100%_0,92%_100%,4%_92%)]', d: 18 },
  { cls: 'right-[6%] top-[14%] w-[18vw] h-[36vh] [clip-path:polygon(10%_0,100%_6%,100%_100%,0_88%)]', d: -24 },
  { cls: 'left-[14%] bottom-[10%] w-[16vw] h-[22vh] [clip-path:polygon(0_0,90%_10%,100%_100%,6%_90%)]', d: -12 },
  { cls: 'right-[16%] bottom-[14%] w-[20vw] h-[24vh] [clip-path:polygon(6%_4%,100%_0,94%_96%,0_100%)]', d: 28 },
]

export default function Home() {
  const [tournaments, setTournaments] = useState<NormalizedTournament[]>([])
  const [featuredTour, setFeaturedTour] = useState<NormalizedTournament | null>(null)
  const [games, setGames] = useState<ApiGame[]>([])
  const [homeMedia, setHomeMedia] = useState<PageMediaConfig | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    Promise.all([
      getTournaments().catch(() => []),
      getGames().catch(() => []),
      getFeaturedTournament().catch(() => null),
      getPageMedia('home').catch(() => null),
    ]).then(([tList, gList, fTour, hMedia]) => {
      if (!isMounted) return
      setTournaments(tList.map(normalizeTournament))
      setGames(gList)
      if (fTour) {
        setFeaturedTour(normalizeTournament(fTour))
      }
      if (hMedia) {
        setHomeMedia(hMedia)
      }
      setLoading(false)
    })
    return () => {
      isMounted = false
    }
  }, [])

  // 60-second dynamic shuffle interval for homepage sections
  const [shuffleTick, setShuffleTick] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => {
      setShuffleTick((prev) => prev + 1)
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  // Derived lists
  const activeTournaments = tournaments.filter(
    (t) => t.status !== 'CANCELLED' && t.status !== 'COMPLETED'
  )
  const eligibleTournaments = tournaments.filter(
    (t) => t.status === 'REGISTRATION_OPEN' || t.status === 'UPCOMING' || t.status === 'LIVE'
  )
  const liveCount = tournaments.filter((t) => t.status.toLowerCase() === 'live').length
  const gameCount = games.length > 0 ? games.length : CATALOG.length

  // Lead featured tournament calculation (to exclude from upcoming list)
  const leadTour = featuredTour || tournaments.find((t) => t.isFeatured) || tournaments[0]

  // Upcoming tournaments: strictly exclude lead tournament and limit to max 4
  const eligibleUpcoming = useMemo(() => {
    return activeTournaments.filter(
      (t) => !leadTour || (t.id !== leadTour.id && t.slug !== leadTour.slug)
    )
  }, [activeTournaments, leadTour])

  // Visible max 4 tournaments, dynamically shuffled/rotated every 60s
  const visibleTournaments = useMemo(() => {
    if (eligibleUpcoming.length <= 4) return eligibleUpcoming
    const offset = (shuffleTick * 4) % eligibleUpcoming.length
    const rotated = [...eligibleUpcoming.slice(offset), ...eligibleUpcoming.slice(0, offset)]
    return rotated.slice(0, 4)
  }, [eligibleUpcoming, shuffleTick])

  // Visible max 4 games, dynamically shuffled/rotated every 60s
  const activeGamesPool = useMemo(() => {
    return games.length > 0 ? games : (CATALOG.filter((g) => g.status === 'active') as any[])
  }, [games])

  const visibleGames = useMemo(() => {
    if (activeGamesPool.length <= 4) return activeGamesPool
    const offset = (shuffleTick * 4) % activeGamesPool.length
    const rotated = [...activeGamesPool.slice(offset), ...activeGamesPool.slice(0, offset)]
    return rotated.slice(0, 4)
  }, [activeGamesPool, shuffleTick])

  return (
    <>
      <Hero
        activeCount={activeTournaments.length}
        gameCount={gameCount}
        eligibleTournaments={eligibleTournaments}
        homeMedia={homeMedia}
      />
      <Featured
        tournaments={tournaments}
        featuredTournament={featuredTour}
      />
      <ExploreGames games={visibleGames} totalCount={activeGamesPool.length} />
      <Upcoming tournaments={visibleTournaments} />
      <Why />
      <FinalCta liveCount={liveCount} />
    </>
  )
}

function Hero({
  activeCount,
  gameCount,
  eligibleTournaments,
  homeMedia,
}: {
  activeCount: number
  gameCount: number
  eligibleTournaments: NormalizedTournament[]
  homeMedia?: PageMediaConfig | null
}) {
  const { isSignedIn } = useAuthContext()
  const ref = useRef<HTMLElement>(null)
  const coord = useRef<HTMLSpanElement>(null)
  const shards = CATALOG.filter((g) => g.status === 'active' && g.photo).slice(0, SLOTS.length)
  const scene = !isMobile() && !reducedMotion()

  const [tourIndex, setTourIndex] = useState(0)

  useEffect(() => {
    if (eligibleTournaments.length <= 1) return
    const id = setInterval(() => {
      setTourIndex((prev) => (prev + 1) % eligibleTournaments.length)
    }, 5000)
    return () => clearInterval(id)
  }, [eligibleTournaments.length])

  const activeTour =
    eligibleTournaments.length > 0 ? eligibleTournaments[tourIndex % eligibleTournaments.length] : null

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
        if (coord.current)
          coord.current.textContent = `X ${(px * 100).toFixed(1)} / Y ${(py * 100).toFixed(1)}`
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
        .from('[data-h="kicker"]', { y: 14, opacity: 0, duration: 0.8 }, '<0.25')
        .from('[data-h="tag"]', { y: 18, opacity: 0, duration: 1 }, '<0.2')
        .from('[data-h="copy"], [data-h="cta"]', { y: 24, opacity: 0, stagger: 0.08, duration: 0.9 }, '<0.15')
        .from('[data-h="shard"]', { opacity: 0, scale: 0.8, stagger: 0.1, duration: 1.3 }, '<-0.3')
        .from('[data-h="hud"]', { opacity: 0, x: -16, stagger: 0.06, duration: 0.7 }, '<0.3')
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
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_115%,#8b5cff4d,transparent_55%),radial-gradient(ellipse_at_80%_-5%,#3ef2ff1a,transparent_45%)]" />
        <img
          src={img('1535391879778-3bae11d29a24', 1920)}
          alt=""
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover opacity-[0.18] mix-blend-luminosity"
        />
        <div className="grid-floor absolute -inset-x-1/2 bottom-0 h-[55%]" />
      </div>

      <div className="pointer-events-none absolute inset-0 hidden md:block [background:radial-gradient(520px_circle_at_var(--lx,50%)_var(--ly,40%),rgb(62_242_255/.09),transparent_60%)]" />
      {scene && (
        <Suspense fallback={null}>
          <Scene3D particles={1200} />
        </Suspense>
      )}

      {homeMedia?.is_active && homeMedia.media_url && (
        <div
          data-h="media-foreground"
          className="pointer-events-none absolute inset-0 z-[5] overflow-hidden"
          style={{ opacity: homeMedia.opacity ?? 0.35 }}
        >
          <img
            src={resolveMediaUrl(homeMedia.media_url)}
            alt=""
            className="h-full w-full object-cover mix-blend-screen"
          />
        </div>
      )}

      {shards.map((g, k) => (
        <Link
          data-h="shard"
          key={g.slug}
          to={`/games/${g.slug}`}
          className={`group absolute hidden md:block ${SLOTS[k].cls} overflow-hidden bg-surface`}
          style={{
            translate: `calc(var(--px) * ${SLOTS[k].d}px) calc(var(--py) * ${SLOTS[k].d}px)`,
            transition: 'translate .6s cubic-bezier(.2,.7,.1,1)',
          }}
        >
          <img
            src={img(g.photo!, 700)}
            alt={`${g.name} world fragment`}
            decoding="async"
            className="h-full w-full object-cover opacity-45 grayscale transition-[opacity,filter,transform] duration-700 group-hover:scale-110 group-hover:opacity-90 group-hover:grayscale-0"
          />
          <div
            className="absolute inset-0 transition-opacity duration-500 group-hover:opacity-60"
            style={{ background: `linear-gradient(180deg, transparent 35%, ${g.accent}66)` }}
          />
          <Hud className="absolute bottom-3 left-4 text-ink">
            {g.short}{' '}
            <span className="inline-block transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
              ↗
            </span>
          </Hud>
        </Link>
      ))}

      <div data-h="stage" className="relative z-10 flex h-full w-full max-w-full flex-col items-center justify-center px-4 text-center overflow-x-hidden">
        <div data-h="kicker" className="mb-6">
          <Hud className="text-cyan">
            <Dot pulse /> &nbsp;System Online · Welcome to Ametheus
          </Hud>
        </div>
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
        <p data-h="copy" className="mt-5 max-w-md text-balance text-sm sm:text-base text-dim px-2">
          A premium esports platform where players discover games, build teams, enter tournaments, and compete.
        </p>
        <div data-h="cta" className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Cta to="/tournaments">Explore Tournaments</Cta>
          <Cta ghost to="/games">Explore Games</Cta>
        </div>

        {!isSignedIn && (
          <div data-h="cta" className="mt-6">
            <Link
              to="/login"
              className="group inline-flex items-center gap-2.5 rounded-full border border-cyan/40 bg-void/80 px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] text-cyan backdrop-blur-md transition-all duration-300 hover:border-cyan hover:bg-cyan/15 hover:shadow-[0_0_24px_rgba(62,242,255,0.3)]"
            >
              <span className="size-1.5 rounded-full bg-cyan animate-pulse" />
              Sign in to join tournaments
              <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
            </Link>
          </div>
        )}
      </div>

      <div className="absolute left-5 top-28 z-10 hidden flex-col gap-4 sm:flex md:left-10">
        {[
          [activeCount, 'Active tournaments'],
          [gameCount, 'Games'],
          [4, 'Live worlds'],
        ].map(([v, k]) => (
          <div data-h="hud" key={k as string} className="flex items-baseline gap-3">
            <span className="font-display text-3xl font-black tabular-nums">{v}</span>
            <Hud>{k as string}</Hud>
          </div>
        ))}
      </div>
      <Hud className="absolute right-6 top-[46%] z-10 hidden [writing-mode:vertical-rl] md:block">
        {gameCount} GAMES · INDIA · EST. 2026
      </Hud>
      <div className="absolute bottom-8 left-6 z-10 hidden flex-col gap-1 md:left-10 md:flex">
        <Hud><span ref={coord}>X 50.0 / Y 40.0</span></Hud>
        <Hud className="text-cyan">INDIA SERVER · 14MS</Hud>
      </div>

      {activeTour ? (
        <div
          data-h="hud"
          className="group absolute bottom-8 right-6 z-20 hidden w-80 flex-col gap-2 border border-white/10 bg-void/85 p-3.5 backdrop-blur-md transition-colors hover:border-white/30 lg:flex md:right-10"
        >
          <Link
            to={`/tournaments/${activeTour.slug || activeTour.id}`}
            className="flex items-center gap-3.5"
          >
            <div className="relative size-14 shrink-0 overflow-hidden bg-surface border border-white/10">
              <Media
                id={gameBy(activeTour.gameId).photo}
                w={160}
                sizes="56px"
                className="h-full w-full object-cover opacity-85"
              />
            </div>
            <div className="min-w-0 flex-1">
              <Hud className="flex items-center gap-1.5 text-[10px]">
                <Dot
                  c={activeTour.status === 'LIVE' ? 'bg-live' : 'bg-ok'}
                  pulse={activeTour.status === 'LIVE'}
                />
                {activeTour.status === 'LIVE'
                  ? 'Live Match'
                  : activeTour.status === 'REGISTRATION_OPEN'
                  ? 'Registration Open'
                  : 'Upcoming Tournament'}
              </Hud>
              <p className="truncate font-display text-lg font-black uppercase leading-tight text-ink mt-0.5">
                {activeTour.title}
              </p>
              <Hud className="block text-[10px] text-cyan">
                {inr(activeTour.prizePoolInr)} · {activeTour.registeredTeams} Teams Registered
              </Hud>
            </div>
            <span className="text-dim transition-transform group-hover:translate-x-1 group-hover:text-cyan">
              →
            </span>
          </Link>

          {eligibleTournaments.length > 1 && (
            <div className="mt-1 flex items-center justify-between border-t border-white/10 pt-2">
              <div className="flex gap-1.5">
                {eligibleTournaments.map((t, idx) => (
                  <button
                    key={t.id}
                    onClick={() => setTourIndex(idx)}
                    aria-label={`Select tournament ${idx + 1}`}
                    className={`h-1 transition-all ${
                      idx === tourIndex % eligibleTournaments.length
                        ? 'w-6 bg-cyan'
                        : 'w-2 bg-white/20 hover:bg-white/40'
                    }`}
                  />
                ))}
              </div>
              <span className="font-mono text-[9px] uppercase tracking-wider text-dim">
                {(tourIndex % eligibleTournaments.length) + 1} / {eligibleTournaments.length}
              </span>
            </div>
          )}
        </div>
      ) : (
        <Link
          data-h="hud"
          to="/tournaments"
          className="group absolute bottom-8 right-6 z-20 hidden w-72 items-center gap-4 border border-white/10 bg-void/75 p-3 transition-colors hover:border-white/30 lg:flex md:right-10"
        >
          <div className="size-12 shrink-0 bg-surface/50 border border-white/10 flex items-center justify-center font-display text-lg text-dim">
            ◈
          </div>
          <div className="min-w-0 flex-1">
            <Hud className="flex items-center gap-1.5 text-dim">
              <Dot c="bg-dim" /> Upcoming Season
            </Hud>
            <p className="truncate font-display text-sm font-bold uppercase leading-tight text-ink mt-0.5">
              Next Tournaments Soon
            </p>
            <Hud className="block text-[10px] text-cyan">Explore All Brackets</Hud>
          </div>
          <span className="text-dim transition-transform group-hover:translate-x-1 group-hover:text-cyan">
            →
          </span>
        </Link>
      )}

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
}: {
  tournaments: NormalizedTournament[]
  featuredTournament?: NormalizedTournament | null
}) {
  if (!tournaments.length && !featuredTournament) return null

  // The lead is strictly the admin-designated featured tournament if available!
  const lead: NormalizedTournament =
    featuredTournament ||
    tournaments.find((t) => t.isFeatured) ||
    tournaments[0]

  // The side tournaments should never repeat the lead tournament
  const side = tournaments
    .filter((t) => t.id !== lead.id && t.slug !== lead.slug)
    .slice(0, 3)

  const leadGame = gameBy(lead.gameId)
  const displayGameName = lead.gameName || leadGame.name || 'Esports'

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
              <div
                className="relative aspect-[4/3] overflow-hidden sm:aspect-[16/10]"
                style={{ background: `linear-gradient(135deg, ${leadGame.accent}33, #0c0e15 60%)` }}
              >
                <img
                  src={img(lead.bannerUrl || leadGame.photo, 1600)}
                  alt={`${lead.title} featured`}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0" style={{ background: `linear-gradient(to top, #05060a 0%, transparent 45%), linear-gradient(120deg, ${leadGame.accent}30, transparent 50%)` }} />
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
                return (
                  <Link
                    key={t.id}
                    to={`/tournaments/${t.slug || t.id}`}
                    className="group grid grid-cols-[88px_1fr] gap-5 border-t border-white/10 py-5 transition-colors first:border-t-0 first:pt-0 sm:grid-cols-[132px_1fr]"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden sm:aspect-[4/3] bg-surface">
                      <img
                        src={img(t.bannerUrl || g.photo, 400)}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover opacity-80 group-hover:scale-105 transition-transform"
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

function ExploreGames({ games, totalCount }: { games: ApiGame[]; totalCount?: number }) {
  const displayGames = games.slice(0, 4)
  return (
    <section className="relative py-24 md:py-36 overflow-hidden">
      {/* High-Resolution Cinematic Gaming / Esports Arena Backdrop with dark overlay, gradient, vignette */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2400&fit=crop&auto=format"
          alt=""
          className="size-full object-cover object-center opacity-[0.14] brightness-75 contrast-125"
        />
        {/* Radial vignette overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at 50% 40%, transparent 20%, #05060a 82%)',
          }}
        />
        {/* Top and bottom gradient fade into platform dark background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#05060a] via-transparent to-[#05060a]" />
        {/* Subtle cyber grid pattern for authentic esports aesthetics */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      <Container>
        <SectionHead
          className="in-view"
          idx="02"
          kicker="Battlegrounds"
          title={<>Explore<br />Games</>}
          sub={`${totalCount || displayGames.length} live competitive titles. Each with dedicated ladders, formats, and squad sizes.`}
          right={<Cta ghost small to="/games">All games</Cta>}
        />
        <div className="mt-14 grid gap-4 md:grid-cols-12">
          {displayGames.map((rawG, k) => {
            const g = normalizeGame(rawG as any)
            return (
              <Link
                key={g.slug}
                to={`/games/${g.slug}`}
                className={`group relative min-h-[340px] overflow-hidden border border-white/10 bg-surface p-6 transition-all duration-500 md:col-span-6`}
              >
                <img
                  src={img(g.bannerUrl || gameBy(g.slug).photo, 1000)}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover opacity-40 transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-void via-void/40 to-transparent" />
                <div className="relative flex h-full flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-xs text-dim">0{k + 1}</span>
                    <Badge s="active" />
                  </div>
                  <div>
                    <h3 className="font-display text-5xl font-black uppercase text-ink">{g.name}</h3>
                    <Hud className="mt-2 block">
                      <span className="text-cyan">{g.category}</span> · {g.platform}
                    </Hud>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </Container>
    </section>
  )
}

function Upcoming({ tournaments }: { tournaments: NormalizedTournament[] }) {
  if (!tournaments.length) return null
  const list = tournaments.slice(0, 4).map((t): Partial<DesignTournament> & Pick<DesignTournament, 'id' | 'name'> => ({
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
  }))

  return (
    <section className="relative py-24 md:py-32">
      <Container>
        <SectionHead
          className="in-view"
          idx="03"
          kicker="On the horizon"
          title="Upcoming"
          size="md"
          right={<Hud>{list.length} events</Hud>}
        />
        <AdaptiveGrid count={list.length} className="mt-12">
          {list.map((t) => (
            <div key={t.id} className="in-view">
              <TournamentCard t={t} />
            </div>
          ))}
        </AdaptiveGrid>
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
        <SectionHead idx="04" kicker="Why Ametheus" title={<>Built for<br /><span className="text-cyan">competitors.</span></>} />
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
