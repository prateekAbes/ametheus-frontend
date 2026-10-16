import React, { lazy, Suspense } from 'react'
import { isMobile, reducedMotion } from '../../lib/motion'

const Scene3D = lazy(() => import('../Scene3D'))

/**
 * Upper Leaderboard Particle Background
 * Reuses the actual homepage WebGL particle system (Three.js Field & Rig):
 * - Identical particle density: 1,200 particles on desktop, 400-500 on mobile
 * - Identical particle distribution, size variation, additive blending, and drift
 * - Identical cursor interaction: displacement, push intensity, and smooth settling
 * - Zero 3D crystals, spheres, cubes, or text — pure particle field only
 * - Strictly pointer-events-none; never intercepts clicks or scrolling
 * - Halts on prefers-reduced-motion or when scrolled out of view
 */
export function LeaderboardParticleBackground() {
  const isReduced = reducedMotion()
  if (isReduced) return null

  const particleCount = isMobile() ? 500 : 1200

  return (
    <div
      className="pointer-events-none absolute inset-0 size-full overflow-hidden select-none"
      aria-hidden="true"
    >
      <Suspense fallback={null}>
        <Scene3D
          crystal={false}
          particles={particleCount}
          className="absolute inset-0 size-full"
        />
      </Suspense>
    </div>
  )
}
