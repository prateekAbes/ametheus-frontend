import { useState, useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router'
import {
  Gamepad2,
  Trophy,
  FolderOpen,
  Search,
  Check,
  Copy,
  ExternalLink,
  UploadCloud,
  ChevronRight,
  Save,
  Trash2,
  X,
  AlertTriangle,
  Star,
  Layers,
} from 'lucide-react'
import { Game } from '../../services/games'
import { Tournament } from '../../services/tournaments'
import {
  updateGame,
  listMediaFiles,
  uploadMediaFile,
  deleteMediaFile,
  MediaLibraryItem,
} from '../../services/admin'
import { updateTournamentOrganizer } from '../../services/organizer'
import { Panel } from '../ui'
import { resolveMediaUrl } from '../../services/apiClient'
import CropFocalEditor from './CropFocalEditor'
import {
  GAME_ARTWORK_ROLES,
  TOURNAMENT_ARTWORK_ROLES,
  ArtworkRoleDefinition,
} from '../../lib/artworkRegistry'

interface MediaArtworkManagerProps {
  games: Game[]
  tournaments: Tournament[]
  onRefresh: () => void
  showToast: (msg: string) => void
}

type MainTab = 'GAMES' | 'TOURNAMENTS' | 'LIBRARY'

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
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 bg-void/50">
          <div className="flex items-center gap-2.5">
            <FolderOpen className="size-5 text-cyan" />
            <h3 className="font-display text-lg font-bold uppercase text-ink">
              Select Managed Asset from Media Library
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-dim hover:text-ink hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-white/10 bg-void/30">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-dim" />
            <input
              type="text"
              placeholder="Search assets by filename..."
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

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center py-16 font-mono text-xs text-dim animate-pulse">
              Loading media library assets...
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
                        Use This Asset
                      </span>
                    </div>
                  </div>
                  <div className="p-2 border-t border-white/5 flex flex-col justify-between flex-1">
                    <div className="font-mono text-[11px] text-ink truncate" title={item.filename}>
                      {item.filename}
                    </div>
                    <div className="flex items-center justify-between font-mono text-[9px] text-dim mt-1">
                      <span>{formatBytes(item.size)}</span>
                      <span>
                        {item.width && item.height
                          ? `${item.width}×${item.height}`
                          : item.content_type?.split('/')[1] || 'img'}
                      </span>
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
   GAMES ARTWORK SECTION (Active Games & Coming Soon Games)
   ========================================================================= */
function GamesArtworkSection({
  games,
  onRefresh,
  showToast,
}: {
  games: Game[]
  onRefresh: () => void
  showToast: (msg: string) => void
}) {
  const [filterMode, setFilterMode] = useState<'ACTIVE' | 'COMING_SOON'>('ACTIVE')
  const [search, setSearch] = useState('')
  const [selectedGameId, setSelectedGameId] = useState<string>(games[0]?.id || games[0]?.slug || '')
  const [savingGameId, setSavingGameId] = useState<string | null>(null)
  const [pickerSlot, setPickerSlot] = useState<string | null>(null)

  const [gameMediaState, setGameMediaState] = useState<Record<string, any>>({})

  const filteredGames = useMemo(() => {
    return games.filter((g) => {
      const isComingSoon = g.status === 'COMING_SOON' || g.status === 'MAINTENANCE'
      const matchesTab = filterMode === 'ACTIVE' ? !isComingSoon : isComingSoon
      const matchesSearch =
        !search.trim() ||
        g.name.toLowerCase().includes(search.toLowerCase()) ||
        g.slug.toLowerCase().includes(search.toLowerCase())
      return matchesTab && matchesSearch
    })
  }, [games, filterMode, search])

  const selectedGame = useMemo(() => {
    return (
      filteredGames.find((g) => (g.id || g.slug) === selectedGameId) ||
      games.find((g) => (g.id || g.slug) === selectedGameId) ||
      filteredGames[0] ||
      games[0]
    )
  }, [games, filteredGames, selectedGameId])

  const currentGameId = selectedGame ? selectedGame.id || selectedGame.slug : ''

  useEffect(() => {
    if (!selectedGame) return
    const id = selectedGame.id || selectedGame.slug
    if (!gameMediaState[id]) {
      const cfg = selectedGame.media_config || (selectedGame as any).mediaConfig || {}
      setGameMediaState((prev) => ({
        ...prev,
        [id]: {
          catalog_card: {
            asset_url: cfg.catalog_card?.asset_url ?? (selectedGame.poster_url || ''),
            focal_x: cfg.catalog_card?.focal_x ?? 50,
            focal_y: cfg.catalog_card?.focal_y ?? 50,
            zoom: cfg.catalog_card?.zoom ?? 1,
            fit_mode: cfg.catalog_card?.fit_mode || 'cover',
          },
          coming_soon_catalog_card: {
            asset_url: cfg.coming_soon_catalog_card?.asset_url ?? (selectedGame.poster_url || ''),
            focal_x: cfg.coming_soon_catalog_card?.focal_x ?? 50,
            focal_y: cfg.coming_soon_catalog_card?.focal_y ?? 50,
            zoom: cfg.coming_soon_catalog_card?.zoom ?? 1,
            fit_mode: cfg.coming_soon_catalog_card?.fit_mode || 'cover',
          },
          banner: {
            asset_url: cfg.banner?.asset_url ?? (selectedGame.banner_url || ''),
            focal_x: cfg.banner?.focal_x ?? 50,
            focal_y: cfg.banner?.focal_y ?? 50,
            zoom: cfg.banner?.zoom ?? 1,
            fit_mode: cfg.banner?.fit_mode || 'ambient',
          },
          logo: {
            asset_url: cfg.logo?.asset_url ?? (selectedGame.logo_url || ''),
          },
        },
      }))
    }
  }, [selectedGame])

  const currentConfig = gameMediaState[currentGameId] || {
    catalog_card: { asset_url: selectedGame?.media_config?.catalog_card?.asset_url ?? (selectedGame?.poster_url || ''), focal_x: 50, focal_y: 50, zoom: 1, fit_mode: 'cover' },
    coming_soon_catalog_card: { asset_url: selectedGame?.media_config?.coming_soon_catalog_card?.asset_url ?? (selectedGame?.poster_url || ''), focal_x: 50, focal_y: 50, zoom: 1, fit_mode: 'cover' },
    banner: { asset_url: selectedGame?.media_config?.banner?.asset_url ?? (selectedGame?.banner_url || ''), focal_x: 50, focal_y: 50, zoom: 1, fit_mode: 'ambient' },
    logo: { asset_url: selectedGame?.media_config?.logo?.asset_url ?? (selectedGame?.logo_url || '') },
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
      const newPoster = cfg.catalog_card?.asset_url ?? ''
      const newBanner = cfg.banner?.asset_url ?? ''
      const newLogo = cfg.logo?.asset_url ?? ''
      await updateGame(currentGameId, {
        poster_url: newPoster,
        banner_url: newBanner,
        logo_url: newLogo,
        media_config: cfg,
      })
      setGameMediaState((prev) => ({
        ...prev,
        [currentGameId]: { ...cfg },
      }))
      showToast(`Artwork for "${selectedGame.name}" successfully updated!`)
      onRefresh()
    } catch (err: any) {
      alert(err.message || `Failed to update artwork for ${selectedGame.name}`)
    } finally {
      setSavingGameId(null)
    }
  }

  // Active roles for this game based on status
  const rolesToDisplay = useMemo(() => {
    const isComingSoon = selectedGame?.status === 'COMING_SOON' || selectedGame?.status === 'MAINTENANCE'
    return GAME_ARTWORK_ROLES.filter((r) => {
      if (r.id === 'game.active_catalog_card') return !isComingSoon
      if (r.id === 'game.coming_soon_catalog_card') return isComingSoon
      return true
    })
  }, [selectedGame])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterMode('ACTIVE')}
            className={`px-3.5 py-1.5 font-mono text-xs uppercase tracking-wider rounded transition-all cursor-pointer ${
              filterMode === 'ACTIVE'
                ? 'bg-cyan text-void font-bold shadow-sm'
                : 'bg-surface/50 text-dim hover:text-ink border border-white/10'
            }`}
          >
            Active Games ({games.filter((g) => g.status !== 'COMING_SOON' && g.status !== 'MAINTENANCE').length})
          </button>
          <button
            onClick={() => setFilterMode('COMING_SOON')}
            className={`px-3.5 py-1.5 font-mono text-xs uppercase tracking-wider rounded transition-all cursor-pointer ${
              filterMode === 'COMING_SOON'
                ? 'bg-cyan text-void font-bold shadow-sm'
                : 'bg-surface/50 text-dim hover:text-ink border border-white/10'
            }`}
          >
            Coming Soon Games ({games.filter((g) => g.status === 'COMING_SOON' || g.status === 'MAINTENANCE').length})
          </button>
        </div>

        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-dim" />
          <input
            type="text"
            placeholder="Search games by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface border border-white/15 pl-8 pr-3 py-1.5 font-mono text-xs text-ink rounded outline-none focus:border-cyan"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-2 max-h-[720px] overflow-y-auto pr-1">
          {filteredGames.length === 0 ? (
            <div className="p-6 text-center text-dim font-mono text-xs border border-white/10 rounded">
              No games found in this view.
            </div>
          ) : (
            filteredGames.map((g) => {
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
            })
          )}
        </div>

        {selectedGame ? (
          <div className="lg:col-span-3 space-y-6">
            <Panel className="p-6 space-y-6 border-white/10">
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
                    <span>View Game Page</span>
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

              {/* Render each canonical artwork role */}
              <div className="space-y-6">
                {rolesToDisplay.map((role) => {
                  const slotConfig = currentConfig[role.slotKey] || {}
                  return (
                    <CropFocalEditor
                      key={role.id}
                      roleSpec={role}
                      value={slotConfig.asset_url || ''}
                      onChangeAsset={(url) => updateSlot(role.slotKey, 'asset_url', url)}
                      focalPoint={{
                        x: slotConfig.focal_x ?? 50,
                        y: slotConfig.focal_y ?? 50,
                      }}
                      onChangeFocalPoint={(fp) => {
                        updateSlot(role.slotKey, 'focal_x', fp.x)
                        updateSlot(role.slotKey, 'focal_y', fp.y)
                      }}
                      zoom={slotConfig.zoom ?? 1}
                      onChangeZoom={(z) => updateSlot(role.slotKey, 'zoom', z)}
                      fitMode={slotConfig.fit_mode || role.defaultFitMode || 'cover'}
                      onChangeFitMode={(m) => updateSlot(role.slotKey, 'fit_mode', m)}
                      targetAspectRatio={role.aspectRatio}
                      recommendedResolution={role.recommendedResolution}
                      slotLabel={role.name}
                      slotDescription={role.description}
                      previewType={
                        role.slotKey === 'homepage_hero_floating'
                          ? 'hero_shard'
                          : role.slotKey === 'catalog_card' || role.slotKey === 'coming_soon_catalog_card'
                          ? 'game_card'
                          : role.slotKey === 'showcase_card'
                          ? 'showcase_card'
                          : role.slotKey === 'logo'
                          ? 'square'
                          : 'banner'
                      }
                      onOpenMediaLibrary={() => setPickerSlot(role.slotKey)}
                    />
                  )
                })}
              </div>
            </Panel>
          </div>
        ) : (
          <div className="lg:col-span-3 p-12 text-center text-dim font-mono text-xs border border-white/10 rounded">
            No game selected.
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
   TOURNAMENTS ARTWORK SECTION (All, Featured, Upcoming)
   ========================================================================= */
function TournamentsArtworkSection({
  tournaments,
  onRefresh,
  showToast,
}: {
  tournaments: Tournament[]
  onRefresh: () => void
  showToast: (msg: string) => void
}) {
  const [filterMode, setFilterMode] = useState<'ALL' | 'FEATURED' | 'UPCOMING'>('ALL')
  const [search, setSearch] = useState('')
  const [selectedTourId, setSelectedTourId] = useState<string>(
    tournaments[0]?.id || tournaments[0]?.slug || ''
  )
  const [savingTourId, setSavingTourId] = useState<string | null>(null)
  const [pickerSlot, setPickerSlot] = useState<string | null>(null)

  const [tourMediaState, setTourMediaState] = useState<Record<string, any>>({})

  const filteredTournaments = useMemo(() => {
    return tournaments.filter((t) => {
      const isFeatured = Boolean(t.is_featured || (t as any).isFeatured)
      const isUpcoming = t.status === 'UPCOMING' || t.status === 'REGISTRATION_OPEN'

      let matchesFilter = true
      if (filterMode === 'FEATURED') matchesFilter = isFeatured
      else if (filterMode === 'UPCOMING') matchesFilter = isUpcoming

      const matchesSearch =
        !search.trim() ||
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        (t.slug && t.slug.toLowerCase().includes(search.toLowerCase()))

      return matchesFilter && matchesSearch
    })
  }, [tournaments, filterMode, search])

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
            asset_url: cfg.card?.asset_url ?? (selectedTournament.banner_url || ''),
            focal_x: cfg.card?.focal_x ?? 50,
            focal_y: cfg.card?.focal_y ?? 50,
            zoom: cfg.card?.zoom ?? 1,
            fit_mode: cfg.card?.fit_mode || 'cover',
          },
          hero: {
            asset_url: cfg.hero?.asset_url ?? (selectedTournament.hero_banner_url || selectedTournament.banner_url || ''),
            focal_x: cfg.hero?.focal_x ?? 50,
            focal_y: cfg.hero?.focal_y ?? 50,
            zoom: cfg.hero?.zoom ?? 1,
            fit_mode: cfg.hero?.fit_mode || 'cover',
          },
          featured_banner: {
            asset_url: cfg.featured_banner?.asset_url ?? (selectedTournament.banner_url || ''),
            focal_x: cfg.featured_banner?.focal_x ?? 50,
            focal_y: cfg.featured_banner?.focal_y ?? 50,
            zoom: cfg.featured_banner?.zoom ?? 1,
            fit_mode: cfg.featured_banner?.fit_mode || 'cover',
          },
          also_on_circuit: {
            asset_url: cfg.also_on_circuit?.asset_url ?? (selectedTournament.banner_url || ''),
            focal_x: cfg.also_on_circuit?.focal_x ?? 50,
            focal_y: cfg.also_on_circuit?.focal_y ?? 50,
            zoom: cfg.also_on_circuit?.zoom ?? 1,
            fit_mode: cfg.also_on_circuit?.fit_mode || 'cover',
          },
          upcoming_card: {
            asset_url: cfg.upcoming_card?.asset_url ?? (selectedTournament.banner_url || ''),
            focal_x: cfg.upcoming_card?.focal_x ?? 50,
            focal_y: cfg.upcoming_card?.focal_y ?? 50,
            zoom: cfg.upcoming_card?.zoom ?? 1,
            fit_mode: cfg.upcoming_card?.fit_mode || 'cover',
          },
          logo: {
            asset_url: cfg.logo?.asset_url ?? (selectedTournament.logo_url || ''),
          },
        },
      }))
    }
  }, [selectedTournament])

  const currentConfig = tourMediaState[currentTourId] || {
    card: { asset_url: selectedTournament?.media_config?.card?.asset_url ?? (selectedTournament?.banner_url || ''), focal_x: 50, focal_y: 50, zoom: 1, fit_mode: 'cover' },
    hero: { asset_url: selectedTournament?.media_config?.hero?.asset_url ?? (selectedTournament?.hero_banner_url || selectedTournament?.banner_url || ''), focal_x: 50, focal_y: 50, zoom: 1, fit_mode: 'cover' },
    featured_banner: { asset_url: selectedTournament?.media_config?.featured_banner?.asset_url ?? (selectedTournament?.banner_url || ''), focal_x: 50, focal_y: 50, zoom: 1, fit_mode: 'cover' },
    also_on_circuit: { asset_url: selectedTournament?.media_config?.also_on_circuit?.asset_url ?? (selectedTournament?.banner_url || ''), focal_x: 50, focal_y: 50, zoom: 1, fit_mode: 'cover' },
    upcoming_card: { asset_url: selectedTournament?.media_config?.upcoming_card?.asset_url ?? (selectedTournament?.banner_url || ''), focal_x: 50, focal_y: 50, zoom: 1, fit_mode: 'cover' },
    logo: { asset_url: selectedTournament?.media_config?.logo?.asset_url ?? (selectedTournament?.logo_url || '') },
  }

  const updateSlot = (slotKey: string, field: string, value: any) => {
    setTourMediaState((prev) => {
      const tourCopy = { ...(prev[currentTourId] || currentConfig) }
      tourCopy[slotKey] = { ...(tourCopy[slotKey] || {}), [field]: value }
      return { ...prev, [currentTourId]: tourCopy }
    })
  }

  const handleToggleFeatured = async () => {
    if (!selectedTournament) return
    const isFeat = Boolean(selectedTournament.is_featured || (selectedTournament as any).isFeatured)
    try {
      await updateTournamentOrganizer(currentTourId, {
        is_featured: !isFeat,
      })
      showToast(
        !isFeat
          ? `"${selectedTournament.title}" is now set as the Homepage Featured Tournament!`
          : `"${selectedTournament.title}" unmarked from featured.`
      )
      onRefresh()
    } catch (err: any) {
      alert(err.message || 'Failed to update featured status')
    }
  }

  const handleSaveTournamentMedia = async () => {
    if (!selectedTournament) return
    setSavingTourId(currentTourId)
    try {
      const cfg = tourMediaState[currentTourId] || currentConfig
      const newCard = cfg.card?.asset_url ?? ''
      const newHero = cfg.hero?.asset_url ?? ''
      const newLogo = cfg.logo?.asset_url ?? ''
      await updateTournamentOrganizer(currentTourId, {
        banner_url: newCard,
        hero_banner_url: newHero,
        logo_url: newLogo,
        media_config: cfg,
      })
      setTourMediaState((prev) => ({
        ...prev,
        [currentTourId]: { ...cfg },
      }))
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
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterMode('ALL')}
            className={`px-3.5 py-1.5 font-mono text-xs uppercase tracking-wider rounded transition-all cursor-pointer ${
              filterMode === 'ALL'
                ? 'bg-cyan text-void font-bold shadow-sm'
                : 'bg-surface/50 text-dim hover:text-ink border border-white/10'
            }`}
          >
            All Tournaments ({tournaments.length})
          </button>
          <button
            onClick={() => setFilterMode('FEATURED')}
            className={`px-3.5 py-1.5 font-mono text-xs uppercase tracking-wider rounded transition-all cursor-pointer ${
              filterMode === 'FEATURED'
                ? 'bg-cyan text-void font-bold shadow-sm'
                : 'bg-surface/50 text-dim hover:text-ink border border-white/10'
            }`}
          >
            Featured Tournaments ({tournaments.filter((t) => t.is_featured || (t as any).isFeatured).length})
          </button>
          <button
            onClick={() => setFilterMode('UPCOMING')}
            className={`px-3.5 py-1.5 font-mono text-xs uppercase tracking-wider rounded transition-all cursor-pointer ${
              filterMode === 'UPCOMING'
                ? 'bg-cyan text-void font-bold shadow-sm'
                : 'bg-surface/50 text-dim hover:text-ink border border-white/10'
            }`}
          >
            Upcoming Tournaments ({tournaments.filter((t) => t.status === 'UPCOMING' || t.status === 'REGISTRATION_OPEN').length})
          </button>
        </div>

        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-dim" />
          <input
            type="text"
            placeholder="Search tournaments by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface border border-white/15 pl-8 pr-3 py-1.5 font-mono text-xs text-ink rounded outline-none focus:border-cyan"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-2 max-h-[720px] overflow-y-auto pr-1">
          {filteredTournaments.length === 0 ? (
            <div className="p-6 text-center text-dim font-mono text-xs border border-white/10 rounded">
              No tournaments found in this view.
            </div>
          ) : (
            filteredTournaments.map((t) => {
              const isSelected = (t.id || t.slug) === currentTourId
              const isFeat = Boolean(t.is_featured || (t as any).isFeatured)
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
                    <div className="flex items-center gap-1.5">
                      <div className="font-display text-sm font-bold uppercase truncate">{t.title}</div>
                      {isFeat && <Star className="size-3 text-cyan fill-cyan shrink-0" />}
                    </div>
                    <div className="font-mono text-[10px] text-dim">{t.slug}</div>
                  </div>
                  <ChevronRight className={`size-4 shrink-0 ${isSelected ? 'text-cyan' : 'opacity-30'}`} />
                </div>
              )
            })
          )}
        </div>

        {selectedTournament ? (
          <div className="lg:col-span-3 space-y-6">
            <Panel className="p-6 space-y-6 border-white/10">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-2xl font-black uppercase text-ink">
                      {selectedTournament.title}
                    </h3>
                    <span className="font-mono text-[10px] text-cyan border border-cyan/30 px-1.5 py-0.5 uppercase">
                      {selectedTournament.status || 'ACTIVE'}
                    </span>
                    {Boolean(selectedTournament.is_featured || (selectedTournament as any).isFeatured) && (
                      <span className="font-mono text-[10px] bg-cyan/20 text-cyan border border-cyan/40 px-1.5 py-0.5 uppercase font-bold flex items-center gap-1">
                        <Star className="size-2.5 fill-cyan" /> Featured on Homepage
                      </span>
                    )}
                  </div>
                  <p className="font-mono text-xs text-dim mt-1">
                    Slug: <span className="text-white/80">{selectedTournament.slug}</span> · Prize Pool:{' '}
                    <span className="text-ok font-bold">
                      ₹{(selectedTournament.prize_pool_inr || 0).toLocaleString('en-IN')}
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleToggleFeatured}
                    type="button"
                    className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs font-bold uppercase rounded border transition-all cursor-pointer ${
                      selectedTournament.is_featured || (selectedTournament as any).isFeatured
                        ? 'border-cyan bg-cyan/20 text-cyan hover:bg-cyan/30'
                        : 'border-white/20 bg-white/5 text-dim hover:text-ink hover:border-white/30'
                    }`}
                  >
                    <Star className="size-3.5" />
                    {selectedTournament.is_featured || (selectedTournament as any).isFeatured
                      ? 'Featured'
                      : 'Mark as Featured'}
                  </button>

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

              {/* Render each canonical tournament role */}
              <div className="space-y-6">
                {TOURNAMENT_ARTWORK_ROLES.map((role) => {
                  const slotConfig = currentConfig[role.slotKey] || {}
                  return (
                    <CropFocalEditor
                      key={role.id}
                      roleSpec={role}
                      value={slotConfig.asset_url || ''}
                      onChangeAsset={(url) => updateSlot(role.slotKey, 'asset_url', url)}
                      focalPoint={{
                        x: slotConfig.focal_x ?? 50,
                        y: slotConfig.focal_y ?? 50,
                      }}
                      onChangeFocalPoint={(fp) => {
                        updateSlot(role.slotKey, 'focal_x', fp.x)
                        updateSlot(role.slotKey, 'focal_y', fp.y)
                      }}
                      zoom={slotConfig.zoom ?? 1}
                      onChangeZoom={(z) => updateSlot(role.slotKey, 'zoom', z)}
                      fitMode={slotConfig.fit_mode || role.defaultFitMode || 'cover'}
                      onChangeFitMode={(m) => updateSlot(role.slotKey, 'fit_mode', m)}
                      targetAspectRatio={role.aspectRatio}
                      recommendedResolution={role.recommendedResolution}
                      slotLabel={role.name}
                      slotDescription={role.description}
                      previewType={
                        role.slotKey === 'card' || role.slotKey === 'upcoming_card'
                          ? 'tournament_card'
                          : role.slotKey === 'logo'
                          ? 'square'
                          : 'banner'
                      }
                      onOpenMediaLibrary={() => setPickerSlot(role.slotKey)}
                    />
                  )
                })}
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
   MEDIA LIBRARY SECTION (Uploaded Database-Managed Assets & Permanent Deletion)
   ========================================================================= */
function MediaLibrarySection({ showToast }: { showToast: (msg: string) => void }) {
  const [items, setItems] = useState<MediaLibraryItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [entityFilter, setEntityFilter] = useState<'ALL' | 'game' | 'tournament'>('ALL')
  const [formatFilter, setFormatFilter] = useState<string>('ALL')
  const [isUploading, setIsUploading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [deletingItem, setDeletingItem] = useState<MediaLibraryItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchAssets = async () => {
    setLoading(true)
    try {
      const res = await listMediaFiles({
        search: search.trim() || undefined,
        entity_type: entityFilter !== 'ALL' ? entityFilter : undefined,
        content_type: formatFilter !== 'ALL' ? formatFilter : undefined,
        limit: 100,
      })
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
  }, [search, entityFilter, formatFilter])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      const res = await uploadMediaFile(file)
      if (res?.url) {
        showToast(`Image "${file.name}" uploaded successfully to Media Library!`)
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

  const handleConfirmDelete = async () => {
    if (!deletingItem) return
    setIsDeleting(true)
    try {
      await deleteMediaFile(deletingItem.id, true)
      showToast(`Asset "${deletingItem.filename}" was permanently deleted.`)
      setDeletingItem(null)
      fetchAssets()
    } catch (err: any) {
      alert(err.message || 'Failed to delete asset')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Panel className="p-6 space-y-6 border-white/10">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <FolderOpen className="size-5 text-cyan" />
            <h3 className="font-display text-2xl font-black uppercase text-ink">
              Platform Media Library ({total} Uploaded Assets)
            </h3>
          </div>
          <p className="font-mono text-xs text-dim mt-1">
            Global repository of uploaded assets registered in the database. Manage, reuse,
            inspect active references, and permanently delete assets with reference safety.
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

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Entity filter */}
          <div className="inline-flex rounded-sm border border-white/10 bg-surface/60 p-0.5">
            {[
              { id: 'ALL', label: 'All Assets' },
              { id: 'game', label: 'Game Artwork' },
              { id: 'tournament', label: 'Tournament Artwork' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setEntityFilter(f.id as any)}
                className={`px-3 py-1 font-mono text-xs uppercase tracking-wider rounded-xs transition-colors cursor-pointer ${
                  entityFilter === f.id ? 'bg-cyan text-void font-bold' : 'text-dim hover:text-ink'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Format filter */}
          <select
            value={formatFilter}
            onChange={(e) => setFormatFilter(e.target.value)}
            className="bg-surface border border-white/15 px-3 py-1.5 font-mono text-xs text-ink rounded outline-none focus:border-cyan"
          >
            <option value="ALL">All Formats</option>
            <option value="png">PNG</option>
            <option value="jpeg">JPEG / JPG</option>
            <option value="webp">WEBP</option>
            <option value="svg">SVG Vector</option>
          </select>
        </div>

        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-dim" />
          <input
            type="text"
            placeholder="Search by filename or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface border border-white/15 pl-9 pr-3 py-1.5 font-mono text-xs text-ink rounded outline-none focus:border-cyan"
          />
        </div>
      </div>

      {/* Assets Grid */}
      {loading ? (
        <div className="py-20 text-center font-mono text-xs text-dim animate-pulse">
          Loading media library assets...
        </div>
      ) : items.length === 0 ? (
        <div className="py-20 text-center text-dim font-mono text-xs border border-white/10 rounded">
          No media assets found matching the selected filters.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {items.map((item) => {
            const references = item.references || []
            const inUse = references.length > 0

            return (
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
                  {inUse ? (
                    <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-xs font-mono text-[9px] font-bold uppercase bg-emerald-500/90 text-white backdrop-blur-sm shadow">
                      In Use ({references.length})
                    </span>
                  ) : (
                    <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-xs font-mono text-[9px] font-bold uppercase bg-white/20 text-dim backdrop-blur-sm">
                      Unassigned
                    </span>
                  )}
                </div>

                <div className="p-3 border-t border-white/5 space-y-2">
                  <div className="font-mono text-xs text-ink font-semibold truncate" title={item.filename}>
                    {item.filename}
                  </div>

                  {/* Reference indicator */}
                  {inUse && (
                    <div className="space-y-0.5">
                      {references.slice(0, 2).map((ref, idx) => (
                        <div
                          key={idx}
                          className="font-mono text-[10px] text-cyan truncate flex items-center gap-1"
                          title={`${ref.entity_name} (${ref.role})`}
                        >
                          <span className="size-1 rounded-full bg-cyan shrink-0" />
                          <span className="truncate">{ref.entity_name}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between font-mono text-[10px] text-dim">
                    <span>{formatBytes(item.size)}</span>
                    <span>
                      {item.width && item.height
                        ? `${item.width}×${item.height}`
                        : item.content_type?.split('/')[1]?.toUpperCase() || 'IMG'}
                    </span>
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
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                    <a
                      href={resolveMediaUrl(item.url)}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 font-mono text-[10px] bg-white/5 hover:bg-white/10 text-dim hover:text-cyan border border-white/10 rounded transition-colors"
                      title="Open full image"
                    >
                      <ExternalLink className="size-3" />
                    </a>
                    <button
                      onClick={() => setDeletingItem(item)}
                      className="p-1 font-mono text-[10px] bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded transition-colors cursor-pointer"
                      title="Permanently Delete Asset"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Delete Confirmation Modal with Reference Safety Checking */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-surface border border-white/20 rounded-lg p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2.5 text-red-400 border-b border-white/10 pb-3">
              <AlertTriangle className="size-5 shrink-0" />
              <h4 className="font-display text-base font-bold uppercase text-ink">
                Permanent Asset Deletion
              </h4>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <p className="text-dim">
                Are you sure you want to permanently delete the image file{' '}
                <strong className="text-ink">"{deletingItem.filename}"</strong>?
              </p>

              {deletingItem.references && deletingItem.references.length > 0 ? (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded space-y-1 text-red-300">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="size-3.5" />
                    <span>This asset is currently in active use across {deletingItem.references.length} placement(s):</span>
                  </div>
                  <ul className="list-disc list-inside text-[11px] opacity-90 pl-1 space-y-0.5">
                    {deletingItem.references.map((r, i) => (
                      <li key={i}>
                        {r.entity_name} ({r.role})
                      </li>
                    ))}
                  </ul>
                  <p className="text-[10px] pt-1 text-white/70">
                    Confirming deletion will safely clear these references and permanently purge the binary file from database storage.
                  </p>
                </div>
              ) : (
                <div className="p-2.5 bg-white/5 border border-white/10 rounded text-dim text-[11px]">
                  ✓ This asset is unassigned. Deleting will permanently remove it from database storage.
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                disabled={isDeleting}
                className="px-3 py-1.5 font-mono text-xs uppercase bg-white/5 hover:bg-white/10 text-dim hover:text-ink border border-white/15 rounded cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-3.5 py-1.5 font-mono text-xs uppercase font-bold bg-red-600 hover:bg-red-500 text-white rounded cursor-pointer transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Permanent Deletion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Panel>
  )
}

/* =========================================================================
   MAIN MEDIA ARTWORK MANAGER COMPONENT (3 Primary Sections)
   ========================================================================= */
export function MediaArtworkManager({
  games,
  tournaments,
  onRefresh,
  showToast,
}: MediaArtworkManagerProps) {
  const [activeTab, setActiveTab] = useState<MainTab>('GAMES')

  return (
    <div className="mt-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="size-2.5 bg-cyan rounded-full animate-pulse" />
            <h2 className="font-display text-3xl font-black uppercase text-ink">
              Media & Artwork Manager
            </h2>
          </div>
          <p className="font-mono text-xs text-dim mt-1 max-w-3xl">
            Manage canonical artwork for Games and Tournaments across all frontend placements, or browse
            the database Media Library with reference tracking and safe permanent deletion.
          </p>
        </div>

        {/* Exactly 3 primary navigation sections as requested in Part B1 */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'GAMES', label: '1. Games', icon: Gamepad2 },
            { id: 'TOURNAMENTS', label: '2. Tournaments', icon: Trophy },
            { id: 'LIBRARY', label: '3. Media Library', icon: FolderOpen },
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as MainTab)}
                className={`flex items-center gap-2 px-4 py-2 font-mono text-xs uppercase tracking-wider rounded transition-all cursor-pointer ${
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
      {activeTab === 'GAMES' && (
        <GamesArtworkSection
          games={games}
          onRefresh={onRefresh}
          showToast={showToast}
        />
      )}

      {activeTab === 'TOURNAMENTS' && (
        <TournamentsArtworkSection
          tournaments={tournaments}
          onRefresh={onRefresh}
          showToast={showToast}
        />
      )}

      {activeTab === 'LIBRARY' && <MediaLibrarySection showToast={showToast} />}
    </div>
  )
}

export default MediaArtworkManager
