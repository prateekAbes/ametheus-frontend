import React, { useMemo } from 'react'
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

  // Platform height hierarchy matching reference: #1 elevated and tallest, #2 medium, #3 lowest
  const heightClasses = isFirst
    ? 'h-56 sm:h-64 md:h-72'
    : isSecond
    ? 'h-42 sm:h-48 md:h-54'
    : 'h-32 sm:h-38 md:h-44'

  // Refined theme matching reference image: dark monolithic body with neon green #1 cap & subtle wireframe for #2 & #3
  const theme = isFirst
    ? {
        accentColor: '#22c55e',
        strokeColor: '#22c55e',
        borderColor: 'border-l border-r border-[#22c55e]/60',
        nameColor: 'text-[#22c55e]',
        hasDivider: false,
        dividerColor: 'border-transparent',
        avatarBorder: 'border border-[#22c55e]/60 shadow-[0_0_14px_rgba(34,197,94,0.3)]',
        pillarGradient: 'from-[#0e141c] via-[#090d14] to-[#040609]',
        topGradientStart: '#18241d',
        topGradientEnd: '#0d1510',
        glow: 'shadow-[0_16px_36px_-8px_rgba(34,197,94,0.18)]',
      }
    : isSecond
    ? {
        accentColor: '#94a3b8',
        strokeColor: 'rgba(255, 255, 255, 0.28)',
        borderColor: 'border-l border-white/10',
        nameColor: 'text-white/90',
        hasDivider: true,
        dividerColor: 'border-white/20',
        avatarBorder: 'border border-white/20 shadow-[0_0_10px_rgba(0,0,0,0.5)]',
        pillarGradient: 'from-[#0c1118] via-[#070b10] to-[#030507]',
        topGradientStart: '#18202a',
        topGradientEnd: '#0e141c',
        glow: 'shadow-[0_12px_28px_-8px_rgba(0,0,0,0.5)]',
      }
    : {
        accentColor: '#a8a29e',
        strokeColor: 'rgba(255, 255, 255, 0.24)',
        borderColor: 'border-r border-white/10',
        nameColor: 'text-white/90',
        hasDivider: true,
        dividerColor: 'border-white/20',
        avatarBorder: 'border border-white/15 shadow-[0_0_10px_rgba(0,0,0,0.5)]',
        pillarGradient: 'from-[#0a0e14] via-[#06090e] to-[#020406]',
        topGradientStart: '#161c24',
        topGradientEnd: '#0d1218',
        glow: 'shadow-[0_12px_28px_-8px_rgba(0,0,0,0.5)]',
      }

  // Canonical username resolution: lowercase to match reference
  const rawName =
    entry.name && !entry.name.toLowerCase().startsWith('player_') && !entry.name.toLowerCase().startsWith('user_')
      ? entry.name
      : entry.captain
      ? entry.captain.replace('@', '')
      : entry.name || 'Contender'

  const displayName = rawName.toLowerCase()

  // Format metric value & sub-label according to the active category
  const { scoreValue, subLabel } = useMemo(() => {
    switch (selectedCategory) {
      case 'overall':
        return {
          scoreValue: (Number(entry.rating || 1500)).toLocaleString('en-US'),
          subLabel: 'RATING',
        }
      case 'win_rate':
        return {
          scoreValue: `${entry.win_rate ?? 0}%`,
          subLabel: 'WIN RATE',
        }
      case 'wins':
        return {
          scoreValue: `${entry.wins ?? 0} W`,
          subLabel: 'MATCH WINS',
        }
      case 'spending':
        return {
          scoreValue: inr(Number(entry.spending || 0)),
          subLabel: 'TOTAL SPENT',
        }
      case 'earnings':
        return {
          scoreValue: inr(Number(entry.earnings || 0)),
          subLabel: 'PRIZE',
        }
      case 'pc':
        return {
          scoreValue: (Number(entry.rating || 1500)).toLocaleString('en-US'),
          subLabel: 'PC RATING',
        }
      case 'mobile':
        return {
          scoreValue: (Number(entry.rating || 1500)).toLocaleString('en-US'),
          subLabel: 'MOBILE RATING',
        }
      default:
        return {
          scoreValue: (Number(entry.rating || 1500)).toLocaleString('en-US'),
          subLabel: 'RATING',
        }
    }
  }, [entry, selectedCategory])

  const avatarUrl = resolveMediaUrl(entry.logo_url)
  const initial = displayName.charAt(0).toUpperCase()

  const avatarContent = avatarUrl ? (
    <DynamicImage
      src={avatarUrl}
      alt={`${displayName} avatar`}
      className="size-full object-cover rounded-lg"
    />
  ) : (
    <div className="flex size-full items-center justify-center font-mono font-bold text-white/80 bg-[#141b24] rounded-lg">
      {initial}
    </div>
  )

  const avatarSizeClasses = isFirst
    ? 'size-16 sm:size-20 md:size-22'
    : isSecond
    ? 'size-14 sm:size-17 md:size-19'
    : 'size-13 sm:size-15 md:size-17'

  return (
    <div
      className={`group relative flex flex-col items-center justify-end select-none w-full ${
        isFirst ? 'z-20' : 'z-10'
      }`}
    >
      {/* ============================================================== */}
      {/* 2D ROUNDED AVATAR RESTING DIRECTLY ON TOP SURFACE OF BLOCK    */}
      {/* ============================================================== */}
      <div className="relative -mb-8 sm:-mb-9 md:-mb-10 z-10 flex flex-col items-center">
        {isCurrentUser ? (
          <Link
            to="/profile"
            title="View your profile"
            className={`relative block ${avatarSizeClasses} rounded-lg ${theme.avatarBorder} bg-[#0d131a] overflow-hidden transition-transform group-hover:scale-105`}
          >
            {avatarContent}
          </Link>
        ) : (
          <div
            className={`relative block ${avatarSizeClasses} rounded-lg ${theme.avatarBorder} bg-[#0d131a] overflow-hidden transition-transform group-hover:scale-105`}
          >
            {avatarContent}
          </div>
        )}

        {/* Current user marker */}
        {isCurrentUser && (
          <span className="absolute -top-2.5 px-1.5 py-0.5 font-mono text-[7px] uppercase font-bold bg-[#22c55e] text-black shadow-[0_0_8px_rgba(34,197,94,0.6)] rounded">
            YOU
          </span>
        )}
        {/* Disqualified marker */}
        {isDisqualified && (
          <span className="absolute -top-2.5 px-1.5 py-0.5 font-mono text-[7px] uppercase font-bold bg-rose-500/80 text-white rounded">
            DQ
          </span>
        )}
      </div>

      {/* ============================================================== */}
      {/* 3D AXONOMETRIC ELEVATED PLATFORM BLOCK                         */}
      {/* ============================================================== */}
      <div className={`w-full flex flex-col relative ${theme.glow}`}>
        {/* TOP SURFACE: 3D axonometric platform cap matching reference */}
        <div className="relative w-full overflow-hidden select-none" aria-hidden="true">
          <svg viewBox="0 0 100 34" preserveAspectRatio="none" className="w-full h-8 sm:h-9 md:h-11 block">
            <defs>
              <linearGradient id={`podium-top-${rank}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={theme.topGradientStart} />
                <stop offset="100%" stopColor={theme.topGradientEnd} />
              </linearGradient>
            </defs>
            {isFirst ? (
              <polygon
                points="16,3 84,3 100,34 0,34"
                fill={`url(#podium-top-${rank})`}
                stroke={theme.strokeColor}
                strokeWidth="1.8"
              />
            ) : isSecond ? (
              <>
                {/* Outer Left Facet Top Angle */}
                <polygon
                  points="0,10 12,3 12,34 0,34"
                  fill="#070a0e"
                  stroke={theme.strokeColor}
                  strokeWidth="1"
                />
                {/* Main Top Platform Surface */}
                <polygon
                  points="12,3 90,3 100,34 12,34"
                  fill={`url(#podium-top-${rank})`}
                  stroke={theme.strokeColor}
                  strokeWidth="1.1"
                />
              </>
            ) : (
              <>
                {/* Main Top Platform Surface */}
                <polygon
                  points="0,3 88,3 88,34 0,34"
                  fill={`url(#podium-top-${rank})`}
                  stroke={theme.strokeColor}
                  strokeWidth="1.1"
                />
                {/* Outer Right Facet Top Angle */}
                <polygon
                  points="88,3 100,10 100,34 88,34"
                  fill="#06080c"
                  stroke={theme.strokeColor}
                  strokeWidth="1"
                />
              </>
            )}
          </svg>
        </div>

        {/* PILLAR BODY: Substantial vertical faces with true 3D outer facets */}
        <div className={`w-full flex ${heightClasses} select-none`}>
          {/* Rank 2: Left Side Outer Facet */}
          {isSecond && (
            <div
              className="w-2.5 sm:w-3.5 md:w-4 shrink-0 bg-gradient-to-b from-[#070a0e] via-[#040609] to-[#020305] border-l border-r border-white/10"
              aria-hidden="true"
            />
          )}

          {/* Front Face Content Container */}
          <div
            className={`flex-1 min-w-0 relative flex flex-col justify-start items-center ${
              isFirst ? theme.borderColor : ''
            } bg-gradient-to-b ${theme.pillarGradient} pt-5 sm:pt-6 pb-6 px-1.5 sm:px-2.5 text-center`}
          >
            {/* Top divider on Rank 3 matching reference layout */}
            {isThird && (
              <div className="w-12 sm:w-16 mx-auto mb-2 sm:mb-2.5 border-b border-white/20" />
            )}

            {/* 1. Rank & Name Inline Monospaced Label */}
            <div className="w-full truncate px-1">
              {isCurrentUser ? (
                <Link
                  to="/profile"
                  title="View your profile"
                  className={`font-mono text-[8.5px] xs:text-[9.5px] sm:text-xs md:text-sm font-semibold tracking-tighter sm:tracking-tight ${theme.nameColor} hover:underline truncate block`}
                >
                  [{rank}] {displayName}
                </Link>
              ) : (
                <p className={`font-mono text-[8.5px] xs:text-[9.5px] sm:text-xs md:text-sm font-semibold tracking-tighter sm:tracking-tight ${theme.nameColor} truncate`}>
                  [{rank}] {displayName}
                </p>
              )}
            </div>

            {/* Subtle Divider Line on 2 & 3, negative space on 1 */}
            {theme.hasDivider ? (
              <div className={`w-14 sm:w-18 mx-auto my-1.5 sm:my-2 border-b ${theme.dividerColor}`} />
            ) : (
              <div className="h-2 sm:h-3" />
            )}

            {/* 2. Numerical Metric Score with circular cyan badge matching reference */}
            <div className="flex items-center justify-center gap-1.5 mt-0.5">
              <span className="inline-flex items-center justify-center size-3.5 sm:size-4 shrink-0 text-[#25D9F2] select-none" aria-hidden="true">
                <svg viewBox="0 0 16 16" className="size-3.5 sm:size-4" fill="none">
                  <circle cx="8" cy="8" r="6.5" stroke="#25D9F2" strokeWidth="1.4" />
                  <circle cx="8" cy="8" r="2.2" fill="#25D9F2" />
                </svg>
              </span>
              <span className="font-mono text-xs sm:text-sm md:text-base font-bold tracking-tight text-white">
                {scoreValue}
              </span>
            </div>

            {/* 3. Understated Metric Sub-label */}
            <span className="font-mono text-[8px] sm:text-[9px] md:text-[10px] uppercase tracking-widest text-white/40 block mt-1">
              {subLabel}
            </span>
          </div>

          {/* Rank 3: Right Side Outer Facet */}
          {isThird && (
            <div
              className="w-2.5 sm:w-3.5 md:w-4 shrink-0 bg-gradient-to-b from-[#06080c] via-[#030508] to-[#020304] border-l border-r border-white/10"
              aria-hidden="true"
            />
          )}
        </div>
      </div>
    </div>
  )
}
