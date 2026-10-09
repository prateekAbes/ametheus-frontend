import React from 'react'
import { Link } from 'react-router'
import { LeaderboardEntry } from '../../services/leaderboard'
import { resolveMediaUrl } from '../../services/apiClient'
import DynamicImage from '../DynamicImage'
import { inr } from '../../lib/data'

interface PodiumColumnProps {
  entry: LeaderboardEntry
  rank: 1 | 2 | 3
  selectedCategory: string
  isCurrentUser?: boolean
  isDisqualified?: boolean
}

export function PodiumColumn({
  entry,
  rank,
  selectedCategory,
  isCurrentUser = false,
  isDisqualified = false,
}: PodiumColumnProps) {
  const isFirst = rank === 1
  const isSecond = rank === 2
  const isThird = rank === 3

  // Platform height hierarchy: #1 elevated and tallest, #2 and #3 stepped down
  const heightClasses = isFirst
    ? 'h-52 sm:h-60 md:h-68'
    : isSecond
    ? 'h-36 sm:h-44 md:h-50'
    : 'h-32 sm:h-40 md:h-44'

  // Minimal theme matching reference: dark polygonal body with thin understated green outlines
  const theme = isFirst
    ? {
        rankLabel: '#1',
        accentColor: '#22c55e',
        borderColor: 'border-[#22c55e]/60',
        topBorder: 'border-[#22c55e]/70',
        textColor: 'text-[#22c55e]',
        avatarBorder: 'border-[#22c55e]/80',
        platformBg: 'bg-[#090b0e]',
        topBg: '#0f141a',
      }
    : isSecond
    ? {
        rankLabel: '#2',
        accentColor: '#94a3b8',
        borderColor: 'border-white/20',
        topBorder: 'border-white/25',
        textColor: 'text-slate-300',
        avatarBorder: 'border-white/30',
        platformBg: 'bg-[#07080a]',
        topBg: '#0c0e12',
      }
    : {
        rankLabel: '#3',
        accentColor: '#78716c',
        borderColor: 'border-white/15',
        topBorder: 'border-white/20',
        textColor: 'text-stone-400',
        avatarBorder: 'border-white/20',
        platformBg: 'bg-[#060708]',
        topBg: '#0a0b0d',
      }

  // Format ONLY the selected metric value — no clutter, no redundant stats
  const getMetricDisplay = () => {
    switch (selectedCategory) {
      case 'win_rate':
        return {
          label: 'WIN RATE',
          value: `${entry.win_rate ?? 0}%`,
        }
      case 'wins':
        return {
          label: 'MATCH WINS',
          value: `${entry.wins ?? 0} W`,
        }
      case 'earnings':
        return {
          label: 'PRIZE',
          value: inr(Number(entry.earnings || 0)),
        }
      case 'pc':
        return {
          label: 'PC ELO',
          value: `${entry.rating ?? 1500}`,
        }
      case 'mobile':
        return {
          label: 'MOBILE ELO',
          value: `${entry.rating ?? 1500}`,
        }
      case 'overall':
      default:
        return {
          label: 'SCORE',
          value: `${entry.rating ?? 1500}`,
        }
    }
  }

  const metric = getMetricDisplay()
  const avatarUrl = resolveMediaUrl(entry.logo_url)
  // Canonical username resolution
  const displayName =
    entry.name && !entry.name.toLowerCase().startsWith('player_') && !entry.name.toLowerCase().startsWith('user_')
      ? entry.name
      : entry.captain
      ? entry.captain.replace('@', '')
      : entry.name || 'Contender'

  const initial = displayName.charAt(0).toUpperCase()

  const avatarContent = avatarUrl ? (
    <DynamicImage
      src={avatarUrl}
      alt={`${displayName} avatar`}
      className="size-full object-cover rounded-none"
    />
  ) : (
    <div className="flex size-full items-center justify-center font-mono font-bold text-white/80 bg-white/5">
      {initial}
    </div>
  )

  return (
    <div
      className={`group relative flex flex-col items-center justify-end select-none ${
        isFirst ? 'z-20 -translate-y-2 sm:-translate-y-4' : 'z-10'
      }`}
    >
      {/* ============================================================== */}
      {/* SQUARE PLAYER AVATAR POSITIONED DIRECTLY ABOVE PLATFORM        */}
      {/* ============================================================== */}
      <div className="relative mb-2 flex flex-col items-center">
        {isCurrentUser ? (
          <Link
            to="/profile"
            title="View your profile"
            className={`relative block ${
              isFirst ? 'size-16 sm:size-20 md:size-24' : 'size-12 sm:size-16 md:size-18'
            } rounded-none border ${theme.avatarBorder} bg-black overflow-hidden transition-transform group-hover:scale-105`}
          >
            {avatarContent}
          </Link>
        ) : (
          <div
            className={`relative block ${
              isFirst ? 'size-16 sm:size-20 md:size-24' : 'size-12 sm:size-16 md:size-18'
            } rounded-none border ${theme.avatarBorder} bg-black overflow-hidden transition-transform group-hover:scale-105`}
          >
            {avatarContent}
          </div>
        )}

        {/* Current user marker */}
        {isCurrentUser && (
          <span className="absolute -top-2 px-1 py-0.2 font-mono text-[7px] uppercase font-bold bg-[#22c55e] text-black">
            YOU
          </span>
        )}
      </div>

      {/* ============================================================== */}
      {/* THREE-DIMENSIONAL ELEVATED POLYGONAL PLATFORM                  */}
      {/* ============================================================== */}
      <div className="w-full flex flex-col relative">
        {/* TOP SURFACE: Perspective platform face with thin outline */}
        <div
          className={`relative h-5 sm:h-7 md:h-8 w-full border-t border-x ${theme.topBorder}`}
          style={{
            background: theme.topBg,
            clipPath: 'polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)',
          }}
          aria-hidden="true"
        >
          {/* Subtle grid line inside top surface */}
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.2) 1px, transparent 1px)',
              backgroundSize: '12px 12px',
            }}
          />
        </div>

        {/* FRONT PILLAR: Minimal dark polygon face with thin outline */}
        <div
          className={`relative flex flex-col justify-between border-x border-b ${theme.borderColor} ${theme.platformBg} ${heightClasses} p-2.5 sm:p-3 text-center`}
        >
          {/* Rank Number & Player Info */}
          <div>
            <span className={`font-mono text-2xl sm:text-3xl md:text-4xl font-black ${theme.textColor}`}>
              {theme.rankLabel}
            </span>

            <div className="mt-1">
              {isCurrentUser ? (
                <Link
                  to="/profile"
                  className="font-mono text-xs sm:text-sm font-bold uppercase tracking-tight text-white hover:text-[#22c55e] transition-colors truncate block"
                >
                  {displayName}
                </Link>
              ) : (
                <p className="font-mono text-xs sm:text-sm font-bold uppercase tracking-tight text-white truncate">
                  {displayName}
                </p>
              )}
              {entry.tag && (
                <span className="font-mono text-[9px] text-white/40 block">
                  [{entry.tag}]
                </span>
              )}
            </div>
          </div>

          {/* Metric Score ONLY — aligned to reference minimalism */}
          <div className="border-t border-white/10 pt-2 pb-1">
            <span className="block font-mono text-[8px] uppercase tracking-wider text-white/40">
              {metric.label}
            </span>
            <span className={`font-mono text-sm sm:text-lg md:text-xl font-bold tracking-tight text-white truncate block mt-0.5`}>
              {metric.value}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
