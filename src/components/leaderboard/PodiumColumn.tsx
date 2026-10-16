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

  // Refined Ametheus theme: dark monolithic body with cyan #1 cap & balanced wireframe for #2 & #3
  const theme = isFirst
    ? {
        accentColor: '#25D9F2',
        strokeColor: '#25D9F2',
        borderColor: 'border-l border-r border-[#25D9F2]/50',
        nameColor: 'text-[#25D9F2]',
        hasDivider: false,
        dividerColor: 'border-transparent',
        avatarBorder: 'border-2 border-[#25D9F2] shadow-[0_0_16px_rgba(37,217,242,0.35)]',
        pillarGradient: 'from-[#0e1d2e] via-[#09131f] to-[#04080e]',
        topGradientStart: '#13283f',
        topGradientEnd: '#0a1725',
        glow: 'shadow-[0_16px_36px_-8px_rgba(37,217,242,0.22)]',
      }
    : isSecond
    ? {
        accentColor: '#94a3b8',
        strokeColor: 'rgba(255, 255, 255, 0.28)',
        borderColor: 'border-l border-white/10',
        nameColor: 'text-white/90',
        hasDivider: true,
        dividerColor: 'border-white/15',
        avatarBorder: 'border border-white/25 shadow-[0_0_10px_rgba(0,0,0,0.5)]',
        pillarGradient: 'from-[#0f1722] via-[#090f17] to-[#03060a]',
        topGradientStart: '#15202e',
        topGradientEnd: '#0b121c',
        glow: 'shadow-[0_12px_28px_-8px_rgba(0,0,0,0.5)]',
      }
    : {
        accentColor: '#a8a29e',
        strokeColor: 'rgba(255, 255, 255, 0.24)',
        borderColor: 'border-r border-white/10',
        nameColor: 'text-white/85',
        hasDivider: true,
        dividerColor: 'border-white/15',
        avatarBorder: 'border border-white/20 shadow-[0_0_10px_rgba(0,0,0,0.5)]',
        pillarGradient: 'from-[#0d141e] via-[#080d14] to-[#020407]',
        topGradientStart: '#131c26',
        topGradientEnd: '#090e15',
        glow: 'shadow-[0_12px_28px_-8px_rgba(0,0,0,0.5)]',
      }

  // Canonical username resolution
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

  const avatarUrl = resolveMediaUrl(entry.avatar_url || entry.logo_url)
  const initial = displayName.charAt(0).toUpperCase()

  const avatarContent = avatarUrl ? (
    <DynamicImage
      src={avatarUrl}
      alt={`${displayName} avatar`}
      className="size-full object-cover rounded-none"
    />
  ) : (
    <div className="flex size-full items-center justify-center font-mono font-bold text-white/80 bg-[#141b24] rounded-none">
      {initial}
    </div>
  )

  // Square 1:1 aspect ratio with identical dimensions across all three players (Part D3)
  const avatarSizeClasses = 'size-16 sm:size-18 md:size-20 aspect-square'

  return (
    <div
      className={`group relative flex flex-col items-center justify-end select-none w-full ${
        isFirst ? 'z-20' : 'z-10'
      }`}
    >
      {/* ============================================================== */}
      {/* SQUARE 1:1 AVATAR CENTERED ABOVE PLATFORM WITH CLEAR SEPARATION */}
      {/* ============================================================== */}
      <div className="relative mb-3 sm:mb-4 md:mb-5 z-10 flex flex-col items-center">
        {isCurrentUser ? (
          <Link
            to="/profile"
            title="View your profile"
            className={`relative block ${avatarSizeClasses} rounded-none ${theme.avatarBorder} bg-[#0d131a] overflow-hidden transition-transform group-hover:scale-105`}
          >
            {avatarContent}
          </Link>
        ) : (
          <div
            className={`relative block ${avatarSizeClasses} rounded-none ${theme.avatarBorder} bg-[#0d131a] overflow-hidden transition-transform group-hover:scale-105`}
          >
            {avatarContent}
          </div>
        )}

        {/* Current user marker */}
        {isCurrentUser && (
          <span className="absolute -top-2.5 px-1.5 py-0.5 font-mono text-[7px] uppercase font-bold bg-[#25D9F2] text-black shadow-[0_0_8px_rgba(37,217,242,0.6)] rounded-sm">
            YOU
          </span>
        )}
        {/* Disqualified marker */}
        {isDisqualified && (
          <span className="absolute -top-2.5 px-1.5 py-0.5 font-mono text-[7px] uppercase font-bold bg-rose-500/80 text-white rounded-sm">
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

            {/* 2. Numerical Metric Score */}
            <div className="flex flex-col items-center justify-center mt-1">
              <span className="font-mono text-xs sm:text-sm md:text-base font-bold tracking-tight text-white">
                {scoreValue}
              </span>
              {/* 3. Understated Metric Sub-label */}
              <span className="font-mono text-[8px] sm:text-[9px] md:text-[10px] uppercase tracking-widest text-[#8995A8] mt-0.5">
                {subLabel}
              </span>
            </div>
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
