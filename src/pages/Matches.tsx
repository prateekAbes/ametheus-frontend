import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router'
import { PageHero, Container, Chips, EmptyState, Hud, Badge, Crest, Brackets } from '../components/ui'
import { gameBy, img, tourBy, type Match } from '../lib/data'
import { getMatches, mapApiMatchToUiMatch } from '../services/matches'
import DynamicImage from '../components/DynamicImage'
import { resolveMediaUrl } from '../services/apiClient'
import { useMatchTicker, type TickerEvent } from '../hooks/useMatchTicker'
import { MatchLobbyModal } from '../components/match/MatchLobbyModal'
import { EvidenceSubmissionModal } from '../components/match/EvidenceSubmissionModal'

const GAMES = ['All Games', 'BGMI', 'Valorant', 'Free Fire', 'COD Mobile'] as const
const GMAP: Record<string, string> = { BGMI: 'bgmi', Valorant: 'valorant', 'Free Fire': 'free-fire', 'COD Mobile': 'codm' }

function useCountdown(scheduledAt?: string): string | null {
  const [now, setNow] = useState<number>(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  if (!scheduledAt) return null
  const diff = new Date(scheduledAt).getTime() - now
  if (diff <= 0) return null

  const totalSecs = Math.floor(diff / 1000)
  const h = Math.floor(totalSecs / 3600)
  const m = Math.floor((totalSecs % 3600) / 60)
  const s = totalSecs % 60
  if (h > 0) return `T-${h}h ${m}m ${s}s`
  if (m > 0) return `T-${m}m ${s}s`
  return `T-${s}s`
}

function LiveFeature({
  m,
  onEnterLobby,
  onSubmitEvidence,
}: {
  m: Match & { tourName?: string; liveLink?: string; rawStatus?: string; lobbyCode?: string; lobbyPassword?: string; serverRegion?: string }
  onEnterLobby: (match: any) => void
  onSubmitEvidence: (match: any) => void
}) {
  const g = gameBy(m.game)
  const [media, setMedia] = useState<'loading' | 'ok' | 'err'>('loading')
  const tourTitle = m.tourName || tourBy(m.tour)?.name || 'Tournament'

  return (
    <div
      className="@container group relative block min-h-[360px] h-full overflow-hidden border border-live/50 bg-void"
      style={{
        background: `radial-gradient(ellipse at 30% 0%, ${g.accent}40, transparent 60%), linear-gradient(160deg, #12141d, #05060a)`,
      }}
    >
      <DynamicImage
        src={resolveMediaUrl((m as any).bannerUrl || (m as any).banner_url)}
        alt=""
        eager
        className="kenburns absolute inset-0 h-full w-full object-cover opacity-30 transition-opacity duration-700 group-hover:opacity-40"
      />
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
            <span className="max-w-full font-display text-[clamp(1.1rem,4.6cqw,3.75rem)] font-black uppercase leading-[0.9] break-words">
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
            <span className="max-w-full font-display text-[clamp(1.1rem,4.6cqw,3.75rem)] font-black uppercase leading-[0.9] break-words">
              {m.b}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
          <Hud>
            {m.date} · {m.time}
          </Hud>

          <div className="flex flex-wrap items-center gap-2.5">
            {m.liveLink && (
              <a
                href={m.liveLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded bg-live/20 px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-live border border-live/50 hover:bg-live hover:text-white transition-all shadow-xs"
              >
                <span className="size-1.5 rounded-full bg-live animate-ping" />
                [ 📺 WATCH BROADCAST ]
              </a>
            )}
            <button
              onClick={() => onEnterLobby(m)}
              className="border border-white/20 bg-surface/80 px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-ink hover:border-cyan hover:text-cyan transition-colors cursor-pointer"
            >
              Enter Lobby
            </button>
            <button
              onClick={() => onSubmitEvidence(m)}
              className="border border-cyan bg-cyan/15 px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-cyan hover:bg-cyan hover:text-void transition-colors cursor-pointer"
            >
              Submit Result
            </button>
            <Link
              to={`/matches/${m.id}`}
              className="inline-flex items-center gap-1.5 font-display text-sm font-extrabold uppercase tracking-[0.08em] text-dim hover:text-ink transition-colors ml-2"
            >
              Details →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function MatchRowItem({
  m,
  onEnterLobby,
  onSubmitEvidence,
}: {
  m: Match & { tourName?: string; liveLink?: string; scheduledAt?: string; rawStatus?: string; lobbyCode?: string; lobbyPassword?: string; serverRegion?: string }
  onEnterLobby: (match: any) => void
  onSubmitEvidence: (match: any) => void
}) {
  const g = gameBy(m.game)
  const live = m.status === 'live'
  const countdown = useCountdown(m.scheduledAt)

  return (
    <div
      className={`group relative grid grid-cols-1 md:grid-cols-[180px_1fr_auto_1fr_auto] items-center gap-4 overflow-hidden border p-5 transition-all duration-300 hover:bg-white/[0.03] ${
        live ? 'border-live/50 bg-live/[0.04]' : 'border-white/10 bg-surface/40'
      }`}
    >
      {live && <span className="absolute inset-y-0 left-0 w-[3px] bg-live" />}

      {/* Game & Stage */}
      <div className="flex items-center justify-between gap-3 md:block">
        <span className="font-display text-sm font-black tracking-[0.15em]" style={{ color: g.accent }}>
          {g.short}
        </span>
        <Hud className="block md:mt-1 truncate">
          {m.tourName || 'Tournament'} · {m.round}
        </Hud>
      </div>

      {/* Team A */}
      <div className="flex items-center gap-3 justify-self-start md:justify-self-end text-left md:text-right">
        <span className="font-display text-lg md:text-xl font-black uppercase text-ink truncate max-w-[140px] md:max-w-none">
          {m.a}
        </span>
        <Crest name={m.a} size={32} color={g.accent} />
      </div>

      {/* Score or VS */}
      <div className="text-center px-2">
        {m.score ? (
          <p className="font-display text-2xl font-black tabular-nums text-ink">
            {m.score[0]}
            <span className="mx-1.5 text-dim">:</span>
            {m.score[1]}
          </p>
        ) : (
          <p className="font-display text-xl font-black text-dim">VS</p>
        )}
        <Hud className="block">{m.format}</Hud>
      </div>

      {/* Team B */}
      <div className="flex items-center gap-3">
        <Crest name={m.b} size={32} color={g.accent} />
        <span className="font-display text-lg md:text-xl font-black uppercase text-ink truncate max-w-[140px] md:max-w-none">
          {m.b}
        </span>
      </div>

      {/* Status & Actions */}
      <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-white/10">
        <div className="flex items-center gap-2">
          {live ? (
            <Badge s="live" label="Live" />
          ) : countdown ? (
            <span className="px-2 py-0.5 border border-cyan/40 bg-cyan/10 font-mono text-[10px] font-bold text-cyan">
              {countdown}
            </span>
          ) : (
            <Badge s={m.status} />
          )}
          <Hud className="hidden xl:inline-block">
            {m.date} · {m.time}
          </Hud>
        </div>

        <div className="flex items-center gap-2">
          {m.liveLink && (
            <a
              href={m.liveLink}
              target="_blank"
              rel="noreferrer"
              className="border border-live bg-live/20 px-2.5 py-1 font-mono text-[10px] font-bold uppercase text-live hover:bg-live hover:text-white transition-colors"
            >
              📺 Watch
            </a>
          )}
          <button
            onClick={() => onEnterLobby(m)}
            className="border border-white/20 bg-surface px-2.5 py-1 font-mono text-[10px] uppercase text-dim hover:text-ink hover:border-white/40 cursor-pointer"
          >
            Lobby
          </button>
          <button
            onClick={() => onSubmitEvidence(m)}
            className="border border-cyan/40 bg-cyan/10 px-2.5 py-1 font-mono text-[10px] uppercase text-cyan hover:bg-cyan hover:text-void cursor-pointer"
          >
            Proof
          </button>
          <Link
            to={`/matches/${m.id}`}
            className="font-mono text-[11px] text-dim hover:text-cyan uppercase font-bold ml-1"
          >
            →
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function Matches() {
  const [game, setGame] = useState<(typeof GAMES)[number]>('All Games')
  const [matches, setMatches] = useState<(Match & { tourName?: string; liveLink?: string; scheduledAt?: string; rawStatus?: string; lobbyCode?: string; lobbyPassword?: string; serverRegion?: string })[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Modals state
  const [activeLobbyMatch, setActiveLobbyMatch] = useState<any | null>(null)
  const [activeEvidenceMatch, setActiveEvidenceMatch] = useState<any | null>(null)

  const fetchMatchesData = useCallback(async () => {
    try {
      const data = await getMatches()
      if (Array.isArray(data)) {
        setMatches(data.map(mapApiMatchToUiMatch))
      }
    } catch (err) {
      console.warn('Could not fetch matches:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMatchesData()
    const interval = setInterval(fetchMatchesData, 25000)
    return () => clearInterval(interval)
  }, [fetchMatchesData])

  // WebSocket Live Telemetry
  const handleTickerEvent = useCallback(
    (event: TickerEvent) => {
      if (
        event.event === 'MATCH_SCORE_SUBMITTED' ||
        event.event === 'MATCH_VERIFIED' ||
        event.event === 'MATCH_STATUS_CHANGED'
      ) {
        fetchMatchesData()
      }
    },
    [fetchMatchesData]
  )

  useMatchTicker(handleTickerEvent)

  const list = matches.filter(
    (m) => m.status === 'live' && (game === 'All Games' || m.game === GMAP[game])
  )
  const liveCount = matches.filter((m) => m.status === 'live').length

  return (
    <>
      <PageHero
        kicker={liveCount > 0 ? `◉ ${liveCount} ${liveCount === 1 ? 'match' : 'matches'} live now` : '◉ Live Matches'}
        title="MATCHES"
        sub="Track live verified matches across Ametheus."
        variant="matches"
        accent="#ff3b4e"
      />

      <Container className="py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-6">
          <div className="flex items-center gap-3">
            <span className="size-2 rounded-full bg-live animate-pulse shadow-[0_0_8px_#ff3b4e]" />
            <Hud className="text-ink font-bold">SANCTIONED LIVE ARENA</Hud>
            <span className="font-mono text-xs text-dim">·</span>
            <span className="font-mono text-xs text-dim uppercase">
              {list.length} {list.length === 1 ? 'Match Live' : 'Matches Live'}
            </span>
          </div>
          <Chips items={GAMES} value={game} onChange={setGame} />
        </div>

        <div className="mt-10 space-y-4">
          {isLoading ? (
            <div className="border border-white/10 bg-surface/50 p-16 text-center">
              <div className="inline-block size-8 animate-spin rounded-full border-2 border-cyan border-t-transparent mb-4" />
              <Hud className="text-cyan">Loading matches...</Hud>
            </div>
          ) : list.length === 0 ? (
            <EmptyState
              code="0:0"
              title="No live matches"
              body="No matches currently live for this game filter. Check back when tournament rounds begin."
              cta="Browse Tournaments"
              to="/tournaments"
            />
          ) : (
            <div className="space-y-4">
              <LiveFeature
                key={`live-feature-${list[0].id}`}
                m={list[0]}
                onEnterLobby={(m) => setActiveLobbyMatch(m)}
                onSubmitEvidence={(m) => setActiveEvidenceMatch(m)}
              />
              {list.length > 1 && (
                <div className="grid gap-4 lg:grid-cols-2">
                  {list.slice(1).map((m, i, r) => (
                    <div
                      key={`live-item-${m.id}-${i}`}
                      className={r.length % 2 === 1 && i === r.length - 1 ? 'lg:col-span-2' : ''}
                    >
                      <LiveFeature
                        m={m}
                        onEnterLobby={(match) => setActiveLobbyMatch(match)}
                        onSubmitEvidence={(match) => setActiveEvidenceMatch(match)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Container>

      {/* Interactive Lobby Modal */}
      <MatchLobbyModal
        match={activeLobbyMatch}
        isOpen={Boolean(activeLobbyMatch)}
        onClose={() => setActiveLobbyMatch(null)}
        onSubmitEvidence={(m) => {
          setActiveLobbyMatch(null)
          setActiveEvidenceMatch(m)
        }}
      />

      {/* Result Evidence Modal */}
      <EvidenceSubmissionModal
        match={activeEvidenceMatch}
        isOpen={Boolean(activeEvidenceMatch)}
        onClose={() => setActiveEvidenceMatch(null)}
        onSuccess={() => {
          fetchMatchesData()
        }}
      />
    </>
  )
}
