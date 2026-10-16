import { useState, useEffect, useRef, useMemo } from 'react'
import {
  Crosshair,
  ZoomIn,
  RefreshCw,
  UploadCloud,
  FolderOpen,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sparkles,
  ShieldAlert,
  Layers,
} from 'lucide-react'
import { uploadMediaFile } from '../../services/admin'
import { resolveMediaUrl } from '../../services/apiClient'
import DynamicImage from '../DynamicImage'
import { ArtworkRoleDefinition } from '../../lib/artworkRegistry'

export interface CropFocalEditorProps {
  value?: string
  onChangeAsset?: (url: string) => void
  focalPoint?: { x: number; y: number }
  onChangeFocalPoint?: (fp: { x: number; y: number }) => void
  zoom?: number
  onChangeZoom?: (z: number) => void
  fitMode?: 'cover' | 'contain' | 'ambient'
  onChangeFitMode?: (m: 'cover' | 'contain' | 'ambient') => void
  roleSpec?: ArtworkRoleDefinition
  targetAspectRatio?: string
  recommendedResolution?: string
  slotLabel?: string
  slotDescription?: string
  previewType?: 'hero_shard' | 'game_card' | 'tournament_card' | 'showcase_card' | 'banner' | 'square'
  onOpenMediaLibrary?: () => void
}

interface ImageNaturalMeta {
  width: number
  height: number
  aspectRatio: number
  ratioName: string
}

function parseTargetRatio(ratioStr?: string): number {
  if (!ratioStr) return 16 / 9
  if (ratioStr.includes(':')) {
    const parts = ratioStr.split(':')
    const w = parseFloat(parts[0])
    const h = parseFloat(parts[1])
    if (w && h) return w / h
  }
  return 16 / 9
}

async function detectFileFormat(file: File): Promise<{
  format: 'JPEG' | 'PNG' | 'WEBP' | 'GIF' | 'SVG' | 'UNKNOWN'
  mime: string
  isCorrupted: boolean
}> {
  const ext = file.name.split('.').pop()?.toUpperCase() || ''
  const mime = (file.type || '').toLowerCase()

  try {
    const slice = file.slice(0, 32)
    const buffer = await slice.arrayBuffer()
    const bytes = new Uint8Array(buffer)

    // JPEG: 0xFF, 0xD8
    if (bytes.length >= 3 && bytes[0] === 0xFF && bytes[1] === 0xD8) {
      return { format: 'JPEG', mime: 'image/jpeg', isCorrupted: false }
    }

    // PNG: 0x89, 0x50, 0x4E, 0x47
    if (
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4E &&
      bytes[3] === 0x47
    ) {
      return { format: 'PNG', mime: 'image/png', isCorrupted: false }
    }

    // WebP: RIFF....WEBP
    if (
      bytes.length >= 12 &&
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    ) {
      return { format: 'WEBP', mime: 'image/webp', isCorrupted: false }
    }

    // GIF: GIF87a or GIF89a
    if (
      bytes.length >= 6 &&
      bytes[0] === 0x47 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46
    ) {
      return { format: 'GIF', mime: 'image/gif', isCorrupted: false }
    }

    // SVG: text check
    const text = new TextDecoder('utf-8').decode(bytes)
    if (text.includes('<svg') || text.includes('<?xml')) {
      return { format: 'SVG', mime: 'image/svg+xml', isCorrupted: false }
    }

    // Check if filename claims to be an image but bytes are completely invalid
    const isImageExt = ['JPG', 'JPEG', 'PNG', 'WEBP', 'GIF', 'SVG'].includes(ext)
    const isImageMime = mime.startsWith('image/')
    if (isImageExt || isImageMime) {
      return { format: 'UNKNOWN', mime: mime || 'application/octet-stream', isCorrupted: true }
    }
  } catch (err) {
    console.warn('[CropFocalEditor] Failed to inspect magic bytes', err)
  }

  // Fallback to extension/MIME if slice fails
  if (ext === 'JPG' || ext === 'JPEG' || mime.includes('jpeg') || mime.includes('jpg')) {
    return { format: 'JPEG', mime: 'image/jpeg', isCorrupted: false }
  }
  if (ext === 'PNG' || mime.includes('png')) {
    return { format: 'PNG', mime: 'image/png', isCorrupted: false }
  }
  if (ext === 'WEBP' || mime.includes('webp')) {
    return { format: 'WEBP', mime: 'image/webp', isCorrupted: false }
  }
  if (ext === 'SVG' || mime.includes('svg')) {
    return { format: 'SVG', mime: 'image/svg+xml', isCorrupted: false }
  }
  if (ext === 'GIF' || mime.includes('gif')) {
    return { format: 'GIF', mime: 'image/gif', isCorrupted: false }
  }

  return { format: 'UNKNOWN', mime: mime || 'application/octet-stream', isCorrupted: false }
}

