/**
 * AMETHEUS Client-Side Image Optimizer
 * 
 * Provides robust, non-distorting image optimization before upload:
 * - Mathematically preserves the exact original aspect ratio (16:9, 4:3, 1:1, 3:4, 9:16, 21:9, etc.).
 * - Zero forced cropping, zero aspect distortion, zero skewing.
 * - Caps maximum bounding dimension (default: 1920px) to prevent massive raw camera files (5-15MB)
 *   from triggering reverse-proxy payload limits (e.g. Nginx 1MB client_max_body_size).
 * - Leaves SVGs completely untouched (vector graphic fidelity preserved).
 * - Leaves small files (< 850KB) untouched if already within resolution limits.
 * - Handles PNG transparency cleanly (outputs WebP with alpha or transparent PNG).
 */

export interface ImageOptimizationOptions {
  /** Maximum width or height bounding box in pixels. Default is 1920. */
  maxDimension?: number
  /** Target maximum file size in bytes. Default is 850KB (comfortably under 1MB). */
  maxSizeBytes?: number
  /** Initial compression quality from 0.0 to 1.0. Default is 0.88. */
  quality?: number
}

export async function optimizeImageForUpload(
  file: File,
  options: ImageOptimizationOptions = {}
): Promise<File> {
  const {
    maxDimension = 1920,
    maxSizeBytes = 850 * 1024,
    quality = 0.88,
  } = options

  // 1. Vector graphics (SVG): bypass optimization completely to preserve infinite resolution
  const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')
  if (isSvg) {
    return file
  }

  // 2. Animated GIFs: pass through if within reasonable size to avoid flattening animation frames
  const isGif = file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif')
  if (isGif && file.size <= maxSizeBytes) {
    return file
  }

  // 3. Non-image files: pass through to let server validation handle
  if (!file.type.startsWith('image/')) {
    return file
  }

  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return resolve(file)
    }

    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = async () => {
      URL.revokeObjectURL(objectUrl)

      try {
        const origWidth = img.naturalWidth || img.width
        const origHeight = img.naturalHeight || img.height

        if (!origWidth || !origHeight) {
          return resolve(file)
        }

        // If file is already under size limit AND within bounding dimensions, preserve original
        if (file.size <= maxSizeBytes && origWidth <= maxDimension && origHeight <= maxDimension) {
          return resolve(file)
        }

        // Calculate proportional bounding dimensions that PRESERVE THE EXACT ORIGINAL ASPECT RATIO
        let targetWidth = origWidth
        let targetHeight = origHeight

        if (origWidth > maxDimension || origHeight > maxDimension) {
          if (origWidth >= origHeight) {
            targetWidth = maxDimension
            targetHeight = Math.max(1, Math.round(origHeight * (maxDimension / origWidth)))
          } else {
            targetHeight = maxDimension
            targetWidth = Math.max(1, Math.round(origWidth * (maxDimension / origHeight)))
          }
        }

        // Setup high-quality canvas
        const canvas = document.createElement('canvas')
        canvas.width = targetWidth
        canvas.height = targetHeight

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          return resolve(file)
        }

        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'

        const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png')

        // If JPEG without alpha, draw clean white background
        if (!isPng && !file.type.includes('webp')) {
          ctx.fillStyle = '#000000'
          ctx.fillRect(0, 0, targetWidth, targetHeight)
        }

        // Draw image keeping exact proportions
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight)

        const exportBlob = (mime: string, q: number): Promise<Blob | null> => {
          return new Promise((resBlob) => {
            canvas.toBlob(resBlob, mime, q)
          })
        }

        // Prefer WebP for high quality & small footprint (supported by all modern browsers and our backend)
        let targetMime = 'image/webp'
        let targetExt = '.webp'
        let currentQuality = quality

        let blob = await exportBlob(targetMime, currentQuality)
        if (!blob || blob.type !== 'image/webp') {
          // Fallback if browser doesn't export WebP
          if (isPng) {
            targetMime = 'image/png'
            targetExt = '.png'
            blob = await exportBlob(targetMime, currentQuality)
          } else {
            targetMime = 'image/jpeg'
            targetExt = '.jpg'
            blob = await exportBlob(targetMime, currentQuality)
          }
        }

        // Iteratively tune quality if output still exceeds max size
        let attempts = 0
        while (blob && blob.size > maxSizeBytes && attempts < 3) {
          attempts++
          currentQuality = Math.max(0.60, currentQuality - 0.15)
          blob = await exportBlob(targetMime, currentQuality)
        }

        if (!blob) {
          return resolve(file)
        }

        // If optimized file is somehow larger than original, keep original
        if (blob.size >= file.size && origWidth <= maxDimension && origHeight <= maxDimension) {
          return resolve(file)
        }

        // Produce a valid File object
        const originalBase = file.name.replace(/\.[^/.]+$/, '')
        const newFileName = `${originalBase}${targetExt}`
        const optimizedFile = new File([blob], newFileName, {
          type: blob.type,
          lastModified: Date.now(),
        })

        resolve(optimizedFile)
      } catch (err) {
        console.warn('[imageOptimizer] Optimization warning, falling back to original file:', err)
        resolve(file)
      }
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(file)
    }

    img.src = objectUrl
  })
}
