import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router'
import { getGameBySlug, normalizeGame, NormalizedGame } from '../services/games'
import { getTournaments, normalizeTournament, NormalizedTournament } from '../services/tournaments'
import { getLeaderboardEntries, LeaderboardEntry } from '../services/leaderboard'
import { apiClient, resolveMediaUrl } from '../services/apiClient'
import DynamicImage from '../components/DynamicImage'
import { gameBy, img, inr, type Tournament as DesignTournament } from '../lib/data'
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
  Portal,
} from '../components/ui'

const TOURNAMENT_RULES = [
  ['Eligibility & Identification', 'Players must have a verified Ametheus account with their exact in-game ID and Riot/Steam/Krafton handle linked. One account per athlete.'],
  ['Squad Lineup & Roster Lock', 'Squads register as a unit before the registration deadline. Substitutes must be declared at registration; rosters lock 2 hours before match check-in.'],
  ['Check-in Window', "Check-in opens 45 minutes before the scheduled match lobby. Lineups failing to check in forfeit their slot, and entry is not refunded."],
  ['Fair Play & Anti-Cheat', 'Emulators, unauthorized third-party scripts, teaming, and bug exploits result in immediate disqualification and platform hardware bans.'],
  ['Evidence & Dispute Protocol', 'Raise disputes within 30 minutes of match completion with unedited video capture or screenshots. Arbiter decisions are binding and final.'],
  ['Verified Prize Settlements', 'Tournament prize pools are calculated from actual verified entries and credited directly to player wallets within 72 hours of result audit.'],
]

