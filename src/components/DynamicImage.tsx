import { useState, useEffect } from 'react'

type ImageStatus = 'missing' | 'loading' | 'success' | 'error'

interface DynamicImageProps {
  src?: string | null
  alt?: string
  className?: string
  /** Force eager loading (above the fold). Default is lazy. */
  eager?: boolean
  /** Optional extra wrapper classes (e.g. 'aspect-video', 'h-full w-full'). */
  wrapperClassName?: string
}

export default function DynamicImage({
  src,
  alt = '',
  className = '',
  eager = false,
  wrapperClassName,
}: DynamicImageProps) {
  const hasSrc = !!(src && typeof src === 'string' && src.trim())
  const [status, setStatus] = useState<ImageStatus>(hasSrc ? 'loading' : 'missing')

  useEffect(() => {
    setStatus(!src || typeof src !== 'string' || !src.trim() ? 'missing' : 'loading')
  }, [src])

  const inner = (
    <>
      {/* skeleton — shown while loading */}
      {status === 'loading' && (
        <div className={`animate-pulse bg-white/10 ${className}`} aria-hidden />
      )}
      {/* text states */}
      {(status === 'missing' || status === 'error') && (
        <div
          className={`flex items-center justify-center bg-surface font-mono text-xs uppercase tracking-wider text-dim ${className}`}
        >
          {status === 'missing' ? 'Image not available' : 'Unable to load image'}
        </div>
      )}
      {/* actual img — always mounted when hasSrc so onLoad/onError fire */}
      {hasSrc && (
        <img
          src={src!}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          fetchPriority={(eager ? 'high' : 'auto') as 'high' | 'low' | 'auto'}
          decoding="async"
          onLoad={() => setStatus('success')}
          onError={() => setStatus('error')}
          className={`${className} ${
            status === 'success' ? '' : 'invisible absolute inset-0 size-0 overflow-hidden pointer-events-none'
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
