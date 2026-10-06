import { lazy, Suspense, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Container, Cta, Hud, SectionHead, Particles } from '../components/ui'
import { AVATARS, GAMES, COMING, img, gameBy } from '../lib/data'
import { getGames, Game as ApiGame, normalizeGame } from '../services/games'
import { getPublicPlatformStats, PublicPlatformStats } from '../services/admin'
import DynamicImage from '../components/DynamicImage'
import { resolveMediaUrl } from '../services/apiClient'

const Scene3D = lazy(() => import('../components/Scene3D'))

const ARENA = '1770067665792-9975acdec4fb', EVENT = '1767455471543-055dbc6c6700', CITY = '1535391879778-3bae11d29a24'

function Chapter({ idx, kicker, title, body, photo, flip }: { idx: string; kicker: string; title: string; body: string; photo: string; flip?: boolean }) {
  return (
    <section className="py-20 md:py-32">
      <Container className={`grid items-center gap-10 md:grid-cols-12 ${flip ? 'md:[&>*:first-child]:order-2' : ''}`}>
        <div className="relative md:col-span-7">
          <img src={img(photo, 1400)} alt="" className="aspect-[4/3] w-full object-cover opacity-80" />
          <span className="outline-text absolute -bottom-10 left-4 font-display text-[8rem] font-black leading-none md:text-[12rem]">{idx}</span>
        </div>
        <div className="md:col-span-5">
          <Hud className="text-cyan">{idx} — {kicker}</Hud>
          <h2 className="mt-4 font-display text-[clamp(2.75rem,6vw,6rem)] font-black uppercase leading-[0.85]">{title}</h2>
          <p className="mt-6 text-lg text-ink/75">{body}</p>
        </div>
      </Container>
    </section>
  )
}