export function CropFocalEditor({
  value = '',
  onChangeAsset,
  focalPoint = { x: 50, y: 50 },
  onChangeFocalPoint,
  zoom = 1,
  onChangeZoom,
  fitMode = 'cover',
  onChangeFitMode,
  roleSpec,
  targetAspectRatio = '16:9',
  recommendedResolution = 'Universal',
  slotLabel,
  slotDescription,
  previewType = 'game_card',
  onOpenMediaLibrary,
}: CropFocalEditorProps) {
  // Derive effective target specifications from roleSpec or fallback props
  const effectiveTargetRatio = roleSpec?.aspectRatio || targetAspectRatio
  const effectiveRecommendedResolution = roleSpec?.recommendedResolution || recommendedResolution
  const effectiveSlotLabel = roleSpec?.name || slotLabel || 'Artwork Container'
  const effectiveSlotDescription = roleSpec?.description || slotDescription
  const effectivePreviewType = roleSpec?.previewType || previewType
  const effectiveAcceptedFormats = roleSpec?.acceptedFormats || ['PNG', 'JPEG', 'WEBP']
  const effectiveMaxSizeBytes = roleSpec?.maxSizeBytes || 25 * 1024 * 1024
  const effectiveMaxSizeLabel = roleSpec?.maxSizeLabel || '25 MB'
  const effectiveMinWidth = roleSpec?.minWidth || 600
  const effectiveMinHeight = roleSpec?.minHeight || 400
  const effectiveTransparency = roleSpec?.transparency || 'not_recommended'
  const effectiveTransparencyNotice = roleSpec?.transparencyNotice
  const effectiveAllowCrop = roleSpec?.allowCrop ?? true
  const effectiveAllowFocal = roleSpec?.allowFocalPoint ?? true
  const effectiveAllowZoom = roleSpec?.allowZoom ?? true
  const effectiveAllowedFitModes = roleSpec?.allowedFitModes || ['cover', 'contain', 'ambient']
  const effectiveSafeArea = roleSpec?.safeAreaGuide

  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [imageLoadError, setImageLoadError] = useState<boolean>(false)
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null)
  const [naturalMeta, setNaturalMeta] = useState<ImageNaturalMeta | null>(null)
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor')
  const [isDragging, setIsDragging] = useState(false)
  const [showSafeArea, setShowSafeArea] = useState<boolean>(true)
  const [showCheckerboard, setShowCheckerboard] = useState<boolean>(
    effectiveTransparency === 'supported'
  )

  const canvasRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Clean up object URL when component unmounts or preview changes
  useEffect(() => {
    return () => {
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl)
      }
    }
  }, [localPreviewUrl])

  const resolvedUrl = useMemo(() => resolveMediaUrl(value), [value])
  const displayUrl = localPreviewUrl || resolvedUrl

  // Form input accept attribute: ensures .jpg, .jpeg, and upper/lowercase variants are visible in OS dialogs
  const acceptAttribute = useMemo(() => {
    const tokens: string[] = []
    for (const f of effectiveAcceptedFormats) {
      const upper = f.toUpperCase()
      if (upper === 'JPEG' || upper === 'JPG') {
        tokens.push('.jpg', '.jpeg', '.JPG', '.JPEG', 'image/jpeg', 'image/jpg')
      } else if (upper === 'PNG') {
        tokens.push('.png', '.PNG', 'image/png')
      } else if (upper === 'WEBP') {
        tokens.push('.webp', '.WEBP', 'image/webp')
      } else if (upper === 'SVG') {
        tokens.push('.svg', '.SVG', 'image/svg+xml')
      } else {
        tokens.push(`.${f.toLowerCase()}`)
      }
    }
    return Array.from(new Set(tokens)).join(',')
  }, [effectiveAcceptedFormats])

  // Inspect natural image dimensions whenever displayUrl changes
  useEffect(() => {
    if (!displayUrl) {
      setNaturalMeta(null)
      setImageLoadError(false)
      return
    }
    setImageLoadError(false)
    const img = new Image()
    img.onload = () => {
      const w = img.naturalWidth
      const h = img.naturalHeight
      const ratio = w / (h || 1)
      let name = 'Widescreen'
      if (ratio >= 2.1) name = 'Ultrawide (21:9)'
      else if (ratio >= 1.6) name = 'Landscape (16:9)'
      else if (ratio >= 1.45) name = 'Wide (16:10)'
      else if (ratio >= 1.25) name = 'Standard (4:3)'
      else if (ratio >= 0.95 && ratio <= 1.05) name = 'Square (1:1)'
      else if (ratio >= 0.75 && ratio < 0.95) name = 'Portrait (4:5)'
      else if (ratio >= 0.65 && ratio < 0.75) name = 'Tall Portrait (3:4)'
      else name = 'Vertical (9:16)'

      setNaturalMeta({
        width: w,
        height: h,
        aspectRatio: ratio,
        ratioName: name,
      })
    }
    img.onerror = () => {
      setNaturalMeta(null)
      setImageLoadError(true)
    }
    img.src = displayUrl
  }, [displayUrl])

  // Target-specific file upload validation handler with magic bytes & instant preview
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError(null)
    setImageLoadError(false)

    // 1. Format validation using binary magic bytes and extension
    const detected = await detectFileFormat(file)

    if (detected.isCorrupted) {
      setUploadError(
        'Corrupted or invalid file. The selected file does not contain valid image data.'
      )
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const ext = file.name.split('.').pop()?.toUpperCase() || ''
    const acceptsJpeg = effectiveAcceptedFormats.some(
      (f) => f.toUpperCase() === 'JPEG' || f.toUpperCase() === 'JPG'
    )
    const acceptsPng = effectiveAcceptedFormats.some((f) => f.toUpperCase() === 'PNG')
    const acceptsWebp = effectiveAcceptedFormats.some((f) => f.toUpperCase() === 'WEBP')
    const acceptsSvg = effectiveAcceptedFormats.some((f) => f.toUpperCase() === 'SVG')

    const isFormatValid =
      (detected.format === 'JPEG' && acceptsJpeg) ||
      (detected.format === 'PNG' && acceptsPng) ||
      (detected.format === 'WEBP' && acceptsWebp) ||
      (detected.format === 'SVG' && acceptsSvg) ||
      (detected.format === 'GIF' && acceptsPng)

    if (!isFormatValid) {
      const formatLabel =
        detected.format === 'UNKNOWN' ? `.${ext.toLowerCase() || 'unknown'}` : detected.format
      setUploadError(
        `Unsupported format (${formatLabel}). This target accepts: ${effectiveAcceptedFormats.join(
          ', '
        )}.`
      )
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    // 2. Upload size validation
    if (file.size > effectiveMaxSizeBytes) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1)
      setUploadError(
        `File size (${sizeMb} MB) exceeds the ${effectiveMaxSizeLabel} upload limit.`
      )
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    // 3. Create immediate local preview so the user sees the image right away
    const tempUrl = URL.createObjectURL(file)
    setLocalPreviewUrl(tempUrl)
    setIsUploading(true)

    try {
      const res = await uploadMediaFile(file)
      if (res?.url && onChangeAsset) {
        onChangeAsset(res.url)
      }
      setLocalPreviewUrl(null)
      URL.revokeObjectURL(tempUrl)
    } catch (err: any) {
      setUploadError(err.message || 'Image upload failed. Please verify the backend connection.')
      setLocalPreviewUrl(null)
      URL.revokeObjectURL(tempUrl)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Handle click / drag on focal canvas
  const updateFocalFromEvent = (e: React.MouseEvent<HTMLDivElement> | MouseEvent) => {
    if (!canvasRef.current || !onChangeFocalPoint) return
    const rect = canvasRef.current.getBoundingClientRect()
    const clientX = e.clientX
    const clientY = e.clientY

    const x = Math.max(0, Math.min(100, Math.round(((clientX - rect.left) / rect.width) * 100)))
    const y = Math.max(0, Math.min(100, Math.round(((clientY - rect.top) / rect.height) * 100)))

    onChangeFocalPoint({ x, y })
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!effectiveAllowFocal) return
    setIsDragging(true)
    updateFocalFromEvent(e)
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        updateFocalFromEvent(e)
      }
    }

    const handleMouseUp = () => {
      if (isDragging) setIsDragging(false)
    }

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  // Aspect ratio comparison check based on target policy
  const ratioValidation = useMemo(() => {
    if (!naturalMeta) return null

    if (roleSpec?.ratioPolicy === 'flexible') {
      const min = roleSpec.minRatio || 0.7
      const max = roleSpec.maxRatio || 1.55
      const isWithin = naturalMeta.aspectRatio >= min && naturalMeta.aspectRatio <= max
      if (isWithin) {
        return {
          type: 'success' as const,
          message: `Flexible ratio approved: ${naturalMeta.ratioName} (${naturalMeta.aspectRatio.toFixed(
            2
          )}:1). Preserves full subject without forced cropping.`,
        }
      }
      return {
        type: 'info' as const,
        message: `Non-standard ratio (${naturalMeta.aspectRatio.toFixed(
          2
        )}:1). Centered contain mode will scale cleanly without cropping.`,
      }
    }

    // Fixed ratio comparison
    const target = roleSpec?.targetRatioValue || parseTargetRatio(effectiveTargetRatio)
    const delta = Math.abs(naturalMeta.aspectRatio - target)

    if (delta < 0.1) {
      return {
        type: 'success' as const,
        message: `Native aspect ratio match: ${naturalMeta.ratioName} (${naturalMeta.aspectRatio.toFixed(
          2
        )}:1). Fits ${effectiveTargetRatio} container cleanly.`,
      }
    }
    return {
      type: 'info' as const,
      message: `Image is ${naturalMeta.ratioName} (${naturalMeta.aspectRatio.toFixed(
        2
      )}:1). Container is ${effectiveTargetRatio} (${effectiveRecommendedResolution}). Adjust the Focal Point Reticle below to position the key subject.`,
    }
  }, [naturalMeta, roleSpec, effectiveTargetRatio, effectiveRecommendedResolution])

  // Resolution dimension validation
  const dimensionValidation = useMemo(() => {
    if (!naturalMeta) return null
    const isBelowMin =
      naturalMeta.width < effectiveMinWidth || naturalMeta.height < effectiveMinHeight
    if (isBelowMin) {
      return {
        type: 'warning' as const,
        message: `Insufficient dimensions: ${naturalMeta.width} × ${naturalMeta.height} px. Minimum required: ${effectiveMinWidth} × ${effectiveMinHeight} px for clean rendering.`,
      }
    }
    return {
      type: 'success' as const,
      message: `Resolution verified: ${naturalMeta.width} × ${naturalMeta.height} px (Meets minimum ${effectiveMinWidth} × ${effectiveMinHeight} px).`,
    }
  }, [naturalMeta, effectiveMinWidth, effectiveMinHeight])

  const handleReset = () => {
    if (onChangeFocalPoint) onChangeFocalPoint({ x: 50, y: 50 })
    if (onChangeZoom) onChangeZoom(1)
    if (onChangeFitMode) onChangeFitMode(roleSpec?.defaultFitMode || 'cover')
  }

  return (
    <div className="rounded-lg border border-white/10 bg-void/60 p-4 space-y-4">
      {/* Header Info & Target Specifications Bar */}
      <div className="flex flex-col gap-2 border-b border-white/10 pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="font-display text-sm font-bold uppercase tracking-wider text-ink flex items-center gap-2">
              <Sparkles className="size-3.5 text-cyan" />
              {effectiveSlotLabel}
            </h4>
            {effectiveSlotDescription && (
              <p className="font-mono text-xs text-dim mt-0.5">{effectiveSlotDescription}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10px]">
            <span className="bg-white/5 border border-white/10 px-2 py-0.5 text-dim uppercase rounded-xs">
              Ratio: <strong className="text-cyan font-bold">{effectiveTargetRatio}</strong>
            </span>
            <span className="bg-white/5 border border-white/10 px-2 py-0.5 text-dim uppercase rounded-xs">
              Rec: <strong className="text-ink font-semibold">{effectiveRecommendedResolution}</strong>
            </span>
            <span className="bg-white/5 border border-white/10 px-2 py-0.5 text-dim uppercase rounded-xs">
              Min: <strong className="text-dim">{effectiveMinWidth}×{effectiveMinHeight}</strong>
            </span>
          </div>
        </div>

        {/* Target Transparency & Format Badges */}
        <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-[10px]">
          <span className="text-dim">
            Accepted: <strong className="text-white/80">{effectiveAcceptedFormats.join(', ')}</strong> (Max {effectiveMaxSizeLabel})
          </span>
          {effectiveTransparency === 'supported' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-cyan/10 border border-cyan/30 text-cyan rounded-xs font-semibold">
              <Layers className="size-3" />
              Transparency Supported (PNG / WebP)
            </span>
          )}
          {effectiveTransparencyNotice && (
            <span className="text-[#8995A8] text-[10px] hidden md:inline">
              • {effectiveTransparencyNotice}
            </span>
          )}
        </div>
      </div>

      {/* Asset Selection / Uploader Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptAttribute}
          className="hidden"
          onChange={handleFileUpload}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-wider bg-white/10 hover:bg-white/20 border border-white/20 text-ink rounded transition-all cursor-pointer disabled:opacity-50"
        >
          <UploadCloud className="size-3.5 text-cyan" />
          {isUploading ? 'Uploading...' : 'Upload New'}
        </button>

        {onOpenMediaLibrary && (
          <button
            type="button"
            onClick={onOpenMediaLibrary}
            className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-wider bg-cyan/10 hover:bg-cyan/20 border border-cyan/30 text-cyan rounded transition-all cursor-pointer"
          >
            <FolderOpen className="size-3.5" />
            Pick from Media Library
          </button>
        )}

        {(value || localPreviewUrl) && onChangeAsset && (
          <button
            type="button"
            onClick={() => {
              setLocalPreviewUrl(null)
              onChangeAsset('')
            }}
            className="px-2.5 py-1.5 font-mono text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-all cursor-pointer ml-auto"
          >
            Clear
          </button>
        )}
      </div>

      {/* Upload Error Message */}
      {uploadError && (
        <div className="flex items-center gap-2 p-2 rounded bg-red-500/10 border border-red-500/30 text-red-300 font-mono text-xs">
          <AlertTriangle className="size-4 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Target-Specific Image Dimension & Ratio Validation Status */}
      {naturalMeta && (
        <div className="space-y-1.5 font-mono text-xs">
          {/* Ratio Check Message */}
          {ratioValidation && (
            <div
              className={`flex items-center justify-between gap-3 px-3 py-2 rounded border ${
                ratioValidation.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-cyan/10 border-cyan/30 text-cyan'
              }`}
            >
              <div className="flex items-center gap-2">
                {ratioValidation.type === 'success' ? (
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
                ) : (
                  <Info className="size-4 shrink-0 text-cyan" />
                )}
                <span>{ratioValidation.message}</span>
              </div>
              <div className="text-[11px] font-bold shrink-0 opacity-80">
                {naturalMeta.width} × {naturalMeta.height}px
              </div>
            </div>
          )}

          {/* Dimension Check Message */}
          {dimensionValidation && dimensionValidation.type === 'warning' && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded border bg-amber-500/10 border-amber-500/30 text-amber-300">
              <AlertTriangle className="size-4 shrink-0 text-amber-400" />
              <span>{dimensionValidation.message}</span>
            </div>
          )}
        </div>
      )}

      {/* View Mode Toggle: Interactive Canvas vs Contextual Preview */}
      {(value || localPreviewUrl) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
          <div className="flex items-center gap-1 bg-surface p-0.5 rounded border border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className={`flex items-center gap-1.5 px-3 py-1 font-mono text-xs uppercase tracking-wider rounded transition-all cursor-pointer ${
                activeTab === 'editor'
                  ? 'bg-cyan text-void font-bold shadow-sm'
                  : 'text-dim hover:text-ink'
              }`}
            >
              <Crosshair className="size-3.5" />
              Focal & Crop Canvas
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 px-3 py-1 font-mono text-xs uppercase tracking-wider rounded transition-all cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-cyan text-void font-bold shadow-sm'
                  : 'text-dim hover:text-ink'
              }`}
            >
              <Eye className="size-3.5" />
              Live Component Preview
            </button>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1 font-mono text-[11px] text-dim hover:text-ink transition-colors cursor-pointer"
            title="Reset focal point, zoom, and fit mode to defaults"
          >
            <RefreshCw className="size-3" />
            Reset to Defaults
          </button>
        </div>
      )}

      {/* Main Interactive Work Area */}
      {(value || localPreviewUrl) ? (
        activeTab === 'editor' ? (
          <div className="space-y-4">
            {/* Interactive Focal Canvas */}
            <div className="relative group border border-white/20 rounded-md overflow-hidden bg-void/90 select-none">
              <div
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                className={`relative w-full max-h-[380px] h-[300px] flex items-center justify-center overflow-hidden ${
                  effectiveAllowFocal ? 'cursor-crosshair' : 'cursor-default'
                }`}
                style={{
                  background:
                    showCheckerboard && effectiveTransparency === 'supported'
                      ? 'repeating-conic-gradient(#181822 0% 25%, #101018 0% 50%) 50% / 20px 20px'
                      : undefined,
                }}
              >
                {/* Visual Image */}
                <img
                  src={displayUrl}
                  alt="Focal calibration"
                  className="size-full object-contain pointer-events-none select-none"
                  onError={() => setImageLoadError(true)}
                />

                {/* Uploading progress overlay */}
                {isUploading && (
                  <div className="absolute inset-0 bg-void/70 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-30">
                    <div className="size-6 border-2 border-cyan border-t-transparent rounded-full animate-spin" />
                    <span className="font-mono text-xs text-cyan uppercase font-bold tracking-wider">
                      Uploading image...
                    </span>
                  </div>
                )}

                {/* Image loading failure plate */}
                {imageLoadError && !isUploading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center bg-surface/90 text-red-300 font-mono text-xs z-20">
                    <AlertTriangle className="size-6 text-red-400" />
                    <p className="font-bold">Failed to load image preview</p>
                    <p className="text-[11px] text-dim max-w-xs">
                      The image could not be loaded from storage. Check your network or upload a replacement asset.
                    </p>
                  </div>
                )}

                {/* Grid Overlay Guide (Rule of Thirds) */}
                {effectiveAllowFocal && (
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-20 border border-white/10">
                    <div className="border-r border-b border-white/20" />
                    <div className="border-r border-b border-white/20" />
                    <div className="border-b border-white/20" />
                    <div className="border-r border-b border-white/20" />
                    <div className="border-r border-b border-white/20" />
                    <div className="border-b border-white/20" />
                    <div className="border-r border-b border-white/20" />
                    <div className="border-r border-b border-white/20" />
                    <div />
                  </div>
                )}

                {/* Reticle / Focal Point Crosshair Indicator */}
                {effectiveAllowFocal && (
                  <div
                    className="absolute pointer-events-none transition-transform duration-75"
                    style={{
                      left: `${focalPoint.x}%`,
                      top: `${focalPoint.y}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <div className="relative flex items-center justify-center">
                      <div className="size-8 rounded-full border-2 border-cyan bg-cyan/20 shadow-[0_0_15px_rgba(6,182,212,0.6)] animate-pulse" />
                      <div className="absolute size-2 rounded-full bg-white shadow-sm" />
                      <span className="absolute left-6 -top-2 whitespace-nowrap rounded bg-void/90 px-1.5 py-0.5 font-mono text-[9px] font-bold text-cyan border border-cyan/40">
                        {focalPoint.x}%, {focalPoint.y}%
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick instructions bar */}
              <div className="flex items-center justify-between px-3 py-1.5 bg-surface/90 border-t border-white/10 font-mono text-[10px] text-dim">
                <span>
                  {effectiveAllowFocal
                    ? 'Click or drag anywhere on the canvas to set the focal focus reticle'
                    : 'Fixed emblem / icon: scales centered without focal cropping'}
                </span>
                {effectiveAllowFocal && (
                  <span className="text-cyan font-semibold">
                    Active Focal: X: {focalPoint.x}% · Y: {focalPoint.y}%
                  </span>
                )}
              </div>
            </div>

            {/* Precision Controls Row */}
            {effectiveAllowFocal && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-surface/40 rounded border border-white/5">
                {/* Focal X Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between font-mono text-xs">
                    <span className="text-dim">Focal Point X (Horiz)</span>
                    <span className="text-cyan font-bold">{focalPoint.x}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={focalPoint.x}
                    onChange={(e) =>
                      onChangeFocalPoint &&
                      onChangeFocalPoint({ ...focalPoint, x: Number(e.target.value) })
                    }
                    className="w-full accent-cyan cursor-pointer"
                  />
                  <div className="flex justify-between font-mono text-[9px] text-dim">
                    <span>0% (Left)</span>
                    <span>50% (Center)</span>
                    <span>100% (Right)</span>
                  </div>
                </div>

                {/* Focal Y Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between font-mono text-xs">
                    <span className="text-dim">Focal Point Y (Vert)</span>
                    <span className="text-cyan font-bold">{focalPoint.y}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={focalPoint.y}
                    onChange={(e) =>
                      onChangeFocalPoint &&
                      onChangeFocalPoint({ ...focalPoint, y: Number(e.target.value) })
                    }
                    className="w-full accent-cyan cursor-pointer"
                  />
                  <div className="flex justify-between font-mono text-[9px] text-dim">
                    <span>0% (Top)</span>
                    <span>50% (Center)</span>
                    <span>100% (Bottom)</span>
                  </div>
                </div>

                {/* Zoom & Fit Mode */}
                <div className="space-y-1.5">
                  <div className="flex justify-between font-mono text-xs">
                    <span className="text-dim flex items-center gap-1">
                      <ZoomIn className="size-3" /> Zoom Scale
                    </span>
                    <span className="text-cyan font-bold">{zoom.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.05"
                    disabled={!effectiveAllowZoom}
                    value={zoom}
                    onChange={(e) => onChangeZoom && onChangeZoom(Number(e.target.value))}
                    className="w-full accent-cyan cursor-pointer disabled:opacity-40"
                  />
                  <div className="flex justify-between font-mono text-[9px] text-dim">
                    <span>1.0x (Normal)</span>
                    <span>2.0x</span>
                    <span>3.0x (Max)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Fit Mode and Presets Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-dim">Fit Mode:</span>
                <div className="inline-flex rounded-sm border border-white/10 bg-surface/60 p-0.5">
                  {effectiveAllowedFitModes.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => onChangeFitMode && onChangeFitMode(m)}
                      className={`px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider rounded-xs transition-colors cursor-pointer ${
                        fitMode === m
                          ? 'bg-cyan text-void font-bold'
                          : 'text-dim hover:text-ink'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                {effectiveTransparency === 'supported' && fitMode === 'contain' && (
                  <span className="font-mono text-[10px] text-cyan/90">
                    (Recommended for transparent silhouettes)
                  </span>
                )}
              </div>

              {/* Quick Focal Presets */}
              {effectiveAllowFocal && (
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[10px] text-dim">Presets:</span>
                  {[
                    { label: 'Center', x: 50, y: 50 },
                    { label: 'Top', x: 50, y: 20 },
                    { label: 'Bottom', x: 50, y: 80 },
                    { label: 'Left', x: 20, y: 50 },
                    { label: 'Right', x: 80, y: 50 },
                  ].map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => onChangeFocalPoint && onChangeFocalPoint({ x: p.x, y: p.y })}
                      className="px-2 py-0.5 rounded font-mono text-[10px] bg-white/5 hover:bg-white/10 text-dim hover:text-ink border border-white/10 transition-colors cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Live Component Preview Simulator */
          <div className="p-4 bg-void/80 rounded border border-white/10 flex flex-col items-center justify-center min-h-[340px] space-y-3">
            {/* Preview Toolbar */}
            <div className="w-full max-w-[460px] flex items-center justify-between font-mono text-xs text-dim pb-1 border-b border-white/10">
              <span className="flex items-center gap-1.5">
                <span>Simulated Container:</span>
                <strong className="text-cyan font-bold">{effectiveTargetRatio}</strong>
              </span>

              <div className="flex items-center gap-3">
                {effectiveTransparency === 'supported' && (
                  <label className="flex items-center gap-1 text-[11px] cursor-pointer hover:text-white">
                    <input
                      type="checkbox"
                      checked={showCheckerboard}
                      onChange={(e) => setShowCheckerboard(e.target.checked)}
                      className="accent-cyan cursor-pointer"
                    />
                    <span>Checkerboard</span>
                  </label>
                )}
                {effectiveSafeArea && (
                  <label className="flex items-center gap-1 text-[11px] cursor-pointer hover:text-white">
                    <input
                      type="checkbox"
                      checked={showSafeArea}
                      onChange={(e) => setShowSafeArea(e.target.checked)}
                      className="accent-cyan cursor-pointer"
                    />
                    <span>Safe Areas</span>
                  </label>
                )}
              </div>
            </div>

            {/* Target-Specific Preview Container */}
            <div className="w-full max-w-[460px] flex justify-center">
              <div
                className={`relative w-full overflow-hidden rounded border border-white/20 shadow-2xl transition-all ${
                  effectivePreviewType === 'game_card'
                    ? 'aspect-[4/5] max-w-[340px] bg-graphite'
                    : effectivePreviewType === 'showcase_card'
                    ? 'aspect-[3/4] max-w-[320px] h-[390px] bg-surface'
                    : effectivePreviewType === 'banner'
                    ? 'aspect-[16/9] w-full bg-void'
                    : effectivePreviewType === 'hero_shard'
                    ? 'aspect-[4/3] max-w-[340px] [clip-path:polygon(0_8%,100%_0,92%_100%,4%_92%)] bg-surface'
                    : effectivePreviewType === 'square'
                    ? 'aspect-square max-w-[260px] bg-surface'
                    : 'aspect-video w-full bg-surface'
                }`}
                style={{
                  background:
                    showCheckerboard && effectiveTransparency === 'supported'
                      ? 'repeating-conic-gradient(#1a1a24 0% 25%, #101018 0% 50%) 50% / 20px 20px'
                      : undefined,
                }}
              >
                <DynamicImage
                  src={localPreviewUrl || value}
                  alt="Contextual preview"
                  mode={fitMode}
                  focalPoint={focalPoint}
                  zoom={zoom}
                  className="size-full"
                />

                {/* Safe Area Overlays */}
                {showSafeArea && effectiveSafeArea && (
                  <div className="absolute inset-0 pointer-events-none z-20">
                    {/* Top UI Hazard Zone */}
                    <div
                      className="absolute inset-x-0 top-0 bg-red-500/15 border-b border-red-500/40 flex items-center justify-between px-3 font-mono text-[9px] text-red-300 font-bold uppercase tracking-wider"
                      style={{ height: `${effectiveSafeArea.topPercent}%` }}
                    >
                      <span>Top UI Zone</span>
                      <ShieldAlert className="size-3 text-red-400" />
                    </div>
                    {/* Bottom UI Hazard Zone */}
                    <div
                      className="absolute inset-x-0 bottom-0 bg-red-500/15 border-t border-red-500/40 flex items-center justify-between px-3 font-mono text-[9px] text-red-300 font-bold uppercase tracking-wider"
                      style={{ height: `${effectiveSafeArea.bottomPercent}%` }}
                    >
                      <span>Title &amp; CTA Zone</span>
                      <ShieldAlert className="size-3 text-red-400" />
                    </div>
                  </div>
                )}

                {/* Realistic mock badges and title overlays based on preview type */}
                <div className="absolute inset-0 bg-gradient-to-t from-void via-void/25 to-transparent pointer-events-none z-10" />

                {/* Top Corner Badge */}
                <div className="absolute top-3 left-3 flex items-center gap-2 z-10 pointer-events-none">
                  <span className="px-2 py-0.5 font-mono text-[9px] font-bold uppercase bg-cyan text-void rounded-xs shadow">
                    LIVE
                  </span>
                  <span className="px-2 py-0.5 font-mono text-[9px] uppercase bg-black/60 backdrop-blur-md text-white border border-white/10 rounded-xs">
                    {effectiveTargetRatio}
                  </span>
                </div>

                {/* Bottom Card / Banner Content Preview */}
                <div className="absolute bottom-3 left-3 right-3 z-10 pointer-events-none">
                  <div className="font-display text-sm font-black uppercase text-ink tracking-wider truncate">
                    {effectiveSlotLabel}
                  </div>
                  <div className="font-mono text-[10px] text-cyan flex items-center justify-between mt-0.5">
                    <span>Focal: {focalPoint.x}%, {focalPoint.y}%</span>
                    <span>Mode: {fitMode}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Safe Area Explanation */}
            {showSafeArea && effectiveSafeArea && (
              <p className="font-mono text-[10px] text-dim max-w-md text-center">
                <span className="text-amber-400 font-semibold">Safe Area Guide: </span>
                {effectiveSafeArea.description}
              </p>
            )}
          </div>
        )
      ) : (
        <div className="p-8 border-2 border-dashed border-white/10 rounded-lg text-center flex flex-col items-center justify-center gap-2 bg-white/2">
          <UploadCloud className="size-8 text-dim" />
          <p className="font-mono text-xs text-dim">No image asset assigned to this slot yet.</p>
          <div className="flex items-center gap-2 mt-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 font-mono text-xs uppercase font-bold bg-cyan text-void rounded transition-all cursor-pointer hover:brightness-110"
            >
              Upload Image
            </button>
            {onOpenMediaLibrary && (
              <button
                type="button"
                onClick={onOpenMediaLibrary}
                className="px-3 py-1.5 font-mono text-xs uppercase font-bold bg-white/10 text-ink border border-white/15 rounded transition-all cursor-pointer hover:bg-white/20"
              >
                Media Library
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default CropFocalEditor
