import { useState, useEffect, useMemo } from 'react'
import { resolveMediaUrl } from '../services/apiClient'

type ImageStatus = 'missing' | 'loading' | 'success' | 'error'

// Global cache of successfully loaded URLs to avoid re-triggering skeletons on re-renders
const loadedImageUrls = new Set<string>()

interface DynamicImageProps {
  src?: string | null
  alt?: string
  className?: string
  /** Force eager loading (above the fold). Default is lazy. */
  eager?: boolean
  /** Optional extra wrapper classes (e.g. 'aspect-video', 'h-full w-full'). */
  wrapperClassName?: string
  /**
   * Rendering mode:
   * - 'cover': (default) Standard edge-to-edge cover.
   * - 'contain': Contained within bounds without cropping.
   * - 'ambient': Context-aware presentation with a blurred ambient backdrop layer
   *              and a contained foreground layer. Preserves 100% of the image's original
   *              aspect ratio and subject content without letterboxing bars or clipping.
   */
  mode?: 'cover' | 'contain' | 'ambient'
  /** Extra class names for ambient background image if mode is 'ambient' */
  backdropClassName?: string
  /** Focal point coordinate percentages (0-100) for intelligent crop alignment */
  focalPoint?: { x: number; y: number }
  /** Zoom scale multiplier (e.g. 1.0 to 3.0) */
  zoom?: number
  /** Additional custom inline styles */
  style?: React.CSSProperties
}

function optimizeUrl(url?: string | null): string {
  if (!url || typeof url !== 'string') return ''
  const trimmed = url.trim()
  if (!trimmed) return ''
  const resolved = resolveMediaUrl(trimmed)
  if (!resolved) return ''
  // Optimize Unsplash images for responsive fast WebP delivery with quality 75
  if (resolved.includes('images.unsplash.com')) {
    try {
      const u = new URL(resolved)
      if (!u.searchParams.has('auto')) u.searchParams.set('auto', 'format')
      if (!u.searchParams.has('fit')) u.searchParams.set('fit', 'crop')
      if (!u.searchParams.has('q')) u.searchParams.set('q', '75')
      if (!u.searchParams.has('w')) u.searchParams.set('w', '800')
      return u.toString()
    } catch {
      return resolved
    }
  }
  return resolved
}

export default function DynamicImage({
  src,
  alt = '',
  className = '',
  eager = false,
  wrapperClassName,
  mode = 'cover',
  backdropClassName,
  focalPoint,
  zoom,
  style,
}: DynamicImageProps) {
  const optimizedSrc = useMemo(() => optimizeUrl(src), [src])
  const hasSrc = Boolean(optimizedSrc)

  const computedImageStyle = useMemo<React.CSSProperties>(() => {
    const s: React.CSSProperties = { ...style }
    if (mode === 'contain') {
      s.objectFit = 'contain'
    } else if (mode === 'cover') {
      s.objectFit = 'cover'
    }
    if (focalPoint && typeof focalPoint.x === 'number' && typeof focalPoint.y === 'number') {
      s.objectPosition = `${focalPoint.x}% ${focalPoint.y}%`
    }
    if (typeof zoom === 'number' && zoom !== 1) {
      s.transform = s.transform ? `${s.transform} scale(${zoom})` : `scale(${zoom})`
      s.transformOrigin = focalPoint
        ? `${focalPoint.x}% ${focalPoint.y}%`
        : 'center center'
    }
    return s
  }, [mode, focalPoint, zoom, style])

  const [status, setStatus] = useState<ImageStatus>(() => {
    if (!hasSrc) return 'missing'
    if (loadedImageUrls.has(optimizedSrc)) return 'success'
    return 'loading'
  })

  useEffect(() => {
    if (!optimizedSrc) {
      setStatus('missing')
    } else if (loadedImageUrls.has(optimizedSrc)) {
      setStatus('success')
    } else {
      setStatus('loading')
    }
  }, [optimizedSrc])

  const handleLoad = () => {
    if (optimizedSrc) {
      loadedImageUrls.add(optimizedSrc)
    }
    setStatus('success')
  }

  const handleError = () => {
    setStatus('error')
  }

  if (mode === 'ambient') {
    return (
      <div className={`relative size-full overflow-hidden select-none ${wrapperClassName || ''}`}>
        {/* Skeleton while loading */}
        {status === 'loading' && (
          <div className="absolute inset-0 size-full animate-pulse bg-white/10" aria-hidden="true" />
        )}

        {/* Fallback plate */}
        {(status === 'missing' || status === 'error') && (
          <div className="absolute inset-0 flex items-center justify-center border border-white/5 bg-[#0a0e17] p-4 text-center font-mono text-[11px] uppercase tracking-wider text-dim/70 select-none">
            <span>No image available</span>
          </div>
        )}

        {hasSrc && (
          <>
            {/* Ambient blurred backdrop layer (fills container smoothly with image palette) */}
            <img
              src={optimizedSrc}
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              className={`absolute inset-0 size-full object-cover blur-2xl opacity-40 scale-125 pointer-events-none select-none transition-transform duration-700 ${backdropClassName || ''}`}
            />
            {/* Foreground focal artwork layer (100% uncropped and contained) */}
            <img
              src={optimizedSrc}
              alt={alt}
              loading={eager ? 'eager' : 'lazy'}
              fetchPriority={(eager ? 'high' : 'low') as 'high' | 'low' | 'auto'}
              decoding="async"
              onLoad={handleLoad}
              onError={handleError}
              style={computedImageStyle}
              className={`relative z-0 size-full object-contain object-center transition-[transform,opacity] duration-300 ${className} ${
                status === 'success'
                  ? 'opacity-100'
                  : 'invisible opacity-0'
              }`}
            />
          </>
        )}
      </div>
    )
  }

  const inner = (
    <>
      {/* Skeleton — shown while loading */}
      {status === 'loading' && (
        <div
          className={`animate-pulse bg-white/10 ${className}`}
          aria-hidden="true"
        />
      )}

      {/* Lightweight fallback plate */}
      {(status === 'missing' || status === 'error') && (
        <div
          className={`flex items-center justify-center border border-white/5 bg-[#0a0e17] p-4 text-center font-mono text-[11px] uppercase tracking-wider text-dim/70 select-none ${className}`}
        >
          <span>No image available</span>
        </div>
      )}

      {/* Actual img — rendered whenever hasSrc so browser triggers onLoad/onError */}
      {hasSrc && (
        <img
          src={optimizedSrc}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          fetchPriority={(eager ? 'high' : 'low') as 'high' | 'low' | 'auto'}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          style={computedImageStyle}
          className={`${className} transition-[transform,opacity] duration-300 ${
            status === 'success'
              ? 'opacity-100'
              : 'invisible absolute inset-0 size-0 overflow-hidden pointer-events-none opacity-0'
          }`}
        />
      )}
    </>
  )

  if (wrapperClassName) {
    return <div className={`relative overflow-hidden ${wrapperClassName}`}>{inner}</div>
  }
  return <>{inner}</>
}

export { DynamicImage }
