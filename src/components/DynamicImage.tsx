import { useState, useEffect, useMemo } from 'react'

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
}

function optimizeUrl(url?: string | null): string {
  if (!url || typeof url !== 'string') return ''
  const trimmed = url.trim()
  if (!trimmed) return ''
  // Optimize Unsplash images for responsive fast WebP delivery with quality 75
  if (trimmed.includes('images.unsplash.com')) {
    try {
      const u = new URL(trimmed)
      if (!u.searchParams.has('auto')) u.searchParams.set('auto', 'format')
      if (!u.searchParams.has('fit')) u.searchParams.set('fit', 'crop')
      if (!u.searchParams.has('q')) u.searchParams.set('q', '75')
      if (!u.searchParams.has('w')) u.searchParams.set('w', '800')
      return u.toString()
    } catch {
      return trimmed
    }
  }
  return trimmed
}

export default function DynamicImage({
  src,
  alt = '',
  className = '',
  eager = false,
  wrapperClassName,
}: DynamicImageProps) {
  const optimizedSrc = useMemo(() => optimizeUrl(src), [src])
  const hasSrc = Boolean(optimizedSrc)

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
          className={`flex flex-col items-center justify-center gap-1.5 border border-white/5 bg-surface/80 p-4 text-center font-mono text-[10px] uppercase tracking-wider text-dim ${className}`}
        >
          <svg
            className="size-5 text-white/20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="3 3" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="m21 15-5-5L5 21" />
          </svg>
          <span>{status === 'missing' ? 'Image unavailable' : 'Failed to load'}</span>
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
          className={`${className} transition-opacity duration-300 ${
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
