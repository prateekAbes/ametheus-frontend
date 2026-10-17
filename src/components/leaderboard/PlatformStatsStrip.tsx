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
 * Inspired by competitive esports dashboards.
 */
export function PlatformStatsStrip({ stats }: PlatformStatsStripProps) {
  return (
    <div className="w-full border-y border-white/10 bg-[#080b12]/60 backdrop-blur-xs">
      <div className="mx-auto w-full max-w-[1600px] px-5 md:px-10">
        <div className="grid grid-cols-2 divide-y divide-white/10 sm:grid-cols-2 md:grid-cols-4 md:divide-y-0 md:divide-x md:divide-white/10">
          {stats.map((s, idx) => (
            <div
              key={s.label}
              className={`py-4 sm:py-5 px-3 sm:px-6 ${
                idx % 2 !== 0 ? 'border-l border-white/10 md:border-l-0' : ''
              }`}
            >
              <div className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight tabular-nums leading-none">
                {s.value}
              </div>
              <div className="mt-2 font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-dim font-medium">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
