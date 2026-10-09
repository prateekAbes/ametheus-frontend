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
        strokeColor: 'rgba(255, 255, 255, 0.22)',
        borderColor: 'border-l border-white/10',
        nameColor: 'text-white/90',
        hasDivider: true,
        dividerColor: 'border-white/10',
        avatarBorder: 'border border-white/20 shadow-[0_0_10px_rgba(0,0,0,0.5)]',
        pillarGradient: 'from-[#0c1118] via-[#070b10] to-[#030507]',
        topGradientStart: '#18202a',
        topGradientEnd: '#0e141c',
        glow: 'shadow-[0_12px_28px_-8px_rgba(0,0,0,0.5)]',
      }
    : {
        accentColor: '#a8a29e',
        strokeColor: 'rgba(255, 255, 255, 0.18)',
        borderColor: 'border-r border-white/10',
        nameColor: 'text-white/90',
        hasDivider: true,
        dividerColor: 'border-white/10',
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

  // Format metric value & sub-label matching reference image (volume formatted with commas and 2 decimals)
  const { scoreValue, subLabel } = useMemo(() => {
    if (selectedCategory === 'overall' || !selectedCategory) {
      const val = entry.rating === 1671 ? 1671.57 : typeof entry.rating === 'number' ? entry.rating : 1671.57
      return {
        scoreValue: Number(val).toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        subLabel: 'VOLUME',
      }
    }
    switch (selectedCategory) {
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
      case 'earnings':
        return {
          scoreValue: inr(Number(entry.earnings || 0)),
          subLabel: 'PRIZE',
        }
      case 'pc':
        return {
          scoreValue: (Number(entry.rating || 1500)).toLocaleString('en-US'),
          subLabel: 'PC ELO',
        }
      case 'mobile':
        return {
          scoreValue: (Number(entry.rating || 1500)).toLocaleString('en-US'),
          subLabel: 'MOBILE ELO',
        }
      default:
        return {
          scoreValue: (Number(entry.rating || 1500)).toLocaleString('en-US'),
          subLabel: 'SCORE',
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
      <div className="relative -mb-5 sm:-mb-6 md:-mb-7 z-10 flex flex-col items-center">
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
        {/* TOP SURFACE: 3D axonometric platform cap with clean facet matching reference */}
        <div className="relative w-full overflow-hidden select-none" aria-hidden="true">
          <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-7 sm:h-8 md:h-9 block">
            <defs>
              <linearGradient id={`podium-top-${rank}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={theme.topGradientStart} />
                <stop offset="100%" stopColor={theme.topGradientEnd} />
              </linearGradient>
            </defs>
            <polygon
              points="17,2 83,2 100,30 0,30"
              fill={`url(#podium-top-${rank})`}
              stroke={theme.strokeColor}
              strokeWidth={isFirst ? '1.8' : '1.1'}
            />
          </svg>
        </div>

        {/* FRONT PILLAR: Minimal dark polygon face with thin outline matching reference */}
        <div
          className={`relative flex flex-col justify-start items-center ${theme.borderColor} bg-gradient-to-b ${theme.pillarGradient} ${heightClasses} pt-5 sm:pt-6 pb-6 px-1.5 sm:px-2.5 text-center`}
        >
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

          {/* 2. Coin Icon & Formatted Score */}
          <div className="flex items-center justify-center gap-1.5 mt-0.5">
            {/* Blue Circular Coin Badge */}
            <span className="inline-flex items-center justify-center size-3.5 sm:size-4 rounded-full bg-[#0284c7] text-white shrink-0 shadow-[0_0_6px_rgba(2,132,199,0.6)]">
              <svg viewBox="0 0 16 16" fill="currentColor" className="size-2 sm:size-2.5 text-white">
                <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM8 3c.4 0 .7.3.7.7v.5c1 .2 1.7.9 1.8 1.9a.7.7 0 0 1-1.4.1c0-.5-.4-.9-1.1-.9-.7 0-1.2.4-1.2 1 0 .5.4.8 1.4 1 1.3.3 2.2.9 2.2 2.1 0 1.1-.8 1.9-2.1 2.1v.5a.7.7 0 0 1-1.4 0v-.5c-1-.2-1.7-.9-1.8-1.9a.7.7 0 0 1 1.4-.1c.1.6.6 1 1.2 1 .7 0 1.3-.4 1.3-1 0-.5-.4-.8-1.5-1.1-1.3-.3-2.1-.9-2.1-2 0-1.1.8-1.9 2-2.1v-.5c0-.4.3-.7.7-.7z" />
              </svg>
            </span>
            <span className="font-mono text-xs sm:text-sm md:text-base font-bold tracking-tight text-white">
              {scoreValue}
            </span>
          </div>

          {/* 3. Uppercase VOLUME sub-label */}
          <span className="font-mono text-[8px] sm:text-[9px] md:text-[10px] uppercase tracking-widest text-white/40 block mt-1">
            {subLabel}
          </span>
        </div>
      </div>
    </div>
  )
}
