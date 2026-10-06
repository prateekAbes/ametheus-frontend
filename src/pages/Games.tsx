import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router'
import { getGames, Game as ApiGame, normalizeGame } from '../services/games'
import { getGenres, type Genre } from '../services/genres'
import { getTournaments, type Tournament as ApiTournament } from '../services/tournaments'
import { resolveMediaUrl } from '../services/apiClient'
import { GameCardSkeleton } from '../components/Skeleton'
import { GAMES, CATALOG, gameBy, type CatalogGame } from '../lib/data'
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
  const [apiGames, setApiGames] = useState<ApiGame[]>([])
  const [genres, setGenres] = useState<Genre[]>([])
  const [tournaments, setTournaments] = useState<ApiTournament[]>([])
  const [selectedGenre, setSelectedGenre] = useState<string>('ALL')
  const [activeGenreIndex, setActiveGenreIndex] = useState(0)
  const [activeTournMediaIndex, setActiveTournMediaIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  // Fetch games, genres, and tournaments concurrently from backend
  useEffect(() => {
    let isMounted = true
    Promise.all([
      getGames().catch(() => []),
      getGenres().catch(() => []),
      getTournaments().catch(() => []),
    ]).then(([gamesRes, genresRes, tournsRes]) => {
      if (!isMounted) return
      if (Array.isArray(gamesRes)) setApiGames(gamesRes)
      if (Array.isArray(genresRes)) setGenres(genresRes)
      if (Array.isArray(tournsRes)) setTournaments(tournsRes)
      setLoading(false)
    })

    return () => {
      isMounted = false
    }
  }, [])

  // Filter only currently ACTIVE tournaments with valid media for dynamic rotation
  const activeTournaments = useMemo(() => {
    return tournaments
      .filter((t) => {
        if (!t) return false
        const s = (t.status || '').toUpperCase()
        if (['COMPLETED', 'CANCELLED', 'CANCELED', 'DELETED'].includes(s)) return false
        const isActive = ['ACTIVE', 'LIVE', 'UPCOMING', 'REGISTRATION_OPEN', 'IN_PROGRESS'].includes(s)
        const rawUrl = t.banner_url || (t as any).bannerUrl || t.logo_url
        return isActive && typeof rawUrl === 'string' && rawUrl.trim().length > 0
      })
      .map((t) => ({
        id: t.id || (t as any)._id || t.slug,
        title: t.title,
        imageUrl: resolveMediaUrl(t.banner_url || (t as any).bannerUrl || t.logo_url),
        gameName: t.game_name || (t as any).gameName || 'Tournament',
        status: t.status,
        slug: t.slug,
      }))
      .filter((t) => Boolean(t.imageUrl))
  }, [tournaments])

  // Dynamic active tournament media rotation every ~5 seconds with cleanup
  useEffect(() => {
    if (activeTournaments.length <= 1) return

    const intervalId = setInterval(() => {
      setActiveTournMediaIndex((prev) => (prev + 1) % activeTournaments.length)
    }, 5000)

    return () => {
      clearInterval(intervalId)
    }
  }, [activeTournaments.length])

  // Count active tournaments per game
  const tournamentCountsByGame = useMemo(() => {
    const map: Record<string, number> = {}
    tournaments.forEach((t) => {
      const s = (t.status || '').toUpperCase()
      if (['CANCELLED', 'CANCELED', 'DELETED'].includes(s)) return
      const gKey = (t.game_id || (t as any).gameId || (t as any).game_slug || (t as any).game || '').toLowerCase()
      if (gKey) {
        map[gKey] = (map[gKey] || 0) + 1
      }
    })
    return map
  }, [tournaments])

  // Base list of games from backend, with fallback to initial catalog if empty
  const allGames = useMemo(() => {
    if (apiGames.length > 0) return apiGames
    return GAMES
  }, [apiGames])

  // Active individual games
  const activeGamesCatalog: (CatalogGame & { genreId?: string; genreName?: string })[] = useMemo(() => {
    return allGames
      .filter((g) => {
        const s = ((g as any).status || '').toUpperCase()
        return s !== 'COMING_SOON' && s !== 'SOON'
      })
      .map((g) => {
        const norm = normalizeGame(g as any)
        const fallback = gameBy(norm.slug)
        const tournCount =
          tournamentCountsByGame[norm.id?.toLowerCase()] ??
          tournamentCountsByGame[norm.slug?.toLowerCase()] ??
          tournamentCountsByGame[norm.tag?.toLowerCase()] ??
          1
        return {
          slug: norm.slug,
          short: norm.tag || fallback.short,
          name: norm.name,
          genre: norm.genreName || norm.category || fallback.genre,
          platform: norm.platform || fallback.platform,
          accent: norm.accentColor || fallback.accent,
          photo: norm.bannerUrl || '',
          status: 'active' as const,
          tournaments: tournCount,
          genreId: norm.genreId,
          genreName: norm.genreName,
        }
      })
  }, [allGames, tournamentCountsByGame])

  // Coming soon individual games
  const comingSoonGamesCatalog: CatalogGame[] = useMemo(() => {
    const fromApi = allGames
      .filter((g) => {
        const s = ((g as any).status || '').toUpperCase()
        return s === 'COMING_SOON' || s === 'SOON'
      })
      .map((g) => {
        const norm = normalizeGame(g as any)
        return {
          slug: norm.slug,
          short: norm.tag || norm.name.toUpperCase(),
          name: norm.name,
          genre: norm.genreName || norm.category || 'Esports',
          platform: norm.platform || 'Multi-platform',
          accent: norm.accentColor || '#8b5cff',
          photo: norm.bannerUrl || '',
          status: 'soon' as const,
          tournaments: 0,
        }
      })

    if (fromApi.length > 0) return fromApi
    return CATALOG.filter((g) => g.status === 'soon')
  }, [allGames])

  // Filter active games by selected genre
  const filteredActiveGames = useMemo(() => {
    if (selectedGenre === 'ALL') return activeGamesCatalog

    const genreObj = genres.find(
      (gn) => gn.slug === selectedGenre || gn.id === selectedGenre || (gn as any)._id === selectedGenre
    )

    if (genreObj) {
      const genreGameSlugs = new Set((genreObj.games || []).map((g) => (g.slug || '').toLowerCase()))
      const genreGameTitles = new Set((genreObj.games || []).map((g) => (g.title || '').toLowerCase()))
      const targetSlug = (genreObj.slug || '').toLowerCase()
      const targetName = (genreObj.name || '').toLowerCase()

      return activeGamesCatalog.filter((g) => {
        const gSlug = (g.slug || '').toLowerCase()
        const gName = (g.name || '').toLowerCase()
        const gGenre = (g.genre || '').toLowerCase()
        const gGenreId = (g.genreId || '').toLowerCase()

        if (genreObj.id && gGenreId === genreObj.id.toLowerCase()) return true
        if (genreGameSlugs.has(gSlug) || genreGameTitles.has(gName)) return true
        if (targetSlug && (gGenre.includes(targetSlug) || targetSlug.includes(gGenre))) return true
        if (targetName && (gGenre.includes(targetName) || targetName.includes(gGenre))) return true
        return false
      })
    }

    const target = selectedGenre.toLowerCase().replace(/[^a-z0-9]/g, '')
    return activeGamesCatalog.filter((g) => {
      const gGenre = (g.genre || '').toLowerCase().replace(/[^a-z0-9]/g, '')
      const gSlug = (g.slug || '').toLowerCase().replace(/[^a-z0-9]/g, '')
      return gGenre.includes(target) || target.includes(gGenre) || gSlug.includes(target)
    })
  }, [activeGamesCatalog, selectedGenre, genres])

  const selectedGenreObj = genres.find((g) => g.slug === selectedGenre || g.id === selectedGenre)

  return (
    <>
      <PageHero
        kicker={`${String(activeGamesCatalog.length).padStart(2, '0')} live worlds`}
        title={<>Explore<br />Games</>}
        sub="CHOOSE YOUR BATTLEGROUND. Master your mechanics, build a roster, and climb the competitive ladder."
        variant="games"
        accent="#8b5cff"
      />

      {/* PART 6 & 7: Dynamic Database-Driven Genre Section (ABOVE Individual Games) */}
      {genres.length > 0 && (
        <section className="py-12 md:py-20 border-b border-white/10" id="genres-hub">
          <Container>
            <div className="mb-8">
              <SectionHead
                idx="01"
                kicker="Competitive Genres"
                title={<>Tournament <span className="text-cyan">Disciplines</span></>}
                sub="Explore official esports battlegrounds grouped by discipline. Live tournament media rotates dynamically in real time."
              />
            </div>

            {/* Expanding Accordion Interaction: Hovered/focused expands, others remain small */}
            <div className="flex flex-col gap-3 lg:h-[580px] lg:flex-row">
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
                    {/* Background Media: Rotating Active Tournament Media for Focused Card */}
                    {isFocused ? (
                      activeTournaments.length > 0 ? (
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                          {activeTournaments.map((t, idx) => {
                            const isCurrent = idx === activeTournMediaIndex
                            return (
                              <img
                                key={t.id || idx}
                                src={t.imageUrl}
                                alt={t.title}
                                loading={idx === 0 ? 'eager' : 'lazy'}
                                decoding="async"
                                className={`absolute inset-0 h-full w-full object-cover transition-all duration-1000 ease-in-out ${
                                  isCurrent
                                    ? 'scale-105 opacity-65'
                                    : 'scale-100 opacity-0 pointer-events-none'
                                }`}
                              />
                            )
                          })}
                        </div>
                      ) : gn.banner_url ? (
                        <img
                          src={resolveMediaUrl(gn.banner_url)}
                          alt={gn.name}
                          loading="lazy"
                          decoding="async"
                          className="absolute inset-0 h-full w-full object-cover opacity-45 scale-105 transition-opacity duration-700"
                        />
                      ) : (
                        <div
                          className="absolute inset-0 opacity-40"
                          style={{
                            background: `radial-gradient(circle at 70% 30%, ${accent}44, transparent 70%), linear-gradient(135deg, #090a14 0%, #161828 100%)`,
                          }}
                        />
                      )
                    ) : gn.banner_url ? (
                      <img
                        src={resolveMediaUrl(gn.banner_url)}
                        alt={gn.name}
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 h-full w-full object-cover opacity-25 grayscale transition-all duration-700 group-hover:opacity-40 group-hover:scale-105"
                      />
                    ) : (
                      <div
                        className="absolute inset-0 opacity-20"
                        style={{ background: `linear-gradient(to top, #05060a, ${accent}22)` }}
                      />
                    )}

                    {/* Gradient Overlays */}
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: `linear-gradient(to top, #05060a 15%, rgba(5,6,10,0.65) 60%, rgba(5,6,10,0.3) 100%), radial-gradient(ellipse at 0% 100%, ${accent}55, transparent 65%)`,
                      }}
                    />

                    {/* Top HUD: Index number and Live Tournament pill */}
                    <div className="absolute left-5 top-5 right-5 flex items-center justify-between gap-3 z-10 pointer-events-none">
                      <div className="flex items-center gap-2">
                        <Hud className="text-ink font-bold">0{i + 1}</Hud>
                        <span className="font-mono text-[10px] uppercase tracking-wider text-dim">
                          {connectedGames.length} {connectedGames.length === 1 ? 'Title' : 'Titles'}
                        </span>
                      </div>

                      {/* Live Rotating Tournament Badge */}
                      {isFocused && activeTournaments.length > 0 && (
                        <div className="flex items-center gap-2 border border-cyan/40 bg-void/85 px-3 py-1 backdrop-blur-md">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan"></span>
                          </span>
                          <span className="font-mono text-[10px] uppercase tracking-wider text-cyan font-bold truncate max-w-[180px] md:max-w-[260px]">
                            Live Event · {activeTournaments[activeTournMediaIndex]?.title}
                          </span>
                          {activeTournaments.length > 1 && (
                            <span className="text-[9px] font-mono text-dim">
                              ({activeTournMediaIndex + 1}/{activeTournaments.length})
                            </span>
                          )}
                        </div>
                      )}
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
                          <span className="font-mono text-[11px] text-dim uppercase tracking-wider">Battlegrounds:</span>
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

                      {/* Action buttons */}
                      <div className="mt-7 flex flex-wrap items-center gap-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            const next = selectedGenre === gn.slug ? 'ALL' : gn.slug
                            setSelectedGenre(next)
                            document.getElementById('active-games')?.scrollIntoView({ behavior: 'smooth' })
                          }}
                          className={`px-5 py-2.5 font-mono text-xs uppercase tracking-wider font-bold transition-all cursor-pointer flex items-center gap-2 ${
                            selectedGenre === gn.slug
                              ? 'border border-cyan bg-cyan text-void shadow-[0_0_16px_rgba(62,242,255,0.4)]'
                              : 'border border-white/20 bg-surface/80 text-ink hover:border-cyan hover:text-cyan'
                          }`}
                        >
                          {selectedGenre === gn.slug ? (
                            <>
                              <span>Filter Active: {gn.name}</span>
                              <span className="text-[10px] opacity-75">✕ Clear Filter</span>
                            </>
                          ) : (
                            <>
                              <span>Filter Games by {gn.name}</span>
                              <span>↓</span>
                            </>
                          )}
                        </button>

                        {activeTournaments.length > 0 && (
                          <Link
                            to={`/tournaments/${activeTournaments[activeTournMediaIndex]?.slug}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-mono text-xs uppercase tracking-wider text-cyan hover:underline inline-flex items-center gap-1.5"
                          >
                            <span>View Live Tournament</span>
                            <span>→</span>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Container>
        </section>
      )}

      {/* PART 2: Show Individual Active Games Directly */}
      <section className="py-16 md:py-24" id="active-games">
        <Container>
          <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <SectionHead
              idx="02"
              kicker="Direct Catalog"
              title={<>Active <span className="text-cyan">Games</span></>}
              sub="Direct access to every active competitive game. Enter world to browse tournament brackets, rules, and squads."
            />

            {/* Filter status pill if filtered */}
            {selectedGenre !== 'ALL' && (
              <div className="flex items-center gap-3 border border-cyan/40 bg-cyan/10 px-4 py-2 font-mono text-xs">
                <span className="text-dim uppercase">Filtered by:</span>
                <span className="text-cyan font-bold uppercase">{selectedGenreObj?.name || selectedGenre}</span>
                <button
                  onClick={() => setSelectedGenre('ALL')}
                  className="ml-2 text-ink hover:text-white underline cursor-pointer"
                >
                  Show All ({activeGamesCatalog.length})
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <AdaptiveGrid count={4} min={280}>
              {[1, 2, 3, 4].map((n) => (
                <GameCardSkeleton key={n} />
              ))}
            </AdaptiveGrid>
          ) : filteredActiveGames.length === 0 ? (
            <div className="border border-white/10 bg-surface/30 p-16 text-center">
              <Hud className="text-cyan">No active games in this genre</Hud>
              <p className="mt-2 font-mono text-sm text-dim">
                No active games are currently mapped to the selected genre filter.
              </p>
              <button
                onClick={() => setSelectedGenre('ALL')}
                className="mt-6 border border-cyan/40 bg-cyan/10 px-5 py-2 font-mono text-xs uppercase font-bold text-cyan hover:bg-cyan/20 transition-colors cursor-pointer"
              >
                Show All Active Games
              </button>
            </div>
          ) : (
            <AdaptiveGrid count={filteredActiveGames.length} min={280}>
              {filteredActiveGames.map((g, i) => (
                <div key={g.slug} className="in-view">
                  <GameCard g={g} i={i} />
                </div>
              ))}
            </AdaptiveGrid>
          )}
        </Container>
      </section>

      {/* PART 3: Coming Soon Games Directly As Individual Game Cards Below Active Games */}
      <section className="in-view border-t border-white/10 bg-graphite/40 py-20 pb-32 md:pb-40" id="coming-soon-games">
        <Container>
          <SectionHead
            idx="03"
            kicker="Locked worlds"
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
    </>
  )
}
