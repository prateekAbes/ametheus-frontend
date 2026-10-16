import React from 'react'

export function LeaderboardSkeleton() {
  return (
    <div className="w-full space-y-12 animate-pulse select-none" aria-busy="true" aria-label="Loading leaderboard">
      {/* 1. Flat Stair-Step Podium Skeleton */}
      <div className="mx-auto max-w-2xl flex items-end justify-center gap-2 sm:gap-3 md:gap-4 pt-8">
        {/* 2nd Place Column Skeleton (Left, Medium) */}
        <div className="flex-1 flex flex-col items-center">
          <div className="size-16 sm:size-18 md:size-20 rounded-none bg-white/10 mb-3" />
          <div className="w-full h-42 sm:h-48 md:h-54 bg-[#0c121d] border border-white/10 rounded-t-sm p-4 flex flex-col items-center justify-between">
            <div className="h-5 w-8 bg-white/10 rounded-sm" />
            <div className="h-4 w-20 bg-white/10 rounded-sm" />
            <div className="h-8 w-24 bg-white/10 rounded-sm" />
          </div>
        </div>

        {/* 1st Place Column Skeleton (Center, Tallest) */}
        <div className="flex-[1.12] flex flex-col items-center">
          <div className="size-16 sm:size-18 md:size-20 rounded-none bg-white/15 mb-3" />
          <div className="w-full h-56 sm:h-64 md:h-72 bg-[#0e1522] border border-white/15 rounded-t-sm p-4 flex flex-col items-center justify-between">
            <div className="h-5 w-8 bg-white/15 rounded-sm" />
            <div className="h-4 w-24 bg-white/15 rounded-sm" />
            <div className="h-9 w-28 bg-white/15 rounded-sm" />
          </div>
        </div>

        {/* 3rd Place Column Skeleton (Right, Shortest) */}
        <div className="flex-1 flex flex-col items-center">
          <div className="size-16 sm:size-18 md:size-20 rounded-none bg-white/10 mb-3" />
          <div className="w-full h-32 sm:h-38 md:h-44 bg-[#0a0f18] border border-white/10 rounded-t-sm p-4 flex flex-col items-center justify-between">
            <div className="h-5 w-8 bg-white/10 rounded-sm" />
            <div className="h-4 w-16 bg-white/10 rounded-sm" />
            <div className="h-7 w-20 bg-white/10 rounded-sm" />
          </div>
        </div>
      </div>

      {/* 2. Standings Ladder Table Skeleton */}
      <div className="border border-white/10 bg-[#0c121d]/80 rounded-sm p-5 space-y-3">
        <div className="h-5 w-44 bg-white/10 rounded-sm" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-11 w-full bg-white/5 rounded-sm border border-white/5" />
          ))}
        </div>
      </div>
    </div>
  )
}
