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
    <div className="relative mx-auto w-full max-w-4xl py-4 sm:py-6 select-none">
      {/* Ambient floor glow beneath podium */}
      <div
        className="pointer-events-none absolute -bottom-6 inset-x-0 h-28 select-none opacity-40"
        aria-hidden="true"
        style={{
          background: 'radial-gradient(ellipse 70% 50% at 50% 100%, rgba(34, 197, 94, 0.16), transparent 75%)',
        }}
      />

      {/* Subtle floor grid line beneath podium */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-16 overflow-hidden opacity-25 select-none"
        aria-hidden="true"
      >
        <div
          className="size-full"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(34, 197, 94, 0.25) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(34, 197, 94, 0.25) 1px, transparent 1px)
            `,
            backgroundSize: '32px 16px',
            transform: 'perspective(400px) rotateX(60deg)',
            transformOrigin: 'bottom',
            maskImage: 'linear-gradient(to top, black 20%, transparent 90%)',
          }}
        />
      </div>

      {/* PODIUM COLUMNS: #2 (Left), #1 (Center, Elevated), #3 (Right) */}
      <div className="relative z-10 grid grid-cols-3 items-end gap-2 sm:gap-4 md:gap-6 px-1 sm:px-2">
        {/* 2nd Place Podium Column (Left) */}
        <div className="order-1 w-full">
          {top2 ? (
            <PodiumColumn
              entry={top2}
              rank={2}
              selectedCategory={selectedCategory}
              isCurrentUser={isEntryCurrentUser(top2, currentUserId, currentUsername)}
              isDisqualified={isEntryDisqualified(top2, disqualifiedIds)}
            />
          ) : (
            <div className="h-32 border border-dashed border-white/10 flex items-center justify-center p-2 text-center">
              <span className="font-mono text-[9px] text-white/30 uppercase">
                #2 Vacant
              </span>
            </div>
          )}
        </div>

        {/* 1st Place Podium Column (Center, Elevated & Tallest) */}
        <div className="order-2 w-full">
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

        {/* 3rd Place Podium Column (Right) */}
        <div className="order-3 w-full">
          {top3 ? (
            <PodiumColumn
              entry={top3}
              rank={3}
              selectedCategory={selectedCategory}
              isCurrentUser={isEntryCurrentUser(top3, currentUserId, currentUsername)}
              isDisqualified={isEntryDisqualified(top3, disqualifiedIds)}
            />
          ) : (
            <div className="h-28 border border-dashed border-white/10 flex items-center justify-center p-2 text-center">
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
