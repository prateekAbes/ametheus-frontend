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

  // Refined esports theme matching Ametheus: dark polygonal body with crisp metallic accents
  const theme = isFirst
    ? {
        rankLabel: '#1',
        accentColor: '#22c55e',
        strokeColor: 'rgba(34, 197, 94, 0.75)',
        borderColor: 'border-[#22c55e]/50',
        textColor: 'text-[#22c55e]',
        avatarBorder: 'border-2 border-[#22c55e]/90 shadow-[0_0_20px_rgba(34,197,94,0.25)]',
        pillarGradient: 'from-[#0e1711] via-[#080d09] to-[#040605]',
        topGradientStart: '#1b2c1f',
        topGradientEnd: '#0d160f',
        glow: 'shadow-[0_12px_32px_-8px_rgba(34,197,94,0.18)]',
      }
    : isSecond
    ? {
        rankLabel: '#2',
        accentColor: '#94a3b8',
        strokeColor: 'rgba(148, 163, 184, 0.45)',
        borderColor: 'border-white/20',
        textColor: 'text-slate-300',
        avatarBorder: 'border border-slate-300/40 shadow-[0_0_12px_rgba(148,163,184,0.15)]',
        pillarGradient: 'from-[#12161f] via-[#090c10] to-[#050608]',
        topGradientStart: '#1a2230',
        topGradientEnd: '#0f141d',
        glow: 'shadow-[0_8px_24px_-8px_rgba(148,163,184,0.08)]',
      }
    : {
        rankLabel: '#3',
        accentColor: '#a8a29e',
        strokeColor: 'rgba(168, 162, 158, 0.35)',
        borderColor: 'border-white/15',
        textColor: 'text-stone-400',
        avatarBorder: 'border border-white/25',
        pillarGradient: 'from-[#151210] via-[#0b0908] to-[#050504]',
        topGradientStart: '#201a15',
        topGradientEnd: '#110e0c',
        glow: 'shadow-[0_8px_24px_-8px_rgba(0,0,0,0.4)]',
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
              isFirst ? 'size-16 sm:size-20 md:size-24' : isSecond ? 'size-13 sm:size-16 md:size-18' : 'size-12 sm:size-14 md:size-16'
            } rounded-none ${theme.avatarBorder} bg-black overflow-hidden transition-transform group-hover:scale-105`}
          >
            {avatarContent}
          </Link>
        ) : (
          <div
            className={`relative block ${
              isFirst ? 'size-16 sm:size-20 md:size-24' : isSecond ? 'size-13 sm:size-16 md:size-18' : 'size-12 sm:size-14 md:size-16'
            } rounded-none ${theme.avatarBorder} bg-black overflow-hidden transition-transform group-hover:scale-105`}
          >
            {avatarContent}
          </div>
        )}

        {/* Current user marker */}
        {isCurrentUser && (
          <span className="absolute -top-2.5 px-1.5 py-0.5 font-mono text-[7px] uppercase font-bold bg-[#22c55e] text-black shadow-[0_0_8px_rgba(34,197,94,0.6)]">
            YOU
          </span>
        )}
        {/* Disqualified marker */}
        {isDisqualified && (
          <span className="absolute -top-2.5 px-1.5 py-0.5 font-mono text-[7px] uppercase font-bold bg-rose-500/80 text-white">
            DQ
          </span>
        )}
      </div>

      {/* ============================================================== */}
      {/* THREE-DIMENSIONAL ELEVATED POLYGONAL PLATFORM                  */}
      {/* ============================================================== */}
      <div className={`w-full flex flex-col relative ${theme.glow}`}>
        {/* TOP SURFACE: 3D perspective platform cap with crisp angled facets */}
        <div className="relative w-full overflow-hidden select-none" aria-hidden="true">
          <svg viewBox="0 0 100 24" preserveAspectRatio="none" className="w-full h-5 sm:h-6 md:h-7 block">
            <defs>
              <linearGradient id={`podium-top-${rank}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={theme.topGradientStart} />
                <stop offset="100%" stopColor={theme.topGradientEnd} />
              </linearGradient>
            </defs>
            <polygon
              points="10,2 90,2 100,24 0,24"
              fill={`url(#podium-top-${rank})`}
              stroke={theme.strokeColor}
              strokeWidth="1.2"
            />
            {/* Subtle center hairline for facet depth */}
            <line x1="50" y1="2" x2="50" y2="24" stroke={theme.strokeColor} strokeWidth="0.5" opacity="0.35" />
          </svg>
        </div>

        {/* FRONT PILLAR: Minimal dark polygon face with thin outline & metallic gradient */}
        <div
          className={`relative flex flex-col justify-between border-x border-b ${theme.borderColor} bg-gradient-to-b ${theme.pillarGradient} ${heightClasses} p-2.5 sm:p-3 text-center`}
        >
          {/* Subtle esports corner ticks on first place */}
          {isFirst && (
            <>
              <span className="absolute top-0 left-0 size-1 border-t border-l border-[#22c55e]" />
              <span className="absolute top-0 right-0 size-1 border-t border-r border-[#22c55e]" />
            </>
          )}

          {/* Rank Number & Player Info */}
          <div>
            <span className={`font-mono ${isFirst ? 'text-3xl sm:text-4xl md:text-5xl' : 'text-2xl sm:text-3xl md:text-4xl'} font-black ${theme.textColor} tracking-tight`}>
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
                <span className="font-mono text-[9px] text-white/40 block mt-0.5">
                  [{entry.tag}]
                </span>
              )}
            </div>
          </div>

          {/* Recessed Metric Score Dock */}
          <div className="border-t border-white/10 bg-black/40 px-2 py-2 mt-auto">
            <span className="block font-mono text-[8px] sm:text-[9px] uppercase tracking-wider text-white/50">
              {metric.label}
            </span>
            <span className="font-mono text-xs sm:text-sm md:text-base font-bold tracking-tight text-white truncate block mt-0.5">
              {metric.value}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
