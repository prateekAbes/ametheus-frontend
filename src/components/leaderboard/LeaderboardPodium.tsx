import React from 'react'
import { LeaderboardEntry } from '../../services/leaderboard'
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

  const isUser = (e: LeaderboardEntry | null) => {
    if (!e) return false
    const uid = currentUserId?.toLowerCase()
    const uname = currentUsername?.toLowerCase()
    const eId = (e.id || '').toLowerCase()
    const eName = (e.name || '').toLowerCase()
    const eCap = (e.captain || '').replace('@', '').toLowerCase()
    return (
      (!!uid && (eId === uid || eName === uid)) ||
      (!!uname && (eName === uname || eCap === uname))
    )
  }

  const isDq = (e: LeaderboardEntry | null) => {
    if (!e) return false
    if (e.is_disqualified) return true
    if ((e.status || '').toUpperCase() === 'DISQUALIFIED') return true
    const id = (e.id || '').toLowerCase()
    const name = (e.name || '').toLowerCase()
    return disqualifiedIds.has(id) || disqualifiedIds.has(name)
  }

  return (
    <div className="relative mx-auto w-full max-w-5xl py-6 select-none overflow-visible">
      {/* ============================================================== */}
      {/* 3D PERSPECTIVE FLOOR GRID & AMBIENT UNDER-GLOW */}
      {/* ============================================================== */}
      <div
        className="pointer-events-none absolute -inset-x-8 -bottom-10 h-44 overflow-hidden opacity-30 select-none"
        aria-hidden="true"
      >
        {/* Angled Perspective Floor Grid */}
        <div
          className="size-full"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(61, 255, 154, 0.2) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(61, 255, 154, 0.2) 1px, transparent 1px)
            `,
            backgroundSize: '40px 20px',
            transform: 'perspective(500px) rotateX(65deg)',
            transformOrigin: 'bottom',
            maskImage: 'linear-gradient(to top, black 20%, transparent 90%)',
          }}
        />

        {/* Center Emerald Ambient Floor Light */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-24 blur-3xl opacity-40 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, #3dff9a55 0%, transparent 70%)',
          }}
        />
      </div>

      {/* ============================================================== */}
      {/* PODIUM COLUMNS: #2 (Left), #1 (Center, Elevated), #3 (Right) */}
      {/* ============================================================== */}
      <div className="relative z-10 grid grid-cols-3 items-end gap-2.5 sm:gap-4 md:gap-6 lg:gap-8 px-1 sm:px-4">
        {/* 2nd Place Podium Column (Left on desktop) */}
        <div className="order-1 w-full">
          {top2 ? (
            <PodiumColumn
              entry={top2}
              rank={2}
              selectedCategory={selectedCategory}
              isCurrentUser={isUser(top2)}
              isDisqualified={isDq(top2)}
            />
          ) : (
            <div className="h-48 border border-dashed border-white/10 rounded-sm flex items-center justify-center p-3 text-center">
              <span className="font-mono text-[10px] text-dim/60 uppercase">
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
              isCurrentUser={isUser(top1)}
              isDisqualified={isDq(top1)}
            />
          ) : null}
        </div>

        {/* 3rd Place Podium Column (Right on desktop) */}
        <div className="order-3 w-full">
          {top3 ? (
            <PodiumColumn
              entry={top3}
              rank={3}
              selectedCategory={selectedCategory}
              isCurrentUser={isUser(top3)}
              isDisqualified={isDq(top3)}
            />
          ) : (
            <div className="h-40 border border-dashed border-white/10 rounded-sm flex items-center justify-center p-3 text-center">
              <span className="font-mono text-[10px] text-dim/60 uppercase">
                #3 Vacant
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
