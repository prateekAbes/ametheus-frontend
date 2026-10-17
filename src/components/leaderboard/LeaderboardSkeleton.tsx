import React from 'react'

export function LeaderboardSkeleton() {
  return (
    <div className="w-full space-y-16 animate-pulse select-none" aria-busy="true" aria-label="Loading leaderboard">
      {/* 1. Three-Player Podium Skeleton matching Leaderboard UI Design */}
      <div className="mx-auto grid max-w-4xl items-end gap-12 md:grid-cols-[1fr_1.25fr_1fr] md:gap-0">
        {/* 2nd Place Column Skeleton (md:order-1) */}
        <div className="flex flex-col items-center order-2 md:order-1 w-full">
          <div className="flex w-full flex-col items-center text-center pb-6">
            <div className="w-[74px] md:w-[86px] aspect-square rounded-sm bg-white/10" />
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
            <div className="w-24 md:w-28 aspect-square rounded-sm bg-white/15 ring-1 ring-cyan/40" />
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
            <div className="w-[70px] md:w-20 aspect-square rounded-sm bg-white/10" />
            <div className="mt-4 h-7 w-20 bg-white/10 rounded-sm" />
          </div>
          <div className="relative flex w-full flex-col items-center px-3 pt-3 text-center h-60 md:h-64 border border-b-0 border-white/10 bg-surface/40 rounded-t-sm">
            <div className="h-12 w-10 bg-white/5 rounded-sm" />
            <div className="mt-4 h-8 w-20 bg-white/10 rounded-sm" />
            <div className="mt-2 h-3 w-16 bg-white/5 rounded-sm" />
          </div>
        </div>
      </div>

      <div className="mx-auto my-16 max-w-6xl border-b border-white/10" />

      {/* 2. Bottom Section Skeleton (Sidebar + Challengers List) */}
      <div className="grid gap-8 lg:grid-cols-[180px_1fr] lg:gap-14">
        <aside className="space-y-3">
          <div className="h-3 w-16 bg-white/10 rounded-sm" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-6 w-32 bg-white/5 rounded-sm" />
            ))}
          </div>
        </aside>

        <div className="space-y-4">
          <div className="flex justify-between items-center pb-2">
            <div className="h-6 w-44 bg-white/10 rounded-sm" />
            <div className="h-8 w-56 bg-white/5 rounded-sm border border-white/10" />
          </div>
          <div className="divide-y divide-white/[0.07] border-t border-white/[0.07]">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-6 w-8 bg-white/5 rounded-sm" />
                  <div className="w-10 h-10 md:w-11 md:h-11 bg-white/10 rounded-full shrink-0" />
                  <div className="h-5 w-36 bg-white/10 rounded-sm" />
                </div>
                <div className="h-8 w-24 bg-white/10 rounded-sm" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
