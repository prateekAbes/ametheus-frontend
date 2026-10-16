import React, { useEffect, useRef } from 'react'

interface Particle {
  x: number // 0..1
  y: number // 0..1
  z: number // Depth 0.15..1.0 (far to near)
  radius: number
  baseAlpha: number
  twinkleSpeed: number
  twinklePhase: number
  driftSpeedX: number
  driftSpeedY: number
  colorType: 'cyan' | 'violet' | 'white'
}

/**
 * Interactive celestial particle field spanning the entire upper leaderboard section.
 * - Reuses the aesthetic, restrained colors (cyan, violet, celestial white), and natural movement of the homepage background.
 * - Gentle depth parallax & organic drift reacting smoothly to cursor movement.
 * - High-DPI canvas rendering at 60fps with lerp easing.
 * - Zero 3D spheres or wireframes.
 * - Strictly pointer-events-none; never intercepts clicks or scrolling.
 * - Pauses on prefers-reduced-motion or when scrolled out of viewport.
 */
export function LeaderboardParticleBackground() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let animationFrameId: number = 0
    let isVisible = true
    let width = 0
    let height = 0
    let dpr = 1

    // Cursor tracking with lerp smoothing
    let targetCursorX = 0
    let targetCursorY = 0
    let smoothedCursorX = 0
    let smoothedCursorY = 0

    // Continuous, rich particle distribution (190 particles across the upper section)
    const PARTICLE_COUNT = 190
    const particles: Particle[] = []

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const z = 0.15 + Math.random() * 0.85
      const colorRoll = Math.random()
      const colorType: 'cyan' | 'violet' | 'white' =
        colorRoll < 0.6 ? 'cyan' : colorRoll < 0.85 ? 'violet' : 'white'

      particles.push({
        x: Math.random(),
        y: Math.random(),
        z,
        radius: 0.65 + z * 1.25,
        baseAlpha: 0.18 + z * 0.52,
        twinkleSpeed: 0.0012 + Math.random() * 0.0022,
        twinklePhase: Math.random() * Math.PI * 2,
        driftSpeedX: (Math.random() - 0.5) * 0.000035,
        driftSpeedY: (Math.random() - 0.5) * 0.000025,
        colorType,
      })
    }

    const updateSize = () => {
      const rect = container.getBoundingClientRect()
      width = rect.width
      height = rect.height
      dpr = Math.min(window.devicePixelRatio || 1, 2)

      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    updateSize()

    const resizeObserver = new ResizeObserver(() => {
      updateSize()
      if (prefersReducedMotion) {
        renderStatic()
      }
    })
    resizeObserver.observe(container)

    const handlePointerMove = (e: PointerEvent) => {
      if (!container) return
      const rect = container.getBoundingClientRect()
      const relX = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2 || 1)
      const relY = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2 || 1)
      targetCursorX = Math.max(-1.2, Math.min(1.2, relX))
      targetCursorY = Math.max(-1.2, Math.min(1.2, relY))
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        isVisible = entry ? entry.isIntersecting : false
        if (isVisible && !prefersReducedMotion && !animationFrameId) {
          animationFrameId = requestAnimationFrame(renderLoop)
        }
      },
      { threshold: 0.05 }
    )
    intersectionObserver.observe(container)

    const renderStatic = () => {
      ctx.clearRect(0, 0, width, height)
      for (const p of particles) {
        const px = p.x * width
        const py = p.y * height
        ctx.beginPath()
        ctx.arc(px, py, p.radius, 0, Math.PI * 2)
        const alpha = p.baseAlpha * 0.6
        if (p.colorType === 'cyan') {
          ctx.fillStyle = `rgba(62, 242, 255, ${alpha})`
        } else if (p.colorType === 'violet') {
          ctx.fillStyle = `rgba(139, 92, 255, ${alpha})`
        } else {
          ctx.fillStyle = `rgba(240, 246, 255, ${alpha})`
        }
        ctx.fill()
      }
    }

    const renderLoop = (time: number) => {
      if (!isVisible) {
        animationFrameId = 0
        return
      }

      // Smooth cursor lerp
      smoothedCursorX += (targetCursorX - smoothedCursorX) * 0.05
      smoothedCursorY += (targetCursorY - smoothedCursorY) * 0.05

      ctx.clearRect(0, 0, width, height)

      for (const p of particles) {
        // Continuous organic drift with coordinate wrapping
        p.x += p.driftSpeedX
        p.y += p.driftSpeedY
        if (p.x < 0) p.x += 1
        if (p.x > 1) p.x -= 1
        if (p.y < 0) p.y += 1
        if (p.y > 1) p.y -= 1

        // Parallax offset proportional to depth
        const parallaxX = smoothedCursorX * (16 * p.z)
        const parallaxY = smoothedCursorY * (10 * p.z)

        // Subtle organic sine wave breathing
        const organicX = Math.sin(time * 0.0005 + p.twinklePhase) * (5 * p.z)
        const organicY = Math.cos(time * 0.0007 + p.twinklePhase) * (3.5 * p.z)

        let posX = p.x * width + parallaxX + organicX
        let posY = p.y * height + parallaxY + organicY

        if (posX < 0) posX += width
        if (posX > width) posX -= width
        if (posY < 0) posY += height
        if (posY > height) posY -= height

        // Organic twinkle
        const twinkle = 0.72 + 0.28 * Math.sin(time * p.twinkleSpeed + p.twinklePhase)
        const alpha = Math.max(0.06, Math.min(0.85, p.baseAlpha * twinkle))

        ctx.beginPath()
        ctx.arc(posX, posY, p.radius, 0, Math.PI * 2)

        // Palette matching homepage: cyan, violet, celestial white
        if (p.colorType === 'cyan') {
          ctx.fillStyle = `rgba(62, 242, 255, ${alpha})`
          if (p.z > 0.7) {
            ctx.shadowBlur = 3.5 * p.z
            ctx.shadowColor = `rgba(62, 242, 255, ${alpha * 0.6})`
          } else {
            ctx.shadowBlur = 0
            ctx.shadowColor = 'transparent'
          }
        } else if (p.colorType === 'violet') {
          ctx.fillStyle = `rgba(139, 92, 255, ${alpha * 0.95})`
          if (p.z > 0.7) {
            ctx.shadowBlur = 3 * p.z
            ctx.shadowColor = `rgba(139, 92, 255, ${alpha * 0.5})`
          } else {
            ctx.shadowBlur = 0
            ctx.shadowColor = 'transparent'
          }
        } else {
          ctx.fillStyle = `rgba(240, 246, 255, ${alpha})`
          ctx.shadowBlur = 0
          ctx.shadowColor = 'transparent'
        }

        ctx.fill()
      }

      ctx.shadowBlur = 0
      animationFrameId = requestAnimationFrame(renderLoop)
    }

    if (prefersReducedMotion) {
      renderStatic()
    } else {
      animationFrameId = requestAnimationFrame(renderLoop)
    }

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('pointermove', handlePointerMove)
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  )
}
