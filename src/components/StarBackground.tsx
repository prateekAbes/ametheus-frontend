import { useMemo } from 'react'

interface Star {
  id: number
  top: number
  left: number
  size: number
  opacity: number
  delay: number
  duration: number
}

interface StarBackgroundProps {
  className?: string
  /**
   * 'standard': Subtle space backdrop for initial login / signup right panel.
   * 'continuation': Deep cinematic space with nebula gradients for /sign-up/continue.
   */
  variant?: 'standard' | 'continuation'
}

export default function StarBackground({ className = '', variant = 'standard' }: StarBackgroundProps) {
  // Generate deterministic stars with subtle varying depths
  const stars: Star[] = useMemo(() => {
    const list: Star[] = []
    const count = variant === 'continuation' ? 70 : 50
    for (let i = 0; i < count; i++) {
      // Deterministic pseudo-random generation based on index
      const seed1 = (i * 9301 + 49297) % 233280
      const seed2 = (i * 49297 + 9301) % 233280
      const seed3 = (i * 233280 + 7) % 1000
      const top = (seed1 / 233280) * 100
      const left = (seed2 / 233280) * 100
      const size = i % 8 === 0 ? 2 : i % 3 === 0 ? 1.5 : 1
      const opacity = (variant === 'continuation' ? 0.3 : 0.2) + (seed3 / 1000) * 0.65
      const delay = (i % 6) * 0.7
      const duration = 3.5 + (i % 4) * 1.2

      list.push({ id: i, top, left, size, opacity, delay, duration })
    }
    return list
  }, [variant])

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      {/* Deep cosmic void backdrop */}
      <div className="absolute inset-0 bg-[#05060a]" />

      {/* Atmospheric nebula gradients */}
      {variant === 'continuation' ? (
        <>
          <div className="absolute -top-[15%] left-[20%] h-[70%] w-[60%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.08)_0%,transparent_65%)] blur-[100px]" />
          <div className="absolute top-[25%] right-[10%] h-[60%] w-[50%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.07)_0%,transparent_60%)] blur-[90px]" />
          <div className="absolute -bottom-[20%] left-[10%] h-[65%] w-[65%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(79,70,229,0.06)_0%,transparent_65%)] blur-[100px]" />
          <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 h-[80%] w-[80%] rounded-full bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.03)_0%,transparent_70%)] blur-[120px]" />
        </>
      ) : (
        <>
          <div className="absolute -top-[20%] right-[-10%] h-[80%] w-[80%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(62,242,255,0.06)_0%,transparent_65%)] blur-3xl" />
          <div className="absolute -bottom-[20%] left-[-10%] h-[75%] w-[75%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.05)_0%,transparent_65%)] blur-3xl" />
          <div className="absolute top-[40%] left-[30%] h-[50%] w-[50%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,59,78,0.02)_0%,transparent_60%)] blur-3xl" />
        </>
      )}

      {/* Subtle fine cosmic dust texture */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:48px_48px] opacity-[0.035]" />

      {/* Individual stars layer with twinkle effect */}
      {stars.map((star) => (
        <span
          key={star.id}
          className="absolute rounded-full bg-white animate-star-twinkle"
          style={{
            top: `${star.top}%`,
            left: `${star.left}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.opacity,
            animationDelay: `${star.delay}s`,
            animationDuration: `${star.duration}s`,
            boxShadow: star.size > 1.2 ? '0 0 5px rgba(255,255,255,0.85)' : undefined,
          }}
        />
      ))}
    </div>
  )
}
