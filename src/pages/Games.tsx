import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router'
import { getGames, Game as ApiGame, normalizeGame } from '../services/games'
import { getGenres, type Genre } from '../services/genres'
import { resolveMediaUrl } from '../services/apiClient'
import { GameCardSkeleton } from '../components/Skeleton'
import { type CatalogGame } from '../lib/data'
import { AdaptiveGrid, GameCard } from '../components/kit'
import { Hud, PageHero, Container, SectionHead } from '../components/ui'
import DynamicImage from '../components/DynamicImage'

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
  const [apiGames, setApiGames] = useState<ApiGame[]>([])
  const [genres, setGenres] = useState<Genre[]>([])
  const [selectedGenre, setSelectedGenre] = useState<string>('ALL')
  const [activeGenreIndex, setActiveGenreIndex] = useState(0)
  const [loading, setLoading] = useState(true)

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
          photo: norm.bannerUrl || norm.logoUrl || '',
          status: 'active' as const,
          tournaments: 0,
          genreId: norm.genreId,
          genreName: norm.genreName,
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
          photo: norm.bannerUrl || norm.logoUrl || '',
          status: 'soon' as const,
          tournaments: 0,
        }
      })
  }, [apiGames])

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

  // Strictly matching games for selected genre without any fallback or backfill
  const matchingGenreGames = useMemo(() => {
    if (!selectedGenreObj) return []

    const genreGameSlugs = new Set((selectedGenreObj.games || []).map((g) => (g.slug || '').toLowerCase()))
    const genreGameTitles = new Set((selectedGenreObj.games || []).map((g) => (g.title || '').toLowerCase()))
    const targetSlug = (selectedGenreObj.slug || '').toLowerCase()
    const targetName = (selectedGenreObj.name || '').toLowerCase()

    return activeGamesCatalog.filter((g) => {
      const gSlug = (g.slug || '').toLowerCase()
      const gName = (g.name || '').toLowerCase()
      const gGenre = (g.genre || '').toLowerCase()
      const gGenreId = (g.genreId || '').toLowerCase()

      if (selectedGenreObj.id && gGenreId === selectedGenreObj.id.toLowerCase()) return true
      if (genreGameSlugs.has(gSlug) || genreGameTitles.has(gName)) return true
      if (targetSlug && (gGenre === targetSlug || gGenre.includes(targetSlug) || targetSlug.includes(gGenre))) return true
      if (targetName && (gGenre === targetName || gGenre.includes(targetName) || targetName.includes(gGenre))) return true
      return false
    })
  }, [activeGamesCatalog, selectedGenreObj])

  return (
    <>
      <PageHero
        kicker={`${String(activeGamesCatalog.length).padStart(2, '0')} live worlds`}
        title={<>Explore<br />Games</>}
        sub="CHOOSE YOUR BATTLEGROUND. Master your mechanics, build a roster, and climb the competitive ladder."
        variant="games"
        accent="#8b5cff"
      />

      {/* DEDICATED SUB-PAGE / SUB-PANEL: Rendered when a genre is selected */}
      {selectedGenre !== 'ALL' && selectedGenreObj ? (
        <section className="py-16 md:py-24 min-h-[60vh]" id="genre-subpanel">
          <Container>
            {/* Navigation & Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6 border-b border-white/10 pb-6">
              <div>
                <button
                  onClick={() => setSelectedGenre('ALL')}
                  className="mb-4 inline-flex items-center gap-2 border border-white/20 bg-surface/60 px-4 py-2 font-mono text-xs uppercase tracking-wider text-ink hover:border-cyan hover:text-cyan transition-colors cursor-pointer"
                >
                  <span>←</span>
                  <span>Back to Joiners / All Games</span>
                </button>
                <div className="flex items-center gap-3">
                  <Hud className="text-cyan font-bold">DISCIPLINE SUB-CATALOG</Hud>
                  <span className="font-mono text-xs text-dim">·</span>
                  <span className="font-mono text-xs text-dim uppercase">
                    {matchingGenreGames.length} {matchingGenreGames.length === 1 ? 'Game' : 'Games'}
                  </span>
                </div>
                <h1 className="mt-2 font-display text-5xl md:text-7xl font-black uppercase leading-tight text-ink">
                  {selectedGenreObj.name} <span className="text-cyan">Games</span>
                </h1>
                <p className="mt-2 max-w-2xl text-sm md:text-base text-ink/70">
                  {selectedGenreObj.description || 'Official competitive titles registered in this discipline.'}
                </p>
              </div>

              <button
                onClick={() => setSelectedGenre('ALL')}
                className="shrink-0 font-mono text-xs uppercase text-dim hover:text-white underline cursor-pointer"
              >
                Clear Filter (Show All {activeGamesCatalog.length} Games)
              </button>
            </div>

            {/* Games Grid or Strict Empty State */}
            {loading ? (
              <AdaptiveGrid count={4} min={280}>
                {[1, 2, 3, 4].map((n) => (
                  <GameCardSkeleton key={n} />
                ))}
              </AdaptiveGrid>
            ) : matchingGenreGames.length === 0 ? (
              <div className="border border-white/10 bg-surface/30 p-16 text-center">
                <Hud className="text-cyan text-sm">No games available in this genre yet.</Hud>
                <p className="mt-2 font-mono text-sm text-dim max-w-md mx-auto">
                  There are currently no active competitive titles registered under the {selectedGenreObj.name} discipline.
                </p>
                <button
                  onClick={() => setSelectedGenre('ALL')}
                  className="mt-6 border border-cyan/40 bg-cyan/10 px-5 py-2.5 font-mono text-xs uppercase font-bold text-cyan hover:bg-cyan/20 transition-colors cursor-pointer"
                >
                  ← Back to Joiners
                </button>
              </div>
            ) : (
              <AdaptiveGrid count={matchingGenreGames.length} min={280}>
                {matchingGenreGames.map((g, i) => (
                  <div key={g.slug} className="in-view">
                    <GameCard g={g} i={i} />
                  </div>
                ))}
              </AdaptiveGrid>
            )}
          </Container>
        </section>
      ) : (
        /* MAIN JOINERS DISCOVERY VIEW: Disciplines Accordion + Active Games + Coming Soon */
        <>
          {/* Canonical Disciplines / Genres Accordion Hub */}
          {genres.length > 0 && (
            <section className="py-12 md:py-20 border-b border-white/10" id="genres-hub">
              <Container>
                <div className="mb-8">
                  <SectionHead
                    idx="01"
                    kicker="Competitive Genres"
                    title={<>Tournament <span className="text-cyan">Disciplines</span></>}
                    sub="Explore official esports battlegrounds grouped by discipline. Select any discipline to inspect registered games."
                  />
                </div>

                {/* Expanding Accordion: Hover or focus expands card */}
                <div className="flex flex-col gap-3 lg:h-[540px] lg:flex-row">
                  {genres.map((gn, i) => {
                    const isFocused = activeGenreIndex === i
                    const accent = getGenreAccent(gn, i)
                    const connectedGames = gn.games || []

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
                        {/* Background Media */}
                        {gn.banner_url ? (
                          <DynamicImage
                            src={resolveMediaUrl(gn.banner_url)}
                            alt={gn.name}
                            className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ${
                              isFocused ? 'opacity-40 scale-105' : 'opacity-20 grayscale group-hover:opacity-35'
                            }`}
                          />
                        ) : (
                          <div
                            className="absolute inset-0 opacity-30"
                            style={{
                              background: `radial-gradient(circle at 70% 30%, ${accent}44, transparent 70%), linear-gradient(135deg, #090a14 0%, #161828 100%)`,
                            }}
                          />
                        )}

                        {/* Gradient Overlays */}
                        <div
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            background: `linear-gradient(to top, #05060a 15%, rgba(5,6,10,0.65) 60%, rgba(5,6,10,0.3) 100%), radial-gradient(ellipse at 0% 100%, ${accent}55, transparent 65%)`,
                          }}
                        />

                        {/* Top HUD: Index number and title count */}
                        <div className="absolute left-5 top-5 right-5 flex items-center justify-between gap-3 z-10 pointer-events-none">
                          <div className="flex items-center gap-2">
                            <Hud className="text-ink font-bold">0{i + 1}</Hud>
                            <span className="font-mono text-[10px] uppercase tracking-wider text-dim">
                              {connectedGames.length} {connectedGames.length === 1 ? 'Title' : 'Titles'}
                            </span>
                          </div>
                        </div>

                        {/* Collapsed Vertical Title (Visible on lg when NOT focused) */}
                        <span
                          className={`absolute bottom-8 left-5 hidden origin-bottom-left font-display text-3xl xl:text-4xl font-black uppercase tracking-wider transition-opacity duration-300 [writing-mode:vertical-rl] rotate-180 lg:block text-ink/75 group-hover:text-ink pointer-events-none ${
                            isFocused ? 'opacity-0' : 'opacity-100'
                          }`}
                        >
                          {gn.name}
                        </span>

                        {/* Focused Content Area */}
                        <div
                          className={`absolute inset-x-0 bottom-0 p-6 md:p-10 transition-all duration-500 z-10 ${
                            isFocused ? 'opacity-100' : 'lg:translate-y-6 lg:opacity-0 pointer-events-none'
                          }`}
                        >
                          <Hud className="block text-cyan uppercase tracking-widest text-xs">
                            Canonical Discipline · {connectedGames.length} Registered Titles
                          </Hud>
                          <h2 className="mt-2 font-display text-5xl md:text-7xl xl:text-8xl font-black uppercase leading-[0.85] text-ink">
                            {gn.name}
                          </h2>
                          <p className="mt-3 max-w-xl text-sm md:text-base text-ink/80 leading-relaxed font-sans">
                            {gn.description || 'Official competitive esports category and tournament battlegrounds.'}
                          </p>

                          {/* Connected Games badges */}
                          {connectedGames.length > 0 && (
                            <div className="mt-5 flex flex-wrap items-center gap-2">
                              <span className="font-mono text-[11px] text-dim uppercase tracking-wider">Registered:</span>
                              {connectedGames.map((cg) => (
                                <span
                                  key={cg.slug || cg.id}
                                  className="border border-white/15 bg-void/70 px-2.5 py-1 font-mono text-xs text-ink/90 backdrop-blur-sm"
                                >
                                  {cg.title}
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
                  idx="02"
                  kicker="Direct Catalog"
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
                  idx="03"
                  kicker="Locked Worlds"
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
