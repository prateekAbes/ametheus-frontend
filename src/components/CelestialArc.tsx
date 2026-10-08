import React, { useMemo } from 'react'

interface CelestialArcProps {
  /**
   * 'subtle' or 'sweeping': Full sweeping continuous purple arc from top of browser toward upper/middle right.
   * 'major': Grand oversized celestial arc / crescent with illuminated rim for /sign-up/continue.
   */
  variant?: 'subtle' | 'major' | 'sweeping'
  className?: string
}

export default function CelestialArc({ variant = 'sweeping', className = '' }: CelestialArcProps) {
  // Deterministic stardust particles along the arc rim
  const dustParticles = useMemo(() => {
    const list = []
    const count = variant === 'major' ? 24 : 18
    for (let i = 0; i < count; i++) {
      const seed1 = (i * 7919 + 104729) % 1000
      const seed2 = (i * 3571 + 224737) % 1000
      const size = i % 5 === 0 ? 2.5 : i % 2 === 0 ? 1.8 : 1.2
      const opacity = 0.35 + (seed1 / 1000) * 0.55
      const delay = (i % 6) * 0.7
      list.push({ id: i, offset: seed1 / 1000, spread: (seed2 / 1000 - 0.5) * 50, size, opacity, delay })
    }
    return list
  }, [variant])

  if (variant === 'major') {
    return (
      <div
        className={`pointer-events-none absolute inset-0 size-full overflow-hidden select-none ${className}`}
        aria-hidden="true"
      >
        {/* Deep ambient cosmic glow behind the arc */}
        <div className="absolute top-[8%] left-1/2 -translate-x-1/2 h-[520px] w-[860px] max-w-[95vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.08)_0%,rgba(139,92,246,0.06)_35%,transparent_70%)] blur-[100px]" />
        <div className="absolute top-[22%] left-[45%] -translate-x-1/2 h-[380px] w-[620px] max-w-[90vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.06)_0%,transparent_65%)] blur-[85px]" />

        {/* Master Oversized Celestial Arc (SVG) */}
        <svg
          viewBox="0 0 1400 900"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[130%] w-[130%] min-w-[1100px] max-w-none opacity-90 transition-opacity duration-700"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="majorArcGradient" x1="180" y1="780" x2="1120" y2="260" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.3" />
              <stop offset="22%" stopColor="#8b5cf6" stopOpacity="0.8" />
              <stop offset="48%" stopColor="#4f46e5" stopOpacity="0.9" />
              <stop offset="70%" stopColor="#2563eb" stopOpacity="0.92" />
              <stop offset="88%" stopColor="#06b6d4" stopOpacity="0.88" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.75" />
            </linearGradient>

            <linearGradient id="majorCrestSpecular" x1="450" y1="210" x2="880" y2="280" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0" />
              <stop offset="35%" stopColor="#93c5fd" stopOpacity="0.8" />
              <stop offset="55%" stopColor="#ffffff" stopOpacity="0.98" />
              <stop offset="75%" stopColor="#67e8f9" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
            </linearGradient>

            <radialGradient id="majorPlanetBody" cx="700" cy="880" r="640" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#030408" stopOpacity="0.99" />
              <stop offset="70%" stopColor="#05060f" stopOpacity="0.95" />
              <stop offset="92%" stopColor="#0a0d1e" stopOpacity="0.88" />
              <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0.35" />
            </radialGradient>

            <radialGradient id="majorStarFlareGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
              <stop offset="25%" stopColor="#67e8f9" stopOpacity="0.65" />
              <stop offset="60%" stopColor="#3b82f6" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0" />
            </radialGradient>

            <filter id="majorBloom" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="30" result="blur" />
            </filter>
            <filter id="majorCorona" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation="10" result="blur" />
            </filter>
            <filter id="majorRimGlow" x="-5%" y="-5%" width="110%" height="110%">
              <feGaussianBlur stdDeviation="3" result="blur" />
            </filter>
          </defs>

          {/* Primary Celestial Body */}
          <path
            d="M 120 780 A 620 540 0 0 1 1280 780 L 1280 920 L 120 920 Z"
            fill="url(#majorPlanetBody)"
            opacity="0.98"
          />

          {/* Layer 1: Ambient Bloom */}
          <path
            d="M 120 780 A 620 540 0 0 1 1280 780"
            stroke="url(#majorArcGradient)"
            strokeWidth="36"
            strokeLinecap="round"
            filter="url(#majorBloom)"
            opacity="0.25"
          />

          {/* Layer 2: Luminous Corona */}
          <path
            d="M 120 780 A 620 540 0 0 1 1280 780"
            stroke="url(#majorArcGradient)"
            strokeWidth="14"
            strokeLinecap="round"
            filter="url(#majorCorona)"
            opacity="0.60"
          />

          {/* Layer 3: Razor-sharp Luminous Rim */}
          <path
            d="M 120 780 A 620 540 0 0 1 1280 780"
            stroke="url(#majorArcGradient)"
            strokeWidth="3.5"
            strokeLinecap="round"
            filter="url(#majorRimGlow)"
            opacity="0.95"
          />

          {/* Layer 4: Specular Rim Light Crest */}
          <path
            d="M 380 430 A 620 540 0 0 1 1020 430"
            stroke="url(#majorCrestSpecular)"
            strokeWidth="1.8"
            strokeLinecap="round"
            opacity="0.92"
          />

          {/* Layer 5: Specular Star Flare */}
          <g transform="translate(685, 230)">
            <circle cx="15" cy="10" r="55" fill="url(#majorStarFlareGlow)" opacity="0.75" />
            <circle cx="15" cy="10" r="4.5" fill="#ffffff" />
            <line x1="-55" y1="10" x2="85" y2="10" stroke="#ffffff" strokeWidth="1.2" strokeOpacity="0.75" />
            <line x1="-30" y1="10" x2="60" y2="10" stroke="#67e8f9" strokeWidth="2.5" strokeOpacity="0.5" />
            <line x1="15" y1="-35" x2="15" y2="55" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.6" />
          </g>

          {/* Layer 6: Dynamic Stardust Points */}
          {dustParticles.map((p) => {
            const t = p.offset
            const angle = Math.PI * (0.85 - t * 0.7)
            const px = 700 + Math.cos(angle) * 580 + p.spread * 0.3
            const py = 760 - Math.sin(angle) * 510 + p.spread * 0.3
            return (
              <circle
                key={p.id}
                cx={px}
                cy={py}
                r={p.size}
                fill={p.id % 3 === 0 ? '#67e8f9' : p.id % 2 === 0 ? '#ffffff' : '#c084fc'}
                opacity={p.opacity}
                className="animate-star-twinkle"
                style={{
                  animationDelay: `${p.delay}s`,
                }}
              />
            )
          })}
        </svg>
      </div>
    )
  }

  // Large Sweeping Purple Arc (Starts near top of browser, sweeps continuously toward upper/middle-right)
  return (
    <div
      className={`pointer-events-none absolute inset-0 size-full overflow-hidden select-none z-0 ${className}`}
      aria-hidden="true"
    >
      {/* Deep atmospheric purple glow behind arc crest */}
      <div className="absolute top-[-5%] left-[25%] h-[45vh] w-[60vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.18)_0%,rgba(124,58,237,0.08)_45%,transparent_75%)] blur-[75px]" />
      <div className="absolute top-[14%] right-[2%] h-[55vh] w-[48vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.14)_0%,rgba(99,102,241,0.06)_50%,transparent_75%)] blur-[80px]" />

      {/* SVG Sweeping Continuous Arc spanning from near top across to upper/middle-right */}
      <svg
        viewBox="0 0 1920 1080"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 h-full w-full object-cover"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="sweepingArcGrad" x1="200" y1="20" x2="1920" y2="640" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#d8b4fe" stopOpacity="0.85" />
            <stop offset="22%" stopColor="#a855f7" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#7c3aed" stopOpacity="0.90" />
            <stop offset="78%" stopColor="#6366f1" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.60" />
          </linearGradient>

          <linearGradient id="sweepingSpecular" x1="480" y1="30" x2="1420" y2="320" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="35%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="70%" stopColor="#f3e8ff" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#c084fc" stopOpacity="0" />
          </linearGradient>

          <radialGradient id="sweepingFlareGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="30%" stopColor="#c084fc" stopOpacity="0.65" />
            <stop offset="70%" stopColor="#7c3aed" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
          </radialGradient>

          <filter id="sweepingBloom" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="34" />
          </filter>
          <filter id="sweepingCorona" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="12" />
          </filter>
          <filter id="sweepingCore" x="-5%" y="-5%" width="110%" height="110%">
            <feGaussianBlur stdDeviation="3.5" />
          </filter>
        </defs>

        {/* Layer 1: Atmospheric wide bloom */}
        <path
          d="M 200 20 C 780 36, 1420 220, 1920 620"
          stroke="url(#sweepingArcGrad)"
          strokeWidth="44"
          strokeLinecap="round"
          filter="url(#sweepingBloom)"
          opacity="0.45"
        />

        {/* Layer 2: Radiant luminous corona */}
        <path
          d="M 200 20 C 780 36, 1420 220, 1920 620"
          stroke="url(#sweepingArcGrad)"
          strokeWidth="16"
          strokeLinecap="round"
          filter="url(#sweepingCorona)"
          opacity="0.75"
        />

        {/* Layer 3: Vivid sharp core ribbon */}
        <path
          d="M 200 20 C 780 36, 1420 220, 1920 620"
          stroke="url(#sweepingArcGrad)"
          strokeWidth="3.5"
          strokeLinecap="round"
          filter="url(#sweepingCore)"
          opacity="0.95"
        />

        {/* Layer 4: Razor-sharp white specular crest along top sweep */}
        <path
          d="M 460 26 C 880 54, 1320 180, 1720 460"
          stroke="url(#sweepingSpecular)"
          strokeWidth="2.2"
          strokeLinecap="round"
          opacity="0.92"
        />

        {/* Layer 5: Luminous celestial flare kissing apex near top-center */}
        <g transform="translate(860, 48)">
          <circle cx="0" cy="0" r="48" fill="url(#sweepingFlareGlow)" opacity="0.8" />
          <circle cx="0" cy="0" r="4" fill="#ffffff" />
          <line x1="-55" y1="0" x2="55" y2="0" stroke="#ffffff" strokeWidth="1.2" strokeOpacity="0.7" />
          <line x1="-30" y1="0" x2="30" y2="0" stroke="#c084fc" strokeWidth="2.5" strokeOpacity="0.5" />
        </g>

        {/* Layer 6: Dynamic Stardust Points along sweeping curve */}
        {dustParticles.map((p) => {
          const t = p.offset
          // Cubic Bezier interpolation: B(t) = (1-t)^3*P0 + 3(1-t)^2*t*P1 + 3(1-t)*t^2*P2 + t^3*P3
          const invT = 1 - t
          const p0 = { x: 200, y: 20 }
          const p1 = { x: 780, y: 36 }
          const p2 = { x: 1420, y: 220 }
          const p3 = { x: 1920, y: 620 }

          const px =
            Math.pow(invT, 3) * p0.x +
            3 * Math.pow(invT, 2) * t * p1.x +
            3 * invT * Math.pow(t, 2) * p2.x +
            Math.pow(t, 3) * p3.x +
            p.spread * 0.2
          const py =
            Math.pow(invT, 3) * p0.y +
            3 * Math.pow(invT, 2) * t * p1.y +
            3 * invT * Math.pow(t, 2) * p2.y +
            Math.pow(t, 3) * p3.y +
            p.spread * 0.2

          return (
            <circle
              key={p.id}
              cx={px}
              cy={py}
              r={p.size}
              fill={p.id % 3 === 0 ? '#38bdf8' : p.id % 2 === 0 ? '#ffffff' : '#d8b4fe'}
              opacity={p.opacity}
              className="animate-star-twinkle"
              style={{
                animationDelay: `${p.delay}s`,
              }}
            />
          )
        })}
      </svg>
    </div>
  )
}
