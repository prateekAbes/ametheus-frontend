import React from 'react'

export function LeaderboardSkeleton() {
  return (
    <div
      className="w-full select-none animate-pulse space-y-12 md:space-y-16"
      aria-busy="true"
      aria-label="Loading leaderboard"
    >
      {/* 1. Centered Three-Player Podium Skeleton */}
      <div className="mx-auto grid max-w-4xl items-end gap-12 md:grid-cols-[1fr_1.25fr_1fr] md:gap-0">
        {/* 2nd Place Column Skeleton (md:order-1) */}
        <div className="flex flex-col items-center order-2 md:order-1 w-full">
          <div className="flex w-full flex-col items-center text-center pb-6">
            <div className="w-[84px] md:w-24 aspect-square rounded-sm bg-white/10" />
            <div className="mt-4 h-7 w-24 bg-white/10 rounded-sm" />
          </div>
          <div className="relative flex w-full flex-col items-center px-3 pt-3 text-center h-64 md:h-72 border border-b-0 border-white/10 bg-surface/50 rounded-t-sm">
            <div className="h-14 w-12 bg-white/5 rounded-sm" />
            <div className="mt-4 h-10 w-24 bg-white/10 rounded-sm" />
            <div className="mt-2 h-3 w-16 bg-white/5 rounded-sm" />
          </div>
        </div>

        {/* 1st Place Column Skeleton (md:order-2) */}
        <div className="flex flex-col items-center order-1 md:order-2 w-full">
          <div className="flex w-full flex-col items-center text-center pb-8">
            <div className="w-28 md:w-32 aspect-square rounded-sm bg-white/15 ring-1 ring-cyan/40" />
            <div className="mt-4 h-9 w-32 bg-white/15 rounded-sm" />
          </div>
          <div className="relative flex w-full flex-col items-center px-3 pt-3 text-center h-72 md:h-80 border border-b-0 border-white/10 bg-surface/60 rounded-t-sm">
            <div className="h-16 w-14 bg-white/5 rounded-sm" />
            <div className="mt-4 h-12 w-32 bg-cyan/20 rounded-sm" />
            <div className="mt-2 h-3 w-20 bg-white/5 rounded-sm" />
            <div className="mt-5 flex gap-7 border-t border-white/10 pt-4 w-3/4 justify-center">
              <div className="h-4 w-12 bg-white/10 rounded-sm" />
              <div className="h-4 w-12 bg-white/10 rounded-sm" />
            </div>
          </div>
        </div>

        {/* 3rd Place Column Skeleton (md:order-3) */}
        <div className="flex flex-col items-center order-3 md:order-3 w-full">
          <div className="flex w-full flex-col items-center text-center pb-6">
            <div className="w-20 md:w-24 aspect-square rounded-sm bg-white/10" />
            <div className="mt-4 h-7 w-20 bg-white/10 rounded-sm" />
          </div>
          <div className="relative flex w-full flex-col items-center px-3 pt-3 text-center h-60 md:h-64 border border-b-0 border-white/10 bg-surface/40 rounded-t-sm">
            <div className="h-12 w-10 bg-white/5 rounded-sm" />
            <div className="mt-4 h-8 w-20 bg-white/10 rounded-sm" />
            <div className="mt-2 h-3 w-16 bg-white/5 rounded-sm" />
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="w-full max-w-[1120px] border-b border-white/10" />

      {/* 2. Lower 2-Column Desktop Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-[200px_minmax(0,1fr)] gap-10 lg:gap-16 items-start max-w-[1120px]">
        {/* Left Column Sidebar Skeleton (Hidden on mobile) */}
        <aside className="hidden lg:block w-[200px] shrink-0 space-y-6 sticky top-28">
          <div>
            <div className="h-4 w-20 bg-white/10 rounded-sm mb-4" />
            <div className="space-y-6">
              {[1, 2, 3].map((g) => (
                <div key={g} className="space-y-2">
                  <div className="h-3 w-16 bg-white/5 rounded-sm mb-2" />
                  <div className="h-4 w-28 bg-white/10 rounded-sm" />
                  <div className="h-4 w-24 bg-white/10 rounded-sm" />
                </div>
              ))}
            </div>
          </div>

          {/* Your Position Skeleton */}
          <div className="rounded-sm border border-white/10 bg-[#0d121c]/90 p-4 space-y-2.5">
            <div className="h-3 w-20 bg-white/10 rounded-sm" />
            <div className="h-8 w-16 bg-cyan/20 rounded-sm" />
            <div className="h-3 w-32 bg-white/5 rounded-sm" />
          </div>
        </aside>

        {/* Right Column: Challengers List Skeleton */}
        <ChallengersLadderSkeleton />
      </div>
    </div>
  )
}

export function ChallengersLadderSkeleton() {
  return (
    <div className="min-w-0 space-y-4 animate-pulse">
      <div className="flex justify-between items-center pb-2">
        <div className="h-6 w-44 bg-white/10 rounded-sm" />
        <div className="h-8 w-56 bg-white/5 rounded-sm border border-white/10" />
      </div>
      <div className="divide-y divide-white/[0.07] border-t border-white/[0.07]">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-6 w-8 bg-white/5 rounded-sm" />
              <div className="w-10 h-10 md:w-11 md:h-11 bg-white/10 rounded-sm shrink-0" />
              <div className="h-5 w-36 bg-white/10 rounded-sm" />
            </div>
            <div className="h-8 w-24 bg-white/10 rounded-sm" />
          </div>
        ))}
      </div>
    </div>
  )
}
