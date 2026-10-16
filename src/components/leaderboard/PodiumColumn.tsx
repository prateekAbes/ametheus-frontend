import React, { useMemo } from 'react'
import { Link } from 'react-router'
import { LeaderboardEntry } from '../../services/leaderboard'
import { resolveMediaUrl } from '../../services/apiClient'
import DynamicImage from '../DynamicImage'
import { inr } from '../../lib/data'
import { MetricTokenIcon } from './MetricTokenIcon'

interface PodiumColumnProps {
  entry: LeaderboardEntry
  rank: 1 | 2 | 3
  selectedCategory: string
  isCurrentUser?: boolean
  isDisqualified?: boolean
}

/**
 * Geometric, dark flat-fronted podium platform with perspective top surface.
 * Reconstructed strictly to match the authoritative reference screenshot:
 * - 3-level stair height proportions (Center #1 tallest 100%, Left #2 ~73%, Right #3 ~50%).
 * - Symmetrical perspective top surface for #1 with thin cyan highlight outline (#3ef2ff).
 * - Subtle neutral borders on #2 and #3 top surfaces.
 * - Square 1:1 avatars resting directly on top surfaces, uniform size across all 3 platforms.
 * - Prestigious, exclusive #1 rank presentation with recognition description and balanced score prominence.
 * - Clean front face text layout preserving authentic data and typography tokens.
 */
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

  // Height proportions matching reference (100% : 73% : 50%)
  const heightClasses = isFirst
    ? 'h-60 sm:h-70 md:h-82 lg:h-90'
    : isSecond
    ? 'h-40 sm:h-48 md:h-56 lg:h-62'
    : 'h-28 sm:h-32 md:h-38 lg:h-42'

  const theme = isFirst
    ? {
        platformBg: 'bg-gradient-to-b from-[#0c121d] via-[#080d16] to-[#04060a]',
        platformBorder: 'border-l border-r border-b border-white/20',
        rankText: 'text-[#4ade80] font-bold',
        nameColor: 'text-[#4ade80] font-bold',
        scoreColor: 'text-white',
        scoreSize: 'text-sm sm:text-base md:text-lg font-bold',
        elevation: 'z-20 shadow-[0_20px_50px_rgba(0,0,0,0.85)]',
      }
    : isSecond
    ? {
        platformBg: 'bg-gradient-to-b from-[#090e16] via-[#060910] to-[#030508]',
        platformBorder: 'border-l border-b border-white/15',
        rankText: 'text-white/70 font-bold',
        nameColor: 'text-white/90 font-bold',
        scoreColor: 'text-white',
        scoreSize: 'text-xs sm:text-sm md:text-base font-semibold',
        elevation: 'z-10',
      }
    : {
        platformBg: 'bg-gradient-to-b from-[#070a10] via-[#05080e] to-[#020306]',
        platformBorder: 'border-r border-b border-white/15',
        rankText: 'text-white/60 font-bold',
        nameColor: 'text-white/80 font-bold',
        scoreColor: 'text-white',
        scoreSize: 'text-xs sm:text-sm md:text-base font-semibold',
        elevation: 'z-10',
      }

  // Canonical username resolution (preserving proper casing)
  const rawName =
    entry.name &&
    !entry.name.toLowerCase().startsWith('player_') &&
    !entry.name.toLowerCase().startsWith('user_')
      ? entry.name
      : entry.captain
      ? entry.captain.replace('@', '')
      : entry.name || 'Contender'

  const displayName = rawName.trim()

  // Format metric value & sub-label according to the active category (matching Figma design)
  const { scoreValue, subLabel } = useMemo(() => {
    switch (selectedCategory) {
      case 'spending':
        return {
          scoreValue: inr(Number(entry.spending || 0)),
          subLabel: 'VOLUME',
        }
      case 'win_rate':
        return {
          scoreValue: `${entry.win_rate ?? 0}%`,
          subLabel: 'WIN RATE',
        }
      case 'wins':
        return {
          scoreValue: (entry.wins ?? 0).toLocaleString(),
          subLabel: 'MATCH WINS',
        }
      case 'overall':
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
    <div className="flex size-full items-center justify-center font-display font-bold text-white/85 bg-[#141b24] rounded-none text-base sm:text-lg md:text-xl">
      {initial}
    </div>
  )

  return (
    <div
      className={`group relative flex flex-col items-center justify-end select-none w-full ${theme.elevation}`}
    >
      {/* ============================================================== */}
      {/* SQUARE 1:1 AVATAR RESTING DIRECTLY ON TOP SURFACE              */}
      {/* Consistent dimensions across all 3 platforms, thin clean border */}
      {/* ============================================================== */}
      <div className="relative -mb-3 sm:-mb-4 md:-mb-5 z-30 flex flex-col items-center">
        {isCurrentUser ? (
          <Link
            to="/profile"
            title="View your profile"
            className="relative block size-16 sm:size-20 md:size-22 aspect-square rounded-none border border-white/20 bg-[#0d131a] overflow-hidden transition-transform group-hover:scale-105"
          >
            {avatarContent}
          </Link>
        ) : (
          <div className="relative block size-16 sm:size-20 md:size-22 aspect-square rounded-none border border-white/20 bg-[#0d131a] overflow-hidden transition-transform group-hover:scale-105">
            {avatarContent}
          </div>
        )}

        {/* Current user marker */}
        {isCurrentUser && (
          <span className="absolute -top-2.5 px-1.5 py-0.5 font-mono text-[8px] uppercase font-bold bg-white text-black rounded-xs shadow-xs">
            YOU
          </span>
        )}
        {/* Disqualified marker */}
        {isDisqualified && (
          <span className="absolute -top-2.5 px-1.5 py-0.5 font-mono text-[8px] uppercase font-bold bg-rose-500/90 text-white rounded-xs">
            DQ
          </span>
        )}
      </div>

      {/* ============================================================== */}
      {/* PERSPECTIVE TOP SURFACE (Tilted plane)                         */}
      {/* Center #1: Thin sharp cyan highlight outline (#3ef2ff)         */}
      {/* Left #2 & Right #3: Subtle neutral white/20 outline             */}
      {/* ============================================================== */}
      <div className="w-full relative z-20">
        {isFirst ? (
          <svg
            viewBox="0 0 100 28"
            preserveAspectRatio="none"
            className="w-full h-7 sm:h-9 md:h-11 block overflow-visible"
          >
            <polygon
              points="10,0 90,0 100,28 0,28"
              fill="#0d141e"
              stroke="#4ade80"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        ) : isSecond ? (
          <svg
            viewBox="0 0 100 28"
            preserveAspectRatio="none"
            className="w-full h-6 sm:h-8 md:h-10 block overflow-visible"
          >
            <polygon
              points="14,0 100,0 100,28 0,28"
              fill="#090e16"
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        ) : (
          <svg
            viewBox="0 0 100 28"
            preserveAspectRatio="none"
            className="w-full h-5 sm:h-7 md:h-9 block overflow-visible"
          >
            <polygon
              points="0,0 86,0 100,28 0,28"
              fill="#070a10"
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        )}
      </div>

      {/* ============================================================== */}
      {/* FLAT VERTICAL FRONT FACE                                       */}
      {/* Exact minimal 3-line layout matching approved Figma design     */}
      {/* ============================================================== */}
      <div
        className={`w-full flex flex-col justify-start items-center ${heightClasses} ${theme.platformBg} ${theme.platformBorder} pt-3 sm:pt-4 md:pt-5 pb-3 sm:pb-4 md:pb-5 px-1.5 sm:px-3 text-center`}
      >
        {/* Line 1: [rank] username */}
        <div className="w-full flex items-center justify-center gap-1.5 px-1 truncate">
          <span
            className={`font-mono text-xs sm:text-sm font-semibold shrink-0 ${
              isFirst ? 'text-[#4ade80]' : theme.rankText
            }`}
          >
            [{rank}]
          </span>
          {isCurrentUser ? (
            <Link
              to="/profile"
              title="View your profile"
              className={`font-mono text-xs sm:text-sm tracking-normal ${
                isFirst ? 'text-[#4ade80]' : theme.nameColor
              } hover:underline transition-colors truncate block`}
            >
              {displayName}
            </Link>
          ) : (
            <span
              className={`font-mono text-xs sm:text-sm tracking-normal ${
                isFirst ? 'text-[#4ade80]' : theme.nameColor
              } truncate block`}
            >
              {displayName}
            </span>
          )}
        </div>

        {/* Line 2: Blue circular coin/token symbol + Score value */}
        {/* Line 3: Metric sub-label */}
        <div className="mt-auto pt-2 pb-0.5 flex flex-col items-center">
          <div className="flex items-center justify-center gap-1.5">
            <MetricTokenIcon className="size-3.5 sm:size-4" />
            <span
              className={`font-mono ${theme.scoreSize} tracking-tight font-bold text-white block`}
            >
              {scoreValue}
            </span>
          </div>
          <span className="font-mono text-[9px] sm:text-[10px] md:text-xs uppercase tracking-widest text-[#8995A8] mt-1 block">
            {subLabel}
          </span>
        </div>
      </div>
    </div>
  )
}
