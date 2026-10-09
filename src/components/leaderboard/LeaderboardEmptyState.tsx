import React from 'react'
import { Hud } from '../ui'

interface LeaderboardEmptyStateProps {
  hasFilters: boolean
  onResetFilters: () => void
}

export function LeaderboardEmptyState({
  hasFilters,
  onResetFilters,
}: LeaderboardEmptyStateProps) {
  return (
    <div className="border border-white/10 bg-surface/30 p-12 sm:p-16 text-center backdrop-blur-md">
      <div className="mx-auto flex size-14 items-center justify-center rounded-full border border-white/10 bg-surface/60 mb-4">
        <svg
          className="size-6 text-[#3dff9a]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      </div>

      <Hud className="text-[#3dff9a]">Standings Unpopulated</Hud>
      <h3 className="mt-2 font-display text-2xl sm:text-3xl font-black uppercase tracking-tight text-ink">
        No Contenders Registered
      </h3>
      <p className="mt-2 font-mono text-dim text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
        {hasFilters
          ? 'No contenders match the current filter or search criteria. Try selecting another game or clearing your search query.'
          : 'Official standings will populate once contenders complete verified sanctioned tournament matches.'}
      </p>

      {hasFilters && (
        <button
          type="button"
          onClick={onResetFilters}
          className="mt-6 border border-[#3dff9a]/40 bg-[#3dff9a]/10 px-5 py-2 font-mono text-xs uppercase font-bold text-[#3dff9a] hover:bg-[#3dff9a]/20 transition-colors cursor-pointer"
        >
          Reset All Filters
        </button>
      )}
    </div>
  )
}