export default function GameDetail() {
  const { slug = '' } = useParams()
  const fallback = gameBy(slug)

  const [gameData, setGameData] = useState<NormalizedGame | null>(null)
  const [tournaments, setTournaments] = useState<NormalizedTournament[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [gameRules, setGameRules] = useState<[string, string][]>([])
  const [loading, setLoading] = useState(true)
  const [selectedGalleryIdx, setSelectedGalleryIdx] = useState<number | null>(null)

  useEffect(() => {
    let isMounted = true
    Promise.all([
      getGameBySlug(slug).catch(() => null),
      getTournaments({ game: slug }).catch(() => []),
      getLeaderboardEntries({ game: slug }).catch(() => []),
      apiClient<any[]>('/regulations').catch(() => []),
    ]).then(([gRes, tRes, lbRes, regRes]) => {
      if (!isMounted) return
      if (gRes) setGameData(normalizeGame(gRes))
      setTournaments(tRes.map(normalizeTournament))
      setLeaderboard(lbRes || [])

      if (Array.isArray(regRes)) {
        const targetSlug = slug.toLowerCase()
        const gName = gRes?.name?.toLowerCase() || ''
        const match = regRes.find((r: any) => {
          const rGame = (r.game_name || '').toLowerCase()
          const rTitle = (r.title || '').toLowerCase()
          return rGame === targetSlug || rGame === gName || rTitle.includes(targetSlug) || (gName && rTitle.includes(gName))
        })
        if (match && Array.isArray(match.rules) && match.rules.length > 0) {
          const parsed: [string, string][] = match.rules.map((ruleStr: string, idx: number) => {
            const parts = ruleStr.split(/:\s+/)
            if (parts.length > 1) {
              return [parts[0].trim(), parts.slice(1).join(': ').trim()]
            }
            return [`Rule 0${idx + 1}`, ruleStr.trim()]
          })
          setGameRules(parsed)
        }
      }

      setLoading(false)
    })
    return () => {
      isMounted = false
    }
  }, [slug])

  // Resolve dynamic canonical game title from actual game record
  const gameTitle = useMemo(() => {
    const rawName = (gameData?.name || fallback.name || '').trim()
    const targetSlug = (slug || gameData?.slug || fallback.slug || '').toLowerCase()

    if (targetSlug === 'bgmi' || rawName.toLowerCase() === 'battlegrounds mobile india') {
      return 'BGMI'
    }
    if (targetSlug === 'valorant') {
      return 'Valorant'
    }
    return rawName || fallback.name || 'Game'
  }, [gameData?.name, fallback.name, slug, gameData?.slug, fallback.slug])

  // Normalize platform to clean single label, avoiding redundant OS/sub-platform tags
  const cleanPlatform = useMemo(() => {
    const raw = (gameData?.platform || fallback.platform || '').trim()
    const lower = raw.toLowerCase()
    if (lower.includes('mobile') || lower.includes('android') || lower.includes('ios')) {
      return 'Mobile'
    }
    if (lower.includes('pc') || lower.includes('windows')) {
      return 'PC'
    }
    return raw || 'Multi-platform'
  }, [gameData?.platform, fallback.platform])

  const name = gameTitle
  const desc = gameData?.description || fallback.desc
  const line = gameData?.announcementText || fallback.line
  const genre = gameData?.genreName || gameData?.category || fallback.genre || 'Esports'
  const accent = gameData?.accentColor || fallback.accent
  const mediaCfg = (gameData as any)?.media_config || (gameData as any)?.mediaConfig
  const bannerCfg = mediaCfg?.banner
  const bannerSrc = bannerCfg?.asset_url || gameData?.bannerUrl || ''
  const bannerFocal =
    bannerCfg && typeof bannerCfg.focal_x === 'number' && typeof bannerCfg.focal_y === 'number'
      ? { x: bannerCfg.focal_x, y: bannerCfg.focal_y }
      : undefined
  const bannerZoom = bannerCfg?.zoom
  const bannerFit = bannerCfg?.fit_mode || 'ambient'

  const minSize = gameData?.minTeamSize || 4
  const maxSize = gameData?.maxTeamSize || fallback.size
  const antiCheat = gameData?.antiCheat || 'Server-Side Platform Guard'
  const gallery = (gameData as any)?.gallery || []

  // Active / Open Brackets
  const activeTours = tournaments
    .filter((t) => ['REGISTRATION_OPEN', 'CHECK_IN_OPEN', 'LIVE', 'ACTIVE', 'IN_PROGRESS'].includes((t.status || '').toUpperCase()))
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
      mediaConfig: t.mediaConfig || t.media_config,
    }))

  // Upcoming Scheduled Events
  const upcomingTours = tournaments
    .filter((t) => ['UPCOMING', 'DRAFT', 'SCHEDULED'].includes((t.status || '').toUpperCase()))
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
      mediaConfig: t.mediaConfig || t.media_config,
    }))

  // Completed Tournaments & Archives
  const completedTours = tournaments
    .filter((t) => ['COMPLETED', 'FINISHED', 'ARCHIVED'].includes((t.status || '').toUpperCase()))
    .map((t): Partial<DesignTournament> & Pick<DesignTournament, 'id' | 'name'> => ({
      id: t.slug || t.id,
      name: t.title,
      game: slug,
      prize: t.prizePoolInr,
      entry: t.entryFeeInr,
      status: 'completed',
      date: t.startDate ? new Date(t.startDate).toLocaleDateString('en-GB') : 'Concluded',
      teams: t.registeredTeams,
      max: t.maxTeams,
      region: 'India',
      format: t.format,
      mediaConfig: t.mediaConfig || t.media_config,
    }))

  const totalPrizePool = tournaments.reduce((acc, t) => acc + (t.prizePoolInr || 0), 0)

  return (
    <>
      {/* 1. Breadcrumb Trail */}
      <div className="w-full bg-void/90 py-3 px-5 md:px-10 border-b border-white/10 pt-20">
        <Container>
          <div className="flex items-center gap-2 text-xs font-mono text-dim">
            <Link to="/" className="hover:text-cyan transition-colors">HOME</Link>
            <span>/</span>
            <Link to="/games" className="hover:text-cyan transition-colors">GAMES</Link>
            <span>/</span>
            <span className="text-ink font-bold uppercase tracking-wider">{gameTitle}</span>
          </div>
        </Container>
      </div>

      {/* 2. Game Hero Section */}
      <section className="relative flex min-h-[85svh] items-end overflow-hidden bg-void">
        <DynamicImage
          src={resolveMediaUrl(bannerSrc)}
          alt={`${gameTitle} artwork`}
          eager
          mode={bannerFit}
          focalPoint={bannerFocal}
          zoom={bannerZoom}
          className="kenburns h-full w-full opacity-60 object-contain object-center md:object-[75%_center]"
          backdropClassName="opacity-30"
        />
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 15% 100%, ${accent}55, transparent 60%)` }} />
        <div className="absolute inset-0 bg-gradient-to-t from-void via-void/50 to-void/20" />
        <div className="grid-floor absolute -inset-x-1/2 bottom-0 h-1/2 opacity-60" />
        <Particles n={20} />

        <Container className="relative pb-16 pt-24 md:pb-24">
          <div className="mb-6 flex flex-wrap items-center gap-4">
            <span className="h-px w-12" style={{ background: accent }} />
            <Hud className="text-ink">
              {genre}
            </Hud>
          </div>
          <h1
            className="reveal font-display text-[clamp(3.5rem,14vw,14rem)] font-black uppercase leading-[0.78]"
            style={{ textShadow: `0 0 80px ${accent}55` }}
          >
            {gameTitle}
          </h1>
          <p className="mt-6 max-w-xl text-lg text-ink/75 font-sans">{desc}</p>
          <div className="mt-10 flex flex-wrap items-center gap-8">
            <Cta onClick={() => document.getElementById('active-tournaments')?.scrollIntoView({ behavior: 'smooth' })}>
              View Brackets
            </Cta>
            <Stat k="Squad size" v={`${minSize}–${maxSize}P`} accent={accent} />
            <Stat k="Platform" v={cleanPlatform} />
            <Stat k="Total Circuit Prize" v={inr(totalPrizePool)} accent="#f59e0b" />
          </div>
        </Container>
      </section>

      {/* 3. Active Tournaments Section */}
      <section id="active-tournaments" className="in-view scroll-mt-24 py-20 md:py-28">
        <Container>
          <SectionHead
            idx="01"
            kicker={gameTitle}
            title="Active Tournaments"
            size="md"
            sub="Official sanctioned tournaments currently open for registration or live in action."
          />
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
                title="No active brackets right now"
                body={`No ${gameTitle} tournaments are currently open for registration. Check upcoming events below.`}
                cta="All Tournaments"
                to="/tournaments"
              />
            )}
          </div>
        </Container>
      </section>

      {/* 4. Upcoming Tournaments Section */}
      <section className="in-view border-t border-white/10 bg-graphite/30 py-20 md:py-28">
        <Container>
          <SectionHead
            idx="02"
            kicker="On The Horizon"
            title="Upcoming Events"
            size="md"
            sub={`Scheduled cups and seasonal qualifiers for ${name}. Form your squad early.`}
          />
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
                title="Nothing scheduled yet"
                body={`New ${gameTitle} tournaments drop weekly. Keep an eye on platform announcements.`}
                cta="Browse All Tournaments"
                to="/tournaments"
              />
            )}
          </div>
        </Container>
      </section>

      {/* 5. Completed Tournaments & Archives */}
      {completedTours.length > 0 && (
        <section className="in-view border-t border-white/10 py-20 md:py-28">
          <Container>
            <SectionHead
              idx="03"
              kicker="Circuit Archive"
              title="Completed Tournaments"
              size="md"
              sub="Historical brackets, championship results, and awarded prizes."
            />
            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {completedTours.map((t) => (
                <TournamentCard key={t.id} t={t} />
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* 6. Game Discipline Leaderboard / Standings */}
      <section className="in-view border-t border-white/10 bg-void py-20 md:py-28">
        <Container>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
            <div>
              <SectionHead
                idx="04"
                kicker={`${gameTitle} Standings`}
                title={<>{gameTitle} <span className="text-cyan">Leaderboard</span></>}
                size="md"
                sub={`Verified contender Elo ratings, match wins, and cash earnings specifically in ${name}.`}
              />
            </div>
            <Link
              to={`/leaderboard?game=${slug}`}
              className="border border-white/15 bg-surface px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-ink hover:border-cyan hover:text-cyan transition-colors self-start md:self-auto"
            >
              Full Standings →
            </Link>
          </div>

          <div className="mt-10">
            {leaderboard.length === 0 ? (
              <div className="border border-white/10 bg-surface/30 p-16 text-center">
                <Hud className="text-cyan">No Ranked Records Yet</Hud>
                <p className="mt-2 font-mono text-xs text-dim">
                  No verified squad match results recorded for {name} yet. Compete in sanctioned tournaments to enter the leaderboard!
                </p>
              </div>
            ) : (
              <div className="border border-white/10 bg-surface/20 overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.02] text-dim uppercase tracking-wider">
                      <th className="py-3 px-4">Rank</th>
                      <th className="py-3 px-4">Squad</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-center">Elo Rating</th>
                      <th className="py-3 px-4 text-center">Win Rate</th>
                      <th className="py-3 px-4 text-center">Record</th>
                      <th className="py-3 px-4 text-right">Prize Earnings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {leaderboard.slice(0, 10).map((entry, idx) => {
                      const isDisbanded = entry.is_disbanded || entry.status === 'DISBANDED'
                      return (
                        <tr key={entry.id || idx} className="transition-colors hover:bg-white/[0.03]">
                          <td className="py-4 px-4 font-bold">
                            <span
                              className={`inline-block size-6 text-center leading-6 rounded font-black ${
                                idx === 0
                                  ? 'bg-amber-400 text-black'
                                  : idx === 1
                                  ? 'bg-zinc-300 text-black'
                                  : idx === 2
                                  ? 'bg-amber-700 text-white'
                                  : 'text-dim'
                              }`}
                            >
                              {entry.rank || idx + 1}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="font-display text-base font-black uppercase text-ink">
                              {entry.name}{' '}
                              <span className="font-mono text-xs font-normal text-dim">
                                [{entry.tag}]
                              </span>
                            </div>
                            {entry.captain && (
                              <div className="text-[10px] text-dim">{entry.captain}</div>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            {isDisbanded ? (
                              <span className="inline-block border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                                Historical
                              </span>
                            ) : (
                              <span className="inline-block border border-ok/30 bg-ok/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ok">
                                Active
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-center font-bold text-cyan">
                            {entry.rating}
                          </td>
                          <td className="py-4 px-4 text-center font-bold text-ink">
                            {entry.win_rate}%
                          </td>
                          <td className="py-4 px-4 text-center text-dim">
                            <span className="text-ok font-bold">{entry.wins}W</span> -{' '}
                            <span className="text-live font-bold">{entry.losses}L</span>
                          </td>
                          <td className="py-4 px-4 text-right font-bold text-amber-400">
                            {inr(Number(entry.earnings || 0))}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Container>
      </section>

      {/* 7. Tournament Rules & Protocols */}
      <section className="in-view border-t border-white/10 bg-graphite/40 py-20 md:py-28">
        <Container>
          <SectionHead
            idx="05"
            kicker="Rules & Integrity"
            title="Sanctioned Rules & Protocol"
            size="md"
            sub="Official platform tournament standards and competitive fair-play regulations."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {(gameRules.length > 0 ? gameRules : TOURNAMENT_RULES).map(([title, content], i) => (
              <div key={title} className="border border-white/10 bg-surface/40 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-4">
                    <Hud className="text-cyan">Rule // 0{i + 1}</Hud>
                  </div>
                  <h3 className="mt-3 font-display text-xl font-black uppercase text-ink">{title}</h3>
                  <p className="mt-3 text-xs font-mono text-dim leading-relaxed">{content}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* 8. Technical Intel & Specifications */}
      <section className="in-view border-t border-white/10 bg-graphite py-20 md:py-28">
        <Container className="grid gap-16 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <SectionHead idx="06" kicker="Specifications" title="Technical Intel" size="md" />
            <p className="mt-8 text-base text-dim font-mono leading-relaxed">{line}</p>
          </div>
          <dl className="grid grid-cols-2 gap-px self-end bg-white/10 lg:col-span-7">
            {[
              ['Genre', genre],
              ['Platform', cleanPlatform],
              ['Squad Format', `${maxSize} Player Team (${minSize}-${maxSize})`],
              ['Region', 'India (Mumbai Dedicated)'],
              ['Server Protocol', 'Custom Room / Dedicated Arbitrated'],
              ['Anti-Cheat Protocol', antiCheat],
            ].map(([k, v]) => (
              <div key={k} className="bg-graphite p-6">
                <Hud>{k}</Hud>
                <dd className="mt-2 font-display text-xl font-black uppercase text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      {/* 9. Media Gallery (if available) */}
      {gallery && gallery.length > 0 && (
        <section className="in-view border-t border-white/10 bg-void py-20 md:py-28">
          <Container>
            <SectionHead
              idx="07"
              kicker="Visual Intel"
              title="Official Arena Gallery"
              size="md"
              sub={`Screen captures and broadcast assets from ${name} tournament battles.`}
            />
            <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {gallery.map((item: any, idx: number) => (
                <div
                  key={item.id || idx}
                  onClick={() => setSelectedGalleryIdx(idx)}
                  className="group relative aspect-video overflow-hidden border border-white/10 bg-surface cursor-pointer hover:border-cyan transition-colors"
                >
                  <DynamicImage
                    src={resolveMediaUrl(item.url)}
                    alt={item.caption || `${name} screenshot`}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {item.caption && (
                    <div className="absolute inset-x-0 bottom-0 bg-void/80 p-2 font-mono text-[10px] text-ink truncate backdrop-blur-sm">
                      {item.caption}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* Lightbox Modal */}
      {selectedGalleryIdx !== null && gallery[selectedGalleryIdx] && (
        <Portal lockScroll>
          <div
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-hidden select-none"
            onClick={() => setSelectedGalleryIdx(null)}
          >
            <div
              className="relative max-w-4xl w-full max-h-[min(90vh,calc(100svh-2rem))] flex flex-col items-center bg-void border border-white/20 p-4 shadow-2xl overflow-y-auto select-text"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-full flex items-center justify-between pb-3 border-b border-white/10 text-xs font-mono text-dim">
                <span>{name} Asset ({selectedGalleryIdx + 1} of {gallery.length})</span>
                <button
                  onClick={() => setSelectedGalleryIdx(null)}
                  className="px-2 py-1 text-ink hover:text-cyan font-bold cursor-pointer"
                >
                  ✕ CLOSE
                </button>
              </div>
              <DynamicImage
                src={resolveMediaUrl(gallery[selectedGalleryIdx].url)}
                alt={gallery[selectedGalleryIdx].caption || 'Screenshot'}
                eager
                className="max-h-[70vh] w-auto object-contain my-4"
              />
              {gallery[selectedGalleryIdx].caption && (
                <p className="font-mono text-xs text-dim text-center">{gallery[selectedGalleryIdx].caption}</p>
              )}
            </div>
          </div>
        </Portal>
      )}
    </>
  )
}
