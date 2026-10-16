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

/**
 * Clean, flat geometric stair-step podium column.
 * - Simple geometric flat surfaces; NO 3D axonometric SVG polygons, no bulky layers.
 * - Profile presentation with square avatar, name, rank, metrics.
 * - Clean neutral styling: NO blue outline around avatars, NO blue glowing borders around platforms.
 * - Height hierarchy: 1st tallest (center), 2nd medium (left), 3rd shortest (right).
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

  // Clean stair-step height hierarchy: #1 tallest in center, #2 medium on left, #3 shortest on right
  const heightClasses = isFirst
    ? 'h-56 sm:h-64 md:h-72'
    : isSecond
    ? 'h-42 sm:h-48 md:h-54'
    : 'h-32 sm:h-38 md:h-44'

  // Refined minimal dark theme with neutral, subtle borders (NO blue outlines / glowing borders)
  const theme = isFirst
    ? {
        rankBadgeBg: 'bg-white/10 text-white border-white/20',
        platformBg: 'bg-gradient-to-b from-[#141d2c] via-[#0d1420] to-[#070b12]',
        platformBorder: 'border-t border-l border-r border-white/20',
        nameColor: 'text-white font-bold',
        scoreColor: 'text-white font-black',
        avatarBorder: 'border border-white/25',
      }
    : isSecond
    ? {
        rankBadgeBg: 'bg-white/5 text-white/80 border-white/10',
        platformBg: 'bg-gradient-to-b from-[#101724] via-[#0b101a] to-[#06090e]',
        platformBorder: 'border-t border-l border-r border-white/10',
        nameColor: 'text-white/90 font-semibold',
        scoreColor: 'text-white/95 font-bold',
        avatarBorder: 'border border-white/15',
      }
    : {
        rankBadgeBg: 'bg-white/5 text-white/70 border-white/10',
        platformBg: 'bg-gradient-to-b from-[#0e141f] via-[#090d16] to-[#05080c]',
        platformBorder: 'border-t border-l border-r border-white/10',
        nameColor: 'text-white/80 font-semibold',
        scoreColor: 'text-white/90 font-bold',
        avatarBorder: 'border border-white/15',
      }

  // Canonical username resolution
  const rawName =
    entry.name &&
    !entry.name.toLowerCase().startsWith('player_') &&
    !entry.name.toLowerCase().startsWith('user_')
      ? entry.name
      : entry.captain
      ? entry.captain.replace('@', '')
      : entry.name || 'Contender'

  const displayName = rawName.toLowerCase()

  // Format metric value & sub-label according to the active category
  const { scoreValue, subLabel } = useMemo(() => {
    switch (selectedCategory) {
      case 'spending':
        return {
          scoreValue: inr(Number(entry.spending || 0)),
          subLabel: 'TOTAL SPENT',
        }
      case 'win_rate':
        return {
          scoreValue: `${entry.win_rate ?? 0}%`,
          subLabel: 'WIN RATE',
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
    <div className="flex size-full items-center justify-center font-mono font-bold text-white/80 bg-[#141b24] rounded-none">
      {initial}
    </div>
  )

  // Square 1:1 aspect ratio across all three podium players
  const avatarSizeClasses = 'size-16 sm:size-18 md:size-20 aspect-square'

  return (
    <div
      className={`group relative flex flex-col items-center justify-end select-none w-full ${
        isFirst ? 'z-20' : 'z-10'
      }`}
    >
      {/* ============================================================== */}
      {/* SQUARE 1:1 AVATAR CENTERED ABOVE PLATFORM                     */}
      {/* Minimal neutral border: NO blue outline or glowing halo       */}
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
          <span className="absolute -top-2.5 px-1.5 py-0.5 font-mono text-[7px] uppercase font-bold bg-white text-black rounded-sm shadow-sm">
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
      {/* SIMPLE GEOMETRIC FLAT STAIR-STEP PLATFORM                      */}
      {/* Flat surface, clean neutral borders, no 3D axonometric angles  */}
      {/* ============================================================== */}
      <div
        className={`w-full flex flex-col justify-start items-center ${heightClasses} ${theme.platformBg} ${theme.platformBorder} rounded-t-sm pt-4 sm:pt-6 pb-6 px-1.5 sm:px-3 text-center`}
      >
        {/* Rank Badge */}
        <span
          className={`inline-flex items-center justify-center font-mono text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-sm border ${theme.rankBadgeBg} mb-2`}
        >
          #{rank}
        </span>

        {/* Contender Name */}
        <div className="w-full truncate px-1">
          {isCurrentUser ? (
            <Link
              to="/profile"
              title="View your profile"
              className={`font-mono text-[10px] xs:text-xs sm:text-sm tracking-tight ${theme.nameColor} hover:underline truncate block`}
            >
              {displayName}
            </Link>
          ) : (
            <p
              className={`font-mono text-[10px] xs:text-xs sm:text-sm tracking-tight ${theme.nameColor} truncate`}
            >
              {displayName}
            </p>
          )}
        </div>

        {/* Subtle Divider */}
        <div className="w-12 sm:w-16 mx-auto my-2 sm:my-3 border-b border-white/10" />

        {/* Numerical Metric Score & Sub-label */}
        <div className="flex flex-col items-center justify-center mt-auto pb-1">
          <span
            className={`font-mono text-sm sm:text-base md:text-lg tracking-tight ${theme.scoreColor}`}
          >
            {scoreValue}
          </span>
          <span className="font-mono text-[8px] sm:text-[9px] md:text-[10px] uppercase tracking-widest text-[#8995A8] mt-0.5">
            {subLabel}
          </span>
        </div>
      </div>
    </div>
  )
}
