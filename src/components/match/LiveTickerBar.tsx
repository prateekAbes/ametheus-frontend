import { TickerEvent } from '../../hooks/useMatchTicker'

interface Props {
  isConnected: boolean
  events?: TickerEvent[]
  latestEvent: TickerEvent | null
}

export function LiveTickerBar({ isConnected, latestEvent }: Props) {
  return (
    <div className="w-full border-y border-white/10 bg-void/90 py-2.5 px-4 backdrop-blur-md">
      <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 border border-white/10 bg-surface/80">
            <span
              className={`size-2 rounded-full ${
                isConnected ? 'bg-ok animate-pulse' : 'bg-warn'
              }`}
            />
            <span className="font-mono text-[10px] text-dim uppercase tracking-wider font-bold">
              {isConnected ? 'TELEMETRY: LIVE' : 'TELEMETRY: CONNECTING...'}
            </span>
          </div>

          <span className="hidden md:inline-block text-white/20 font-mono">•</span>
          <span className="hidden md:inline-block text-dim font-mono text-[11px]">
            Real-time Bracket Telemetry &amp; Match Feeds
          </span>
        </div>

        <div className="flex items-center gap-3 overflow-hidden text-ellipsis whitespace-nowrap min-w-0 max-w-full">
          {latestEvent && latestEvent.event !== 'CONNECTED' ? (
            <div className="flex items-center gap-2 min-w-0 truncate">
              {latestEvent.event === 'MATCH_VERIFIED' ? (
                <span className="text-ok font-mono text-xs font-bold">✓</span>
              ) : (
                <span className="text-live font-mono text-xs font-bold">⚡</span>
              )}
              <span className="font-mono text-ink text-[11px] min-w-0 truncate">
                {latestEvent.event === 'MATCH_SCORE_SUBMITTED' && (
                  <>
                    <strong className="text-live">SCORE SUBMITTED:</strong> Match{' '}
                    {latestEvent.match_id?.slice(0, 8)}... (Score: {latestEvent.score || 'Recorded'})
                  </>
                )}
                {latestEvent.event === 'MATCH_VERIFIED' && (
                  <>
                    <strong className="text-ok">MATCH VERIFIED:</strong> Match{' '}
                    {latestEvent.match_id?.slice(0, 8)}... Result Certified
                  </>
                )}
                {latestEvent.event !== 'MATCH_SCORE_SUBMITTED' &&
                  latestEvent.event !== 'MATCH_VERIFIED' && (
                    <span>{latestEvent.message || latestEvent.event}</span>
                  )}
              </span>
              <span className="text-[10px] text-dim font-mono shrink-0">
                [{latestEvent.timestamp}]
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-dim font-mono text-[11px] min-w-0 truncate">
              <span className="size-1.5 rounded-full bg-live animate-ping shrink-0" />
              <span className="truncate">Monitoring authoritative match lobbies and bracket tree advances...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
