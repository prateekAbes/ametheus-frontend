import React, { useMemo } from 'react'

interface Star {
  id: number
  top: number
  left: number
  size: number
  baseOpacity: number
  maxOpacity?: number
  color: string
  boxShadow?: string
  filter?: string
  hasAnimation: boolean
  animationDuration?: number
  animationDelay?: number
}

interface StarBackgroundProps {
  className?: string
  /**
   * 'standard': Subtle space backdrop for initial login / signup right panel.
   * 'continuation': Deep refined celestial night sky with multi-layered depth for /sign-up/continue.
   */
  variant?: 'standard' | 'continuation'
}

export default function StarBackground({ className = '', variant = 'standard' }: StarBackgroundProps) {
  // Deterministic multi-layered star generator
  const stars: Star[] = useMemo(() => {
    const list: Star[] = []
    const isContinuation = variant === 'continuation'

    // Total star counts per layer
    const countDistant = isContinuation ? 105 : 35
    const countMid = isContinuation ? 52 : 20
    const countFocal = isContinuation ? 14 : 6

    let starId = 0

    // Palette of natural cool celestial tones (no garish neons)
    const starColors = [
      '#ffffff', // Pure white
      '#f8fafc', // Bright cool white
      '#f1f5f9', // Soft starlight white
      '#e0f2fe', // Extremely subtle ice blue tint
      '#ede9fe', // Extremely subtle soft violet tint
      '#cbd5e1', // Faint distant stellar grey-blue
    ]

    // Pseudo-random deterministic generator helper
    const pseudoRandom = (seed: number, mod = 233280) => ((seed * 9301 + 49297) % mod) / mod

    // Helper to test if a coordinate is in the central UI bounding corridor
    // where authentication inputs and text reside (protects form readability)
    const isInCentralCorridor = (x: number, y: number) => {
      return x >= 33 && x <= 67 && y >= 20 && y <= 80
    }

    // LAYER 1: Background Distant Stars (Tiny points of light, deep cosmos)
    for (let i = 0; i < countDistant; i++) {
      const s1 = (i * 9301 + 49297 + 11) % 233280
      const s2 = (i * 49297 + 9301 + 23) % 233280
      const s3 = (i * 233280 + 7 + 37) % 1000

      const left = (s1 / 233280) * 100
      const top = (s2 / 233280) * 100
      const inCenter = isInCentralCorridor(left, top)

      // Sub-pixel sizes from 0.7px to 1.1px
      const sizeIndex = i % 4
      const size = sizeIndex === 0 ? 0.7 : sizeIndex === 1 ? 0.85 : sizeIndex === 2 ? 1.0 : 1.15

      // Opacity: outer stars slightly clearer (0.16–0.38), center stars restrained (0.10–0.22)
      const rawOpacity = 0.14 + (s3 / 1000) * 0.24
      const baseOpacity = inCenter ? Math.min(rawOpacity, 0.2) : rawOpacity

      const color = starColors[i % starColors.length]

      list.push({
        id: starId++,
        top,
        left,
        size,
        baseOpacity,
        color,
        hasAnimation: false, // Distant stars are calm and static
      })
    }

    // LAYER 2: Middle Field Stars (Softly glowing, small-medium points)
    for (let i = 0; i < countMid; i++) {
      const s1 = (i * 12345 + 67891 + 59) % 233280
      const s2 = (i * 67891 + 12345 + 71) % 233280
      const s3 = (i * 233280 + 13 + 83) % 1000

      let left = (s1 / 233280) * 100
      let top = (s2 / 233280) * 100
      const inCenter = isInCentralCorridor(left, top)

      // If in center, softly nudge toward outer quadrants or soften
      if (inCenter && i % 2 === 0) {
        left = left < 50 ? left * 0.65 : 100 - (100 - left) * 0.65
      }

      // Sizes: 1.2px to 1.7px
      const size = i % 3 === 0 ? 1.2 : i % 3 === 1 ? 1.45 : 1.7
      const rawOpacity = 0.32 + (s3 / 1000) * 0.3
      const baseOpacity = inCenter ? 0.22 : rawOpacity
      const maxOpacity = baseOpacity * 1.35

      // Only ~15% of middle stars gently breathe over a long duration (10s - 16s)
      const hasAnimation = i % 6 === 0 && !inCenter
      const animationDuration = 9 + (i % 5) * 1.6
      const animationDelay = (i % 7) * 1.1

      const color = i % 4 === 0 ? '#ffffff' : i % 4 === 1 ? '#e0f2fe' : '#f8fafc'
      const boxShadow = size > 1.4 && !inCenter ? `0 0 2.5px rgba(255, 255, 255, 0.45)` : undefined

      list.push({
        id: starId++,
        top,
        left,
        size,
        baseOpacity,
        maxOpacity,
        color,
        boxShadow,
        hasAnimation,
        animationDuration,
        animationDelay,
      })
    }

    // LAYER 3: Foreground Focal Celestial Points (Brighter, delicate halo bloom)
    for (let i = 0; i < countFocal; i++) {
      const s1 = (i * 3571 + 224737 + 101) % 233280
      const s2 = (i * 7919 + 104729 + 113) % 233280
      const s3 = (i * 233280 + 17 + 127) % 1000

      // Strictly map focal stars to outer areas (flanks, top sky, lower flanks)
      // Never directly behind the central form
      let left = (s1 / 233280) * 100
      let top = (s2 / 233280) * 100

      if (left >= 30 && left <= 70) {
        left = left < 50 ? 5 + (left / 50) * 22 : 73 + ((left - 50) / 50) * 22
      }
      if (top >= 25 && top <= 75) {
        top = top < 50 ? 6 + (top / 50) * 16 : 78 + ((top - 50) / 50) * 16
      }

      // Sizes: 2.0px to 2.6px
      const size = i % 2 === 0 ? 2.1 : 2.5
      const baseOpacity = 0.72 + (s3 / 1000) * 0.18
      const maxOpacity = Math.min(1.0, baseOpacity * 1.25)

      // Soft delicate bloom, never harsh
      const boxShadow = `0 0 3px 1px rgba(255, 255, 255, 0.65), 0 0 8px 2px rgba(186, 230, 253, 0.28)`

      // ~30% have very slow, subtle breath (8s - 14s)
      const hasAnimation = i % 3 === 0
      const animationDuration = 10 + (i % 4) * 1.5
      const animationDelay = (i % 5) * 1.4

      list.push({
        id: starId++,
        top,
        left,
        size,
        baseOpacity,
        maxOpacity,
        color: '#ffffff',
        boxShadow,
        hasAnimation,
        animationDuration,
        animationDelay,
      })
    }

    return list
  }, [variant])

  return (
    <div
      className={`pointer-events-none absolute inset-0 size-full overflow-hidden select-none ${className}`}
      aria-hidden="true"
    >
      {/* Deep cosmic void base */}
      <div className="absolute inset-0 bg-[#030408]" />

      {/* Atmospheric depth: extremely soft, restrained celestial glow */}
      {variant === 'continuation' ? (
        <>
          {/* Faint deep midnight navy haze (upper-right) */}
          <div className="absolute -top-[12%] right-[8%] h-[60%] w-[52%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(30,58,138,0.075)_0%,rgba(15,23,42,0.04)_45%,transparent_70%)] blur-[110px]" />

          {/* Faint subtle violet-indigo atmosphere (lower-left) */}
          <div className="absolute -bottom-[15%] left-[6%] h-[58%] w-[54%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(79,70,229,0.05)_0%,rgba(88,28,135,0.03)_50%,transparent_70%)] blur-[120px]" />

          {/* Faint cool cyan atmospheric horizon (top-center) */}
          <div className="absolute top-[-5%] left-[45%] -translate-x-1/2 h-[40%] w-[55%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(8,145,178,0.045)_0%,transparent_65%)] blur-[95px]" />

          {/* Central dark pocket / radial vignette to protect the UI and guarantee pristine contrast */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(3,4,8,0.52)_0%,transparent_70%)] pointer-events-none" />
        </>
      ) : (
        <>
          <div className="absolute -top-[20%] right-[-10%] h-[80%] w-[80%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(62,242,255,0.05)_0%,transparent_65%)] blur-3xl" />
          <div className="absolute -bottom-[20%] left-[-10%] h-[75%] w-[75%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.04)_0%,transparent_65%)] blur-3xl" />
        </>
      )}

      {/* Subtle fine cosmic stardust texture */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:48px_48px] opacity-[0.02]" />

      {/* Multi-layered stars rendering */}
      {stars.map((star) => (
        <span
          key={star.id}
          className={`absolute rounded-full ${star.hasAnimation ? 'animate-star-gentle' : ''}`}
          style={{
            top: `${star.top}%`,
            left: `${star.left}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            backgroundColor: star.color,
            opacity: star.baseOpacity,
            boxShadow: star.boxShadow,
            filter: star.filter,
            // Custom properties passed to gentle animation
            ['--star-min-opacity' as any]: star.baseOpacity,
            ['--star-max-opacity' as any]: star.maxOpacity ?? star.baseOpacity * 1.3,
            ['--star-duration' as any]: star.animationDuration ? `${star.animationDuration}s` : undefined,
            animationDelay: star.animationDelay ? `${star.animationDelay}s` : undefined,
          }}
        />
      ))}
    </div>
  )
}
