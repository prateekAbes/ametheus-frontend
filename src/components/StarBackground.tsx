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
    const countDistant = isContinuation ? 155 : 55
    const countMid = isContinuation ? 72 : 28
    const countFocal = isContinuation ? 18 : 8

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
      return x >= 30 && x <= 70 && y >= 18 && y <= 82
    }

    // LAYER 1: Background Distant Stars (Tiny points of light, deep cosmos)
    for (let i = 0; i < countDistant; i++) {
      const s1 = (i * 9301 + 49297 + 11) % 233280
      const s2 = (i * 49297 + 9301 + 23) % 233280
      const s3 = (i * 233280 + 7 + 37) % 1000

      const left = (s1 / 233280) * 100
      const top = (s2 / 233280) * 100
      const inCenter = isInCentralCorridor(left, top)

      // Sub-pixel sizes from 0.65px to 1.1px
      const sizeIndex = i % 4
      const size = sizeIndex === 0 ? 0.65 : sizeIndex === 1 ? 0.8 : sizeIndex === 2 ? 0.95 : 1.1

      // Opacity: outer stars slightly clearer (0.14–0.32), center stars restrained (0.08–0.18)
      const rawOpacity = 0.12 + (s3 / 1000) * 0.22
      const baseOpacity = inCenter ? Math.min(rawOpacity, 0.16) : rawOpacity

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

      // Sizes: 1.15px to 1.65px
      const size = i % 3 === 0 ? 1.15 : i % 3 === 1 ? 1.4 : 1.65
      const rawOpacity = 0.28 + (s3 / 1000) * 0.28
      const baseOpacity = inCenter ? 0.18 : rawOpacity
      const maxOpacity = baseOpacity * 1.35

      // Only ~12% of middle stars gently breathe over a long duration (10s - 16s)
      const hasAnimation = i % 8 === 0 && !inCenter
      const animationDuration = 9 + (i % 5) * 1.6
      const animationDelay = (i % 7) * 1.1

      const color = i % 4 === 0 ? '#ffffff' : i % 4 === 1 ? '#e0f2fe' : '#f8fafc'
      const boxShadow = size > 1.35 && !inCenter ? `0 0 2.5px rgba(255, 255, 255, 0.4)` : undefined

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

      if (left >= 28 && left <= 72) {
        left = left < 50 ? 5 + (left / 50) * 20 : 75 + ((left - 50) / 50) * 20
      }
      if (top >= 22 && top <= 78) {
        top = top < 50 ? 5 + (top / 50) * 15 : 80 + ((top - 50) / 50) * 15
      }

      // Sizes: 1.9px to 2.4px
      const size = i % 2 === 0 ? 1.9 : 2.3
      const baseOpacity = 0.65 + (s3 / 1000) * 0.2
      const maxOpacity = Math.min(0.95, baseOpacity * 1.25)

      // Soft delicate bloom, never harsh
      const boxShadow = `0 0 3px 1px rgba(255, 255, 255, 0.6), 0 0 8px 2px rgba(186, 230, 253, 0.25)`

      // ~25% have very slow, subtle breath (8s - 14s)
      const hasAnimation = i % 4 === 0
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
          {/* Deep space base navy gradient */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(15,23,42,0.45)_0%,rgba(3,4,8,0.95)_75%)]" />

          {/* Faint deep midnight navy haze (upper-right) */}
          <div className="absolute -top-[12%] right-[8%] h-[60%] w-[52%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(30,58,138,0.075)_0%,rgba(15,23,42,0.04)_45%,transparent_70%)] blur-[110px]" />

          {/* Faint subtle violet-indigo atmosphere (lower-left) */}
          <div className="absolute -bottom-[15%] left-[6%] h-[58%] w-[54%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(79,70,229,0.05)_0%,rgba(88,28,135,0.03)_50%,transparent_70%)] blur-[120px]" />

          {/* Faint cool cyan atmospheric horizon (top-center) */}
          <div className="absolute top-[-5%] left-[45%] -translate-x-1/2 h-[40%] w-[55%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(8,145,178,0.045)_0%,transparent_65%)] blur-[95px]" />

          {/* Elegant transparent purple radial glow in the nebula background */}
          <div className="absolute top-[32%] left-1/2 -translate-x-1/2 -translate-y-1/2 h-[520px] w-[640px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.045)_0%,rgba(59,130,246,0.025)_40%,transparent_70%)] blur-[115px] pointer-events-none" />

          {/* Central dark pocket / radial vignette to protect the UI and guarantee pristine contrast */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(3,4,8,0.52)_0%,transparent_70%)] pointer-events-none" />
        </>
      ) : (
        <>
          {/* Main Login: deep black, deep navy, subtle blue, subtle purple, faint atmospheric gradients */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_20%,rgba(15,23,42,0.4)_0%,rgba(3,4,8,0.92)_70%)]" />
          <div className="absolute -top-[15%] left-[-8%] h-[75%] w-[65%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(30,58,138,0.075)_0%,rgba(79,70,229,0.04)_45%,transparent_70%)] blur-[110px]" />
          <div className="absolute top-[25%] right-[-10%] h-[70%] w-[65%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(62,242,255,0.045)_0%,rgba(139,92,246,0.035)_50%,transparent_65%)] blur-3xl" />
          <div className="absolute -bottom-[20%] left-[20%] h-[65%] w-[65%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.035)_0%,rgba(30,58,138,0.045)_50%,transparent_65%)] blur-3xl" />
        </>
      )}

      {/* Subtle fine cosmic stardust texture */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:48px_48px] opacity-[0.018]" />

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
