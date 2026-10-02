import { useLayoutEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)
// optional content (e.g. no featured ticket, no shards) legitimately has no targets
gsap.config({ nullTargetWarn: false })
ScrollTrigger.config({ ignoreMobileResize: true, autoRefreshEvents: 'visibilitychange,DOMContentLoaded,load,resize' })

// Prevent GSAP ScrollTrigger from restoring stale scroll memory across SPA route changes
ScrollTrigger.addEventListener('refreshInit', () => {
  try {
    const v = ScrollTrigger.getScrollFunc(window) as any
    const h = ScrollTrigger.getScrollFunc(window, true) as any
    if (v && v.rec) v.rec = 0
    if (h && h.rec) h.rec = 0
  } catch {}
})

export { gsap, ScrollTrigger }

export const reducedMotion = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
export const isMobile = () => typeof innerWidth !== 'undefined' && innerWidth < 768

/**
 * Page-level GSAP choreography, re-run per route. Transform/opacity only, every reveal fires once.
 * - `.in-view`      → rise on enter. Only elements below the fold are hidden, so nothing visible ever blinks.
 * - `[data-speed]`  → parallax (desktop only)
 * - `.reveal-chars` → heading char cascade
 * - `[data-count]`  → count-up when visible
 * Reduced motion: everything stays in its final state.
 */
export function useGsapPage(key: string) {
  useLayoutEffect(() => {
    try {
      const v = ScrollTrigger.getScrollFunc(window) as any
      const h = ScrollTrigger.getScrollFunc(window, true) as any
      if (v) v.rec = 0
      if (h) h.rec = 0
      ScrollTrigger.clearScrollMemory()
    } catch {}

    if (reducedMotion()) return
    const mm = gsap.matchMedia()
    mm.add({ desk: '(min-width: 768px)', all: 'all' }, (c) => {
      const fold = innerHeight * 0.92
      const below = gsap.utils.toArray<HTMLElement>('.in-view').filter((el) => el.getBoundingClientRect().top > fold)
      if (below.length) gsap.set(below, { opacity: 0, y: 32 })
      ScrollTrigger.batch(below, {
        start: 'top 92%', once: true,
        onEnter: (els) => gsap.to(els, { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', stagger: 0.06, overwrite: true, clearProps: 'transform' }),
      })
      if (c.conditions?.desk) gsap.utils.toArray<HTMLElement>('[data-speed]').forEach((el) => {
        const s = parseFloat(el.dataset.speed || '0.2')
        gsap.fromTo(el, { yPercent: -s * 30 }, { yPercent: s * 30, ease: 'none', scrollTrigger: { trigger: el.parentElement || el, start: 'top bottom', end: 'bottom top', scrub: true } })
      })
      gsap.utils.toArray<HTMLElement>('.reveal-chars').forEach((el) => {
        if (!el.dataset.split) {
          el.dataset.split = '1'
          el.innerHTML = (el.textContent || '').split(' ').map((w) => `<span class="inline-block whitespace-nowrap">${[...w].map((ch) => `<span class="inline-block">${ch}</span>`).join('')}</span>`).join(' ')
        }
        { const parts = el.querySelectorAll('span > span'); if (parts.length) gsap.from(parts, { yPercent: 100, opacity: 0, duration: 0.8, ease: 'expo.out', stagger: 0.02, scrollTrigger: { trigger: el, start: 'top 92%', once: true } }) }
      })
      gsap.utils.toArray<HTMLElement>('[data-count]').forEach((el) => {
        const end = parseFloat(el.dataset.count || '0'), o = { v: 0 }
        gsap.to(o, { v: end, duration: 1.4, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 95%', once: true }, onUpdate: () => { el.textContent = Math.round(o.v).toLocaleString('en-IN') + (el.dataset.suffix || '') } })
      })
    })

    const r = requestAnimationFrame(() => {
      try {
        const v = ScrollTrigger.getScrollFunc(window) as any
        const h = ScrollTrigger.getScrollFunc(window, true) as any
        if (v) v.rec = 0
        if (h) h.rec = 0
        ScrollTrigger.clearScrollMemory()
      } catch {}
      ScrollTrigger.refresh()
    })

    return () => { cancelAnimationFrame(r); mm.revert() }
  }, [key])
}

/** Pointer → CSS vars (--mx/--my, 0..1) on an element via rAF. No React state, one rect read per frame max. */
export function bindPointerVars(el: HTMLElement) {
  let raf = 0, x = 0, y = 0
  const move = (e: PointerEvent) => {
    x = e.clientX; y = e.clientY
    if (raf) return
    raf = requestAnimationFrame(() => {
      raf = 0
      const r = el.getBoundingClientRect()
      el.style.setProperty('--mx', ((x - r.left) / r.width).toFixed(3))
      el.style.setProperty('--my', ((y - r.top) / r.height).toFixed(3))
    })
  }
  const leave = () => { el.style.setProperty('--mx', '0.5'); el.style.setProperty('--my', '0.5') }
  el.addEventListener('pointermove', move, { passive: true })
  el.addEventListener('pointerleave', leave)
  return () => { cancelAnimationFrame(raf); el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave) }
}
