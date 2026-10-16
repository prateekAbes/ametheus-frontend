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
 * Minimal, dark geometric stair-step podium column inspired by the reference layout.
 * - Simple flat surfaces with clear stair-like height silhouette.
 * - Clean square avatars with neutral, understated borders (no blue outlines).
 * - Upgraded player typography (crisp font-display names, clear #1, #2, #3 labels).
 * - No bulky 3D angles, neon glowing outlines, crowns, or decorative distractions.
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

  // Stair-step height hierarchy: #1 tallest in center, #2 medium on left, #3 shortest on right
  const heightClasses = isFirst
    ? 'h-54 sm:h-64 md:h-72'
    : isSecond
    ? 'h-40 sm:h-48 md:h-54'
    : 'h-30 sm:h-36 md:h-42'

  // Restrained differences in platform height, background tone, and borders (no blue/neon glows)
  const theme = isFirst
    ? {
        platformBg: 'bg-[#121824]',
        platformBorder: 'border-t border-l border-r border-white/20',
        rankBadge: 'bg-white/15 text-white border-white/30',
        rankText: 'text-white',
        nameColor: 'text-white font-bold',
        scoreColor: 'text-white font-bold',
        avatarSize: 'size-16 sm:size-20 md:size-22',
        avatarBorder: 'border border-white/30',
      }
    : isSecond
    ? {
        platformBg: 'bg-[#0d131d]',
        platformBorder: 'border-t border-l border-r border-white/10',
        rankBadge: 'bg-white/10 text-white/90 border-white/20',
        rankText: 'text-white/85',
        nameColor: 'text-white/90 font-semibold',
        scoreColor: 'text-white/90 font-bold',
        avatarSize: 'size-14 sm:size-16 md:size-18',
        avatarBorder: 'border border-white/15',
      }
    : {
        platformBg: 'bg-[#090e16]',
        platformBorder: 'border-t border-l border-r border-white/10',
        rankBadge: 'bg-white/5 text-white/80 border-white/10',
        rankText: 'text-white/75',
        nameColor: 'text-white/85 font-semibold',
        scoreColor: 'text-white/85 font-bold',
        avatarSize: 'size-14 sm:size-16 md:size-18',
        avatarBorder: 'border border-white/15',
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
      case 'wins':
        return {
          scoreValue: `${(entry.wins ?? 0).toLocaleString()} WINS`,
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
    <div className="flex size-full items-center justify-center font-display font-bold text-white/85 bg-[#141b24] rounded-none">
      {initial}
    </div>
  )

  return (
    <div
      className={`group relative flex flex-col items-center justify-end select-none w-full ${
        isFirst ? 'z-20' : 'z-10'
      }`}
    >
      {/* ============================================================== */}
      {/* SQUARE 1:1 AVATAR CENTERED ABOVE PLATFORM                     */}
      {/* Clean neutral border; no blue outline or neon halos            */}
      {/* ============================================================== */}
      <div className="relative mb-3 sm:mb-4 z-10 flex flex-col items-center">
        {isCurrentUser ? (
          <Link
            to="/profile"
            title="View your profile"
            className={`relative block ${theme.avatarSize} aspect-square rounded-none ${theme.avatarBorder} bg-[#0d131a] overflow-hidden transition-transform group-hover:scale-105`}
          >
            {avatarContent}
          </Link>
        ) : (
          <div
            className={`relative block ${theme.avatarSize} aspect-square rounded-none ${theme.avatarBorder} bg-[#0d131a] overflow-hidden transition-transform group-hover:scale-105`}
          >
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
      {/* GEOMETRIC STAIR-STEP PLATFORM (Mostly Flat Surfaces)           */}
      {/* ============================================================== */}
      <div
        className={`w-full flex flex-col justify-start items-center ${heightClasses} ${theme.platformBg} ${theme.platformBorder} rounded-t-sm pt-3 sm:pt-5 pb-5 px-1.5 sm:px-3 text-center`}
      >
        {/* Crisp Rank Badge */}
        <span
          className={`inline-flex items-center justify-center font-mono text-xs sm:text-sm font-bold px-2 py-0.5 rounded-xs border ${theme.rankBadge} mb-2`}
        >
          #{rank}
        </span>

        {/* Player Name with Upgraded Typography */}
        <div className="w-full truncate px-1">
          {isCurrentUser ? (
            <Link
              to="/profile"
              title="View your profile"
              className={`font-display text-xs sm:text-sm md:text-base tracking-normal ${theme.nameColor} hover:text-cyan transition-colors truncate block`}
            >
              {displayName}
            </Link>
          ) : (
            <p
              className={`font-display text-xs sm:text-sm md:text-base tracking-normal ${theme.nameColor} truncate`}
            >
              {displayName}
            </p>
          )}
        </div>

        {/* Subtle Divider */}
        <div className="w-10 sm:w-14 mx-auto my-2 sm:my-3 border-b border-white/10" />

        {/* Compact Numerical Metric Score & Sub-label */}
        <div className="flex flex-col items-center justify-center mt-auto pb-1">
          <span
            className={`font-mono text-xs sm:text-sm md:text-base tracking-tight ${theme.scoreColor}`}
          >
            {scoreValue}
          </span>
          <span className="font-mono text-[8px] sm:text-[9px] uppercase tracking-widest text-[#8995A8] mt-0.5">
            {subLabel}
          </span>
        </div>
      </div>
    </div>
  )
}
