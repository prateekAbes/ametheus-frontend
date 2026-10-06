import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router'
import { getGames, Game as ApiGame, normalizeGame } from '../services/games'
import { getTournaments, normalizeTournament, NormalizedTournament } from '../services/tournaments'
import { groupGamesByCategory, GameCategory, slugifyCategory } from '../lib/categories'
import { gameBy, img, inr, type Tournament as DesignTournament } from '../lib/data'
import { PageHero, Container, SectionHead, Hud, EmptyState, TournamentCard, Cta, Badge } from '../components/ui'
import { AdaptiveGrid, GameCard } from '../components/kit'
import CategoryCard from '../components/CategoryCard'
import DynamicImage from '../components/DynamicImage'
import { resolveMediaUrl } from '../services/apiClient'

export default function CategoryDetail() {
  const { slug } = useParams<{ slug: string }>()
  const [games, setGames] = useState<ApiGame[]>([])
  const [tournaments, setTournaments] = useState<NormalizedTournament[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    Promise.all([
      getGames().catch(() => []),
      getTournaments().catch(() => []),
    ]).then(([gList, tList]) => {
      if (!isMounted) return
      setGames(gList)
      setTournaments(tList.map(normalizeTournament))
      setLoading(false)
    })
    return () => {
      isMounted = false
    }
  }, [])

  const categories = useMemo(() => groupGamesByCategory(games), [games])

  const currentCategory = useMemo(() => {
    if (!slug) return categories[0] || null
    return (
      categories.find((c) => c.slug === slug.toLowerCase()) ||
      categories.find((c) => c.slug.includes(slug.toLowerCase())) ||
      null
    )
  }, [categories, slug])

  // Tournaments for games in this category
  const categoryTournaments = useMemo(() => {
    if (!currentCategory) return []
    const gameSlugs = new Set(currentCategory.games.map((g) => g.slug.toLowerCase()))
    const gameIds = new Set(currentCategory.games.map((g) => g.id.toLowerCase()))

    return tournaments
      .filter((t) => {
        if (t.status === 'CANCELLED') return false
        const tGameId = (t.gameId || '').toLowerCase()
        return gameSlugs.has(tGameId) || gameIds.has(tGameId)
      })
      .map(
        (nt): Partial<DesignTournament> & Pick<DesignTournament, 'id' | 'name'> => ({
          id: nt.slug || nt.id,
          name: nt.title,
          game: nt.gameId,
          prize: nt.prizePoolInr,
          entry: nt.entryFeeInr,
          status: nt.status.toLowerCase() as any,
          date: nt.startDate
            ? new Date(nt.startDate).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
              })
            : 'TBD',
          teams: nt.registeredTeams,
          max: nt.maxTeams,
          region: 'India',
          format: nt.format,
        })
      )
  }, [currentCategory, tournaments])

  const otherCategories = useMemo(() => {
    if (!currentCategory) return categories
    return categories.filter((c) => c.slug !== currentCategory.slug)
  }, [categories, currentCategory])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-cyan border-t-transparent" />
      </div>
    )
  }

  if (!currentCategory) {
    return (
      <Container className="py-32">
        <EmptyState
          code="404"
          title="Category Not Found"
          body="No esports titles currently match this category."
          cta="Explore All Games"
          onClick={() => (window.location.href = '/games')}
        />
      </Container>
    )
  }

  return (
    <>
      <PageHero
        kicker={`Category · ${currentCategory.games.length} titles`}
        title={currentCategory.name}
        sub={currentCategory.description}
        variant="category"
        accent={currentCategory.accent}
      >
        <div className="flex flex-wrap items-center gap-3">
          <Cta to="/games" ghost small>
            ← All Games
          </Cta>
          <Cta to="/tournaments" small>
            View Tournaments
          </Cta>
        </div>
      </PageHero>

      {/* Category quick-nav chips */}
      <div className="sticky top-16 z-20 border-y border-white/10 bg-void/90 backdrop-blur-md md:top-[72px]">
        <Container className="py-3">
          <div className="no-scrollbar flex items-center gap-2 overflow-x-auto">
            <span className="font-mono text-xs uppercase tracking-wider text-dim shrink-0 mr-2">
              Categories:
            </span>
            {categories.map((cat) => {
              const active = cat.slug === currentCategory.slug
              return (
                <Link
                  key={cat.slug}
                  to={`/games/category/${cat.slug}`}
                  className={`shrink-0 border px-3 py-1 font-mono text-[11px] uppercase tracking-wider transition-all ${
                    active
                      ? 'border-cyan bg-cyan/15 text-cyan'
                      : 'border-white/10 bg-surface/50 text-dim hover:border-white/30 hover:text-ink'
                  }`}
                >
                  {cat.name} ({cat.games.length})
                </Link>
              )
            })}
          </div>
        </Container>
      </div>

      {/* Games in this category */}
      <section className="py-16 md:py-24">
        <Container>
          <SectionHead
            idx="01"
            kicker="Competitive Titles"
            title={
              <>
                {currentCategory.name} <span className="outline-text">Games</span>
              </>
            }
            sub={`Play, practice, and build teams in ${currentCategory.name} battlegrounds.`}
          />
          <div className="mt-12">
            <AdaptiveGrid count={currentCategory.games.length} min={320}>
              {currentCategory.games.map((g, i) => {
                const fallback = gameBy(g.slug)
                return (
                  <Link
                    key={g.slug}
                    to={`/games/${g.slug}`}
                    className="group relative flex aspect-[16/10] flex-col justify-between overflow-hidden border border-white/10 bg-surface p-6 transition-all duration-500 hover:border-cyan/50"
                  >
                    <DynamicImage
                      src={resolveMediaUrl(g.bannerUrl)}
                      alt={`${g.name} banner`}
                      className="absolute inset-0 size-full object-cover opacity-45 transition-transform duration-700 group-hover:scale-105 group-hover:opacity-65"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-void via-void/50 to-transparent" />
                    <div className="relative z-10 flex items-start justify-between">
                      <span className="font-mono text-xs text-dim">0{i + 1}</span>
                      <Badge s="active" label={g.platform || 'Cross-play'} />
                    </div>
                    <div className="relative z-10">
                      <Hud className="text-cyan block">{g.tag || 'ESPORTS'}</Hud>
                      <h3 className="mt-1 font-display text-4xl font-black uppercase text-ink group-hover:text-cyan transition-colors">
                        {g.name}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-xs text-dim">
                        {g.description || fallback.desc}
                      </p>
                      <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                        <Hud>
                          Squad: {g.maxTeamSize}v{g.maxTeamSize}
                        </Hud>
                        <span className="font-display text-xs font-bold uppercase tracking-wider text-cyan">
                          Enter World →
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </AdaptiveGrid>
          </div>
        </Container>
      </section>

      {/* Tournaments in this category */}
      {categoryTournaments.length > 0 && (
        <section className="border-t border-white/10 py-16 md:py-24">
          <Container>
            <SectionHead
              idx="02"
              kicker="Live Competition"
              title={
                <>
                  {currentCategory.name} <span className="text-cyan">Events</span>
                </>
              }
              sub={`Verified prize pool events for ${currentCategory.name} competitors.`}
              right={
                <Cta ghost small to="/tournaments">
                  All Tournaments
                </Cta>
              }
            />
            <AdaptiveGrid count={categoryTournaments.length} min={340} className="mt-12">
              {categoryTournaments.map((t) => (
                <TournamentCard key={t.id} t={t} />
              ))}
            </AdaptiveGrid>
          </Container>
        </section>
      )}

      {/* Explore other categories */}
      {otherCategories.length > 0 && (
        <section className="border-t border-white/10 bg-graphite/40 py-16 md:py-24">
          <Container>
            <SectionHead
              idx="03"
              kicker="Browse More"
              title="Other Categories"
              sub="Explore different game genres, mechanics, and tournament formats on Ametheus."
              right={
                <Cta ghost small to="/games">
                  Full Catalog
                </Cta>
              }
            />
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {otherCategories.slice(0, 6).map((cat, idx) => (
                <CategoryCard key={cat.slug} category={cat} index={idx} />
              ))}
            </div>
          </Container>
        </section>
      )}
    </>
  )
}
