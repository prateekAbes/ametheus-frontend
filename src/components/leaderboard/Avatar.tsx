import React from 'react'
import DynamicImage from '../DynamicImage'
import { LeaderboardPlayer } from '../../services/leaderboard'

/**
 * Player Avatar Component from Leaderboard UI Design:
 * - Square aspect ratio with rounded-sm and border-white/10
 * - Displays high-res uploaded profile photo when present
 * - Falls back to tone-based background and initials when photo is absent
 */
export function Avatar({
  p,
  className = '',
}: {
  p: LeaderboardPlayer
  className?: string
}) {
  if (p.avatarUrl) {
    return (
      <div
        className={`relative aspect-square shrink-0 overflow-hidden rounded-sm border border-white/10 bg-[#0d131a] ${className}`}
        role="img"
        aria-label={`${p.name} profile picture`}
      >
        <DynamicImage
          src={p.avatarUrl}
          alt={`${p.name} profile picture`}
          className="size-full object-cover rounded-none"
        />
      </div>
    )
  }

  return (
    <div
      className={`grid aspect-square shrink-0 place-items-center rounded-sm border border-white/10 font-display font-bold tracking-wide text-ink/70 ${className}`}
      style={{ background: `hsl(222 18% ${p.tone - 10}%)` }}
      role="img"
      aria-label={`${p.name} profile picture`}
    >
      {p.initials}
    </div>
  )
}
