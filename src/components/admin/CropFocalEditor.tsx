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
  Sparkles,
} from 'lucide-react'
import { uploadMediaFile } from '../../services/admin'
import { resolveMediaUrl } from '../../services/apiClient'
import DynamicImage from '../DynamicImage'

export interface CropFocalEditorProps {
  value?: string
  onChangeAsset?: (url: string) => void
  focalPoint?: { x: number; y: number }
  onChangeFocalPoint?: (fp: { x: number; y: number }) => void
  zoom?: number
  onChangeZoom?: (z: number) => void
  fitMode?: 'cover' | 'contain' | 'ambient'
  onChangeFitMode?: (m: 'cover' | 'contain' | 'ambient') => void
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
    const [w, h] = ratioStr.split(':').map(Number)
    if (w && h) return w / h
  }
  return 16 / 9
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
  targetAspectRatio = '16:9',
  recommendedResolution = 'Universal',
  slotLabel,
  slotDescription,
  previewType = 'game_card',
  onOpenMediaLibrary,
}: CropFocalEditorProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [naturalMeta, setNaturalMeta] = useState<ImageNaturalMeta | null>(null)
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor')
  const [isDragging, setIsDragging] = useState(false)

  const canvasRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resolvedUrl = useMemo(() => resolveMediaUrl(value), [value])

  // Inspect natural image dimensions whenever resolvedUrl changes
  useEffect(() => {
    if (!resolvedUrl) {
      setNaturalMeta(null)
      return
    }
    const img = new Image()
    img.crossOrigin = 'anonymous'
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
    }
    img.src = resolvedUrl
  }, [resolvedUrl])

  // File Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError(null)

    if (file.size > 25 * 1024 * 1024) {
      setUploadError('File size exceeds 25MB limit.')
      return
    }

    setIsUploading(true)
    try {
      const res = await uploadMediaFile(file)
      if (res?.url && onChangeAsset) {
        onChangeAsset(res.url)
      }
    } catch (err: any) {
      setUploadError(err.message || 'Image upload failed')
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

  // Target ratio comparison check
  const ratioDelta = useMemo(() => {
    if (!naturalMeta) return null
    const target = parseTargetRatio(targetAspectRatio)
    return Math.abs(naturalMeta.aspectRatio - target)
  }, [naturalMeta, targetAspectRatio])

  const ratioStatus = useMemo(() => {
    if (!naturalMeta) return null
    if (ratioDelta !== null && ratioDelta < 0.15) {
      return {
        type: 'success',
        message: `Native match (${naturalMeta.ratioName} · ${naturalMeta.aspectRatio.toFixed(2)}:1)`,
      }
    }
    return {
      type: 'warning',
      message: `Image is ${naturalMeta.ratioName} (${naturalMeta.aspectRatio.toFixed(2)}:1). Container is ${targetAspectRatio}. Focal & Zoom positioning handles framing cleanly.`,
    }
  }, [naturalMeta, ratioDelta, targetAspectRatio])

  const handleReset = () => {
    if (onChangeFocalPoint) onChangeFocalPoint({ x: 50, y: 50 })
    if (onChangeZoom) onChangeZoom(1)
    if (onChangeFitMode) onChangeFitMode('cover')
  }

  return (
    <div className="rounded-lg border border-white/10 bg-void/60 p-4 space-y-4">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div>
          {slotLabel && (
            <h4 className="font-display text-sm font-bold uppercase tracking-wider text-ink flex items-center gap-2">
              <Sparkles className="size-3.5 text-cyan" />
              {slotLabel}
            </h4>
          )}
          {slotDescription && <p className="font-mono text-xs text-dim mt-0.5">{slotDescription}</p>}
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 text-dim uppercase">
            Target: <strong className="text-cyan font-bold">{targetAspectRatio}</strong> ({recommendedResolution})
          </span>
        </div>
      </div>

      {/* Asset Selection / Uploader Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
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

        {value && onChangeAsset && (
          <button
            type="button"
            onClick={() => onChangeAsset('')}
            className="px-2.5 py-1.5 font-mono text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-all cursor-pointer ml-auto"
          >
            Clear
          </button>
        )}
      </div>

      {uploadError && (
        <div className="flex items-center gap-2 p-2 rounded bg-red-500/10 border border-red-500/30 text-red-300 font-mono text-xs">
          <AlertTriangle className="size-4 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Dimension & Aspect Ratio Inspector Status */}
      {naturalMeta && (
        <div
          className={`flex items-center justify-between gap-3 px-3 py-2 rounded border font-mono text-xs ${
            ratioStatus?.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {ratioStatus?.type === 'success' ? (
              <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertTriangle className="size-4 shrink-0 text-amber-400" />
            )}
            <span>{ratioStatus?.message}</span>
          </div>
          <div className="text-[11px] font-bold shrink-0 opacity-80">
            {naturalMeta.width} × {naturalMeta.height}px
          </div>
        </div>
      )}

      {/* View Mode Toggle: Interactive Canvas vs Contextual Preview */}
      {value && (
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
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
              Focal Point Canvas
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
            title="Reset focal point and zoom"
          >
            <RefreshCw className="size-3" />
            Reset
          </button>
        </div>
      )}

      {/* Main Interactive Work Area */}
      {value ? (
        activeTab === 'editor' ? (
          <div className="space-y-4">
            {/* Interactive Focal Canvas */}
            <div className="relative group border border-white/20 rounded-md overflow-hidden bg-void/90 select-none">
              <div
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                className="relative w-full max-h-[380px] h-[300px] flex items-center justify-center cursor-crosshair overflow-hidden"
              >
                {/* Visual Image */}
                <img
                  src={resolvedUrl}
                  alt="Focal calibration"
                  className="size-full object-contain pointer-events-none select-none"
                />

                {/* Grid Overlay Guide (Rule of Thirds) */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-20 border border-white/10">
                  <div className="border-r border-b border-white/20" />
                  <div className="border-r border-b border-white/20" />
                  <div className="border-b border-white/20" />
                  <div className="border-r border-b border-white/20" />
                  <div className="border-r border-b border-white/20" />
                  <div className="border-b border-white/20" />
                  <div className="border-r border-white/20" />
                  <div className="border-r border-white/20" />
                  <div />
                </div>

                {/* Reticle / Focal Point Crosshair Indicator */}
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
              </div>

              {/* Quick instructions bar */}
              <div className="flex items-center justify-between px-3 py-1.5 bg-surface/90 border-t border-white/10 font-mono text-[10px] text-dim">
                <span>Click or drag anywhere on the image to set the focal focus reticle</span>
                <span className="text-cyan font-semibold">
                  Active Focal: X: {focalPoint.x}% · Y: {focalPoint.y}%
                </span>
              </div>
            </div>

            {/* Precision Controls Row */}
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
                  value={zoom}
                  onChange={(e) => onChangeZoom && onChangeZoom(Number(e.target.value))}
                  className="w-full accent-cyan cursor-pointer"
                />
                <div className="flex justify-between font-mono text-[9px] text-dim">
                  <span>1.0x (Normal)</span>
                  <span>2.0x</span>
                  <span>3.0x (Max)</span>
                </div>
              </div>
            </div>

            {/* Fit Mode and Presets Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-dim">Fit Mode:</span>
                <div className="inline-flex rounded-sm border border-white/10 bg-surface/60 p-0.5">
                  {(['cover', 'contain', 'ambient'] as const).map((m) => (
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
              </div>

              {/* Quick Focal Presets */}
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
            </div>
          </div>
        ) : (
          /* Live Component Preview Simulator */
          <div className="p-4 bg-void/80 rounded border border-white/10 flex flex-col items-center justify-center min-h-[320px]">
            <div className="w-full max-w-[420px] space-y-2">
              <div className="flex items-center justify-between font-mono text-xs text-dim">
                <span>Simulated live container ({targetAspectRatio})</span>
                <span className="text-cyan font-bold">{previewType.toUpperCase()}</span>
              </div>

              {/* Preview container rendering with DynamicImage */}
              <div
                className={`relative w-full overflow-hidden rounded border border-white/20 bg-surface shadow-2xl ${
                  previewType === 'game_card'
                    ? 'aspect-[4/5]'
                    : previewType === 'tournament_card'
                    ? 'aspect-video'
                    : previewType === 'showcase_card'
                    ? 'aspect-[3/4]'
                    : previewType === 'hero_shard'
                    ? 'aspect-video -rotate-1 skew-x-1'
                    : previewType === 'square'
                    ? 'aspect-square'
                    : 'aspect-video'
                }`}
              >
                <DynamicImage
                  src={value}
                  alt="Contextual preview"
                  mode={fitMode}
                  focalPoint={focalPoint}
                  zoom={zoom}
                  className="size-full"
                />

                {/* Realistic mock badges and title overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-void via-void/20 to-transparent pointer-events-none" />
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="px-2 py-0.5 font-mono text-[9px] font-bold uppercase bg-cyan text-void rounded-xs shadow">
                    LIVE
                  </span>
                  <span className="px-2 py-0.5 font-mono text-[9px] uppercase bg-black/60 backdrop-blur-md text-white border border-white/10 rounded-xs">
                    {targetAspectRatio}
                  </span>
                </div>
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="font-display text-sm font-black uppercase text-ink tracking-wider">
                    {slotLabel || 'Artwork Container'}
                  </div>
                  <div className="font-mono text-[10px] text-cyan flex items-center justify-between mt-1">
                    <span>Focal: {focalPoint.x}%, {focalPoint.y}%</span>
                    <span>Zoom: {zoom.toFixed(2)}x</span>
                  </div>
                </div>
              </div>
            </div>
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
