import { useState, useEffect, useMemo } from 'react'
import { getGames, Game as ApiGame, normalizeGame } from '../services/games'
import { getGenres, type Genre } from '../services/genres'
import { getPageMedia, PageMediaConfig } from '../services/admin'
import { GameCardSkeleton } from '../components/Skeleton'
import { GAMES, CATALOG, gameBy } from '../lib/data'
import { AdaptiveGrid, GameCard } from '../components/kit'
import { Hud, PageHero, Container, SectionHead } from '../components/ui'

export default function Games() {
  const [apiGames, setApiGames] = useState<ApiGame[]>([])
  const [genres, setGenres] = useState<Genre[]>([])
  const [selectedGenre, setSelectedGenre] = useState<string>('ALL')
  const [pageMedia, setPageMedia] = useState<PageMediaConfig | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    Promise.all([
      getGames().catch(() => []),
      getGenres().catch(() => []),
      getPageMedia('games').catch(() => null),
    ]).then(([res, genreRes, pMedia]) => {
      if (!isMounted) return
      if (Array.isArray(res)) setApiGames(res)
      if (Array.isArray(genreRes)) setGenres(genreRes)
      if (pMedia) setPageMedia(pMedia)
      setLoading(false)
    })

    return () => {
      isMounted = false
    }
  }, [])

  const activeGames = apiGames.length > 0 ? apiGames : GAMES
  const displayGames = activeGames.map((ag) => {
    const norm = normalizeGame(ag as any)
    const fallback = gameBy(norm.slug)
    return {
      slug: norm.slug,
      short: norm.tag || fallback.short,
      name: norm.name,
      genre: norm.category || fallback.genre,
      squad: `${norm.maxTeamSize || 4} Player Squad`,
      size: norm.maxTeamSize || 4,
      platform: norm.platform || fallback.platform,
      accent: norm.accentColor || fallback.accent,
      photo: norm.bannerUrl || '',
      line: norm.announcementText || fallback.line,
      desc: norm.description || fallback.desc,
      tournaments: 1,
      status: 'active' as const,
      live: 1,
    }
  })

  const filteredDisplayGames = useMemo(() => {
    if (selectedGenre === 'ALL') return displayGames
    const genreObj = genres.find(
      (gn) => gn.slug === selectedGenre || gn.id === selectedGenre || gn._id === selectedGenre
    )
    if (genreObj) {
      const genreGameSlugs = new Set((genreObj.games || []).map((g) => (g.slug || '').toLowerCase()))
      const genreGameTitles = new Set((genreObj.games || []).map((g) => (g.title || '').toLowerCase()))
      const targetSlug = (genreObj.slug || '').toLowerCase()
      const targetName = (genreObj.name || '').toLowerCase()

      return displayGames.filter((g) => {
        const gSlug = (g.slug || '').toLowerCase()
        const gName = (g.name || '').toLowerCase()
        const gGenre = (g.genre || '').toLowerCase()

        if (genreGameSlugs.has(gSlug) || genreGameTitles.has(gName)) return true
        if (targetSlug && (gGenre.includes(targetSlug) || targetSlug.includes(gGenre))) return true
        if (targetName && (gGenre.includes(targetName) || targetName.includes(gGenre))) return true
        return false
      })
    }

    const target = selectedGenre.toLowerCase().replace(/[^a-z0-9]/g, '')
    return displayGames.filter((g) => {
      const gGenre = (g.genre || '').toLowerCase().replace(/[^a-z0-9]/g, '')
      const gSlug = (g.slug || '').toLowerCase().replace(/[^a-z0-9]/g, '')
      return gGenre.includes(target) || target.includes(gGenre) || gSlug.includes(target)
    })
  }, [displayGames, selectedGenre, genres])

  return (
    <>
      <PageHero
        kicker={`${String(displayGames.length).padStart(2, '0')} live worlds`}
        title={<>Explore<br />Games</>}
        sub="CHOOSE YOUR BATTLEGROUND. Master your mechanics, build a roster, and climb the competitive ladder."
        photo={pageMedia?.media_url}
        accent="#8b5cff"
      />

      {/* Section 1: Browse by Genre (Filter/Navigation buttons only) & Playable Games Grid */}
      <section className="py-16 md:py-24" id="games-catalog">
        <Container>
          <div className="mb-10">
            <SectionHead
              idx="01"
              kicker="Browse by Genre"
              title={<>Playable <span className="text-cyan">Disciplines</span></>}
              sub="Select a competitive discipline to filter official tournament battlegrounds. Click any title to view brackets, rules, and squad rosters."
            />

            {/* Genre Filter Pills */}
            <div className="mt-8 flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-dim uppercase mr-2 tracking-wider">Genre:</span>
              <button
                onClick={() => setSelectedGenre('ALL')}
                className={`px-3.5 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer ${
                  selectedGenre === 'ALL'
                    ? 'border border-cyan bg-cyan text-void font-bold shadow-[0_0_12px_rgba(62,242,255,0.3)]'
                    : 'border border-white/10 bg-surface/60 text-dim hover:text-ink hover:border-white/25'
                }`}
              >
                All Worlds ({displayGames.length})
              </button>
              {genres.map((gn) => {
                const isSelected = selectedGenre === gn.slug
                return (
                  <button
                    key={gn.slug}
                    onClick={() => setSelectedGenre(isSelected ? 'ALL' : gn.slug)}
                    className={`px-3.5 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'border border-cyan bg-cyan text-void font-bold shadow-[0_0_12px_rgba(62,242,255,0.3)]'
                        : 'border border-white/10 bg-surface/60 text-dim hover:text-ink hover:border-white/25'
                    }`}
                  >
                    <span>{gn.name}</span>
                    {gn.games && gn.games.length > 0 && (
                      <span className={`text-[10px] font-mono ${isSelected ? 'text-void/80' : 'text-dim'}`}>
                        ({gn.games.length})
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {loading ? (
            <AdaptiveGrid count={4} min={280}>
              {[1, 2, 3, 4].map((n) => (
                <GameCardSkeleton key={n} />
              ))}
            </AdaptiveGrid>
          ) : filteredDisplayGames.length === 0 ? (
            <div className="border border-white/10 bg-surface/30 p-16 text-center">
              <Hud className="text-cyan">No titles found</Hud>
              <p className="mt-2 font-mono text-sm text-dim">
                No active games currently mapped to the selected genre filter.
              </p>
              <button
                onClick={() => setSelectedGenre('ALL')}
                className="mt-6 border border-cyan/40 bg-cyan/10 px-5 py-2 font-mono text-xs uppercase font-bold text-cyan hover:bg-cyan/20 transition-colors cursor-pointer"
              >
                Reset to All Worlds
              </button>
            </div>
          ) : (
            <AdaptiveGrid count={filteredDisplayGames.length} min={280}>
              {filteredDisplayGames.map((g, i) => (
                <div key={g.slug} className="in-view">
                  <GameCard g={g} i={i} />
                </div>
              ))}
            </AdaptiveGrid>
          )}
        </Container>
      </section>

      {/* Section 2: Locked Worlds / Coming Soon */}
      <section className="in-view border-t border-white/10 bg-graphite/40 py-20 pb-32 md:pb-40">
        <Container>
          <SectionHead
            idx="02"
            kicker="Locked worlds"
            title={<span className="outline-text">Coming soon</span>}
            size="md"
            sub="New esports battlegrounds unlocking soon. Follow the community discord to get notified when registrations open."
          />
          <AdaptiveGrid count={CATALOG.filter((g) => g.status === 'soon').length} min={240} className="mt-12">
            {CATALOG.filter((g) => g.status === 'soon').map((g, i) => (
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
