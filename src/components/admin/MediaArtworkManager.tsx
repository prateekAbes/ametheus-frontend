import { useState, useMemo } from 'react'
import { Link } from 'react-router'
import { Game } from '../../services/games'
import { Tournament } from '../../services/tournaments'
import { updateGame } from '../../services/admin'
import { updateTournamentOrganizer } from '../../services/organizer'
import { Panel, Hud, Badge } from '../ui'
import { BannerImageUploader } from './BannerImageUploader'

interface MediaArtworkManagerProps {
  games: Game[]
  tournaments: Tournament[]
  onRefresh: () => void
  showToast: (msg: string) => void
}

interface GameMediaState {
  poster_url: string
  banner_url: string
  logo_url: string
  banner_tablet_url: string
  banner_mobile_url: string
}

interface TournamentMediaState {
  banner_url: string
  hero_banner_url: string
  logo_url: string
  banner_tablet_url: string
  banner_mobile_url: string
}

function GameArtworkCard({
  game,
  onRefresh,
  showToast,
}: {
  game: Game
  onRefresh: () => void
  showToast: (msg: string) => void
}) {
  const [state, setState] = useState<GameMediaState>({
    poster_url: game.poster_url || '',
    banner_url: game.banner_url || '',
    logo_url: game.logo_url || '',
    banner_tablet_url: game.banner_tablet_url || '',
    banner_mobile_url: game.banner_mobile_url || '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [showOverrides, setShowOverrides] = useState(false)

  const hasChanges =
    state.poster_url !== (game.poster_url || '') ||
    state.banner_url !== (game.banner_url || '') ||
    state.logo_url !== (game.logo_url || '') ||
    state.banner_tablet_url !== (game.banner_tablet_url || '') ||
    state.banner_mobile_url !== (game.banner_mobile_url || '')

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateGame(game.id || game.slug, {
        poster_url: state.poster_url,
        banner_url: state.banner_url,
        logo_url: state.logo_url,
        banner_tablet_url: state.banner_tablet_url,
        banner_mobile_url: state.banner_mobile_url,
      })
      showToast(`Artwork for ${game.name} updated and persisted successfully!`)
      onRefresh()
    } catch (err: any) {
      alert(err.message || `Failed to update artwork for ${game.name}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Panel className="p-5 space-y-4 border-white/10 hover:border-white/20 transition-all">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-8 rounded-sm bg-void border border-white/15 overflow-hidden shrink-0 grid place-items-center">
            {state.logo_url ? (
              <img src={state.logo_url} alt="" className="size-full object-contain p-0.5" />
            ) : (
              <span className="font-mono text-xs text-dim">?</span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-xl font-black uppercase text-ink">{game.name}</h3>
              <span className="font-mono text-[10px] text-cyan border border-cyan/30 px-1.5 py-0.5 uppercase">
                {game.tag || 'ESPORTS'}
              </span>
            </div>
            <p className="font-mono text-[11px] text-dim">
              Slug: <span className="text-white/70">{game.slug}</span> · Platform:{' '}
              <span className="text-white/70">{game.platform || 'PC'}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to={`/games/${game.slug}`}
            target="_blank"
            className="font-mono text-[11px] text-cyan hover:underline uppercase tracking-wider"
          >
            ↗ View Game Page
          </Link>
          <button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className={`px-4 py-1.5 font-mono text-xs uppercase font-bold tracking-wider transition-all cursor-pointer ${
              hasChanges
                ? 'bg-cyan text-void hover:brightness-110 shadow-lg shadow-cyan/20'
                : 'border border-white/10 bg-surface/50 text-dim cursor-not-allowed'
            }`}
          >
            {isSaving ? 'Saving...' : hasChanges ? 'Save Artwork' : 'Saved'}
          </button>
        </div>
      </div>

      {/* Grid of 3 Main Slots */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Slot 1: Box Art / Poster (3:4 Portrait) */}
        <div className="border border-white/10 bg-surface/30 p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-cyan uppercase tracking-wider">
                1. Box Art / Poster
              </span>
              <span className="font-mono text-[10px] text-dim">3:4 Portrait</span>
            </div>
            <p className="text-[10px] text-dim mt-1">
              <strong>Target: 900×1200 px</strong>. Used for Homepage game tiles, Active Games (
              <code className="text-cyan/80">/games</code>), and catalog cards.
            </p>
          </div>
          <div className="mt-3">
            <BannerImageUploader
              label="Poster Image URL or Upload"
              recommendedRatio="3:4"
              recommendedRes="900x1200"
              value={state.poster_url}
              onChange={(val) => setState((prev) => ({ ...prev, poster_url: val }))}
            />
          </div>
        </div>

        {/* Slot 2: Widescreen Banner (16:9 Landscape) */}
        <div className="border border-white/10 bg-surface/30 p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-cyan uppercase tracking-wider">
                2. Widescreen Banner
              </span>
              <span className="font-mono text-[10px] text-dim">16:9 Landscape</span>
            </div>
            <p className="text-[10px] text-dim mt-1">
              <strong>Target: 1600×900 px</strong>. Used for Game Detail hero header (
              <code className="text-cyan/80">/games/:slug</code>) and floating shards.
            </p>
          </div>
          <div className="mt-3">
            <BannerImageUploader
              label="Banner Image URL or Upload"
              recommendedRatio="16:9"
              recommendedRes="1600x900"
              value={state.banner_url}
              onChange={(val) => setState((prev) => ({ ...prev, banner_url: val }))}
            />
          </div>
        </div>

        {/* Slot 3: Logo / Icon (1:1 Square) */}
        <div className="border border-white/10 bg-surface/30 p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-cyan uppercase tracking-wider">
                3. Logo / Emblem
              </span>
              <span className="font-mono text-[10px] text-dim">1:1 Square</span>
            </div>
            <p className="text-[10px] text-dim mt-1">
              <strong>Target: 256×256 px or SVG</strong>. Used for tournament game badges, team crest selector, and catalog icons.
            </p>
          </div>
          <div className="mt-3">
            <BannerImageUploader
              label="Icon Image URL or Upload"
              recommendedRatio="1:1"
              recommendedRes="256x256"
              value={state.logo_url}
              onChange={(val) => setState((prev) => ({ ...prev, logo_url: val }))}
            />
          </div>
        </div>
      </div>

      {/* Expandable Device Overrides */}
      <div className="border-t border-white/5 pt-2">
        <button
          type="button"
          onClick={() => setShowOverrides(!showOverrides)}
          className="font-mono text-[11px] uppercase tracking-wider text-dim hover:text-cyan flex items-center gap-1.5"
        >
          <span>{showOverrides ? '▼' : '▶'}</span>
          <span>Responsive Device Overrides (Optional Tablet 4:3 & Mobile 9:16)</span>
        </button>
        {showOverrides && (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-surface/20 border border-white/5">
            <div>
              <span className="font-mono text-[11px] text-dim">Tablet Banner (1600×1200 px · 4:3)</span>
              <BannerImageUploader
                label="Tablet Override"
                recommendedRatio="4:3"
                recommendedRes="1600x1200"
                value={state.banner_tablet_url}
                onChange={(val) => setState((prev) => ({ ...prev, banner_tablet_url: val }))}
              />
            </div>
            <div>
              <span className="font-mono text-[11px] text-dim">Mobile Banner (1080×1920 px · 9:16)</span>
              <BannerImageUploader
                label="Mobile Override"
                recommendedRatio="9:16"
                recommendedRes="1080x1920"
                value={state.banner_mobile_url}
                onChange={(val) => setState((prev) => ({ ...prev, banner_mobile_url: val }))}
              />
            </div>
          </div>
        )}
      </div>
    </Panel>
  )
}

function TournamentArtworkCard({
  tournament,
  onRefresh,
  showToast,
}: {
  tournament: Tournament
  onRefresh: () => void
  showToast: (msg: string) => void
}) {
  const [state, setState] = useState<TournamentMediaState>({
    banner_url: tournament.banner_url || '',
    hero_banner_url: tournament.hero_banner_url || '',
    logo_url: tournament.logo_url || '',
    banner_tablet_url: tournament.banner_tablet_url || '',
    banner_mobile_url: tournament.banner_mobile_url || '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [showOverrides, setShowOverrides] = useState(false)

  const hasChanges =
    state.banner_url !== (tournament.banner_url || '') ||
    state.hero_banner_url !== (tournament.hero_banner_url || '') ||
    state.logo_url !== (tournament.logo_url || '') ||
    state.banner_tablet_url !== (tournament.banner_tablet_url || '') ||
    state.banner_mobile_url !== (tournament.banner_mobile_url || '')

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateTournamentOrganizer(tournament.id || tournament.slug, {
        banner_url: state.banner_url,
        hero_banner_url: state.hero_banner_url,
        logo_url: state.logo_url,
        banner_tablet_url: state.banner_tablet_url,
        banner_mobile_url: state.banner_mobile_url,
      })
      showToast(`Artwork for tournament "${tournament.title}" updated and persisted!`)
      onRefresh()
    } catch (err: any) {
      alert(err.message || `Failed to update artwork for ${tournament.title}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Panel className="p-5 space-y-4 border-white/10 hover:border-white/20 transition-all">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-8 rounded-sm bg-void border border-white/15 overflow-hidden shrink-0 grid place-items-center">
            {state.logo_url ? (
              <img src={state.logo_url} alt="" className="size-full object-contain p-0.5" />
            ) : (
              <span className="font-mono text-xs text-dim">🏆</span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-xl font-black uppercase text-ink">{tournament.title}</h3>
              <span className="font-mono text-[10px] text-cyan border border-cyan/30 px-1.5 py-0.5 uppercase">
                {tournament.status || 'REGISTRATION_OPEN'}
              </span>
            </div>
            <p className="font-mono text-[11px] text-dim">
              Slug: <span className="text-white/70">{tournament.slug}</span> · Prize:{' '}
              <span className="text-ok font-bold">₹{(tournament.prize_pool_inr || 0).toLocaleString('en-IN')}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to={`/tournaments/${tournament.id || tournament.slug}`}
            target="_blank"
            className="font-mono text-[11px] text-cyan hover:underline uppercase tracking-wider"
          >
            ↗ View Tournament Page
          </Link>
          <button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className={`px-4 py-1.5 font-mono text-xs uppercase font-bold tracking-wider transition-all cursor-pointer ${
              hasChanges
                ? 'bg-cyan text-void hover:brightness-110 shadow-lg shadow-cyan/20'
                : 'border border-white/10 bg-surface/50 text-dim cursor-not-allowed'
            }`}
          >
            {isSaving ? 'Saving...' : hasChanges ? 'Save Artwork' : 'Saved'}
          </button>
        </div>
      </div>

      {/* Grid of Main Slots */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Slot 1: Tournament Card Artwork (16:9 Landscape) */}
        <div className="border border-white/10 bg-surface/30 p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-cyan uppercase tracking-wider">
                1. Listing Card Banner
              </span>
              <span className="font-mono text-[10px] text-dim">16:9 Landscape</span>
            </div>
            <p className="text-[10px] text-dim mt-1">
              <strong>Target: 1600×900 px</strong>. Used for cards on{' '}
              <code className="text-cyan/80">/tournaments</code>, Homepage upcoming tournaments, and featured listings.
            </p>
          </div>
          <div className="mt-3">
            <BannerImageUploader
              label="Card Banner URL or Upload"
              recommendedRatio="16:9"
              recommendedRes="1600x900"
              value={state.banner_url}
              onChange={(val) => setState((prev) => ({ ...prev, banner_url: val }))}
            />
          </div>
        </div>

        {/* Slot 2: Detail Page Panoramic Hero Header (1920x820) */}
        <div className="border border-white/10 bg-surface/30 p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-cyan uppercase tracking-wider">
                2. Detail Panoramic Hero
              </span>
              <span className="font-mono text-[10px] text-dim">~2.34:1 Hero</span>
            </div>
            <p className="text-[10px] text-dim mt-1">
              <strong>Target: 1920×820 px</strong>. Used as the main hero background banner on the Tournament Detail page (
              <code className="text-cyan/80">/tournaments/:id</code>).
            </p>
          </div>
          <div className="mt-3">
            <BannerImageUploader
              label="Hero Header URL or Upload"
              recommendedRatio="universal"
              recommendedRes="1920x820"
              value={state.hero_banner_url}
              onChange={(val) => setState((prev) => ({ ...prev, hero_banner_url: val }))}
            />
          </div>
        </div>

        {/* Slot 3: Tournament Logo / Crest */}
        <div className="border border-white/10 bg-surface/30 p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-cyan uppercase tracking-wider">
                3. Tournament Crest / Logo
              </span>
              <span className="font-mono text-[10px] text-dim">1:1 Square</span>
            </div>
            <p className="text-[10px] text-dim mt-1">
              <strong>Target: 256×256 px or SVG</strong>. Used for bracket match headers, registration badge, and tournament crests.
            </p>
          </div>
          <div className="mt-3">
            <BannerImageUploader
              label="Crest URL or Upload"
              recommendedRatio="1:1"
              recommendedRes="256x256"
              value={state.logo_url}
              onChange={(val) => setState((prev) => ({ ...prev, logo_url: val }))}
            />
          </div>
        </div>
      </div>

      {/* Expandable Device Overrides */}
      <div className="border-t border-white/5 pt-2">
        <button
          type="button"
          onClick={() => setShowOverrides(!showOverrides)}
          className="font-mono text-[11px] uppercase tracking-wider text-dim hover:text-cyan flex items-center gap-1.5"
        >
          <span>{showOverrides ? '▼' : '▶'}</span>
          <span>Responsive Device Overrides (Optional Tablet 4:3 & Mobile 9:16)</span>
        </button>
        {showOverrides && (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-surface/20 border border-white/5">
            <div>
              <span className="font-mono text-[11px] text-dim">Tablet Banner (1600×1200 px · 4:3)</span>
              <BannerImageUploader
                label="Tablet Override"
                recommendedRatio="4:3"
                recommendedRes="1600x1200"
                value={state.banner_tablet_url}
                onChange={(val) => setState((prev) => ({ ...prev, banner_tablet_url: val }))}
              />
            </div>
            <div>
              <span className="font-mono text-[11px] text-dim">Mobile Story Banner (1080×1920 px · 9:16)</span>
              <BannerImageUploader
                label="Mobile Story Override"
                recommendedRatio="9:16"
                recommendedRes="1080x1920"
                value={state.banner_mobile_url}
                onChange={(val) => setState((prev) => ({ ...prev, banner_mobile_url: val }))}
              />
            </div>
          </div>
        )}
      </div>
    </Panel>
  )
}

export function MediaArtworkManager({
  games,
  tournaments,
  onRefresh,
  showToast,
}: MediaArtworkManagerProps) {
  const [filterType, setFilterType] = useState<'ALL' | 'GAMES' | 'TOURNAMENTS' | 'SPECS'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredGames = useMemo(() => {
    if (!searchQuery.trim()) return games
    const q = searchQuery.toLowerCase()
    return games.filter(
      (g) => g.name.toLowerCase().includes(q) || g.slug.toLowerCase().includes(q)
    )
  }, [games, searchQuery])

  const filteredTournaments = useMemo(() => {
    if (!searchQuery.trim()) return tournaments
    const q = searchQuery.toLowerCase()
    return tournaments.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.slug && t.slug.toLowerCase().includes(q))
    )
  }, [tournaments, searchQuery])

  return (
    <div className="mt-8 space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="size-2.5 bg-cyan rounded-full animate-pulse" />
            <h2 className="font-display text-3xl font-black uppercase text-ink">
              Media & Artwork Manager
            </h2>
          </div>
          <p className="text-xs text-dim mt-1 max-w-2xl">
            Centralized dynamic asset controller for all game titles, catalog box art, widescreen
            headers, tournament cards, and panoramic detail heroes. Uploaded assets are persisted in
            the database without hardcoded paths.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(['ALL', 'GAMES', 'TOURNAMENTS', 'SPECS'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterType(mode)}
              className={`px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-all cursor-pointer ${
                filterType === mode
                  ? 'border border-cyan bg-cyan text-void font-bold'
                  : 'border border-white/15 bg-surface/50 text-dim hover:text-ink hover:border-white/30'
              }`}
            >
              {mode === 'ALL'
                ? `All (${games.length + tournaments.length})`
                : mode === 'GAMES'
                ? `Games (${games.length})`
                : mode === 'TOURNAMENTS'
                ? `Tournaments (${tournaments.length})`
                : 'Artwork Specs'}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      {filterType !== 'SPECS' && (
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search titles or slugs (e.g. valorant, ascent, bgmi)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 max-w-md border border-white/15 bg-surface p-2.5 font-mono text-xs text-ink outline-none focus:border-cyan"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="font-mono text-xs text-dim hover:text-cyan uppercase cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* SPECS & GUIDELINES TAB */}
      {filterType === 'SPECS' && (
        <Panel className="p-6 space-y-6 border-cyan/30 bg-cyan/[0.02]">
          <div className="border-b border-white/10 pb-4">
            <h3 className="font-display text-2xl font-black uppercase text-cyan">
              Ametheus Artwork Specification Manifest
            </h3>
            <p className="text-xs text-dim mt-1">
              All images uploaded through the Admin Panel are automatically validated, stored permanently in the MongoDB media store, and served via fast streaming endpoints.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border border-white/10">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-cyan uppercase">
                  <th className="p-3">#</th>
                  <th className="p-3">Component / Usage</th>
                  <th className="p-3">Database Field</th>
                  <th className="p-3">Dimensions</th>
                  <th className="p-3">Aspect Ratio</th>
                  <th className="p-3">Where It Renders</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-dim">
                <tr className="hover:bg-white/[0.02]">
                  <td className="p-3 text-white font-bold">1</td>
                  <td className="p-3 text-ink font-bold">Game Box Art / Poster</td>
                  <td className="p-3 text-cyan">Game.poster_url</td>
                  <td className="p-3">900 × 1200 px</td>
                  <td className="p-3">3:4 / 4:5 Portrait</td>
                  <td className="p-3">Homepage game tiles, Active Games (/games), Catalog cards</td>
                </tr>
                <tr className="hover:bg-white/[0.02]">
                  <td className="p-3 text-white font-bold">2</td>
                  <td className="p-3 text-ink font-bold">Game Widescreen Banner</td>
                  <td className="p-3 text-cyan">Game.banner_url</td>
                  <td className="p-3">1600 × 900 px</td>
                  <td className="p-3">16:9 Widescreen</td>
                  <td className="p-3">Game Detail Hero Header (/games/:slug), floating shards</td>
                </tr>
                <tr className="hover:bg-white/[0.02]">
                  <td className="p-3 text-white font-bold">3</td>
                  <td className="p-3 text-ink font-bold">Game Logo / Emblem</td>
                  <td className="p-3 text-cyan">Game.logo_url</td>
                  <td className="p-3">256 × 256 px or SVG</td>
                  <td className="p-3">1:1 Square</td>
                  <td className="p-3">Tournament badges, team crest selector, search dropdowns</td>
                </tr>
                <tr className="hover:bg-white/[0.02]">
                  <td className="p-3 text-white font-bold">4</td>
                  <td className="p-3 text-ink font-bold">Tournament Listing Card</td>
                  <td className="p-3 text-cyan">Tournament.banner_url</td>
                  <td className="p-3">1600 × 900 px</td>
                  <td className="p-3">16:9 Landscape</td>
                  <td className="p-3">Tournament cards on /tournaments, homepage upcoming, featured cards</td>
                </tr>
                <tr className="hover:bg-white/[0.02]">
                  <td className="p-3 text-white font-bold">5</td>
                  <td className="p-3 text-ink font-bold">Tournament Detail Hero Header</td>
                  <td className="p-3 text-cyan">Tournament.hero_banner_url</td>
                  <td className="p-3">1920 × 820 px</td>
                  <td className="p-3">~2.34:1 Panoramic</td>
                  <td className="p-3">Large immersive hero background banner on /tournaments/:id</td>
                </tr>
                <tr className="hover:bg-white/[0.02]">
                  <td className="p-3 text-white font-bold">6</td>
                  <td className="p-3 text-ink font-bold">Tournament Mobile Story Hero</td>
                  <td className="p-3 text-cyan">Tournament.banner_mobile_url</td>
                  <td className="p-3">1080 × 1920 px</td>
                  <td className="p-3">9:16 Vertical</td>
                  <td className="p-3">Mobile screen layout for /tournaments/:id</td>
                </tr>
                <tr className="hover:bg-white/[0.02]">
                  <td className="p-3 text-white font-bold">7</td>
                  <td className="p-3 text-ink font-bold">Tournament Crest / Icon</td>
                  <td className="p-3 text-cyan">Tournament.logo_url</td>
                  <td className="p-3">256 × 256 px</td>
                  <td className="p-3">1:1 Square</td>
                  <td className="p-3">Bracket match badges, registration badges, tournament crest</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {/* GAMES SECTION */}
      {(filterType === 'ALL' || filterType === 'GAMES') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h3 className="font-display text-2xl font-black uppercase text-cyan">
              Game Titles Artwork ({filteredGames.length})
            </h3>
            <span className="font-mono text-xs text-dim">
              Portrait Posters (3:4) & Widescreen Banners (16:9)
            </span>
          </div>

          {filteredGames.length === 0 ? (
            <div className="p-8 text-center border border-white/10 bg-surface/30 text-dim font-mono text-xs">
              No game titles match "{searchQuery}"
            </div>
          ) : (
            filteredGames.map((g) => (
              <GameArtworkCard
                key={g.id || g.slug}
                game={g}
                onRefresh={onRefresh}
                showToast={showToast}
              />
            ))
          )}
        </div>
      )}

      {/* TOURNAMENTS SECTION */}
      {(filterType === 'ALL' || filterType === 'TOURNAMENTS') && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h3 className="font-display text-2xl font-black uppercase text-cyan">
              Tournament Artwork ({filteredTournaments.length})
            </h3>
            <span className="font-mono text-xs text-dim">
              Listing Cards (16:9) & Panoramic Detail Heroes (1920×820)
            </span>
          </div>

          {filteredTournaments.length === 0 ? (
            <div className="p-8 text-center border border-white/10 bg-surface/30 text-dim font-mono text-xs">
              No tournaments match "{searchQuery}"
            </div>
          ) : (
            filteredTournaments.map((t) => (
              <TournamentArtworkCard
                key={t.id || t.slug}
                tournament={t}
                onRefresh={onRefresh}
                showToast={showToast}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}
