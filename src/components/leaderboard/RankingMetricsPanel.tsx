import React from 'react'
import { METRIC_GROUPS, MetricId } from '../../services/leaderboard'

export interface RankingMetricsPanelProps {
  currentMetric: MetricId
  onSelectMetric: (m: MetricId) => void
  userPosition: {
    rankText: string
    subText: string
  }
  className?: string
}

/**
 * Left-Side Ranking Metrics Panel & Dynamic Your Position Card
 * Proportions: ~190–210px width
 * Groups:
 * - PERFORMANCE: Overall Standing, Win Rate, Match Wins, Win Streak
 * - ACTIVITY: Matches Played, Top 3 Finishes
 * - ECONOMY: Prize Earnings, Highest Spending
 */
export function RankingMetricsPanel({
  currentMetric,
  onSelectMetric,
  userPosition,
  className = '',
}: RankingMetricsPanelProps) {
  return (
    <aside className={`flex flex-col justify-between w-full lg:w-[200px] shrink-0 ${className}`}>
      <div className="space-y-6">
        <div>
          <h3 className="font-mono text-xs uppercase tracking-[0.18em] text-white font-bold mb-4">
            RANK BY
          </h3>
          <div className="space-y-6">
            {METRIC_GROUPS.map((grp) => (
              <div key={grp.group}>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-dim/80 font-bold mb-2.5 block">
                  {grp.group}
                </span>
                <div className="space-y-1">
                  {grp.items.map((x) => {
                    const on = x.id === currentMetric
                    return (
                      <button
                        key={x.id}
                        type="button"
                        onClick={() => onSelectMetric(x.id)}
                        aria-pressed={on}
                        className={`group flex items-center gap-3 w-full py-1 text-left text-sm transition-colors cursor-pointer ${
                          on ? 'text-white font-bold' : 'text-dim hover:text-white'
                        }`}
                      >
                        <span
                          className={`h-px transition-all ${
                            on ? 'w-5 bg-cyan' : 'w-2 bg-white/20 group-hover:bg-white/40'
                          }`}
                        />
                        <span className="truncate">{x.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* YOUR POSITION Card at the bottom of the left sidebar */}
      <div className="mt-8 rounded-sm border border-white/10 bg-[#0d121c]/90 p-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-dim font-bold">
          YOUR POSITION
        </div>
        <div className="mt-2 font-display text-4xl font-black text-cyan leading-none tabular-nums">
          {userPosition.rankText}
        </div>
        <div className="mt-2 font-mono text-xs text-dim leading-relaxed">
          {userPosition.subText}
        </div>
      </div>
    </aside>
  )
}
