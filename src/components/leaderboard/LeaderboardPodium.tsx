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
      {/* Subtle orthogonal dark grid matching reference screenshot */}
      <div
        className="pointer-events-none absolute -inset-y-4 -inset-x-8 z-0 opacity-20"
        aria-hidden="true"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.08) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse 75% 65% at 50% 45%, black 40%, transparent 85%)',
          WebkitMaskImage: 'radial-gradient(ellipse 75% 65% at 50% 45%, black 40%, transparent 85%)',
        }}
      />

      {/* Ambient floor glow beneath podium */}
      <div
        className="pointer-events-none absolute -bottom-6 inset-x-0 h-28 select-none opacity-40 z-0"
        aria-hidden="true"
        style={{
          background: 'radial-gradient(ellipse 70% 50% at 50% 100%, rgba(37, 217, 242, 0.12), transparent 75%)',
        }}
      />

      {/* PODIUM COLUMNS: Layered 3D Axonometric Blocks matching reference */}
      <div className="relative z-10 flex items-end justify-center w-full max-w-3xl mx-auto px-1 sm:px-3">
        {/* 2nd Place Podium Column (Left, Layered Behind #1) */}
        <div className="flex-1 relative z-10 -mr-2 sm:-mr-4 md:-mr-6 min-w-0">
          {top2 ? (
            <PodiumColumn
              entry={top2}
              rank={2}
              selectedCategory={selectedCategory}
              isCurrentUser={isEntryCurrentUser(top2, currentUserId, currentUsername)}
              isDisqualified={isEntryDisqualified(top2, disqualifiedIds)}
            />
          ) : (
            <div className="h-44 border border-dashed border-white/10 flex items-center justify-center p-2 text-center bg-black/40">
              <span className="font-mono text-[9px] text-white/30 uppercase">
                #2 Vacant
              </span>
            </div>
          )}
        </div>

        {/* 1st Place Podium Column (Center, Foreground & Tallest) */}
        <div className="flex-[1.14] relative z-20 min-w-0">
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

        {/* 3rd Place Podium Column (Right, Layered Behind #1) */}
        <div className="flex-1 relative z-10 -ml-2 sm:-ml-4 md:-ml-6 min-w-0">
          {top3 ? (
            <PodiumColumn
              entry={top3}
              rank={3}
              selectedCategory={selectedCategory}
              isCurrentUser={isEntryCurrentUser(top3, currentUserId, currentUsername)}
              isDisqualified={isEntryDisqualified(top3, disqualifiedIds)}
            />
          ) : (
            <div className="h-36 border border-dashed border-white/10 flex items-center justify-center p-2 text-center bg-black/40">
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
