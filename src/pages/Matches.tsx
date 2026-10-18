import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router'
import { PageHero, Container, Chips, Hud, Badge, Crest, Brackets, Cta } from '../components/ui'
import { gameBy, tourBy } from '../lib/data'
import { getMatches, mapApiMatchToUiMatch } from '../services/matches'
import DynamicImage from '../components/DynamicImage'
import { resolveMediaUrl } from '../services/apiClient'
import { useMatchTicker, type TickerEvent } from '../hooks/useMatchTicker'

const GAMES = ['All Games', 'BGMI', 'Valorant', 'Free Fire', 'COD Mobile'] as const
const GMAP: Record<string, string> = { BGMI: 'bgmi', Valorant: 'valorant', 'Free Fire': 'free-fire', 'COD Mobile': 'codm' }

const STATUS_FILTERS = ['All Matches', 'Live', 'Upcoming', 'Completed'] as const

type UiMatchItem = ReturnType<typeof mapApiMatchToUiMatch>

function PublicMatchCard({ m }: { m: UiMatchItem }) {
  const g = gameBy(m.game)
  const tourTitle = m.tourName || tourBy(m.tour)?.name || 'Tournament'
  const isLive = m.status === 'live'

  return (
    <div
      className={`@container group relative block min-h-[300px] h-full overflow-hidden border transition-all duration-300 ${
        isLive ? 'border-live/60 bg-void shadow-[0_0_25px_rgba(239,68,68,0.15)]' : 'border-white/10 bg-surface/50 hover:border-cyan/40'
      }`}
      style={{
        background: isLive
          ? `radial-gradient(ellipse at 30% 0%, ${g.accent}40, transparent 60%), linear-gradient(160deg, #12141d, #05060a)`
          : `radial-gradient(ellipse at 50% 0%, ${g.accent}20, transparent 70%), linear-gradient(160deg, #10121a, #08090e)`,
      }}
    >
      <Brackets color={isLive ? 'border-live/70' : 'border-cyan/40'} />
      <div className="relative flex h-full flex-col justify-between p-5 @xl:p-7 @4xl:p-9">
        {/* Header Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex min-w-0 items-center gap-3">
            <Badge s={m.status} label={isLive ? 'Live Now' : m.status === 'completed' ? 'Final' : 'Scheduled'} />
            <Hud className="truncate text-ink max-w-[280px]">
              {tourTitle} · {m.round}
            </Hud>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-display text-sm font-black tracking-[0.15em]" style={{ color: g.accent }}>
              {g.short}
            </span>
            <span className="border border-white/10 bg-surface/80 px-2 py-0.5 font-mono text-[10px] text-cyan uppercase font-bold">
              {m.format}
            </span>
          </div>
        </div>

        {/* Central Display: Battle Royale vs Head-to-Head */}
        {m.isBattleRoyale ? (
          <div className="my-auto py-6 text-center">
            <div className="inline-flex items-center gap-2 border border-cyan/30 bg-cyan/10 px-3 py-1 font-mono text-xs uppercase tracking-wider text-cyan mb-3">
              <span>{m.isSolo ? 'Multi-Player Battle Royale' : 'Multi-Squad Battle Royale'}</span>
              <span>•</span>
              <span>Match {String(m.no).padStart(2, '0')}</span>
            </div>
            <h3 className="font-display text-3xl @xl:text-4xl font-black uppercase text-ink">
              {m.squadsCount > 0
                ? `${m.squadsCount} ${m.isSolo ? 'Solo Contenders' : 'Competing Squads'}`
                : (m.hasParticipants ? (m.isSolo ? 'Solo Contenders' : 'Competing Squads') : 'Participants TBD')}
            </h3>
            {m.squads && m.squads.length > 0 ? (
              <div className="mt-4 flex flex-wrap justify-center gap-2 max-w-xl mx-auto">
                {m.squads.slice(0, 6).map((sq: any, i: number) => (
                  <span
                    key={sq.id || sq.name || i}
                    className="border border-white/10 bg-void/80 px-2.5 py-1 font-mono text-[11px] text-ink font-bold uppercase"
                  >
                    {sq.name || sq.team_name || (m.isSolo ? `Player ${i + 1}` : `Squad ${i + 1}`)}
                  </span>
                ))}
                {m.squads.length > 6 && (
                  <span className="border border-white/10 bg-void/40 px-2 py-1 font-mono text-[11px] text-dim">
                    +{m.squads.length - 6} more
                  </span>
                )}
              </div>
            ) : (
              <p className="mt-3 font-mono text-xs text-dim">
                {m.isSolo
                  ? 'Contender lobby registration in progress. Check match details for full lineup.'
                  : 'Squad lobby registration in progress. Check match details for full lineup.'}
              </p>
            )}
          </div>
        ) : !m.hasParticipants ? (
          /* Head-to-Head without assigned participants */
          <div className="my-auto py-6 text-center">
            <div className="inline-block border border-white/15 bg-void/60 px-4 py-2 font-mono text-xs uppercase tracking-widest text-dim mb-3">
              Match {String(m.no).padStart(2, '0')}
            </div>
            <h3 className="font-display text-2xl @xl:text-3xl font-black uppercase text-ink">
              Participants TBD
            </h3>
            <p className="mt-2 font-mono text-xs text-dim">
              Competitor seeding or previous round progression pending.
            </p>
          </div>
        ) : (
          /* Genuine Head-to-Head match with participants */
          <div className="my-auto grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 py-6 @xl:gap-6 @4xl:gap-10">
            {/* Team A */}
            <div className="flex min-w-0 flex-col items-end gap-3 text-right @3xl:flex-row-reverse @3xl:items-center @3xl:justify-start">
              {m.teamALogo ? (
                <DynamicImage src={resolveMediaUrl(m.teamALogo)} alt="" className="size-12 rounded-full border border-white/20 object-cover" />
              ) : (
                <Crest name={m.a} size={48} color={g.accent} />
              )}
              <span className={`max-w-full font-display text-[clamp(1.1rem,4.2cqw,3.25rem)] font-black uppercase leading-[0.9] break-words ${
                m.status === 'completed' && m.winnerTeamId && m.teamAId && m.winnerTeamId !== m.teamAId ? 'text-dim/50' : 'text-ink'
              }`}>
                {m.a}
              </span>
            </div>

            {/* Score or VS */}
            <div className="text-center px-2">
              {m.score ? (
                <p className="whitespace-nowrap font-display text-[clamp(2rem,10cqw,5.5rem)] font-black tabular-nums leading-none text-ink">
                  {m.score[0]}
                  <span className={`mx-2 ${isLive ? 'text-live animate-pulse' : 'text-dim'}`}>:</span>
                  {m.score[1]}
                </p>
              ) : (
                <p className="font-display text-[clamp(1.75rem,8cqw,4rem)] font-black leading-none text-dim/50">
                  VS
                </p>
              )}
              <Hud className="mt-2 block">
                {m.status === 'completed' ? 'Final Result' : `Match ${String(m.no).padStart(2, '0')}`}
              </Hud>
            </div>

            {/* Team B */}
            <div className="flex min-w-0 flex-col items-start gap-3 @3xl:flex-row @3xl:items-center">
              {m.teamBLogo ? (
                <DynamicImage src={resolveMediaUrl(m.teamBLogo)} alt="" className="size-12 rounded-full border border-white/20 object-cover" />
              ) : (
                <Crest name={m.b} size={48} color={g.accent} />
              )}
              <span className={`max-w-full font-display text-[clamp(1.1rem,4.2cqw,3.25rem)] font-black uppercase leading-[0.9] break-words ${
                m.status === 'completed' && m.winnerTeamId && m.teamBId && m.winnerTeamId !== m.teamBId ? 'text-dim/50' : 'text-ink'
              }`}>
                {m.b}
              </span>
            </div>
          </div>
        )}

        {/* Footer Bar: Date/Time and ONLY 'Details →' Action */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 font-mono text-xs">
          <Hud className="text-dim">
            {m.date} · {m.time}
          </Hud>

          <Link
            to={`/matches/${m.id}`}
            className="inline-flex items-center gap-1.5 font-display text-sm font-extrabold uppercase tracking-[0.08em] text-cyan hover:text-ink transition-colors"
          >
            Details →
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function Matches() {
  const [game, setGame] = useState<(typeof GAMES)[number]>('All Games')
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>('All Matches')
  const [matches, setMatches] = useState<UiMatchItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMatchesData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getMatches()
      if (Array.isArray(data)) {
        setMatches(data.map(mapApiMatchToUiMatch))
      } else {
        setMatches([])
      }
    } catch (err: any) {
      console.warn('Could not fetch matches:', err)
      setError(err?.message || 'Failed to load tournament matches. Please check your connection and try again.')
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

  const filteredList = matches.filter((m) => {
    const gameMatch = game === 'All Games' || m.game === GMAP[game]
    const statusMatch =
      statusFilter === 'All Matches'
        ? true
        : statusFilter === 'Live'
        ? m.status === 'live'
        : statusFilter === 'Upcoming'
        ? m.status === 'upcoming'
        : m.status === 'completed'
    return gameMatch && statusMatch
  })

  return (
    <>
      <PageHero
        title="MATCHES"
        sub="Track verified tournament matches across Ametheus."
        variant="matches"
        accent="#ff3b4e"
      />

      <Container className="py-10">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
          <Chips items={GAMES} value={game} onChange={setGame} />

          {/* Status Segmented Tabs */}
          <div className="flex items-center gap-1 rounded bg-surface p-1 border border-white/10 font-mono text-xs">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 uppercase font-bold transition-all cursor-pointer ${
                  statusFilter === s
                    ? 'bg-cyan text-void shadow-xs'
                    : 'text-dim hover:text-ink'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10 space-y-4">
          {error ? (
            <div className="border border-live/30 bg-live/5 p-12 text-center flex flex-col items-center justify-center">
              <span className="font-mono text-xs uppercase tracking-widest text-live mb-2">Error Loading Matches</span>
              <h2 className="font-display text-2xl sm:text-3xl font-black uppercase text-ink mb-3">
                Unable to load tournament matches
              </h2>
              <p className="font-mono text-xs text-dim max-w-md mb-6">{error}</p>
              <button
                onClick={() => fetchMatchesData()}
                className="border border-cyan bg-cyan/10 px-5 py-2 font-mono text-xs uppercase font-bold text-cyan hover:bg-cyan/20 transition-colors cursor-pointer"
              >
                ↻ Retry
              </button>
            </div>
          ) : isLoading ? (
            <div className="border border-white/10 bg-surface/50 p-16 text-center">
              <div className="inline-block size-8 animate-spin rounded-full border-2 border-cyan border-t-transparent mb-4" />
              <Hud className="text-cyan">Loading matches...</Hud>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="border border-white/10 bg-surface/40 py-16 px-6 text-center flex flex-col items-center justify-center">
              <h2 className="font-display text-3xl sm:text-4xl font-black uppercase tracking-wider text-ink mb-3">
                {statusFilter === 'Upcoming'
                  ? 'No upcoming matches scheduled yet'
                  : statusFilter === 'Live'
                  ? 'No live matches right now'
                  : statusFilter === 'Completed'
                  ? 'No completed matches found'
                  : 'No matches found'}
              </h2>
              <p className="font-mono text-xs text-dim max-w-md mb-6">
                {statusFilter === 'Upcoming'
                  ? 'There are currently no upcoming tournament matches scheduled. Check back once tournament brackets are seeded.'
                  : statusFilter === 'Live'
                  ? 'There are currently no active tournament matches in progress.'
                  : statusFilter === 'Completed'
                  ? 'No completed tournament matches match the selected filter.'
                  : 'No verified tournament matches match the selected criteria.'}
              </p>
              <Cta to="/tournaments" small>
                Browse Tournaments
              </Cta>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {filteredList.map((m) => (
                <PublicMatchCard key={`match-card-${m.id}`} m={m} />
              ))}
            </div>
          )}
        </div>
      </Container>
    </>
  )
}
