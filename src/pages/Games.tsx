import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { getGames, Game as ApiGame, normalizeGame } from '../services/games'
import { getTournaments, normalizeTournament } from '../services/tournaments'
import { GAMES, CATALOG, gameBy, img } from '../lib/data'
import { AdaptiveGrid, GameCard } from '../components/kit'
import { Hud, Badge, PageHero, Container, SectionHead } from '../components/ui'

export default function Games() {
  const [open, setOpen] = useState(0)
  const [apiGames, setApiGames] = useState<ApiGame[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    getGames()
      .then((res) => {
        if (isMounted) {
          setApiGames(res)
          setLoading(false)
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false)
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
      photo: norm.bannerUrl || fallback.photo,
      line: norm.announcementText || fallback.line,
      desc: norm.description || fallback.desc,
      live: 1,
    }
  })

  return (
    <>
      <PageHero
        kicker={`${String(displayGames.length).padStart(2, '0')} live worlds`}
        title={<>Explore<br />Games</>}
        sub="CHOOSE YOUR BATTLEGROUND. Master your mechanics, build a roster, and climb the competitive ladder."
        photo={displayGames[0]?.photo || GAMES[1].photo}
        accent="#8b5cff"
      />

      <section className="py-16 md:py-24">
        <Container>
          {displayGames.length > 5 ? (
            <AdaptiveGrid count={displayGames.length} min={260}>
              {displayGames.map((g, i) => (
                <GameCard key={g.slug} g={{ ...g, status: 'active', tournaments: 1 }} i={i} />
              ))}
            </AdaptiveGrid>
          ) : (
            <div className="flex flex-col gap-3 lg:h-[680px] lg:flex-row">
              {displayGames.map((g, i) => {
                const on = open === i
                return (
                  <Link
                    key={g.slug}
                    to={`/games/${g.slug}`}
                    onMouseEnter={() => setOpen(i)}
                    onFocus={() => setOpen(i)}
                    className={`group relative min-h-[380px] overflow-hidden border border-white/10 transition-[flex-grow,border-color] duration-700 ease-[cubic-bezier(.2,.7,.1,1)] lg:min-h-0 ${
                      on ? 'lg:flex-[4]' : 'lg:flex-[1]'
                    }`}
                    style={{ borderColor: on ? g.accent + '88' : undefined }}
                  >
                    <img
                      src={img(g.photo, 1400)}
                      loading={i < 2 ? 'eager' : 'lazy'}
                      decoding="async"
                      alt={`${g.name} artwork`}
                      className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ${
                        on ? 'scale-105 opacity-75' : 'opacity-40 grayscale'
                      }`}
                    />
                    <div
                      className="absolute inset-0"
                      style={{
                        background: `linear-gradient(to top, #05060a 10%, transparent 70%), radial-gradient(ellipse at 0% 100%, ${g.accent}66, transparent 60%)`,
                      }}
                    />
                    <div className="absolute left-5 top-5 flex items-center gap-3">
                      <Hud className="text-ink">0{i + 1}</Hud>
                      <Badge s="active" label="Active" />
                    </div>
                    <span
                      className={`absolute bottom-8 left-5 hidden origin-bottom-left font-display text-4xl font-black uppercase transition-opacity duration-300 [writing-mode:vertical-rl] rotate-180 lg:block ${
                        on ? 'opacity-0' : 'opacity-100'
                      }`}
                    >
                      {g.short}
                    </span>
                    <div
                      className={`absolute inset-x-0 bottom-0 p-6 transition-all duration-500 md:p-10 ${
                        on ? 'opacity-100' : 'lg:translate-y-6 lg:opacity-0'
                      }`}
                    >
                      <Hud className="block">
                        {g.genre} · {g.platform} · {g.squad}
                      </Hud>
                      <h2 className="mt-3 font-display text-6xl font-black uppercase leading-[0.82] md:text-8xl xl:text-9xl">
                        {g.short}
                      </h2>
                      <p className="mt-4 max-w-md text-ink/75">{g.line}</p>
                      <div className="mt-8 flex flex-wrap items-end gap-10">
                        <div>
                          <Hud>Squad Format</Hud>
                          <p className="font-display text-3xl font-black uppercase" style={{ color: g.accent }}>
                            {g.squad}
                          </p>
                        </div>
                        <div>
                          <Hud>Platform</Hud>
                          <p className="font-display text-3xl font-black uppercase">{g.platform}</p>
                        </div>
                        <span
                          className="ml-auto inline-flex items-center gap-2 font-display text-lg font-extrabold uppercase tracking-[0.08em] transition-all group-hover:gap-4"
                          style={{ color: g.accent }}
                        >
                          Enter world →
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </Container>
      </section>

      <section className="in-view pb-32 pt-10 md:pb-40">
        <Container>
          <SectionHead
            idx="//"
            kicker="Locked worlds"
            title={<span className="outline-text">Coming soon</span>}
            size="md"
            sub="New battlegrounds unlocking soon. Follow the discord to get notified when registrations open."
          />
          <AdaptiveGrid count={CATALOG.filter((g) => g.status === 'soon').length} min={220} className="mt-12">
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
