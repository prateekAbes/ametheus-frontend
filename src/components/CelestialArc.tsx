import React, { useMemo } from 'react'

interface CelestialArcProps {
  /**
   * 'subtle': Understated right-side celestial arc for initial Sign In / Sign Up.
   * 'major': Grand oversized celestial arc / crescent with illuminated rim for /sign-up/continue.
   */
  variant?: 'subtle' | 'major'
  className?: string
}

export default function CelestialArc({ variant = 'subtle', className = '' }: CelestialArcProps) {
  // Deterministic stardust particles along the arc rim
  const dustParticles = useMemo(() => {
    const list = []
    const count = variant === 'major' ? 24 : 14
    for (let i = 0; i < count; i++) {
      const seed1 = (i * 7919 + 104729) % 1000
      const seed2 = (i * 3571 + 224737) % 1000
      const size = i % 5 === 0 ? 2 : i % 2 === 0 ? 1.5 : 1
      const opacity = 0.25 + (seed1 / 1000) * 0.6
      const delay = (i % 6) * 0.7
      list.push({ id: i, offset: seed1 / 1000, spread: (seed2 / 1000 - 0.5) * 60, size, opacity, delay })
    }
    return list
  }, [variant])

  if (variant === 'major') {
    return (
      <div
        className={`pointer-events-none absolute inset-0 size-full overflow-hidden select-none ${className}`}
        aria-hidden="true"
      >
        {/* Deep ambient cosmic glow behind the arc - restrained and subtle */}
        <div className="absolute top-[8%] left-1/2 -translate-x-1/2 h-[520px] w-[860px] max-w-[95vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.06)_0%,rgba(139,92,246,0.04)_35%,transparent_70%)] blur-[100px]" />
        <div className="absolute top-[22%] left-[45%] -translate-x-1/2 h-[380px] w-[620px] max-w-[90vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.05)_0%,transparent_65%)] blur-[85px]" />

        {/* Master Oversized Celestial Arc (SVG) */}
        <svg
          viewBox="0 0 1400 900"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[130%] w-[130%] min-w-[1100px] max-w-none opacity-85 transition-opacity duration-700"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Multi-stop gradient: Royal violet -> electric cobalt -> luminous cyan */}
            <linearGradient id="majorArcGradient" x1="180" y1="780" x2="1120" y2="260" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.3" />
              <stop offset="22%" stopColor="#8b5cf6" stopOpacity="0.75" />
              <stop offset="48%" stopColor="#4f46e5" stopOpacity="0.85" />
              <stop offset="70%" stopColor="#2563eb" stopOpacity="0.9" />
              <stop offset="88%" stopColor="#06b6d4" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.75" />
            </linearGradient>

            {/* Razor-sharp specular highlight gradient across the crest */}
            <linearGradient id="majorCrestSpecular" x1="450" y1="210" x2="880" y2="280" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0" />
              <stop offset="35%" stopColor="#93c5fd" stopOpacity="0.75" />
              <stop offset="55%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="75%" stopColor="#67e8f9" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
            </linearGradient>

            {/* Dark celestial sphere body gradient */}
            <radialGradient id="majorPlanetBody" cx="700" cy="880" r="640" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#030408" stopOpacity="0.99" />
              <stop offset="70%" stopColor="#05060f" stopOpacity="0.95" />
              <stop offset="92%" stopColor="#0a0d1e" stopOpacity="0.88" />
              <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0.35" />
            </radialGradient>

            {/* Specular star flare radial glow */}
            <radialGradient id="starFlareGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
              <stop offset="25%" stopColor="#67e8f9" stopOpacity="0.6" />
              <stop offset="60%" stopColor="#3b82f6" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0" />
            </radialGradient>

            {/* Glow filters */}
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

          {/* Primary Celestial Body (Dark Disc Shading below the arc) */}
          <path
            d="M 120 780 A 620 540 0 0 1 1280 780 L 1280 920 L 120 920 Z"
            fill="url(#majorPlanetBody)"
            opacity="0.98"
          />

          {/* Layer 1: Ambient Deep Nebula Bloom (Restrained soft glow) */}
          <path
            d="M 120 780 A 620 540 0 0 1 1280 780"
            stroke="url(#majorArcGradient)"
            strokeWidth="36"
            strokeLinecap="round"
            filter="url(#majorBloom)"
            opacity="0.22"
          />

          {/* Layer 2: Radiant Luminous Corona (Medium blur) */}
          <path
            d="M 120 780 A 620 540 0 0 1 1280 780"
            stroke="url(#majorArcGradient)"
            strokeWidth="14"
            strokeLinecap="round"
            filter="url(#majorCorona)"
            opacity="0.55"
          />

          {/* Layer 3: Razor-sharp Luminous Outer Rim */}
          <path
            d="M 120 780 A 620 540 0 0 1 1280 780"
            stroke="url(#majorArcGradient)"
            strokeWidth="3.5"
            strokeLinecap="round"
            filter="url(#majorRimGlow)"
            opacity="0.95"
          />

          {/* Layer 4: Specular Rim Light Crest (White-hot sharp crest) */}
          <path
            d="M 380 430 A 620 540 0 0 1 1020 430"
            stroke="url(#majorCrestSpecular)"
            strokeWidth="1.8"
            strokeLinecap="round"
            opacity="0.92"
          />

          {/* Layer 5: Specular Star Flare at Apex (kissing the rim around x=700, y=240) */}
          <g transform="translate(685, 230)">
            {/* Ambient radial flare */}
            <circle cx="15" cy="10" r="55" fill="url(#starFlareGlow)" opacity="0.65" />
            {/* Blinding core */}
            <circle cx="15" cy="10" r="4.5" fill="#ffffff" />
            {/* Horizontal light beam */}
            <line x1="-55" y1="10" x2="85" y2="10" stroke="#ffffff" strokeWidth="1.2" strokeOpacity="0.75" />
            <line x1="-30" y1="10" x2="60" y2="10" stroke="#67e8f9" strokeWidth="2.5" strokeOpacity="0.5" />
            {/* Vertical subtle beam */}
            <line x1="15" y1="-35" x2="15" y2="55" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.6" />
          </g>

          {/* Layer 6: Dynamic Stardust Points along the curve */}
          {dustParticles.map((p) => {
            // Parametric curve calculation along arc
            const t = p.offset
            // Approximate coordinates along the ellipse
            const angle = Math.PI * (0.85 - t * 0.7) // sweeping from left to right
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

        {/* Fine atmospheric cosmic dust overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#ffffff_1px,transparent_1px)] [background-size:64px_64px] opacity-[0.025]" />
      </div>
    )
  }

  // Variant === 'subtle' (Right side of initial Sign In / Sign Up)
  return (
    <div
      className={`pointer-events-none absolute inset-0 size-full overflow-hidden select-none ${className}`}
      aria-hidden="true"
    >
      {/* Soft atmospheric violet-blue glow situated towards the right */}
      <div className="absolute top-[15%] right-[-10%] h-[560px] w-[560px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.14)_0%,rgba(56,189,248,0.08)_45%,transparent_70%)] blur-[80px]" />
      <div className="absolute top-[45%] right-[-5%] h-[380px] w-[380px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.1)_0%,transparent_65%)] blur-[70px]" />

      {/* Subtle Right-Side Celestial Arc (Partially Cropped by Viewport) */}
      <svg
        viewBox="0 0 800 1000"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute right-[-15%] top-[-5%] h-[115%] w-[120%] min-w-[650px] max-w-none opacity-85 transition-opacity duration-700"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="subtleArcGrad" x1="450" y1="60" x2="720" y2="820" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.75" />
            <stop offset="35%" stopColor="#6366f1" stopOpacity="0.9" />
            <stop offset="70%" stopColor="#3b82f6" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.6" />
          </linearGradient>

          <linearGradient id="subtleSpecular" x1="320" y1="180" x2="600" y2="480" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="45%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="70%" stopColor="#93c5fd" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>

          <filter id="subtleBloom" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="28" result="blur" />
          </filter>
          <filter id="subtleCorona" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="8" result="blur" />
          </filter>
        </defs>

        {/* Layer 1: Ambient Bloom */}
        <path
          d="M 520 80 A 460 480 0 0 1 760 920"
          stroke="url(#subtleArcGrad)"
          strokeWidth="38"
          strokeLinecap="round"
          filter="url(#subtleBloom)"
          opacity="0.32"
        />

        {/* Layer 2: Luminous Corona */}
        <path
          d="M 520 80 A 460 480 0 0 1 760 920"
          stroke="url(#subtleArcGrad)"
          strokeWidth="12"
          strokeLinecap="round"
          filter="url(#subtleCorona)"
          opacity="0.65"
        />

        {/* Layer 3: Crisp Rim */}
        <path
          d="M 520 80 A 460 480 0 0 1 760 920"
          stroke="url(#subtleArcGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.9"
        />

        {/* Layer 4: Specular Rim Light */}
        <path
          d="M 530 140 A 460 480 0 0 1 680 580"
          stroke="url(#subtleSpecular)"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.85"
        />

        {/* Layer 5: Subtle Stardust Points along right arc */}
        {dustParticles.map((p) => {
          const t = p.offset
          const angle = Math.PI * (0.6 - t * 0.45)
          const px = 620 + Math.cos(angle) * 220 + p.spread * 0.2
          const py = 480 - Math.sin(angle) * 380 + p.spread * 0.2
          return (
            <circle
              key={p.id}
              cx={px}
              cy={py}
              r={p.size}
              fill={p.id % 2 === 0 ? '#38bdf8' : '#e0e7ff'}
              opacity={p.opacity * 0.8}
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
