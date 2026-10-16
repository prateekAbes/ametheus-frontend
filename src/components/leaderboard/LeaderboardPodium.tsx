import React from 'react'
import {
  LeaderboardEntry,
  isEntryCurrentUser,
  isEntryDisqualified,
} from '../../services/leaderboard'
import { PodiumColumn } from './PodiumColumn'

interface LeaderboardPodiumProps {
  topEntries: LeaderboardEntry[]
  selectedCategory: string
  currentUserId?: string
  currentUsername?: string
  disqualifiedIds?: Set<string>
}

/**
 * Reconstructed 3-Player Connected Podium:
 * - 2nd Place (Left): Shorter than #1 (~73% height of #1), ~29% width.
 * - 1st Place (Center): Tallest platform (100% height), elevated with z-20 in front, ~42% width.
 * - 3rd Place (Right): Stepped down further (~50% height of #1), ~29% width.
 * - Flush alignment: Platforms touch with zero gap (-mx-[1px] subpixel overlap on Center).
 * - Shared flat horizontal baseline at the bottom.
 * - Solid, connected architectural block matching the reference screenshot.
 */
export function LeaderboardPodium({
  topEntries,
  selectedCategory,
  currentUserId,
  currentUsername,
  disqualifiedIds = new Set(),
}: LeaderboardPodiumProps) {
  if (!topEntries || topEntries.length === 0) {
    return null
  }

  const top1 = topEntries[0] || null
  const top2 = topEntries[1] || null
  const top3 = topEntries[2] || null

  return (
    <div className="relative mx-auto w-full max-w-4xl pt-6 pb-2 select-none">
      {/* CONNECTED ARCHITECTURAL PODIUM: 2nd (Left), 1st (Center, Raised), 3rd (Right) */}
      <div className="relative z-10 flex items-end justify-center w-full max-w-3xl mx-auto px-2 sm:px-4">
        {/* 2nd Place Platform (Left, ~29% width) */}
        <div className="w-[29%] shrink-0 relative z-10 min-w-0">
          {top2 ? (
            <PodiumColumn
              entry={top2}
              rank={2}
              selectedCategory={selectedCategory}
              isCurrentUser={isEntryCurrentUser(top2, currentUserId, currentUsername)}
              isDisqualified={isEntryDisqualified(top2, disqualifiedIds)}
            />
          ) : (
            <div className="flex flex-col items-center justify-end w-full">
              {/* Vacant top surface */}
              <div className="w-full relative z-20">
                <svg
                  viewBox="0 0 100 28"
                  preserveAspectRatio="none"
                  className="w-full h-6 sm:h-8 md:h-10 block overflow-visible"
                >
                  <polygon
                    points="14,0 100,0 100,28 0,28"
                    fill="#090e16"
                    stroke="rgba(255, 255, 255, 0.15)"
                    strokeWidth="1"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
              </div>
              {/* Vacant front face */}
              <div className="w-full h-40 sm:h-48 md:h-56 lg:h-62 bg-gradient-to-b from-[#090e16] via-[#060910] to-[#030508] border-l border-b border-white/10 flex flex-col items-center justify-start pt-4 text-center">
                <span className="font-mono text-xs text-white/40 font-bold uppercase tracking-wider">
                  [#2] VACANT
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 1st Place Platform (Center, Tallest, ~42% width, elevated in front) */}
        <div className="w-[42%] shrink-0 relative z-20 min-w-0 -mx-[1px]">
          {top1 ? (
            <PodiumColumn
              entry={top1}
              rank={1}
              selectedCategory={selectedCategory}
              isCurrentUser={isEntryCurrentUser(top1, currentUserId, currentUsername)}
              isDisqualified={isEntryDisqualified(top1, disqualifiedIds)}
            />
          ) : null}
        </div>

        {/* 3rd Place Platform (Right, ~29% width) */}
        <div className="w-[29%] shrink-0 relative z-10 min-w-0">
          {top3 ? (
            <PodiumColumn
              entry={top3}
              rank={3}
              selectedCategory={selectedCategory}
              isCurrentUser={isEntryCurrentUser(top3, currentUserId, currentUsername)}
              isDisqualified={isEntryDisqualified(top3, disqualifiedIds)}
            />
          ) : (
            <div className="flex flex-col items-center justify-end w-full">
              {/* Vacant top surface */}
              <div className="w-full relative z-20">
                <svg
                  viewBox="0 0 100 28"
                  preserveAspectRatio="none"
                  className="w-full h-5 sm:h-7 md:h-9 block overflow-visible"
                >
                  <polygon
                    points="0,0 86,0 100,28 0,28"
                    fill="#070a10"
                    stroke="rgba(255, 255, 255, 0.15)"
                    strokeWidth="1"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
              </div>
              {/* Vacant front face */}
              <div className="w-full h-28 sm:h-32 md:h-38 lg:h-42 bg-gradient-to-b from-[#070a10] via-[#05080e] to-[#020306] border-r border-b border-white/10 flex flex-col items-center justify-start pt-3 text-center">
                <span className="font-mono text-xs text-white/30 font-bold uppercase tracking-wider">
                  [#3] VACANT
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
