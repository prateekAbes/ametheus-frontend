import React, { useEffect, useRef } from 'react'

interface Star {
  x: number // Normalized 0..1
  y: number // Normalized 0..1
  z: number // Depth 0.15..1.0 (far to near)
  radius: number
  baseAlpha: number
  twinkleSpeed: number
  twinklePhase: number
  driftSpeedX: number
  driftSpeedY: number
}

/**
 * Interactive starry particle field positioned strictly behind the top-three podium section.
 * - Organic drift with depth parallax reacting to mouse cursor movement
 * - Zero 3D spheres, globes, or wireframes
 * - High-DPI 2D canvas, smooth 60fps with lerp easing
 * - Strictly pointer-events-none, never blocks clicks or scrolling
 * - Pauses on prefers-reduced-motion or when scrolled out of viewport
 */
export function PodiumParticleBackground() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let animationFrameId: number
    let isVisible = true
    let width = 0
    let height = 0
    let dpr = window.devicePixelRatio || 1

    // Cursor tracking with lerp smoothing
    let targetCursorX = 0
    let targetCursorY = 0
    let smoothedCursorX = 0
    let smoothedCursorY = 0

    // Initialize starry particles
    const STAR_COUNT = 75
    const stars: Star[] = []
    for (let i = 0; i < STAR_COUNT; i++) {
      const z = 0.15 + Math.random() * 0.85
      stars.push({
        x: Math.random(),
        y: Math.random(),
        z,
        radius: 0.7 + z * 1.3,
        baseAlpha: 0.2 + z * 0.55,
        twinkleSpeed: 0.0015 + Math.random() * 0.0025,
        twinklePhase: Math.random() * Math.PI * 2,
        driftSpeedX: (Math.random() - 0.5) * 0.00003,
        driftSpeedY: (Math.random() - 0.5) * 0.00002,
      })
    }

    // Resize handler
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

    // Cursor movement handler
    const handlePointerMove = (e: PointerEvent) => {
      if (!container) return
      const rect = container.getBoundingClientRect()
      // Normalized offset from container center (-1 to 1)
      const relX = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2 || 1)
      const relY = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2 || 1)
      // Clamp within -1.2 to 1.2
      targetCursorX = Math.max(-1.2, Math.min(1.2, relX))
      targetCursorY = Math.max(-1.2, Math.min(1.2, relY))
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })

    // Viewport intersection observer (pause when off-screen)
    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        isVisible = entry ? entry.isIntersecting : false
        if (isVisible && !prefersReducedMotion && !animationFrameId) {
          lastTime = performance.now()
          animationFrameId = requestAnimationFrame(renderLoop)
        }
      },
      { threshold: 0.05 }
    )
    intersectionObserver.observe(container)

    const renderStatic = () => {
      ctx.clearRect(0, 0, width, height)
      for (const star of stars) {
        const px = star.x * width
        const py = star.y * height
        ctx.beginPath()
        ctx.arc(px, py, star.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(226, 232, 240, ${star.baseAlpha * 0.7})`
        ctx.fill()
      }
    }

    let lastTime = performance.now()

    const renderLoop = (time: number) => {
      if (!isVisible) {
        animationFrameId = 0
        return
      }

      // Smooth cursor lerp
      smoothedCursorX += (targetCursorX - smoothedCursorX) * 0.05
      smoothedCursorY += (targetCursorY - smoothedCursorY) * 0.05

      ctx.clearRect(0, 0, width, height)

      for (const star of stars) {
        // Continuous subtle organic drift
        star.x += star.driftSpeedX
        star.y += star.driftSpeedY
        if (star.x < 0) star.x += 1
        if (star.x > 1) star.x -= 1
        if (star.y < 0) star.y += 1
        if (star.y > 1) star.y -= 1

        // Parallax offset proportional to depth
        const maxParallaxX = 18 * star.z
        const maxParallaxY = 12 * star.z
        const parallaxX = smoothedCursorX * maxParallaxX
        const parallaxY = smoothedCursorY * maxParallaxY

        // Organic wave oscillation
        const organicX = Math.sin(time * 0.0006 + star.twinklePhase) * (6 * star.z)
        const organicY = Math.cos(time * 0.0008 + star.twinklePhase) * (4 * star.z)

        let posX = star.x * width + parallaxX + organicX
        let posY = star.y * height + parallaxY + organicY

        // Wrap around bounds
        if (posX < 0) posX += width
        if (posX > width) posX -= width
        if (posY < 0) posY += height
        if (posY > height) posY -= height

        // Organic twinkle
        const twinkle = 0.7 + 0.3 * Math.sin(time * star.twinkleSpeed + star.twinklePhase)
        const alpha = Math.max(0.08, Math.min(0.9, star.baseAlpha * twinkle))

        ctx.beginPath()
        ctx.arc(posX, posY, star.radius, 0, Math.PI * 2)

        // Soft celestial white/blue hue
        if (star.z > 0.75) {
          ctx.fillStyle = `rgba(240, 246, 255, ${alpha})`
          ctx.shadowBlur = 3 * star.z
          ctx.shadowColor = `rgba(180, 220, 255, ${alpha * 0.6})`
        } else {
          ctx.fillStyle = `rgba(203, 213, 225, ${alpha})`
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
