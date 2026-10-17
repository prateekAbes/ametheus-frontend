import React from 'react'

export interface StatBlock {
  label: string
  value: string | number
}

interface PlatformStatsStripProps {
  stats: StatBlock[]
}

/**
 * Horizontal Platform Statistics Strip
 * Displays four equally distributed statistic blocks separated by subtle vertical dividers.
 * Occupies the full width of the restricted main content container (1120px).
 */
export function PlatformStatsStrip({ stats }: PlatformStatsStripProps) {
  return (
    <div className="w-full border-y border-white/10 bg-[#080b12]/60">
      <div className="grid grid-cols-2 divide-y divide-white/10 md:grid-cols-4 md:divide-y-0 md:divide-x md:divide-white/10">
        {stats.map((s) => (
          <div
            key={s.label}
            className="py-4 px-4 sm:px-6"
          >
            <div className="font-display text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight tabular-nums leading-none">
              {s.value}
            </div>
            <div className="mt-1.5 font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-dim font-medium">
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
