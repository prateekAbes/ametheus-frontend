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
    <div className="relative mx-auto w-full max-w-4xl pt-4 pb-2 select-none">
      {/* CLEAN STAIR-LIKE PODIUM: 2nd (Left), 1st (Center, Tallest), 3rd (Right, Shortest) */}
      <div className="relative z-10 flex items-end justify-center w-full max-w-2xl mx-auto px-2 sm:px-4 gap-2 sm:gap-3 md:gap-4">
        {/* 2nd Place Step (Left) */}
        <div className="flex-1 relative z-10 min-w-0">
          {top2 ? (
            <PodiumColumn
              entry={top2}
              rank={2}
              selectedCategory={selectedCategory}
              isCurrentUser={isEntryCurrentUser(top2, currentUserId, currentUsername)}
              isDisqualified={isEntryDisqualified(top2, disqualifiedIds)}
            />
          ) : (
            <div className="h-44 border border-dashed border-white/10 flex items-center justify-center p-2 text-center bg-black/40 rounded-t-sm">
              <span className="font-mono text-[9px] text-white/30 uppercase">
                #2 Vacant
              </span>
            </div>
          )}
        </div>

        {/* 1st Place Step (Center, Tallest) */}
        <div className="flex-[1.12] relative z-20 min-w-0">
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

        {/* 3rd Place Step (Right, Shortest) */}
        <div className="flex-1 relative z-10 min-w-0">
          {top3 ? (
            <PodiumColumn
              entry={top3}
              rank={3}
              selectedCategory={selectedCategory}
              isCurrentUser={isEntryCurrentUser(top3, currentUserId, currentUsername)}
              isDisqualified={isEntryDisqualified(top3, disqualifiedIds)}
            />
          ) : (
            <div className="h-32 border border-dashed border-white/10 flex items-center justify-center p-2 text-center bg-black/40 rounded-t-sm">
              <span className="font-mono text-[9px] text-white/30 uppercase">
                #3 Vacant
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
