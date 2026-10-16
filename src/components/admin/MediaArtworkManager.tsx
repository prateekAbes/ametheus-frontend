import { useState, useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router'
import {
  Sparkles,
  Layers,
  Gamepad2,
  Trophy,
  FolderOpen,
  FileText,
  Search,
  Check,
  Copy,
  ExternalLink,
  UploadCloud,
  ChevronRight,
  Eye,
  Save,
  Trash2,
  X,
  Compass,
} from 'lucide-react'
import { Game } from '../../services/games'
import { Tournament } from '../../services/tournaments'
import {
  updateGame,
  getPlacements,
  updatePlacement,
  clearPlacementAsset,
  listMediaFiles,
  uploadMediaFile,
  PlacementConfig,
  MediaLibraryItem,
} from '../../services/admin'
import { updateTournamentOrganizer } from '../../services/organizer'
import { Panel, Hud, Badge } from '../ui'
import { resolveMediaUrl } from '../../services/apiClient'
import DynamicImage from '../DynamicImage'
import CropFocalEditor from './CropFocalEditor'

interface MediaArtworkManagerProps {
  games: Game[]
  tournaments: Tournament[]
  onRefresh: () => void
  showToast: (msg: string) => void
}

type MainTab = 'HOMEPAGE' | 'GAMES' | 'TOURNAMENTS' | 'LIBRARY' | 'SPECS'

// Helper to format file size
function formatBytes(bytes?: number): string {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

/* =========================================================================
   MEDIA LIBRARY MODAL (for 1-click selecting existing assets into any slot)
   ========================================================================= */
interface MediaLibraryModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (url: string) => void
  showToast: (msg: string) => void
}

function MediaLibraryModal({ isOpen, onClose, onSelect, showToast }: MediaLibraryModalProps) {
  const [items, setItems] = useState<MediaLibraryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchItems = async () => {
    setLoading(true)
    try {
      const res = await listMediaFiles({ search: search.trim() || undefined, limit: 100 })
      setItems(res?.items || [])
    } catch (err: any) {
      console.error('Failed to load media files', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchItems()
    }
  }, [isOpen, search])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      const res = await uploadMediaFile(file)
      if (res?.url) {
        showToast('Image uploaded successfully to Media Library!')
        fetchItems()
        onSelect(res.url)
        onClose()
      }
    } catch (err: any) {
      alert(err.message || 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-4xl max-h-[85vh] flex flex-col bg-surface border border-white/20 rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 bg-void/50">
          <div className="flex items-center gap-2.5">
            <FolderOpen className="size-5 text-cyan" />
            <h3 className="font-display text-lg font-bold uppercase text-ink">
              Media Library Asset Selector
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-dim hover:text-ink hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Action bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-white/10 bg-void/30">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-dim" />
            <input
              type="text"
              placeholder="Filter by filename..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface/80 border border-white/15 pl-9 pr-3 py-1.5 font-mono text-xs text-ink rounded outline-none focus:border-cyan"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs font-bold uppercase bg-cyan text-void rounded hover:brightness-110 transition-all cursor-pointer disabled:opacity-50"
            >
              <UploadCloud className="size-3.5" />
              {isUploading ? 'Uploading...' : 'Upload New'}
            </button>
          </div>
        </div>

        {/* Media Grid */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center py-16 font-mono text-xs text-dim animate-pulse">
              Loading library assets...
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-dim">
              <FolderOpen className="size-12 opacity-30 mb-2" />
              <p className="font-mono text-xs">No media assets found matching search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelect(item.url)
                    onClose()
                  }}
                  className="group relative border border-white/10 hover:border-cyan bg-void/50 rounded overflow-hidden cursor-pointer transition-all hover:scale-[1.02] flex flex-col"
                >
                  <div className="aspect-video w-full bg-black/60 relative overflow-hidden">
                    <img
                      src={resolveMediaUrl(item.url)}
                      alt={item.filename}
                      className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-cyan/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="px-2 py-1 bg-cyan text-void font-mono text-[10px] font-bold uppercase rounded shadow">
                        Select Asset
                      </span>
                    </div>
                  </div>
                  <div className="p-2 border-t border-white/5 flex flex-col justify-between flex-1">
                    <div className="font-mono text-[11px] text-ink truncate" title={item.filename}>
                      {item.filename}
                    </div>
                    <div className="flex items-center justify-between font-mono text-[9px] text-dim mt-1">
                      <span>{formatBytes(item.size)}</span>
                      <span>{item.content_type?.split('/')[1] || 'img'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* =========================================================================
   HOMEPAGE PLACEMENTS MANAGER
   (Placement 1: 4 Hero Floating Shards, Placement 2: Featured Tournament, Placement 7: Game Showcase)
   ========================================================================= */
function HomepagePlacementsManager({
  tournaments,
  games,
  showToast,
}: {
  tournaments: Tournament[]
  games: Game[]
  showToast: (msg: string) => void
}) {
  const [placements, setPlacements] = useState<PlacementConfig[]>([])
  const [loading, setLoading] = useState(false)
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [pickerSlotKey, setPickerSlotKey] = useState<string | null>(null)

  const fetchPlacements = async () => {
    setLoading(true)
    try {
      const data = await getPlacements({ page: 'homepage' })
      setPlacements(data || [])
    } catch (err: any) {
      console.error('Failed to load homepage placements', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlacements()
  }, [])

  const getPlacementByKey = (key: string): PlacementConfig => {
    const existing = placements.find((p) => p.placement_key === key)
    if (existing) return existing
    return {
      placement_key: key,
      page: 'homepage',
      section: key.includes('hero') ? 'hero' : 'featured_tournament',
      slot_name: key,
      asset_url: '',
      focal_x: 50,
      focal_y: 50,
      zoom: 1,
      fit_mode: 'cover',
      target_aspect_ratio: key.includes('hero') ? '16:9' : '16:10',
      recommended_resolution: key.includes('hero') ? '1600x900' : '1600x1000',
      min_width: 800,
      min_height: 500,
    }
  }

  const handleUpdateLocalPlacement = (key: string, updates: Partial<PlacementConfig>) => {
    setPlacements((prev) => {
      const index = prev.findIndex((p) => p.placement_key === key)
      if (index >= 0) {
        const copy = [...prev]
        copy[index] = { ...copy[index], ...updates }
        return copy
      } else {
        const fresh = getPlacementByKey(key)
        return [...prev, { ...fresh, ...updates }]
      }
    })
  }

  const handleSavePlacement = async (key: string) => {
    const current = getPlacementByKey(key)
    setSavingKey(key)
    try {
      await updatePlacement(key, {
        asset_url: current.asset_url,
        focal_x: current.focal_x,
        focal_y: current.focal_y,
        zoom: current.zoom,
        fit_mode: current.fit_mode,
        target_aspect_ratio: current.target_aspect_ratio,
        recommended_resolution: current.recommended_resolution,
      })
      showToast(`Placement slot "${current.slot_name || key}" saved and live!`)
      fetchPlacements()
    } catch (err: any) {
      alert(err.message || `Failed to save placement ${key}`)
    } finally {
      setSavingKey(null)
    }
  }

  const heroShards = [
    {
      key: 'homepage_hero_slot_1',
      title: 'Slot 1: Top-Left Floating Shard',
      desc: 'Floating artwork panel positioned top-left behind the hero sphere composition.',
      tilt: '-rotate-2 -skew-x-2',
    },
    {
      key: 'homepage_hero_slot_2',
      title: 'Slot 2: Bottom-Left Floating Shard',
      desc: 'Floating artwork panel positioned bottom-left behind the hero sphere composition.',
      tilt: 'rotate-1 skew-y-1',
    },
    {
      key: 'homepage_hero_slot_3',
      title: 'Slot 3: Top-Right Floating Shard',
      desc: 'Floating artwork panel positioned top-right behind the hero sphere composition.',
      tilt: 'rotate-2 skew-x-2',
    },
    {
      key: 'homepage_hero_slot_4',
      title: 'Slot 4: Bottom-Right Floating Shard',
      desc: 'Floating artwork panel positioned bottom-right behind the hero sphere composition.',
      tilt: '-rotate-1 -skew-y-1',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Placement 1: Homepage Hero Floating Artwork Panels */}
      <Panel className="p-6 space-y-6 border-white/10">
        <div className="border-b border-white/10 pb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs px-2 py-0.5 bg-cyan/20 text-cyan border border-cyan/40 font-bold uppercase rounded-xs">
                Placement 1
              </span>
              <h3 className="font-display text-2xl font-black uppercase text-ink">
                Homepage Hero Floating Artwork Panels (4 Slots)
              </h3>
            </div>
            <p className="font-mono text-xs text-dim mt-1">
              Floating angular artwork cards orbiting the central 3D hero composition. Independent upload,
              crop focal reticle, zoom scale, and responsive perspective preservation.
            </p>
          </div>
          <div className="font-mono text-xs text-dim bg-white/5 border border-white/10 px-3 py-1.5 rounded">
            Target: <strong className="text-cyan">16:9 Widescreen</strong> (1600×900 px)
          </div>
        </div>

        {/* 4 Hero Shards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {heroShards.map((slot) => {
            const p = getPlacementByKey(slot.key)
            return (
              <div key={slot.key} className="space-y-3 p-4 bg-void/50 border border-white/10 rounded-lg">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="font-display text-sm font-bold uppercase text-ink">
                    {slot.title}
                  </span>
                  <button
                    onClick={() => handleSavePlacement(slot.key)}
                    disabled={savingKey === slot.key}
                    className="flex items-center gap-1.5 px-3 py-1 font-mono text-xs font-bold uppercase bg-cyan text-void rounded hover:brightness-110 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Save className="size-3.5" />
                    {savingKey === slot.key ? 'Saving...' : 'Save Slot'}
                  </button>
                </div>

                <CropFocalEditor
                  value={p.asset_url || ''}
                  onChangeAsset={(url) => handleUpdateLocalPlacement(slot.key, { asset_url: url })}
                  focalPoint={{ x: p.focal_x ?? 50, y: p.focal_y ?? 50 }}
                  onChangeFocalPoint={(fp) =>
                    handleUpdateLocalPlacement(slot.key, { focal_x: fp.x, focal_y: fp.y })
                  }
                  zoom={p.zoom ?? 1}
                  onChangeZoom={(z) => handleUpdateLocalPlacement(slot.key, { zoom: z })}
                  fitMode={p.fit_mode ?? 'cover'}
                  onChangeFitMode={(m) => handleUpdateLocalPlacement(slot.key, { fit_mode: m })}
                  targetAspectRatio="16:9"
                  recommendedResolution="1600x900"
                  slotLabel={slot.title}
                  slotDescription={slot.desc}
                  previewType="hero_shard"
                  onOpenMediaLibrary={() => setPickerSlotKey(slot.key)}
                />
              </div>
            )
          })}
        </div>
      </Panel>

      {/* Placement 2: Homepage Featured Tournament Card */}
      <Panel className="p-6 space-y-6 border-white/10">
        <div className="border-b border-white/10 pb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs px-2 py-0.5 bg-cyan/20 text-cyan border border-cyan/40 font-bold uppercase rounded-xs">
                Placement 2
              </span>
              <h3 className="font-display text-2xl font-black uppercase text-ink">
                Homepage Featured Tournament (Lead Hero & Side Thumbnails)
              </h3>
            </div>
            <p className="font-mono text-xs text-dim mt-1">
              The primary featured tournament spotlight card on the homepage. Lead hero banner displays
              at 16:10 aspect ratio with focal calibration.
            </p>
          </div>
          <div className="font-mono text-xs text-dim bg-white/5 border border-white/10 px-3 py-1.5 rounded">
            Target: <strong className="text-cyan">16:10 Aspect</strong> (1600×1000 px)
          </div>
        </div>

        {(() => {
          const featuredPlacementKey = 'homepage_featured_tournament'
          const p = getPlacementByKey(featuredPlacementKey)
          return (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-dim">
                  Custom Featured Tournament Artwork Slot:
                </span>
                <button
                  onClick={() => handleSavePlacement(featuredPlacementKey)}
                  disabled={savingKey === featuredPlacementKey}
                  className="flex items-center gap-1.5 px-3 py-1 font-mono text-xs font-bold uppercase bg-cyan text-void rounded hover:brightness-110 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className="size-3.5" />
                  {savingKey === featuredPlacementKey ? 'Saving...' : 'Save Featured Slot'}
                </button>
              </div>

              <CropFocalEditor
                value={p.asset_url || ''}
                onChangeAsset={(url) =>
                  handleUpdateLocalPlacement(featuredPlacementKey, { asset_url: url })
                }
                focalPoint={{ x: p.focal_x ?? 50, y: p.focal_y ?? 50 }}
                onChangeFocalPoint={(fp) =>
                  handleUpdateLocalPlacement(featuredPlacementKey, { focal_x: fp.x, focal_y: fp.y })
                }
                zoom={p.zoom ?? 1}
                onChangeZoom={(z) => handleUpdateLocalPlacement(featuredPlacementKey, { zoom: z })}
                fitMode={p.fit_mode ?? 'cover'}
                onChangeFitMode={(m) =>
                  handleUpdateLocalPlacement(featuredPlacementKey, { fit_mode: m })
                }
                targetAspectRatio="16:10"
                recommendedResolution="1600x1000"
                slotLabel="Featured Tournament Lead Hero"
                slotDescription="Displays as the centerpiece banner on the homepage featured tournament section."
                previewType="tournament_card"
                onOpenMediaLibrary={() => setPickerSlotKey(featuredPlacementKey)}
              />
            </div>
          )
        })()}
      </Panel>

      {/* Media Library Picker Modal */}
      <MediaLibraryModal
        isOpen={pickerSlotKey !== null}
        onClose={() => setPickerSlotKey(null)}
        onSelect={(url) => {
          if (pickerSlotKey) {
            handleUpdateLocalPlacement(pickerSlotKey, { asset_url: url })
          }
        }}
        showToast={showToast}
      />
    </div>
  )
}

/* =========================================================================
   GAMES ARTWORK MANAGER (Placement 3: Active Games Catalog, Placement 5: Coming Soon, Detail Banner)
   ========================================================================= */
function GamesArtworkManager({
  games,
  onRefresh,
  showToast,
}: {
  games: Game[]
  onRefresh: () => void
  showToast: (msg: string) => void
}) {
  const [catalogSubTab, setCatalogSubTab] = useState<'ACTIVE' | 'COMING_SOON'>('ACTIVE')
  const [search, setSearch] = useState('')
  const [selectedGameId, setSelectedGameId] = useState<string>(games[0]?.id || games[0]?.slug || '')
  const [savingGameId, setSavingGameId] = useState<string | null>(null)
  const [pickerSlot, setPickerSlot] = useState<string | null>(null)

  // Local editing copy per game
  const [gameMediaState, setGameMediaState] = useState<Record<string, any>>({})

  const filteredGames = useMemo(() => {
    return games.filter((g) => {
      const isComingSoon = g.status === 'COMING_SOON' || g.status === 'MAINTENANCE'
      const matchesTab = catalogSubTab === 'ACTIVE' ? !isComingSoon : isComingSoon
      const matchesSearch =
        !search.trim() ||
        g.name.toLowerCase().includes(search.toLowerCase()) ||
        g.slug.toLowerCase().includes(search.toLowerCase())
      return matchesTab && matchesSearch
    })
  }, [games, catalogSubTab, search])

  const selectedGame = useMemo(() => {
    return (
      filteredGames.find((g) => (g.id || g.slug) === selectedGameId) ||
      games.find((g) => (g.id || g.slug) === selectedGameId) ||
      filteredGames[0] ||
      games[0]
    )
  }, [games, filteredGames, selectedGameId])

  const currentGameId = selectedGame ? selectedGame.id || selectedGame.slug : ''

  // Initialize local media state when selectedGame changes
  useEffect(() => {
    if (!selectedGame) return
    const id = selectedGame.id || selectedGame.slug
    if (!gameMediaState[id]) {
      const cfg = selectedGame.media_config || (selectedGame as any).mediaConfig || {}
      setGameMediaState((prev) => ({
        ...prev,
        [id]: {
          catalog_card: {
            asset_url: cfg.catalog_card?.asset_url || selectedGame.poster_url || '',
            focal_x: cfg.catalog_card?.focal_x ?? 50,
            focal_y: cfg.catalog_card?.focal_y ?? 50,
            zoom: cfg.catalog_card?.zoom ?? 1,
            fit_mode: cfg.catalog_card?.fit_mode || 'cover',
          },
          banner: {
            asset_url: cfg.banner?.asset_url || selectedGame.banner_url || '',
            focal_x: cfg.banner?.focal_x ?? 50,
            focal_y: cfg.banner?.focal_y ?? 50,
            zoom: cfg.banner?.zoom ?? 1,
            fit_mode: cfg.banner?.fit_mode || 'cover',
          },
          showcase_card: {
            asset_url: cfg.showcase_card?.asset_url || selectedGame.poster_url || '',
            focal_x: cfg.showcase_card?.focal_x ?? 50,
            focal_y: cfg.showcase_card?.focal_y ?? 50,
            zoom: cfg.showcase_card?.zoom ?? 1,
            fit_mode: cfg.showcase_card?.fit_mode || 'cover',
          },
          logo: {
            asset_url: cfg.logo?.asset_url || selectedGame.logo_url || '',
          },
        },
      }))
    }
  }, [selectedGame])

  const currentConfig = gameMediaState[currentGameId] || {
    catalog_card: { asset_url: selectedGame?.poster_url || '', focal_x: 50, focal_y: 50, zoom: 1, fit_mode: 'cover' },
    banner: { asset_url: selectedGame?.banner_url || '', focal_x: 50, focal_y: 50, zoom: 1, fit_mode: 'cover' },
    showcase_card: { asset_url: selectedGame?.poster_url || '', focal_x: 50, focal_y: 50, zoom: 1, fit_mode: 'cover' },
    logo: { asset_url: selectedGame?.logo_url || '' },
  }

  const updateSlot = (slotKey: string, field: string, value: any) => {
    setGameMediaState((prev) => {
      const gameCopy = { ...(prev[currentGameId] || currentConfig) }
      gameCopy[slotKey] = { ...(gameCopy[slotKey] || {}), [field]: value }
      return { ...prev, [currentGameId]: gameCopy }
    })
  }

  const handleSaveGameMedia = async () => {
    if (!selectedGame) return
    setSavingGameId(currentGameId)
    try {
      const cfg = gameMediaState[currentGameId] || currentConfig
      await updateGame(currentGameId, {
        poster_url: cfg.catalog_card?.asset_url || selectedGame.poster_url,
        banner_url: cfg.banner?.asset_url || selectedGame.banner_url,
        logo_url: cfg.logo?.asset_url || selectedGame.logo_url,
        media_config: cfg,
      })
      showToast(`Artwork and focal alignment for "${selectedGame.name}" updated successfully!`)
      onRefresh()
    } catch (err: any) {
      alert(err.message || `Failed to update artwork for ${selectedGame.name}`)
    } finally {
      setSavingGameId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Filter and Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCatalogSubTab('ACTIVE')}
            className={`px-3 py-1.5 font-mono text-xs uppercase tracking-wider rounded transition-all cursor-pointer ${
              catalogSubTab === 'ACTIVE'
                ? 'bg-cyan text-void font-bold'
                : 'bg-surface/50 text-dim hover:text-ink border border-white/10'
            }`}
          >
            Placement 3: Active Games Catalog ({games.filter((g) => g.status !== 'COMING_SOON').length})
          </button>
          <button
            onClick={() => setCatalogSubTab('COMING_SOON')}
            className={`px-3 py-1.5 font-mono text-xs uppercase tracking-wider rounded transition-all cursor-pointer ${
              catalogSubTab === 'COMING_SOON'
                ? 'bg-cyan text-void font-bold'
                : 'bg-surface/50 text-dim hover:text-ink border border-white/10'
            }`}
          >
            Placement 5: Coming Soon Games ({games.filter((g) => g.status === 'COMING_SOON').length})
          </button>
        </div>

        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-dim" />
          <input
            type="text"
            placeholder="Search game titles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface border border-white/15 pl-8 pr-3 py-1 font-mono text-xs text-ink rounded outline-none focus:border-cyan"
          />
        </div>
      </div>

      {/* Main Two-Column Layout: Left game selector sidebar, Right focal editor */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Game Titles List */}
        <div className="lg:col-span-1 space-y-2 max-h-[700px] overflow-y-auto pr-1">
          {filteredGames.map((g) => {
            const isSelected = (g.id || g.slug) === currentGameId
            return (
              <div
                key={g.id || g.slug}
                onClick={() => setSelectedGameId(g.id || g.slug)}
                className={`p-3 rounded border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                  isSelected
                    ? 'border-cyan bg-cyan/10 text-ink shadow-md'
                    : 'border-white/10 bg-surface/30 hover:border-white/20 text-dim hover:text-ink'
                }`}
              >
                <div className="min-w-0">
                  <div className="font-display text-sm font-bold uppercase truncate">{g.name}</div>
                  <div className="font-mono text-[10px] text-dim">{g.slug}</div>
                </div>
                <ChevronRight className={`size-4 shrink-0 ${isSelected ? 'text-cyan' : 'opacity-30'}`} />
              </div>
            )
          })}
        </div>

        {/* Selected Game Editor */}
        {selectedGame ? (
          <div className="lg:col-span-3 space-y-6">
            <Panel className="p-5 space-y-6 border-white/10">
              {/* Selected Game Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-2xl font-black uppercase text-ink">
                      {selectedGame.name}
                    </h3>
                    <span className="font-mono text-[10px] text-cyan border border-cyan/30 px-1.5 py-0.5 uppercase">
                      {selectedGame.status || 'ACTIVE'}
                    </span>
                  </div>
                  <p className="font-mono text-xs text-dim mt-1">
                    Slug: <span className="text-white/80">{selectedGame.slug}</span> · Platform:{' '}
                    <span className="text-white/80">{selectedGame.platform || 'PC'}</span>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    to={`/games/${selectedGame.slug}`}
                    target="_blank"
                    className="font-mono text-xs text-cyan hover:underline uppercase flex items-center gap-1"
                  >
                    <span>View Page</span>
                    <ExternalLink className="size-3" />
                  </Link>
                  <button
                    onClick={handleSaveGameMedia}
                    disabled={savingGameId === currentGameId}
                    className="flex items-center gap-1.5 px-4 py-1.5 font-mono text-xs font-bold uppercase bg-cyan text-void rounded hover:brightness-110 shadow-lg shadow-cyan/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Save className="size-3.5" />
                    {savingGameId === currentGameId ? 'Saving...' : 'Save Game Artwork'}
                  </button>
                </div>
              </div>

              {/* Slot 1: Catalog Box Art (Placement 3 & 5: 4:5 Portrait) */}
              <div className="space-y-2">
                <CropFocalEditor
                  value={currentConfig.catalog_card?.asset_url}
                  onChangeAsset={(url) => updateSlot('catalog_card', 'asset_url', url)}
                  focalPoint={{
                    x: currentConfig.catalog_card?.focal_x ?? 50,
                    y: currentConfig.catalog_card?.focal_y ?? 50,
                  }}
                  onChangeFocalPoint={(fp) => {
                    updateSlot('catalog_card', 'focal_x', fp.x)
                    updateSlot('catalog_card', 'focal_y', fp.y)
                  }}
                  zoom={currentConfig.catalog_card?.zoom ?? 1}
                  onChangeZoom={(z) => updateSlot('catalog_card', 'zoom', z)}
                  fitMode={currentConfig.catalog_card?.fit_mode || 'cover'}
                  onChangeFitMode={(m) => updateSlot('catalog_card', 'fit_mode', m)}
                  targetAspectRatio="4:5"
                  recommendedResolution="900x1125"
                  slotLabel="1. Catalog Card Artwork (Placement 3 & 5)"
                  slotDescription="Used on /games catalog and homepage active games grid. Target ratio is 4:5 portrait."
                  previewType="game_card"
                  onOpenMediaLibrary={() => setPickerSlot('catalog_card')}
                />
              </div>

              {/* Slot 2: Game Detail Widescreen Banner (16:9 Landscape) */}
              <div className="space-y-2">
                <CropFocalEditor
                  value={currentConfig.banner?.asset_url}
                  onChangeAsset={(url) => updateSlot('banner', 'asset_url', url)}
                  focalPoint={{
                    x: currentConfig.banner?.focal_x ?? 50,
                    y: currentConfig.banner?.focal_y ?? 50,
                  }}
                  onChangeFocalPoint={(fp) => {
                    updateSlot('banner', 'focal_x', fp.x)
                    updateSlot('banner', 'focal_y', fp.y)
                  }}
                  zoom={currentConfig.banner?.zoom ?? 1}
                  onChangeZoom={(z) => updateSlot('banner', 'zoom', z)}
                  fitMode={currentConfig.banner?.fit_mode || 'cover'}
                  onChangeFitMode={(m) => updateSlot('banner', 'fit_mode', m)}
                  targetAspectRatio="16:9"
                  recommendedResolution="1600x900"
                  slotLabel="2. Game Detail Header Banner"
                  slotDescription="Used as the panoramic header on the individual game detail page (/games/:slug)."
                  previewType="banner"
                  onOpenMediaLibrary={() => setPickerSlot('banner')}
                />
              </div>

              {/* Slot 3: Homepage Showcase Card (Placement 7: 3:4 Portrait) */}
              <div className="space-y-2">
                <CropFocalEditor
                  value={currentConfig.showcase_card?.asset_url}
                  onChangeAsset={(url) => updateSlot('showcase_card', 'asset_url', url)}
                  focalPoint={{
                    x: currentConfig.showcase_card?.focal_x ?? 50,
                    y: currentConfig.showcase_card?.focal_y ?? 50,
                  }}
                  onChangeFocalPoint={(fp) => {
                    updateSlot('showcase_card', 'focal_x', fp.x)
                    updateSlot('showcase_card', 'focal_y', fp.y)
                  }}
                  zoom={currentConfig.showcase_card?.zoom ?? 1}
                  onChangeZoom={(z) => updateSlot('showcase_card', 'zoom', z)}
                  fitMode={currentConfig.showcase_card?.fit_mode || 'cover'}
                  onChangeFitMode={(m) => updateSlot('showcase_card', 'fit_mode', m)}
                  targetAspectRatio="3:4"
                  recommendedResolution="900x1200"
                  slotLabel="3. Homepage Game Showcase Card (Placement 7)"
                  slotDescription="Staggered cards rendered in '8 Games. One Arena.' on the homepage."
                  previewType="showcase_card"
                  onOpenMediaLibrary={() => setPickerSlot('showcase_card')}
                />
              </div>

              {/* Slot 4: Emblem / Logo (1:1 Square) */}
              <div className="space-y-2">
                <CropFocalEditor
                  value={currentConfig.logo?.asset_url}
                  onChangeAsset={(url) => updateSlot('logo', 'asset_url', url)}
                  targetAspectRatio="1:1"
                  recommendedResolution="256x256"
                  slotLabel="4. Game Emblem / Icon (1:1)"
                  slotDescription="Square game badge or SVG emblem used in tournament match headers and selectors."
                  previewType="square"
                  onOpenMediaLibrary={() => setPickerSlot('logo')}
                />
              </div>
            </Panel>
          </div>
        ) : (
          <div className="lg:col-span-3 p-12 text-center text-dim font-mono text-xs border border-white/10 rounded">
            No game selected.
          </div>
        )}
      </div>

      {/* Media Library Picker Modal */}
      <MediaLibraryModal
        isOpen={pickerSlot !== null}
        onClose={() => setPickerSlot(null)}
        onSelect={(url) => {
          if (pickerSlot) {
            updateSlot(pickerSlot, 'asset_url', url)
          }
        }}
        showToast={showToast}
      />
    </div>
  )
}

/* =========================================================================
   TOURNAMENTS ARTWORK MANAGER (Placement 4: Upcoming Tournaments, Placement 6: Main Tournaments)
   ========================================================================= */
function TournamentsArtworkManager({
  tournaments,
  onRefresh,
  showToast,
}: {
  tournaments: Tournament[]
  onRefresh: () => void
  showToast: (msg: string) => void
}) {
  const [tournamentSubTab, setTournamentSubTab] = useState<'UPCOMING' | 'ALL'>('UPCOMING')
  const [search, setSearch] = useState('')
  const [selectedTourId, setSelectedTourId] = useState<string>(
    tournaments[0]?.id || tournaments[0]?.slug || ''
  )
  const [savingTourId, setSavingTourId] = useState<string | null>(null)
  const [pickerSlot, setPickerSlot] = useState<string | null>(null)

  const [tourMediaState, setTourMediaState] = useState<Record<string, any>>({})

  const filteredTournaments = useMemo(() => {
    return tournaments.filter((t) => {
      const isUpcoming = t.status === 'UPCOMING' || t.status === 'REGISTRATION_OPEN'
      const matchesTab = tournamentSubTab === 'UPCOMING' ? isUpcoming : true
      const matchesSearch =
        !search.trim() ||
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        (t.slug && t.slug.toLowerCase().includes(search.toLowerCase()))
      return matchesTab && matchesSearch
    })
  }, [tournaments, tournamentSubTab, search])

  const selectedTournament = useMemo(() => {
    return (
      filteredTournaments.find((t) => (t.id || t.slug) === selectedTourId) ||
      tournaments.find((t) => (t.id || t.slug) === selectedTourId) ||
      filteredTournaments[0] ||
      tournaments[0]
    )
  }, [tournaments, filteredTournaments, selectedTourId])

  const currentTourId = selectedTournament ? selectedTournament.id || selectedTournament.slug : ''

  useEffect(() => {
    if (!selectedTournament) return
    const id = selectedTournament.id || selectedTournament.slug
    if (!tourMediaState[id]) {
      const cfg = selectedTournament.media_config || (selectedTournament as any).mediaConfig || {}
      setTourMediaState((prev) => ({
        ...prev,
        [id]: {
          card: {
            asset_url: cfg.card?.asset_url || selectedTournament.banner_url || '',
            focal_x: cfg.card?.focal_x ?? 50,
            focal_y: cfg.card?.focal_y ?? 50,
            zoom: cfg.card?.zoom ?? 1,
            fit_mode: cfg.card?.fit_mode || 'cover',
          },
          hero: {
            asset_url: cfg.hero?.asset_url || selectedTournament.hero_banner_url || selectedTournament.banner_url || '',
            focal_x: cfg.hero?.focal_x ?? 50,
            focal_y: cfg.hero?.focal_y ?? 50,
            zoom: cfg.hero?.zoom ?? 1,
            fit_mode: cfg.hero?.fit_mode || 'cover',
          },
          logo: {
            asset_url: cfg.logo?.asset_url || selectedTournament.logo_url || '',
          },
        },
      }))
    }
  }, [selectedTournament])

  const currentConfig = tourMediaState[currentTourId] || {
    card: { asset_url: selectedTournament?.banner_url || '', focal_x: 50, focal_y: 50, zoom: 1, fit_mode: 'cover' },
    hero: { asset_url: selectedTournament?.hero_banner_url || '', focal_x: 50, focal_y: 50, zoom: 1, fit_mode: 'cover' },
    logo: { asset_url: selectedTournament?.logo_url || '' },
  }

  const updateSlot = (slotKey: string, field: string, value: any) => {
    setTourMediaState((prev) => {
      const tourCopy = { ...(prev[currentTourId] || currentConfig) }
      tourCopy[slotKey] = { ...(tourCopy[slotKey] || {}), [field]: value }
      return { ...prev, [currentTourId]: tourCopy }
    })
  }

  const handleSaveTournamentMedia = async () => {
    if (!selectedTournament) return
    setSavingTourId(currentTourId)
    try {
      const cfg = tourMediaState[currentTourId] || currentConfig
      await updateTournamentOrganizer(currentTourId, {
        banner_url: cfg.card?.asset_url || selectedTournament.banner_url,
        hero_banner_url: cfg.hero?.asset_url || selectedTournament.hero_banner_url,
        logo_url: cfg.logo?.asset_url || selectedTournament.logo_url,
        media_config: cfg,
      })
      showToast(`Artwork for tournament "${selectedTournament.title}" updated successfully!`)
      onRefresh()
    } catch (err: any) {
      alert(err.message || `Failed to update artwork for ${selectedTournament.title}`)
    } finally {
      setSavingTourId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Filter and Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTournamentSubTab('UPCOMING')}
            className={`px-3 py-1.5 font-mono text-xs uppercase tracking-wider rounded transition-all cursor-pointer ${
              tournamentSubTab === 'UPCOMING'
                ? 'bg-cyan text-void font-bold'
                : 'bg-surface/50 text-dim hover:text-ink border border-white/10'
            }`}
          >
            Placement 4: Upcoming Tournaments ({tournaments.filter((t) => t.status === 'UPCOMING' || t.status === 'REGISTRATION_OPEN').length})
          </button>
          <button
            onClick={() => setTournamentSubTab('ALL')}
            className={`px-3 py-1.5 font-mono text-xs uppercase tracking-wider rounded transition-all cursor-pointer ${
              tournamentSubTab === 'ALL'
                ? 'bg-cyan text-void font-bold'
                : 'bg-surface/50 text-dim hover:text-ink border border-white/10'
            }`}
          >
            Placement 6: Main Tournaments Page ({tournaments.length})
          </button>
        </div>

        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-dim" />
          <input
            type="text"
            placeholder="Search tournament title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface border border-white/15 pl-8 pr-3 py-1 font-mono text-xs text-ink rounded outline-none focus:border-cyan"
          />
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tournament List */}
        <div className="lg:col-span-1 space-y-2 max-h-[700px] overflow-y-auto pr-1">
          {filteredTournaments.map((t) => {
            const isSelected = (t.id || t.slug) === currentTourId
            return (
              <div
                key={t.id || t.slug}
                onClick={() => setSelectedTourId(t.id || t.slug)}
                className={`p-3 rounded border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                  isSelected
                    ? 'border-cyan bg-cyan/10 text-ink shadow-md'
                    : 'border-white/10 bg-surface/30 hover:border-white/20 text-dim hover:text-ink'
                }`}
              >
                <div className="min-w-0">
                  <div className="font-display text-sm font-bold uppercase truncate">{t.title}</div>
                  <div className="font-mono text-[10px] text-dim">{t.slug}</div>
                </div>
                <ChevronRight className={`size-4 shrink-0 ${isSelected ? 'text-cyan' : 'opacity-30'}`} />
              </div>
            )
          })}
        </div>

        {/* Selected Tournament Editor */}
        {selectedTournament ? (
          <div className="lg:col-span-3 space-y-6">
            <Panel className="p-5 space-y-6 border-white/10">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-2xl font-black uppercase text-ink">
                      {selectedTournament.title}
                    </h3>
                    <span className="font-mono text-[10px] text-cyan border border-cyan/30 px-1.5 py-0.5 uppercase">
                      {selectedTournament.status || 'ACTIVE'}
                    </span>
                  </div>
                  <p className="font-mono text-xs text-dim mt-1">
                    Slug: <span className="text-white/80">{selectedTournament.slug}</span> · Prize:{' '}
                    <span className="text-ok font-bold">
                      ₹{(selectedTournament.prize_pool_inr || 0).toLocaleString('en-IN')}
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    to={`/tournaments/${selectedTournament.id || selectedTournament.slug}`}
                    target="_blank"
                    className="font-mono text-xs text-cyan hover:underline uppercase flex items-center gap-1"
                  >
                    <span>View Page</span>
                    <ExternalLink className="size-3" />
                  </Link>
                  <button
                    onClick={handleSaveTournamentMedia}
                    disabled={savingTourId === currentTourId}
                    className="flex items-center gap-1.5 px-4 py-1.5 font-mono text-xs font-bold uppercase bg-cyan text-void rounded hover:brightness-110 shadow-lg shadow-cyan/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Save className="size-3.5" />
                    {savingTourId === currentTourId ? 'Saving...' : 'Save Tournament Artwork'}
                  </button>
                </div>
              </div>

              {/* Slot 1: Listing Card Artwork (Placement 4 & 6: 16:9 Landscape) */}
              <div className="space-y-2">
                <CropFocalEditor
                  value={currentConfig.card?.asset_url}
                  onChangeAsset={(url) => updateSlot('card', 'asset_url', url)}
                  focalPoint={{
                    x: currentConfig.card?.focal_x ?? 50,
                    y: currentConfig.card?.focal_y ?? 50,
                  }}
                  onChangeFocalPoint={(fp) => {
                    updateSlot('card', 'focal_x', fp.x)
                    updateSlot('card', 'focal_y', fp.y)
                  }}
                  zoom={currentConfig.card?.zoom ?? 1}
                  onChangeZoom={(z) => updateSlot('card', 'zoom', z)}
                  fitMode={currentConfig.card?.fit_mode || 'cover'}
                  onChangeFitMode={(m) => updateSlot('card', 'fit_mode', m)}
                  targetAspectRatio="16:9"
                  recommendedResolution="1600x900"
                  slotLabel="1. Tournament Listing Card Artwork (Placement 4 & 6)"
                  slotDescription="Used for cards on /tournaments and homepage upcoming tournament cards."
                  previewType="tournament_card"
                  onOpenMediaLibrary={() => setPickerSlot('card')}
                />
              </div>

              {/* Slot 2: Detail Panoramic Hero Header (1920x820) */}
              <div className="space-y-2">
                <CropFocalEditor
                  value={currentConfig.hero?.asset_url}
                  onChangeAsset={(url) => updateSlot('hero', 'asset_url', url)}
                  focalPoint={{
                    x: currentConfig.hero?.focal_x ?? 50,
                    y: currentConfig.hero?.focal_y ?? 50,
                  }}
                  onChangeFocalPoint={(fp) => {
                    updateSlot('hero', 'focal_x', fp.x)
                    updateSlot('hero', 'focal_y', fp.y)
                  }}
                  zoom={currentConfig.hero?.zoom ?? 1}
                  onChangeZoom={(z) => updateSlot('hero', 'zoom', z)}
                  fitMode={currentConfig.hero?.fit_mode || 'cover'}
                  onChangeFitMode={(m) => updateSlot('hero', 'fit_mode', m)}
                  targetAspectRatio="16:9"
                  recommendedResolution="1920x820"
                  slotLabel="2. Tournament Detail Page Panoramic Hero Header"
                  slotDescription="Large immersive panoramic hero background banner on /tournaments/:id."
                  previewType="banner"
                  onOpenMediaLibrary={() => setPickerSlot('hero')}
                />
              </div>

              {/* Slot 3: Crest / Logo (1:1 Square) */}
              <div className="space-y-2">
                <CropFocalEditor
                  value={currentConfig.logo?.asset_url}
                  onChangeAsset={(url) => updateSlot('logo', 'asset_url', url)}
                  targetAspectRatio="1:1"
                  recommendedResolution="256x256"
                  slotLabel="3. Tournament Crest / Emblem (1:1)"
                  slotDescription="Crest used in brackets, match cards, and registration summary."
                  previewType="square"
                  onOpenMediaLibrary={() => setPickerSlot('logo')}
                />
              </div>
            </Panel>
          </div>
        ) : (
          <div className="lg:col-span-3 p-12 text-center text-dim font-mono text-xs border border-white/10 rounded">
            No tournament selected.
          </div>
        )}
      </div>

      <MediaLibraryModal
        isOpen={pickerSlot !== null}
        onClose={() => setPickerSlot(null)}
        onSelect={(url) => {
          if (pickerSlot) {
            updateSlot(pickerSlot, 'asset_url', url)
          }
        }}
        showToast={showToast}
      />
    </div>
  )
}

/* =========================================================================
   MEDIA LIBRARY BROWSER TAB
   ========================================================================= */
function MediaLibraryBrowser({ showToast }: { showToast: (msg: string) => void }) {
  const [items, setItems] = useState<MediaLibraryItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchAssets = async () => {
    setLoading(true)
    try {
      const res = await listMediaFiles({ search: search.trim() || undefined, limit: 60 })
      setItems(res?.items || [])
      setTotal(res?.total || 0)
    } catch (err: any) {
      console.error('Failed to load media items', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAssets()
  }, [search])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      const res = await uploadMediaFile(file)
      if (res?.url) {
        showToast(`Image "${file.name}" uploaded successfully!`)
        fetchAssets()
      }
    } catch (err: any) {
      alert(err.message || 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const handleCopy = (id: string, url: string) => {
    const full = resolveMediaUrl(url)
    navigator.clipboard.writeText(full)
    setCopiedId(id)
    showToast('Asset URL copied to clipboard!')
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <Panel className="p-6 space-y-6 border-white/10">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <FolderOpen className="size-5 text-cyan" />
            <h3 className="font-display text-2xl font-black uppercase text-ink">
              Platform Media Library ({total} Assets)
            </h3>
          </div>
          <p className="font-mono text-xs text-dim mt-1">
            Global repository of uploaded images stored in the MongoDB GridFS media database.
            Re-use existing assets across any placement slot without duplicate file uploads.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-1.5 px-4 py-2 font-mono text-xs font-bold uppercase bg-cyan text-void rounded hover:brightness-110 shadow-lg shadow-cyan/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <UploadCloud className="size-4" />
            {isUploading ? 'Uploading...' : 'Upload Media Asset'}
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-dim" />
        <input
          type="text"
          placeholder="Search by filename or keyword..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-surface border border-white/15 pl-9 pr-3 py-2 font-mono text-xs text-ink rounded outline-none focus:border-cyan"
        />
      </div>

      {/* Assets Grid */}
      {loading ? (
        <div className="py-20 text-center font-mono text-xs text-dim animate-pulse">
          Loading media library assets...
        </div>
      ) : items.length === 0 ? (
        <div className="py-20 text-center text-dim font-mono text-xs border border-white/10 rounded">
          No media assets found. Upload images to populate your library.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="group border border-white/10 hover:border-cyan/50 bg-void/50 rounded overflow-hidden flex flex-col justify-between transition-all hover:shadow-lg hover:shadow-cyan/10"
            >
              <div className="aspect-video w-full bg-black/60 relative overflow-hidden">
                <img
                  src={resolveMediaUrl(item.url)}
                  alt={item.filename}
                  className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              </div>

              <div className="p-3 border-t border-white/5 space-y-2">
                <div className="font-mono text-xs text-ink font-semibold truncate" title={item.filename}>
                  {item.filename}
                </div>
                <div className="flex items-center justify-between font-mono text-[10px] text-dim">
                  <span>{formatBytes(item.size)}</span>
                  <span>{item.content_type?.split('/')[1]?.toUpperCase() || 'IMG'}</span>
                </div>

                <div className="pt-1 flex items-center gap-1.5">
                  <button
                    onClick={() => handleCopy(item.id, item.url)}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1 font-mono text-[10px] uppercase bg-white/5 hover:bg-white/10 text-dim hover:text-ink border border-white/10 rounded transition-colors cursor-pointer"
                  >
                    {copiedId === item.id ? (
                      <>
                        <Check className="size-3 text-cyan" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3" />
                        <span>Copy URL</span>
                      </>
                    )}
                  </button>
                  <a
                    href={resolveMediaUrl(item.url)}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 font-mono text-[10px] bg-white/5 hover:bg-white/10 text-dim hover:text-cyan border border-white/10 rounded transition-colors"
                    title="Open Full Image"
                  >
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  )
}

/* =========================================================================
   SPECIFICATIONS MANIFEST TAB
   ========================================================================= */
function SpecsManifestView() {
  const specs = [
    {
      num: 1,
      placement: 'Placement 1: Homepage Hero Floating Artwork',
      field: 'placements/homepage_hero_slot_1..4',
      ratio: '16:9 Landscape',
      dimensions: '1600 × 900 px',
      usage: '4 floating angular shard panels orbiting central 3D hero composition on Homepage.',
      notes: 'Preserves 3D perspective & rotation; focal point X/Y% and zoom calibrated in Admin.',
    },
    {
      num: 2,
      placement: 'Placement 2: Homepage Featured Tournament',
      field: 'placements/homepage_featured_tournament',
      ratio: '16:10 Aspect',
      dimensions: '1600 × 1000 px',
      usage: 'Primary featured tournament lead hero card and side thumbnails on Homepage.',
      notes: 'Admin tournament selector or custom artwork assignment; no clipping.',
    },
    {
      num: 3,
      placement: 'Placement 3: Active Games Catalog',
      field: 'Game.media_config.catalog_card (poster_url)',
      ratio: '4:5 Portrait',
      dimensions: '900 × 1125 px',
      usage: 'Game cards on /games catalog and homepage active games listing.',
      notes: 'Contains badges, title, and platform tags; focal reticle prevents cropping player heads.',
    },
    {
      num: 4,
      placement: 'Placement 4: Upcoming Tournaments',
      field: 'Tournament.media_config.card (banner_url)',
      ratio: '16:9 Widescreen',
      dimensions: '1280 × 720 px',
      usage: 'Upcoming tournament listing cards on Homepage & Tournaments page.',
      notes: 'Full-bleed widescreen banner with prize pool overlay and status badge.',
    },
    {
      num: 5,
      placement: 'Placement 5: Coming Soon Games Catalog',
      field: 'Game.media_config.catalog_card',
      ratio: '4:5 Portrait',
      dimensions: '900 × 1125 px',
      usage: 'Upcoming locked game worlds on /games catalog.',
      notes: 'Seamless asset preservation when game status transitions from Coming Soon to Active.',
    },
    {
      num: 6,
      placement: 'Placement 6: Main Tournaments Page',
      field: 'Tournament.media_config.hero & .card',
      ratio: '16:9 Card / 2.34:1 Hero',
      dimensions: '1600 × 900 / 1920 × 820 px',
      usage: 'Main /tournaments catalog listing cards & /tournaments/:id panoramic hero banner.',
      notes: 'Independent thumbnail card and panoramic detail background artwork.',
    },
    {
      num: 7,
      placement: 'Placement 7: Homepage Game Showcase',
      field: 'Game.media_config.showcase_card',
      ratio: '3:4 Portrait',
      dimensions: '900 × 1200 px',
      usage: 'Staggered vertical cards in "8 Games. One Arena." on Homepage.',
      notes: 'Displays game title, platform tags, description, and "Enter world →" action.',
    },
  ]

  return (
    <Panel className="p-6 space-y-6 border-cyan/30 bg-cyan/[0.02]">
      <div className="border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="size-5 text-cyan" />
          <h3 className="font-display text-2xl font-black uppercase text-cyan">
            Ametheus Master Artwork Specification Manifest
          </h3>
        </div>
        <p className="font-mono text-xs text-dim mt-1">
          Complete engineering reference covering all 7 placement categories, aspect ratios, target resolutions,
          and component integrations across the platform.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs border border-white/10">
          <thead>
            <tr className="bg-white/5 border-b border-white/10 text-cyan uppercase">
              <th className="p-3">#</th>
              <th className="p-3">Placement / Component</th>
              <th className="p-3">Database Target</th>
              <th className="p-3">Aspect Ratio</th>
              <th className="p-3">Target Dimensions</th>
              <th className="p-3">Component Usage & Behavior</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-dim">
            {specs.map((s) => (
              <tr key={s.num} className="hover:bg-white/[0.02]">
                <td className="p-3 text-white font-bold">{s.num}</td>
                <td className="p-3 text-ink font-bold">{s.placement}</td>
                <td className="p-3 text-cyan">{s.field}</td>
                <td className="p-3 text-white">{s.ratio}</td>
                <td className="p-3 text-cyan">{s.dimensions}</td>
                <td className="p-3">
                  <div className="text-white/80">{s.usage}</div>
                  <div className="text-[10px] text-dim mt-0.5">{s.notes}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

/* =========================================================================
   MAIN MEDIA ARTWORK MANAGER COMPONENT
   ========================================================================= */
export function MediaArtworkManager({
  games,
  tournaments,
  onRefresh,
  showToast,
}: MediaArtworkManagerProps) {
  const [activeTab, setActiveTab] = useState<MainTab>('HOMEPAGE')

  return (
    <div className="mt-8 space-y-6">
      {/* Top Main Navigation Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="size-2.5 bg-cyan rounded-full animate-pulse" />
            <h2 className="font-display text-3xl font-black uppercase text-ink">
              Image Management System
            </h2>
          </div>
          <p className="font-mono text-xs text-dim mt-1 max-w-3xl">
            Centralized dynamic asset controller with visual crop focal calibration, real container ratio
            inspection, zoom adjustments, and component-accurate live previews across all 7 platform placements.
          </p>
        </div>

        {/* Organized Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'HOMEPAGE', label: '1. Homepage', icon: Compass },
            { id: 'GAMES', label: '2. Games', icon: Gamepad2 },
            { id: 'TOURNAMENTS', label: '3. Tournaments', icon: Trophy },
            { id: 'LIBRARY', label: '4. Media Library', icon: FolderOpen },
            { id: 'SPECS', label: '5. Specifications Manifest', icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as MainTab)}
                className={`flex items-center gap-2 px-3.5 py-2 font-mono text-xs uppercase tracking-wider rounded transition-all cursor-pointer ${
                  isActive
                    ? 'bg-cyan text-void font-bold shadow-lg shadow-cyan/20'
                    : 'border border-white/10 bg-surface/50 text-dim hover:text-ink hover:border-white/20'
                }`}
              >
                <Icon className="size-3.5" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === 'HOMEPAGE' && (
        <HomepagePlacementsManager
          tournaments={tournaments}
          games={games}
          showToast={showToast}
        />
      )}

      {activeTab === 'GAMES' && (
        <GamesArtworkManager
          games={games}
          onRefresh={onRefresh}
          showToast={showToast}
        />
      )}

      {activeTab === 'TOURNAMENTS' && (
        <TournamentsArtworkManager
          tournaments={tournaments}
          onRefresh={onRefresh}
          showToast={showToast}
        />
      )}

      {activeTab === 'LIBRARY' && <MediaLibraryBrowser showToast={showToast} />}

      {activeTab === 'SPECS' && <SpecsManifestView />}
    </div>
  )
}

export default MediaArtworkManager
