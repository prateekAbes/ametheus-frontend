import React from 'react'

export function LeaderboardSkeleton() {
  return (
    <div className="w-full space-y-12 animate-pulse select-none" aria-busy="true" aria-label="Loading leaderboard">
      {/* 1. Podium Skeleton: 3-column dimensional placeholder */}
      <div className="mx-auto max-w-5xl grid grid-cols-3 items-end gap-3 sm:gap-6 pt-10">
        {/* 2nd Place Column Skeleton */}
        <div className="flex flex-col items-center">
          <div className="size-16 sm:size-20 rounded-full bg-white/10 mb-3" />
          <div className="w-full h-8 bg-white/5 rounded-t" />
          <div className="w-full h-56 sm:h-64 bg-surface/80 border border-white/10 p-4 space-y-3">
            <div className="h-6 w-12 bg-white/10 mx-auto rounded" />
            <div className="h-4 w-24 bg-white/10 mx-auto rounded" />
            <div className="h-10 w-full bg-white/10 rounded mt-6" />
          </div>
        </div>

        {/* 1st Place Column Skeleton (Taller, elevated) */}
        <div className="flex flex-col items-center -translate-y-4">
          <div className="size-20 sm:size-24 rounded-full bg-white/15 mb-3" />
          <div className="w-full h-10 bg-white/10 rounded-t" />
          <div className="w-full h-72 sm:h-80 bg-surface/90 border border-white/15 p-4 space-y-3">
            <div className="h-8 w-16 bg-white/15 mx-auto rounded" />
            <div className="h-5 w-32 bg-white/15 mx-auto rounded" />
            <div className="h-12 w-full bg-white/15 rounded mt-6" />
          </div>
        </div>

        {/* 3rd Place Column Skeleton */}
        <div className="flex flex-col items-center">
          <div className="size-14 sm:size-18 rounded-full bg-white/10 mb-3" />
          <div className="w-full h-7 bg-white/5 rounded-t" />
          <div className="w-full h-44 sm:h-52 bg-surface/70 border border-white/10 p-4 space-y-3">
            <div className="h-5 w-10 bg-white/10 mx-auto rounded" />
            <div className="h-4 w-20 bg-white/10 mx-auto rounded" />
            <div className="h-10 w-full bg-white/10 rounded mt-6" />
          </div>
        </div>
      </div>

      {/* 2. Standings Ladder Table Skeleton */}
      <div className="border border-white/10 bg-surface/30 p-5 space-y-4">
        <div className="h-5 w-48 bg-white/10 rounded" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-12 w-full bg-white/5 rounded border border-white/5" />
          ))}
        </div>
      </div>
    </div>
  )
}
