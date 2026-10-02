import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router'
import { getGameBySlug, normalizeGame, NormalizedGame } from '../services/games'
import { getTournaments, normalizeTournament, NormalizedTournament } from '../services/tournaments'
import { gameBy, img, type Tournament as DesignTournament } from '../lib/data'
import {
  Hud,
  Badge,
  Cta,
  SectionHead,
  Container,
  TournamentCard,
  EmptyState,
  Stat,
  Particles,
} from '../components/ui'

const RULES = [
  ['Eligibility', 'Players must be 16+ with a verified Ametheus account and an in-game ID linked to their profile. One account per player.'],
  ['Team registration', 'Squads register as a unit before the deadline. Substitutes must be declared at registration; roster locks 2 hours before check-in.'],
  ['Check-in', "Check-in opens 45 minutes before the first match. Teams that don't check in forfeit their slot and entry is not refunded."],
  ['Fair play', 'Emulators, scripts, teaming and exploit abuse result in immediate disqualification and a platform-wide ban.'],
  ['Disputes', 'Raise disputes within 30 minutes of a match with screenshot or replay evidence. Admin decisions are final.'],
  ['Payouts', 'Prize money is credited to the winning wallet within 72 hours of result verification.'],
]

export default function GameDetail() {
  const { slug = '' } = useParams()
  const fallback = gameBy(slug)

  const [gameData, setGameData] = useState<NormalizedGame | null>(null)
  const [tournaments, setTournaments] = useState<NormalizedTournament[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    Promise.all([
      getGameBySlug(slug).catch(() => null),
      getTournaments({ game: slug }).catch(() => []),
    ]).then(([gRes, tRes]) => {
      if (!isMounted) return
      if (gRes) setGameData(normalizeGame(gRes))
      setTournaments(tRes.map(normalizeTournament))
      setLoading(false)
    })
    return () => {
      isMounted = false
    }
  }, [slug])

  const name = gameData?.name || fallback.name
  const short = gameData?.tag || fallback.short
  const desc = gameData?.description || fallback.desc
  const line = gameData?.announcementText || fallback.line
  const genre = gameData?.category || fallback.genre
  const platform = gameData?.platform || fallback.platform
  const accent = gameData?.accentColor || fallback.accent
  const banner = gameData?.bannerUrl || fallback.photo
  const minSize = gameData?.minTeamSize || 4
  const maxSize = gameData?.maxTeamSize || fallback.size

  const activeTours = tournaments
    .filter((t) => t.status === 'REGISTRATION_OPEN' || t.status === 'LIVE')
    .map((t): Partial<DesignTournament> & Pick<DesignTournament, 'id' | 'name'> => ({
      id: t.slug || t.id,
      name: t.title,
      game: slug,
      prize: t.prizePoolInr,
      entry: t.entryFeeInr,
      status: t.status.toLowerCase() as any,
      date: t.startDate ? new Date(t.startDate).toLocaleDateString('en-GB') : 'TBD',
      teams: t.registeredTeams,
      max: t.maxTeams,
      region: 'India',
      format: t.format,
    }))

  const upcomingTours = tournaments
    .filter((t) => t.status === 'UPCOMING' || t.status === 'DRAFT')
    .map((t): Partial<DesignTournament> & Pick<DesignTournament, 'id' | 'name'> => ({
      id: t.slug || t.id,
      name: t.title,
      game: slug,
      prize: t.prizePoolInr,
      entry: t.entryFeeInr,
      status: 'upcoming',
      date: t.startDate ? new Date(t.startDate).toLocaleDateString('en-GB') : 'TBD',
      teams: t.registeredTeams,
      max: t.maxTeams,
      region: 'India',
      format: t.format,
    }))

  return (
    <>
      <section className="relative flex min-h-[92svh] items-end overflow-hidden bg-void">
        <img
          src={img(banner, 2000)}
          alt={`${name} artwork`}
          className="kenburns absolute inset-0 h-full w-full object-cover opacity-50"
        />
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 15% 100%, ${accent}55, transparent 60%)` }} />
        <div className="absolute inset-0 bg-gradient-to-t from-void via-void/50 to-void/20" />
        <div className="grid-floor absolute -inset-x-1/2 bottom-0 h-1/2 opacity-60" />
        <Particles n={20} />

        <Container className="relative pb-16 pt-36 md:pb-24">
          <div className="mb-6 flex flex-wrap items-center gap-4">
            <span className="h-px w-12" style={{ background: accent }} />
            <Hud className="text-ink">
              {genre} · {platform}
            </Hud>
            <Badge s="active" />
          </div>
          <h1
            className="reveal font-display text-[clamp(4rem,16vw,16rem)] font-black uppercase leading-[0.78]"
            style={{ textShadow: `0 0 80px ${accent}55` }}
          >
            {short}
          </h1>
          <p className="mt-6 max-w-xl text-lg text-ink/75">{desc}</p>
          <div className="mt-10 flex flex-wrap items-center gap-8">
            <Cta onClick={() => document.getElementById('tournaments')?.scrollIntoView({ behavior: 'smooth' })}>
              View Tournaments
            </Cta>
            <Stat k="Squad size" v={`${minSize}–${maxSize}P`} accent={accent} />
            <Stat k="Platform" v={platform} />
          </div>
        </Container>
      </section>

      {/* Active tournaments */}
      <section id="tournaments" className="in-view scroll-mt-28 py-20 md:py-32">
        <Container>
          <SectionHead idx="01" kicker={short} title="Active tournaments" size="md" />
          <div className="mt-12">
            {activeTours.length ? (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr]">
                {activeTours.map((t, i) => (
                  <TournamentCard key={t.id} t={t} wide={i === 0} />
                ))}
              </div>
            ) : (
              <EmptyState
                code="00"
                title="No active brackets"
                body={`No ${short} tournaments are open right now. Check upcoming events below.`}
                cta="All tournaments"
                to="/tournaments"
              />
            )}
          </div>
        </Container>
      </section>

      {/* Upcoming tournaments */}
      <section className="in-view pb-20 md:pb-32">
        <Container>
          <SectionHead idx="02" kicker="Next up" title="Upcoming tournaments" size="md" />
          <div className="mt-12">
            {upcomingTours.length ? (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {upcomingTours.map((t) => (
                  <TournamentCard key={t.id} t={t} />
                ))}
              </div>
            ) : (
              <EmptyState
                code="404"
                title="Nothing scheduled"
                body={`New ${short} events drop weekly. Check back soon.`}
                cta="Browse all"
                to="/tournaments"
              />
            )}
          </div>
        </Container>
      </section>

      {/* Intel */}
      <section className="in-view border-y border-white/10 bg-graphite py-20 md:py-32">
        <Container className="grid gap-16 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <SectionHead idx="03" kicker="Intel" title="Game information" size="md" />
            <p className="mt-8 text-lg text-dim">{line}</p>
          </div>
          <dl className="grid grid-cols-2 gap-px self-end bg-white/10 lg:col-span-7">
            {[
              ['Genre', genre],
              ['Platform', platform],
              ['Squad Format', `${maxSize} Player Team`],
              ['Region', 'India'],
              ['Server Protocol', 'Dedicated / Custom Rooms'],
              ['Anti-Cheat', 'Official Server Client'],
            ].map(([k, v]) => (
              <div key={k} className="bg-graphite p-6">
                <Hud>{k}</Hud>
                <dd className="mt-2 font-display text-2xl font-black uppercase text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>
    </>
  )
}
