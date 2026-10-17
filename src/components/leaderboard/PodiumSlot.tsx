import React from 'react'
import { Link } from 'react-router'
import { Avatar } from './Avatar'
import {
  LeaderboardPlayer,
  MetricId,
  METRICS,
  showPlayerMetricValue,
} from '../../services/leaderboard'

export const Mono = ({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) => (
  <span className={`font-mono text-[11px] uppercase tracking-[0.14em] text-dim ${className}`}>
    {children}
  </span>
)

interface PodiumSlotProps {
  p?: LeaderboardPlayer
  m: MetricId
  order: string
}

/**
 * Three-Player Podium Slot from Leaderboard UI Design:
 * - 1st Place: elevated, w-28 md:w-36 avatar with ring-1 ring-cyan/40, text-6xl md:text-7xl title, h-72 md:h-80 pedestal with cyan/70 top border, text-6xl md:text-7xl cyan score
 * - 2nd/3rd Place: w-20 md:w-24 avatar, text-4xl md:text-5xl title, h-64 md:h-72 (2nd) or h-60 md:h-64 (3rd) pedestal with white/25 top border
 * - Ghost watermark rank number (text-white/20 text-7xl md:text-8xl)
 * - Overall supporting stats (Wins & Win Rate) side-by-side with border-t border-white/10
 */
export function PodiumSlot({ p, m, order }: PodiumSlotProps) {
  if (!p) {
    return null
  }

  const first = p.rank === 1
  const metricConfig = METRICS.find((x) => x.id === m) || METRICS[0]
  const unit = metricConfig.unit
  const height = ['', 'h-72 md:h-80', 'h-64 md:h-72', 'h-60 md:h-64'][p.rank] || 'h-60 md:h-64'

  // Proportional avatar sizing matching podium hierarchy (Rank 1 > Rank 2 > Rank 3)
  const avatarClass =
    p.rank === 1
      ? 'w-24 text-3xl ring-1 ring-cyan/40 md:w-28 md:text-4xl'
      : p.rank === 2
      ? 'w-[74px] text-xl md:w-[86px] md:text-2xl'
      : 'w-[70px] text-xl md:w-20 md:text-2xl'

  return (
    <div className={`flex flex-col items-center ${order} w-full`}>
      <div className={`flex w-full flex-col items-center text-center ${first ? 'pb-8' : 'pb-6'}`}>
        {p.isCurrentUser ? (
          <Link to="/profile" title="View your profile" className="group">
            <Avatar
              p={p}
              className={`${avatarClass} transition-transform group-hover:scale-105`}
            />
          </Link>
        ) : (
          <Avatar p={p} className={avatarClass} />
        )}
        <h2
          title={p.name}
          className={`mt-4 w-full px-2 font-display font-black uppercase leading-[0.95] tracking-tight text-white truncate ${
            first
              ? 'text-3xl sm:text-4xl md:text-[2.75rem]'
              : 'text-xl sm:text-2xl md:text-3xl'
          }`}
        >
          {p.isCurrentUser ? (
            <Link to="/profile" className="hover:text-cyan transition-colors">
              {p.name}
            </Link>
          ) : (
            p.name
          )}
        </h2>
      </div>

      <div className={`relative flex w-full flex-col items-center px-3 pt-3 text-center ${height}`}>
        <div className="absolute inset-0 rounded-t-sm border border-b-0 border-white/10 bg-surface" />
        <div className={`absolute inset-x-0 top-0 h-px ${first ? 'bg-cyan/70' : 'bg-white/25'}`} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />

        <span className="relative font-display text-7xl font-black leading-none tabular-nums text-white/20 md:text-8xl">
          {p.rank}
        </span>
        <div
          className={`relative mt-4 font-display font-extrabold leading-none tabular-nums ${
            first ? 'text-6xl text-cyan md:text-7xl' : 'text-4xl text-ink md:text-5xl'
          }`}
        >
          {showPlayerMetricValue(p, m)}
        </div>
        <Mono className="relative mt-1.5">{unit}</Mono>
        {m === 'overall' && (
          <div className="relative mt-5 flex gap-7 border-t border-white/10 pt-4">
            <div>
              <div className="font-mono text-sm font-bold tabular-nums">{p.wins}</div>
              <Mono>Wins</Mono>
            </div>
            <div>
              <div className="font-mono text-sm font-bold tabular-nums">{p.winRate}%</div>
              <Mono>Win Rate</Mono>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
