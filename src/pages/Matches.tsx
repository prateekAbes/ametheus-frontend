import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { PageHero, Container, Tabs, Chips, MatchCard, EmptyState, Hud, Badge, Crest, Brackets } from '../components/ui'
import { gameBy, img, tourBy, type Match } from '../lib/data'
import { getMatches, mapApiMatchToUiMatch } from '../services/matches'

const TABS = ['UPCOMING', 'LIVE', 'COMPLETED'] as const
const GAMES = ['All Games', 'BGMI', 'Valorant', 'Free Fire', 'COD Mobile'] as const
const GMAP: Record<string, string> = { BGMI: 'bgmi', Valorant: 'valorant', 'Free Fire': 'free-fire', 'COD Mobile': 'codm' }

function LiveFeature({ m }: { m: Match & { tourName?: string; liveLink?: string } }) {
  const g = gameBy(m.game)
  const [media, setMedia] = useState<'loading' | 'ok' | 'err'>('loading')
  const tourTitle = m.tourName || tourBy(m.tour)?.name || 'Tournament'

  return (
    <Link
      to={`/matches/${m.id}`}
      className="@container group relative block min-h-[340px] h-full overflow-hidden border border-live/40"
      style={{
        background: `radial-gradient(ellipse at 30% 0%, ${g.accent}40, transparent 60%), linear-gradient(160deg, #12141d, #05060a)`,
      }}
    >
      {media === 'loading' && <div className="skeleton absolute inset-0" />}
      {media !== 'err' && (
        <img
          src={img(g.photo, 1600)}
          alt=""
          loading="lazy"
          decoding="async"
          onLoad={() => setMedia('ok')}
          onError={() => setMedia('err')}
          className={`kenburns absolute inset-0 h-full w-full object-cover transition-opacity duration-700 group-hover:opacity-50 ${
            media === 'ok' ? 'opacity-35' : 'opacity-0'
          }`}
        />
      )}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 50% 120%, ${g.accent}55, transparent 60%), linear-gradient(to top, #05060a, #05060a99 50%, #05060a55)`,
        }}
      />
      <Brackets color="border-live/70" />
      <div className="relative flex h-full flex-col justify-between p-5 @xl:p-8 @4xl:p-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Badge s="live" label="Live Now" />
            <Hud className="truncate text-ink max-w-[280px]">
              {tourTitle} · {m.round}
            </Hud>
          </div>
          <span className="font-display text-sm font-black tracking-[0.15em]" style={{ color: g.accent }}>
            {g.short}
          </span>
        </div>

        <div className="my-auto grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 py-6 @xl:gap-6 @4xl:gap-10 @4xl:py-8">
          <div className="flex min-w-0 flex-col items-end gap-3 text-right @3xl:flex-row-reverse @3xl:items-center @3xl:justify-start">
            <Crest name={m.a} size={48} color={g.accent} />
            <span className="max-w-full font-display text-[clamp(0.95rem,4.6cqw,3.75rem)] font-black uppercase leading-[0.9] break-words">
              {m.a}
            </span>
          </div>
          <div className="text-center px-2">
            <p className="whitespace-nowrap font-display text-[clamp(2.25rem,12cqw,7rem)] font-black tabular-nums leading-none">
              {m.score?.[0] ?? 0}
              <span className="mx-2 text-live">:</span>
              {m.score?.[1] ?? 0}
            </p>
            <Hud className="mt-2 block">
              {m.format} · Match {String(m.no).padStart(2, '0')}
            </Hud>
          </div>
          <div className="flex min-w-0 flex-col items-start gap-3 @3xl:flex-row @3xl:items-center">
            <Crest name={m.b} size={48} color={g.accent} />
            <span className="max-w-full font-display text-[clamp(0.95rem,4.6cqw,3.75rem)] font-black uppercase leading-[0.9] break-words">
              {m.b}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
          <Hud>
            {m.date} · {m.time}
          </Hud>
          <div className="flex items-center gap-3">
            {m.liveLink && (
              <span className="flex items-center gap-1.5 rounded bg-live/20 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-live border border-live/40">
                <span className="size-1.5 rounded-full bg-live animate-ping" />
                Stream Active
              </span>
            )}
            <span className="inline-flex items-center gap-2 font-display text-sm md:text-base font-extrabold uppercase tracking-[0.08em] text-live transition-all group-hover:gap-4">
              ▶ Watch Broadcast
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function Matches() {
  const [tab, setTab] = useState<(typeof TABS)[number]>('LIVE')
  const [game, setGame] = useState<(typeof GAMES)[number]>('All Games')
  const [matches, setMatches] = useState<(Match & { tourName?: string; liveLink?: string })[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    setIsLoading(true)
    getMatches()
      .then((data) => {
        if (!mounted) return
        if (Array.isArray(data)) {
          setMatches(data.map(mapApiMatchToUiMatch))
        }
      })
      .catch((err) => {
        console.warn('Could not fetch matches:', err)
      })
      .finally(() => {
        if (mounted) setIsLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  const list = matches.filter(
    (m) => m.status === tab.toLowerCase() && (game === 'All Games' || m.game === GMAP[game])
  )
  const liveCount = matches.filter((m) => m.status === 'live').length

  return (
    <>
      <PageHero
        kicker={`◉ ${liveCount} matches live right now`}
        title="MATCHES"
        sub="Every round, every clutch, every scoreline — streamed and tracked in real time."
        photo={gameBy('free-fire').photo}
        accent="#ff3b4e"
      />
      <Container className="py-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <Tabs tabs={TABS} value={tab} onChange={setTab} />
          <Chips items={GAMES} value={game} onChange={setGame} />
        </div>
        <div className="mt-10 space-y-4">
          {isLoading ? (
            <div className="border border-white/10 bg-surface/50 p-16 text-center">
              <div className="inline-block size-8 animate-spin rounded-full border-2 border-cyan border-t-transparent mb-4" />
              <Hud className="text-cyan">Querying match arena servers...</Hud>
            </div>
          ) : list.length === 0 ? (
            <EmptyState
              code="0:0"
              title={`No ${tab.toLowerCase()} matches`}
              body="The arena is quiet for this filter. Switch games or check another tab."
              cta="Browse Tournaments"
              to="/tournaments"
            />
          ) : tab === 'LIVE' ? (
            <div className="space-y-4">
              <LiveFeature key={`live-feature-${list[0].id}`} m={list[0]} />
              {list.length > 1 && (
                <div className="grid gap-4 lg:grid-cols-2">
                  {list.slice(1).map((m, i, r) => (
                    <div
                      key={`live-item-${m.id}-${i}`}
                      className={r.length % 2 === 1 && i === r.length - 1 ? 'lg:col-span-2' : ''}
                    >
                      <LiveFeature m={m} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            list.map((m, i) => (
              <div
                key={`match-${m.id}-${i}`}
                className="reveal"
                style={{ animationDelay: `${Math.min(i, 6) * 60}ms` }}
              >
                <MatchCard m={m} />
              </div>
            ))
          )}
        </div>
      </Container>
    </>
  )
}
