import React from 'react'

interface LeaderboardEmptyStateProps {
  hasFilters: boolean
  onResetFilters: () => void
}

export function LeaderboardEmptyState({
  hasFilters,
  onResetFilters,
}: LeaderboardEmptyStateProps) {
  return (
    <div className="flex min-h-[340px] flex-col items-center justify-center border border-white/10 bg-surface/30 p-12 sm:p-20 text-center backdrop-blur-md">
      <h3 className="font-display text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-wider text-ink">
        NO CONTENDERS REGISTERED
      </h3>

      {hasFilters && (
        <button
          type="button"
          onClick={onResetFilters}
          className="mt-6 border border-[#25D9F2]/40 bg-[#25D9F2]/10 px-5 py-2 font-mono text-xs uppercase font-bold text-[#25D9F2] hover:bg-[#25D9F2]/20 transition-colors cursor-pointer"
        >
          Reset All Filters
        </button>
      )}
    </div>
  )
}
