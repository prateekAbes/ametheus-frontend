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
   * 'standard': Full-screen unified celestial environment with stars, glowing dots, particles & purple atmosphere across both sides.
   * 'continuation': Deep refined celestial night sky with multi-layered depth for /sign-up/continue.
   */
  variant?: 'standard' | 'continuation'
}

/**
 * High-quality deterministic pseudo-random number generator (Mulberry32).
 * Guarantees completely natural, organic distribution with ZERO grid alignment or diagonal streaks.
 */
function createRng(seed: number) {
  let s = seed >>> 0
  return function next() {
    let t = (s += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export default function StarBackground({ className = '', variant = 'standard' }: StarBackgroundProps) {
  // Deterministic multi-layered star generator
  const stars: Star[] = useMemo(() => {
    const list: Star[] = []
    const isContinuation = variant === 'continuation'
    const rng = createRng(isContinuation ? 987654321 : 123456789)

    // Total star counts per layer
    const countDistant = isContinuation ? 165 : 185
    const countMid = isContinuation ? 75 : 85
    const countFocal = isContinuation ? 18 : 22

    let starId = 0

    // Palette of natural cool celestial tones (no garish neons)
    const distantColors = [
      '#ffffff', // Pure white
      '#f8fafc', // Bright cool white
      '#f1f5f9', // Soft starlight white
      '#e0f2fe', // Ice blue tint
      '#ede9fe', // Soft violet tint
      '#cbd5e1', // Faint distant stellar grey-blue
    ]

    const midColors = [
      '#ffffff', // Pure crisp white
      '#f8fafc', // Bright cool starlight
      '#e0f2fe', // Delicate ice blue
      '#ede9fe', // Delicate lavender
      '#c4b5fd', // Celestial violet dot
      '#38bdf8', // Subtle cyan particle dot
    ]

    // LAYER 1: Background Distant Stars (Tiny points of light, deep cosmos across entire page)
    for (let i = 0; i < countDistant; i++) {
      const left = rng() * 100
      const top = rng() * 100

      // Sub-pixel sizes from 0.7px to 1.2px
      const sizeIndex = i % 4
      const size = sizeIndex === 0 ? 0.7 : sizeIndex === 1 ? 0.85 : sizeIndex === 2 ? 1.0 : 1.25

      const rawOpacity = 0.22 + rng() * 0.35
      const color = distantColors[i % distantColors.length]

      list.push({
        id: starId++,
        top,
        left,
        size,
        baseOpacity: rawOpacity,
        color,
        hasAnimation: false, // Distant stars are calm and static
      })
    }

    // LAYER 2: Middle Field Stars (Softly glowing points & colored dots across entire screen)
    for (let i = 0; i < countMid; i++) {
      const left = rng() * 100
      const top = rng() * 100

      // Sizes: 1.2px to 1.8px
      const size = i % 3 === 0 ? 1.2 : i % 3 === 1 ? 1.5 : 1.8
      const baseOpacity = 0.38 + rng() * 0.35
      const maxOpacity = Math.min(0.95, baseOpacity * 1.35)

      // ~20% of middle stars gently breathe over a long duration (7s - 14s)
      const hasAnimation = i % 5 === 0
      const animationDuration = 8 + (i % 5) * 1.5
      const animationDelay = (i % 7) * 1.1

      const color = midColors[i % midColors.length]
      const boxShadow =
        size > 1.4
          ? color === '#38bdf8'
            ? '0 0 3px rgba(56, 189, 248, 0.6)'
            : color === '#c4b5fd' || color === '#ede9fe'
            ? '0 0 3px rgba(167, 139, 250, 0.6)'
            : '0 0 2.5px rgba(255, 255, 255, 0.55)'
          : undefined

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

    // LAYER 3: Foreground Focal Celestial Points (Brighter, delicate halo bloom across entire screen)
    for (let i = 0; i < countFocal; i++) {
      const left = rng() * 100
      const top = rng() * 100

      // Sizes: 2.0px to 2.6px
      const size = i % 2 === 0 ? 2.0 : 2.5
      const baseOpacity = 0.75 + rng() * 0.22
      const maxOpacity = Math.min(1.0, baseOpacity * 1.25)

      // Soft delicate bloom
      const boxShadow = '0 0 4px 1.5px rgba(255, 255, 255, 0.75), 0 0 10px 3px rgba(167, 139, 250, 0.35)'

      // ~30% have very slow, subtle breath (8s - 14s)
      const hasAnimation = i % 3 === 0
      const animationDuration = 9 + (i % 4) * 1.5
      const animationDelay = (i % 5) * 1.2

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

    // LAYER 4: High-Density Left-Side Celestial Atmosphere (Continuous micro stardust & glowing points on left side)
    const countLeftSmall = isContinuation ? 160 : 180
    for (let i = 0; i < countLeftSmall; i++) {
      const left = rng() * 56
      const top = rng() * 100
      const sizeIndex = i % 3
      const size = sizeIndex === 0 ? 0.65 : sizeIndex === 1 ? 0.85 : 1.15
      const edgeFade = left > 46 ? Math.max(0.18, 1 - (left - 46) / 10) : 1
      const rawOpacity = (0.24 + rng() * 0.45) * edgeFade
      const color = distantColors[i % distantColors.length]
      list.push({
        id: starId++,
        top,
        left,
        size,
        baseOpacity: rawOpacity,
        color,
        hasAnimation: i % 4 === 0,
        animationDuration: 7 + (i % 5) * 1.5,
        animationDelay: (i % 6) * 0.9,
      })
    }

    const countLeftMedium = isContinuation ? 40 : 50
    for (let i = 0; i < countLeftMedium; i++) {
      const left = rng() * 54
      const top = rng() * 100
      const size = i % 2 === 0 ? 1.4 : 1.9
      const edgeFade = left > 44 ? Math.max(0.2, 1 - (left - 44) / 10) : 1
      const baseOpacity = (0.35 + rng() * 0.40) * edgeFade
      const maxOpacity = Math.min(0.95, baseOpacity * 1.35)
      const color = midColors[i % midColors.length]
      const boxShadow =
        color === '#38bdf8'
          ? '0 0 4px rgba(56, 189, 248, 0.7)'
          : color === '#c4b5fd' || color === '#ede9fe'
          ? '0 0 4px rgba(167, 139, 250, 0.7)'
          : '0 0 3px rgba(255, 255, 255, 0.65)'

      list.push({
        id: starId++,
        top,
        left,
        size,
        baseOpacity,
        maxOpacity,
        color,
        boxShadow,
        hasAnimation: true,
        animationDuration: 8 + (i % 4) * 2,
        animationDelay: (i % 5) * 1.1,
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
          <div className="absolute -top-[12%] right-[8%] h-[60%] w-[52%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(30,58,138,0.08)_0%,rgba(15,23,42,0.04)_45%,transparent_70%)] blur-[110px]" />

          {/* Faint subtle violet-indigo atmosphere (lower-left) */}
          <div className="absolute -bottom-[15%] left-[6%] h-[58%] w-[54%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(79,70,229,0.06)_0%,rgba(88,28,135,0.03)_50%,transparent_70%)] blur-[120px]" />

          {/* Faint cool cyan atmospheric horizon (top-center) */}
          <div className="absolute top-[-5%] left-[45%] -translate-x-1/2 h-[40%] w-[55%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(8,145,178,0.05)_0%,transparent_65%)] blur-[95px]" />

          {/* Elegant transparent purple radial glow in the nebula background */}
          <div className="absolute top-[32%] left-1/2 -translate-x-1/2 -translate-y-1/2 h-[520px] w-[640px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.06)_0%,rgba(59,130,246,0.03)_40%,transparent_70%)] blur-[115px] pointer-events-none" />

          {/* Central dark pocket / radial vignette to protect the UI and guarantee pristine contrast */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(3,4,8,0.52)_0%,transparent_70%)] pointer-events-none" />
        </>
      ) : (
        <>
          {/* Main Login: Continuous full-page celestial atmosphere (deep black, deep navy, subtle blue, subtle purple) */}
          {/* Deep space base navy gradient across the full viewport */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,rgba(17,24,39,0.6)_0%,rgba(15,23,42,0.4)_45%,rgba(3,4,8,0.96)_85%)]" />

          {/* Left subtle violet/purple nebula around and behind the sphere */}
          <div className="absolute top-[8%] -left-[10%] h-[82%] w-[68%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.16)_0%,rgba(99,102,241,0.08)_40%,transparent_70%)] blur-[120px] pointer-events-none" />

          {/* Right subtle violet/purple nebula spanning across the right side */}
          <div className="absolute top-[12%] -right-[8%] h-[82%] w-[68%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(147,51,234,0.14)_0%,rgba(79,70,229,0.07)_40%,transparent_70%)] blur-[120px] pointer-events-none" />

          {/* Center celestial bridge connecting left and right smoothly with purple/indigo atmosphere */}
          <div className="absolute top-[25%] left-1/2 -translate-x-1/2 h-[70%] w-[90%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.09)_0%,rgba(30,58,138,0.05)_45%,transparent_70%)] blur-[125px] pointer-events-none" />

          {/* Top subtle cool cyan/ice-blue starlight horizon */}
          <div className="absolute -top-[12%] left-[48%] -translate-x-1/2 h-[45%] w-[75%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.05)_0%,transparent_65%)] blur-[100px] pointer-events-none" />

          {/* Bottom subtle deep midnight navy shadow haze */}
          <div className="absolute -bottom-[20%] left-1/2 -translate-x-1/2 h-[55%] w-[92%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(30,58,138,0.1)_0%,rgba(15,23,42,0.05)_50%,transparent_70%)] blur-[120px] pointer-events-none" />
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