export default function About() {
  const [stats, setStats] = useState<PublicPlatformStats | null>(null)
  const [apiGames, setApiGames] = useState<ApiGame[]>([])

  useEffect(() => {
    let mounted = true
    Promise.allSettled([
      getPublicPlatformStats(),
      getGames(),
    ]).then(([sRes, gRes]) => {
      if (!mounted) return
      if (sRes.status === 'fulfilled') setStats(sRes.value)
      if (gRes.status === 'fulfilled' && gRes.value.length > 0) setApiGames(gRes.value)
    })
    return () => {
      mounted = false
    }
  }, [])

  const displayGames =
    apiGames.length > 0
      ? apiGames.map((g) => {
          const norm = normalizeGame(g)
          const fallback = gameBy(norm.slug)
          return {
            slug: norm.slug,
            short: norm.tag || fallback.short,
            name: norm.name,
            genre: norm.category || fallback.genre,
            accent: norm.accentColor || fallback.accent,
            photo: norm.bannerUrl || '',
            line: norm.announcementText || fallback.line,
          }
        })
      : GAMES

  const numberMetrics = [
    [
      stats?.total_payout_inr && stats.total_payout_inr > 0
        ? stats.total_payout_inr >= 100000
          ? `₹${(stats.total_payout_inr / 100000).toFixed(1)}L`
          : `₹${stats.total_payout_inr.toLocaleString('en-IN')}`
        : '₹0',
      'Prize pool paid',
    ],
    [stats?.total_tournaments ? `${stats.total_tournaments}` : '0', 'Tournaments run'],
    [
      stats?.total_users
        ? stats.total_users >= 1000
          ? `${(stats.total_users / 1000).toFixed(1)}K`
          : `${stats.total_users}`
        : '0',
      'Registered players',
    ],
    [stats?.total_matches ? `${stats.total_matches}` : '0', 'Matches played'],
  ]

  return (
    <div className="bg-void">
      <section className="relative flex min-h-[100svh] items-end overflow-hidden">
        <img src={img(ARENA, 2200)} alt="" className="kenburns absolute inset-0 h-full w-full object-cover opacity-45" />
        <div className="absolute inset-0 bg-gradient-to-t from-void via-void/50 to-void/20" />
        <Suspense fallback={null}><Scene3D accent="#8b5cff" shellOpacity={0.35} /></Suspense>
        <Container className="relative pb-16 pt-40">
          <Hud className="text-cyan">Established in Ghaziabad · 2026</Hud>
          <h1 className="reveal mt-6 font-display text-[clamp(4.5rem,19vw,20rem)] font-black uppercase leading-[0.78]">Ametheus</h1>
          <p className="mt-4 font-display text-[clamp(1.5rem,4vw,4rem)] font-black uppercase tracking-[0.05em] text-cyan">The Gaming Battleground</p>
        </Container>
      </section>

      <div className="overflow-hidden border-y border-white/10 py-6">
        <div className="marquee flex w-max gap-12 whitespace-nowrap font-display text-5xl font-black uppercase md:text-7xl">
          {[0, 1].map((k) => <span key={k} className="flex gap-12">{[...displayGames.map((g) => g.name), ...COMING].map((n, i) => <span key={n} className={i % 2 ? 'outline-text' : ''}>{n} ✦</span>)}</span>)}
        </div>
      </div>

      <Chapter
        idx="01"
        kicker="Our Story"
        title="Built in a hostel room."
        photo={CITY}
        body="Established in Ghaziabad. It started with six friends, a borrowed router and a WhatsApp bracket that broke every weekend. We wanted tournaments that felt like finals, not spreadsheets. So we built the arena we wished existed."
      />
      <Chapter
        flip
        idx="02"
        kicker="Our Mission"
        title="Every player deserves a stage."
        photo={EVENT}
        body="From a phone in Patna to a rig in Pune, talent is everywhere. Fair brackets, instant payouts and real broadcasts — so the only thing that decides a match is how you play."
      />

      <section className="py-20">
        <Container>
          <SectionHead
            idx="03"
            kicker="The Gaming Ecosystem"
            title={<>{displayGames.length} games.<br /><span className="text-cyan">One arena.</span></>}
            right={<Cta ghost small to="/games">Explore all games</Cta>}
          />
          <div className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {displayGames.map((g, i) => (
              <Link
                key={g.slug}
                to={`/games/${g.slug}`}
                className={`group relative h-[420px] overflow-hidden border border-white/10 transition-all duration-300 hover:border-cyan/50 hover:shadow-[0_0_30px_rgba(62,242,255,0.15)] ${
                  i % 2 ? 'lg:mt-16' : ''
                }`}
              >
                <DynamicImage
                  src={resolveMediaUrl(g.photo)}
                  alt={g.name}
                  className="absolute inset-0 h-full w-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-110"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(to top, #05060a, transparent 60%), linear-gradient(140deg, ${g.accent}40, transparent 50%)`,
                  }}
                />
                <div className="absolute inset-x-5 bottom-5">
                  <Hud>{g.genre}</Hud>
                  <p
                    className="font-display text-4xl font-black uppercase transition-colors group-hover:text-cyan"
                    style={{ color: g.accent }}
                  >
                    {g.short}
                  </p>
                  <p className="mt-1 text-sm text-ink/70">{g.line}</p>
                  <span className="mt-3 inline-flex items-center gap-1 font-mono text-[11px] text-cyan uppercase tracking-wider transition-transform group-hover:translate-x-1">
                    Enter world →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      <section className="relative overflow-hidden py-24 md:py-36">
        <div className="grid-floor absolute -inset-x-1/2 bottom-0 h-2/3 opacity-60" />
        <Container className="relative">
          <SectionHead idx="04" kicker="Tournament Ecosystem" title="By the numbers" />
          <div className="mt-16 grid grid-cols-2 gap-y-14 md:grid-cols-4">
            {numberMetrics.map(([v, k]) => (
              <div key={k} className="border-l border-cyan/40 pl-5">
                <p className="font-display text-[clamp(3.5rem,8vw,8rem)] font-black leading-none">{v}</p>
                <Hud className="mt-3 block">{k}</Hud>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-24">
        <Container className="grid items-end gap-12 md:grid-cols-2">
          <div>
            <Hud className="text-cyan">05 — Community</Hud>
            <h2 className="mt-4 font-display text-[clamp(3rem,9vw,9rem)] font-black uppercase leading-[0.82]">Squads<br />become<br /><span className="text-cyan">family.</span></h2>
            <p className="mt-6 max-w-md text-lg text-ink/75">Scrims at 2am, Discord voice channels that never sleep, rivals who become teammates. The scoreboard resets. The bonds don't.</p>
            <div className="mt-10 flex flex-wrap gap-4"><Cta to="/login">Join the battleground</Cta><Cta ghost to="/tournaments">See tournaments</Cta></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[...AVATARS, AVATARS[1]].map((a, i) => <img key={i} src={img(a, 500)} alt="" className={`aspect-[3/4] w-full object-cover grayscale transition hover:grayscale-0 ${i % 3 === 1 ? 'translate-y-8' : ''}`} />)}
          </div>
        </Container>
      </section>
    </div>
  )
}
