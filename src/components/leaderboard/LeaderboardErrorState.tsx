import React from 'react'
import { Hud } from '../ui'

interface LeaderboardErrorStateProps {
  onRetry: () => void
}

export function LeaderboardErrorState({ onRetry }: LeaderboardErrorStateProps) {
  return (
    <div className="border border-white/10 bg-surface/30 p-12 sm:p-16 text-center backdrop-blur-md">
      <div className="mx-auto flex size-14 items-center justify-center rounded-full border border-live/30 bg-live/10 mb-4">
        <svg
          className="size-6 text-live"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>

      <Hud className="text-live">Connection Interrupted</Hud>
      <h3 className="mt-2 font-display text-2xl sm:text-3xl font-black uppercase tracking-tight text-ink">
        Unable to Retrieve Standings
      </h3>
      <p className="mt-2 font-mono text-dim text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
        A temporary network issue prevented the leaderboard from loading. Please retry to synchronize with the tournament engine.
      </p>

      <button
        type="button"
        onClick={onRetry}
        className="mt-6 border border-white/20 bg-surface/80 px-5 py-2 font-mono text-xs uppercase font-bold text-ink hover:border-[#3dff9a] hover:text-[#3dff9a] transition-colors cursor-pointer"
      >
        Retry Synchronization ↻
      </button>
    </div>
  )
}
