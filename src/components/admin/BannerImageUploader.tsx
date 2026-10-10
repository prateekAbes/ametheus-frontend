import { useState } from 'react'
import { uploadMediaFile } from '../../services/admin'
import { resolveMediaUrl } from '../../services/apiClient'
import { DynamicImage } from '../DynamicImage'

export interface BannerImageUploaderProps {
  value: string
  onChange: (val: string) => void
  label?: string
  recommendedRatio?: string
  recommendedRes?: string
}

export function BannerImageUploader({
  value,
  onChange,
  label = 'Banner Image',
  recommendedRatio = 'universal',
  recommendedRes = 'Any aspect ratio',
}: BannerImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [warning, setWarning] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [previewSrc, setPreviewSrc] = useState<string | null>(null)
  const [detectedRatio, setDetectedRatio] = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setWarning(null)
    setInfo(null)
    setDetectedRatio(null)

    if (file.size > 20 * 1024 * 1024) {
      setWarning('⚠️ File size exceeds maximum limit of 20MB.')
      return
    }

    const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')
    const objectUrl = URL.createObjectURL(file)

    if (isSvg) {
      setInfo('✓ Vector SVG graphic loaded (infinitely sharp at all resolutions)')
      setDetectedRatio('Vector SVG')
      setPreviewSrc(objectUrl)
      setIsUploading(true)
      try {
        const res = await uploadMediaFile(file)
        if (res?.url) {
          onChange(res.url)
          setPreviewSrc(null)
        }
      } catch (err: any) {
        alert(err.message || 'SVG upload failed')
        setPreviewSrc(null)
      } finally {
        setIsUploading(false)
      }
      return
    }

    const imgObj = new Image()
    imgObj.onload = async () => {
      const width = imgObj.naturalWidth
      const height = imgObj.naturalHeight
      const ratio = width / (height || 1)

      let ratioName = 'Widescreen'
      if (ratio >= 1.6) ratioName = '16:9 Widescreen'
      else if (ratio >= 1.2) ratioName = '4:3 Standard'
      else if (ratio >= 0.88) ratioName = '1:1 Square'
      else if (ratio >= 0.65) ratioName = '3:4 Portrait'
      else ratioName = '9:16 Vertical / Story'
      setDetectedRatio(ratioName)

      if (recommendedRatio === 'universal' || recommendedRatio === 'auto') {
        setInfo(`✓ Verified: ${width}x${height}px (${ratioName} · ${ratio.toFixed(2)}:1). Adapts cleanly across all layouts.`)
      } else if (recommendedRatio === '1:1') {
        if (Math.abs(ratio - 1.0) > 0.25) {
          setWarning(
            `⚠️ Note: Image is ${width}x${height} (${ratioName}). Recommended icon ratio is 1:1 square, but it will be contained cleanly.`
          )
        } else {
          setInfo(`✓ Verified: 1:1 square aspect ratio (${width}x${height}px)`)
        }
      } else if (recommendedRatio === '3:4') {
        const targetRatio = 3 / 4
        if (Math.abs(ratio - targetRatio) > 0.18) {
          setInfo(
            `✓ Uploaded: ${width}x${height}px (${ratioName}). Adapts cleanly to 3:4 / 4:5 portrait cards.`
          )
        } else {
          setInfo(`✓ Verified: 3:4 portrait aspect ratio (${width}x${height}px)`)
        }
      } else if (recommendedRatio === '4:3') {
        if (Math.abs(ratio - 4 / 3) > 0.2) {
          setInfo(
            `✓ Uploaded: ${width}x${height} (${ratioName}). Will adapt cleanly to tablet layouts.`
          )
        } else {
          setInfo(`✓ Verified: 4:3 tablet aspect ratio (${width}x${height}px)`)
        }
      } else if (recommendedRatio === '9:16') {
        if (Math.abs(ratio - 9 / 16) > 0.15) {
          setInfo(
            `✓ Uploaded: ${width}x${height} (${ratioName}). Will adapt cleanly to mobile story layouts.`
          )
        } else {
          setInfo(`✓ Verified: 9:16 vertical mobile aspect ratio (${width}x${height}px)`)
        }
      } else if (recommendedRatio === '16:9') {
        const targetRatio = 16 / 9
        if (Math.abs(ratio - targetRatio) > 0.18) {
          setInfo(
            `✓ Uploaded: ${width}x${height}px (${ratioName}). Adapts cleanly to 16:9 widescreen containers.`
          )
        } else {
          setInfo(`✓ Verified: 16:9 widescreen aspect ratio (${width}x${height}px)`)
        }
      } else {
        setInfo(`✓ Verified: ${width}x${height}px (${ratio.toFixed(2)}:1)`)
      }

      setPreviewSrc(objectUrl)
      setIsUploading(true)
      try {
        const res = await uploadMediaFile(file)
        if (res?.url) {
          onChange(res.url)
          setPreviewSrc(null)
        }
      } catch (err: any) {
        alert(err.message || 'Image upload failed')
        setPreviewSrc(null)
      } finally {
        setIsUploading(false)
      }
    }

    imgObj.onerror = () => {
      setWarning('Unable to decode image file. Please choose a valid PNG, JPG, WEBP, or SVG image.')
    }

    imgObj.src = objectUrl
  }

  const currentDisplay = previewSrc || (value ? resolveMediaUrl(value) : null)
  const aspectClass =
    recommendedRatio === '1:1'
      ? 'aspect-square max-w-[120px]'
      : recommendedRatio === '9:16'
      ? 'aspect-[9/16] max-w-[120px]'
      : recommendedRatio === '3:4'
      ? 'aspect-[3/4] max-w-[140px]'
      : recommendedRatio === '4:3'
      ? 'aspect-[4/3] max-w-[200px]'
      : 'aspect-[16/9] max-w-sm'

  return (
    <div className="space-y-1.5 mt-2">
      <div className="flex items-center justify-between">
        <label className="text-dim text-[11px] uppercase tracking-wider">{label}</label>
        <span className="font-mono text-[10px] text-cyan">
          {recommendedRatio === 'universal' ? 'Universal Adaptive' : `Target: ${recommendedRatio} (${recommendedRes})`}
        </span>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="https://... or upload below"
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setPreviewSrc(null)
          }}
          className="flex-1 border border-white/15 bg-surface p-2.5 font-mono text-xs text-ink outline-none focus:border-cyan"
        />
        <label className="cursor-pointer border border-cyan/40 bg-cyan/10 px-3.5 py-2 font-mono text-xs uppercase tracking-wider text-cyan hover:bg-cyan/20 shrink-0 flex items-center justify-center">
          {isUploading ? 'Uploading...' : 'Upload File'}
          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
            className="hidden"
            disabled={isUploading}
            onChange={handleFileChange}
          />
        </label>
      </div>

      {warning && (
        <div className="border border-warn/30 bg-warn/10 p-2 font-mono text-[11px] text-warn">
          {warning}
        </div>
      )}
      {info && !warning && (
        <div className="border border-ok/30 bg-ok/10 p-1.5 font-mono text-[11px] text-ok">
          {info}
        </div>
      )}

      {/* Card Aspect Ratio Preview */}
      {currentDisplay ? (
        <div className={`relative ${aspectClass} w-full overflow-hidden border border-white/20 bg-surface/50 mt-1`}>
          <DynamicImage
            src={currentDisplay}
            alt="Preview"
            mode="ambient"
            className="size-full"
          />
          <div className="absolute bottom-1 right-1 bg-void/85 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-cyan border border-white/10 backdrop-blur-sm z-10">
            {detectedRatio || (recommendedRatio === 'universal' ? 'Universal Preview' : `${recommendedRatio} Preview`)}
          </div>
          <button
            type="button"
            onClick={() => {
              onChange('')
              setPreviewSrc(null)
              setWarning(null)
              setInfo(null)
              setDetectedRatio(null)
            }}
            className="absolute top-1 right-1 bg-void/85 px-2 py-0.5 font-mono text-[10px] text-live hover:text-white border border-white/10 z-10 cursor-pointer"
          >
            Clear
          </button>
        </div>
      ) : (
        <div className={`flex ${aspectClass} w-full items-center justify-center border border-dashed border-white/15 bg-surface/20 text-dim font-mono text-[10px] mt-1 text-center p-2`}>
          No {recommendedRatio === '1:1' ? 'Logo' : `${recommendedRatio === 'universal' ? 'Primary' : recommendedRatio} Asset`} Set
        </div>
      )}
    </div>
  )
}
