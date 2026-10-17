import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { getGames, Game as ApiGame, normalizeGame } from '../services/games'
import { getGenres, type Genre } from '../services/genres'
import { GameCardSkeleton } from '../components/Skeleton'
import { type CatalogGame } from '../lib/data'
import { AdaptiveGrid, GameCard } from '../components/kit'
import { Hud, PageHero, Container, SectionHead } from '../components/ui'

const GENRE_ACCENTS: Record<string, string> = {
  'battle-royale': '#ffb547',
  'tactical-fps': '#ff4655',
  strategy: '#3ef2ff',
  sports: '#2f8cff',
  fighting: '#ff5ca8',
}

function getGenreAccent(genre: Genre, index: number): string {
  const slug = (genre.slug || '').toLowerCase()
  for (const [key, color] of Object.entries(GENRE_ACCENTS)) {
    if (slug.includes(key)) return color
  }
  const palette = ['#3ef2ff', '#ffb547', '#ff4655', '#8b5cff', '#00f0ff', '#ffaa00']
  return palette[index % palette.length]
}

export default function Games() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialGenre = searchParams.get('genre') || 'ALL'

  const [apiGames, setApiGames] = useState<ApiGame[]>([])
  const [genres, setGenres] = useState<Genre[]>([])
  const [selectedGenre, setSelectedGenre] = useState<string>(initialGenre)
  const [activeGenreIndex, setActiveGenreIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  // Sync selectedGenre if URL searchParams changes
  useEffect(() => {
    const gParam = searchParams.get('genre')
    if (gParam) {
      setSelectedGenre(gParam)
    } else {
      setSelectedGenre('ALL')
    }
  }, [searchParams])

  // Fetch games and genres directly from backend database
  useEffect(() => {
    let isMounted = true
    Promise.all([
      getGames().catch(() => []),
      getGenres().catch(() => []),
    ]).then(([gamesRes, genresRes]) => {
      if (!isMounted) return
      if (Array.isArray(gamesRes)) setApiGames(gamesRes)
      if (Array.isArray(genresRes)) setGenres(genresRes)
      setLoading(false)
    })

    return () => {
      isMounted = false
    }
  }, [])

  // Active individual games strictly from backend database
  const activeGamesCatalog: (CatalogGame & { genreId?: string; genreName?: string })[] = useMemo(() => {
    return apiGames
      .filter((g) => {
        const s = ((g as any).status || '').toUpperCase()
        return s !== 'COMING_SOON' && s !== 'SOON'
      })
      .map((g) => {
        const norm = normalizeGame(g as any)
        return {
          slug: norm.slug,
          short: norm.tag || norm.name,
          name: norm.name,
          genre: norm.genreName || norm.category || 'Esports',
          platform: norm.platform || 'Cross-Platform',
          accent: norm.accentColor || '#3ef2ff',
          photo: '',
          status: 'active' as const,
          tournaments: 0,
          genreId: norm.genreId,
          genreName: norm.genreName,
          mediaConfig: norm.mediaConfig,
          media_config: norm.media_config,
        }
      })
  }, [apiGames])

  // Coming soon individual games strictly from backend database
  const comingSoonGamesCatalog: CatalogGame[] = useMemo(() => {
    return apiGames
      .filter((g) => {
        const s = ((g as any).status || '').toUpperCase()
        return s === 'COMING_SOON' || s === 'SOON'
      })
      .map((g) => {
        const norm = normalizeGame(g as any)
        return {
          slug: norm.slug,
          short: norm.tag || norm.name,
          name: norm.name,
          genre: norm.genreName || norm.category || 'Esports',
          platform: norm.platform || 'Multi-platform',
          accent: norm.accentColor || '#8b5cff',
          photo: '',
          status: 'soon' as const,
          tournaments: 0,
          mediaConfig: norm.mediaConfig,
          media_config: norm.media_config,
        }
      })
  }, [apiGames])

  // Map of active games for each genre (strictly excluding Coming Soon games)
  const genreActiveGamesMap = useMemo(() => {
    const map = new Map<string, typeof activeGamesCatalog>()

    genres.forEach((gn) => {
      const genreGameSlugs = new Set((gn.games || []).map((g) => (g.slug || '').toLowerCase()))
      const genreGameTitles = new Set((gn.games || []).map((g) => (g.title || '').toLowerCase()))
      const targetSlug = (gn.slug || '').toLowerCase()
      const targetName = (gn.name || '').toLowerCase()
      const targetId = (gn.id || (gn as any)._id || '').toLowerCase()

      const matches = activeGamesCatalog.filter((g) => {
        const gSlug = (g.slug || '').toLowerCase()
        const gName = (g.name || '').toLowerCase()
        const gGenre = (g.genre || '').toLowerCase()
        const gGenreId = (g.genreId || '').toLowerCase()

        if (targetId && gGenreId === targetId) return true
        if (genreGameSlugs.has(gSlug) || genreGameTitles.has(gName)) return true
        if (targetSlug && (gGenre === targetSlug || gGenre.includes(targetSlug) || targetSlug.includes(gGenre))) return true
        if (targetName && (gGenre === targetName || gGenre.includes(targetName) || targetName.includes(gGenre))) return true
        return false
      })

      const key = gn.slug || gn.id || gn.name
      map.set(key, matches)
    })

    return map
  }, [genres, activeGamesCatalog])

  // Selected Genre Object
  const selectedGenreObj = useMemo(() => {
    if (selectedGenre === 'ALL') return null
    return (
      genres.find(
        (gn) =>
          gn.slug?.toLowerCase() === selectedGenre.toLowerCase() ||
          gn.id === selectedGenre ||
          (gn as any)._id === selectedGenre
      ) || null
    )
  }, [genres, selectedGenre])

  // Strictly matching active games for selected genre without any fallback or backfill
  const matchingGenreGames = useMemo(() => {
    if (!selectedGenreObj) return []
    const key = selectedGenreObj.slug || selectedGenreObj.id || selectedGenreObj.name
    return genreActiveGamesMap.get(key) || []
  }, [selectedGenreObj, genreActiveGamesMap])

  return (
    <>
      <PageHero
        title={<>Explore<br />Games</>}
        variant="games"
        accent="#8b5cff"
      />

      {/* DEDICATED SUB-PAGE / SUB-PANEL: Rendered when a genre is selected */}
      {selectedGenre !== 'ALL' && selectedGenreObj ? (
        <section className="py-16 md:py-24 min-h-[60vh]" id="genre-subpage">
          <Container>
            {/* Navigation & Header */}
            <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6 border-b border-white/10 pb-6">
              <div>
                <button
                  onClick={() => {
                    setSelectedGenre('ALL')
                    searchParams.delete('genre')
                    setSearchParams(searchParams)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  className="mb-4 inline-flex items-center gap-2 border border-white/20 bg-surface/60 px-4 py-2 font-mono text-xs uppercase tracking-wider text-ink hover:border-cyan hover:text-cyan transition-colors cursor-pointer"
                >
                  <span>←</span>
                  <span>Back to All Games</span>
                </button>
                <div className="flex items-center gap-3">
                  <Hud className="text-cyan font-bold">ACTIVE COMPETITIVE DISCIPLINE</Hud>
                  <span className="font-mono text-xs text-dim">·</span>
                  <span className="font-mono text-xs text-dim uppercase">
                    {matchingGenreGames.length} {matchingGenreGames.length === 1 ? 'Active Game' : 'Active Games'}
                  </span>
                </div>
                <h1 className="mt-2 font-display text-4xl sm:text-6xl lg:text-7xl font-black uppercase leading-tight text-ink">
                  {selectedGenreObj.name} <span className="text-cyan">Games</span>
                </h1>
                <p className="mt-2 max-w-2xl text-sm md:text-base text-ink/70">
                  {selectedGenreObj.description || 'Official competitive titles registered in this discipline.'}
                </p>
              </div>

              <button
                onClick={() => {
                  setSelectedGenre('ALL')
                  searchParams.delete('genre')
                  setSearchParams(searchParams)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="shrink-0 font-mono text-xs uppercase text-dim hover:text-white underline cursor-pointer"
              >
                Clear Filter (Show All {activeGamesCatalog.length} Games)
              </button>
            </div>

            {/* NORMAL-SIZED Game Cards Grid or Strict Empty State */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {[1, 2, 3, 4].map((n) => (
                  <GameCardSkeleton key={n} />
                ))}
              </div>
            ) : matchingGenreGames.length === 0 ? (
              <div className="border border-white/10 bg-surface/30 p-16 text-center max-w-2xl mx-auto">
                <Hud className="text-cyan text-sm">No active games available in this genre yet.</Hud>
                <p className="mt-2 font-mono text-sm text-dim">
                  There are currently no active competitive titles registered under the {selectedGenreObj.name} discipline.
                </p>
                <button
                  onClick={() => {
                    setSelectedGenre('ALL')
                    searchParams.delete('genre')
                    setSearchParams(searchParams)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  className="mt-6 border border-cyan/40 bg-cyan/10 px-5 py-2.5 font-mono text-xs uppercase font-bold text-cyan hover:bg-cyan/20 transition-colors cursor-pointer"
                >
                  ← Back to All Games
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {matchingGenreGames.map((g, i) => (
                  <div key={g.slug} className="in-view w-full">
                    <GameCard g={g} i={i} />
                  </div>
                ))}
              </div>
            )}
          </Container>
        </section>
      ) : (
        /* MAIN GAMES FRONT PAGE VIEW: Disciplines Accordion + Active Games + Coming Soon */
        <>
          {/* Canonical Disciplines / Genres Accordion Hub */}
          {genres.length > 0 && (
            <section className="py-12 md:py-20 border-b border-white/10" id="genres-hub">
              <Container>
                <div className="mb-8">
                  <SectionHead
                    title="Games"
                    sub="Explore official esports battlegrounds grouped by discipline. Select any discipline to inspect registered games."
                  />
                </div>

                {/* Expanding Accordion: Hover or focus expands card */}
                <div className="flex flex-col gap-3 lg:h-[540px] lg:flex-row">
                  {genres.map((gn, i) => {
                    const isFocused = activeGenreIndex === i
                    const accent = getGenreAccent(gn, i)
                    const activeGamesForGenre = genreActiveGamesMap.get(gn.slug || gn.id || gn.name) || []

                    return (
                      <div
                        key={gn.id || gn.slug || i}
                        onMouseEnter={() => setActiveGenreIndex(i)}
                        onFocus={() => setActiveGenreIndex(i)}
                        onClick={() => setActiveGenreIndex(i)}
                        className={`group relative min-h-[380px] overflow-hidden border transition-[flex-grow,border-color] duration-700 ease-[cubic-bezier(.2,.7,.1,1)] cursor-pointer lg:min-h-0 ${
                          isFocused
                            ? 'lg:flex-[4] border-cyan/70 bg-surface/80'
                            : 'lg:flex-[1] border-white/10 bg-surface/40 hover:border-white/25'
                        }`}
                        style={{ borderColor: isFocused ? accent + 'aa' : undefined }}
                      >
                        {/* Ambient Discipline Background: Clean esports gradients and ambient glows */}
                        <div
                          className="absolute inset-0 transition-opacity duration-700"
                          style={{
                            background: `radial-gradient(circle at 75% 25%, ${accent}25, transparent 65%), radial-gradient(circle at 20% 80%, ${accent}18, transparent 60%), linear-gradient(135deg, #090a14 0%, #0d0f1a 50%, #161828 100%)`,
                            opacity: isFocused ? 0.75 : 0.45,
                          }}
                        />

                        {/* Subtle Grid / Circuit Overlay */}
                        <div
                          className="absolute inset-0 opacity-[0.04] pointer-events-none"
                          style={{
                            backgroundImage: `linear-gradient(${accent} 1px, transparent 1px), linear-gradient(90deg, ${accent} 1px, transparent 1px)`,
                            backgroundSize: '24px 24px',
                          }}
                        />

                        {/* Gradient Overlays */}
                        <div
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            background: `linear-gradient(to top, #05060a 20%, rgba(5,6,10,0.7) 60%, rgba(5,6,10,0.3) 100%), radial-gradient(ellipse at 0% 100%, ${accent}45, transparent 65%)`,
                          }}
                        />

                        {/* Top HUD: Index number and title count */}
                        <div className="absolute left-5 top-5 right-5 flex items-center justify-between gap-3 z-10 pointer-events-none">
                          <div className="flex items-center gap-2">
                            <Hud className="text-ink font-bold">0{i + 1}</Hud>
                            <span className="font-mono text-[10px] uppercase tracking-wider text-dim">
                              {activeGamesForGenre.length} {activeGamesForGenre.length === 1 ? 'Active Game' : 'Active Games'}
                            </span>
                          </div>
                        </div>

                        {/* Focused Content Area */}
                        <div
                          className={`absolute inset-x-0 bottom-0 p-6 md:p-10 transition-all duration-500 z-10 ${
                            isFocused
                              ? 'opacity-100 translate-y-0 pointer-events-auto'
                              : 'opacity-0 translate-y-6 pointer-events-none'
                          }`}
                        >
                          <Hud className="block text-cyan uppercase tracking-widest text-xs">
                            {activeGamesForGenre.length} Active Competitive {activeGamesForGenre.length === 1 ? 'Title' : 'Titles'}
                          </Hud>
                          <h2 className="mt-2 font-display text-5xl md:text-7xl xl:text-8xl font-black uppercase leading-[0.85] text-ink">
                            {gn.name}
                          </h2>
                          <p className="mt-3 max-w-xl text-sm md:text-base text-ink/80 leading-relaxed font-sans">
                            {gn.description || 'Official competitive esports category and tournament battlegrounds.'}
                          </p>

                          {/* Connected Active Games badges */}
                          {activeGamesForGenre.length > 0 && (
                            <div className="mt-5 flex flex-wrap items-center gap-2">
                              <span className="font-mono text-[11px] text-dim uppercase tracking-wider">Active Games:</span>
                              {activeGamesForGenre.map((cg) => (
                                <span
                                  key={cg.slug}
                                  className="border border-white/15 bg-void/70 px-2.5 py-1 font-mono text-xs text-ink/90 backdrop-blur-sm"
                                >
                                  {cg.name}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Action button to open dedicated sub-panel */}
                          <div className="mt-7 flex flex-wrap items-center gap-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedGenre(gn.slug)
                                searchParams.set('genre', gn.slug)
                                setSearchParams(searchParams)
                                window.scrollTo({ top: 0, behavior: 'smooth' })
                              }}
                              className="px-5 py-2.5 font-mono text-xs uppercase tracking-wider font-bold transition-all cursor-pointer flex items-center gap-2 border border-cyan bg-cyan text-void hover:brightness-110 shadow-[0_0_16px_rgba(62,242,255,0.4)]"
                            >
                              <span>Explore {gn.name} Games</span>
                              <span>→</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Container>
            </section>
          )}

          {/* Subsection 1: Active Games (Direct Catalog from DB) */}
          <section className="py-16 md:py-24" id="active-games">
            <Container>
              <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                <SectionHead
                  title={<>Active <span className="text-cyan">Games</span></>}
                  sub="Direct access to every active competitive game. Enter world to browse tournament brackets, rules, and squads."
                />
              </div>

              {loading ? (
                <AdaptiveGrid count={4} min={280}>
                  {[1, 2, 3, 4].map((n) => (
                    <GameCardSkeleton key={n} />
                  ))}
                </AdaptiveGrid>
              ) : activeGamesCatalog.length === 0 ? (
                <div className="border border-white/10 bg-surface/30 p-16 text-center">
                  <Hud className="text-cyan">No Active Games</Hud>
                  <p className="mt-2 font-mono text-sm text-dim">
                    No active competitive titles are currently registered in the database.
                  </p>
                </div>
              ) : (
                <AdaptiveGrid count={activeGamesCatalog.length} min={280}>
                  {activeGamesCatalog.map((g, i) => (
                    <div key={g.slug} className="in-view">
                      <GameCard g={g} i={i} />
                    </div>
                  ))}
                </AdaptiveGrid>
              )}
            </Container>
          </section>

          {/* Subsection 2: Coming Soon Games (Strictly from DB) */}
          {comingSoonGamesCatalog.length > 0 && (
            <section className="in-view border-t border-white/10 bg-graphite/40 py-20 pb-32 md:pb-40" id="coming-soon-games">
              <Container>
                <SectionHead
                  title={<span className="outline-text">Coming soon</span>}
                  size="md"
                  sub="New esports battlegrounds unlocking soon. Follow the community discord to get notified when registrations open."
                />
                <AdaptiveGrid count={comingSoonGamesCatalog.length} min={240} className="mt-12">
                  {comingSoonGamesCatalog.map((g, i) => (
                    <div key={g.slug} className="in-view">
                      <GameCard g={g} i={i} />
                    </div>
                  ))}
                </AdaptiveGrid>
              </Container>
            </section>
          )}
        </>
      )}
    </>
  )
}
