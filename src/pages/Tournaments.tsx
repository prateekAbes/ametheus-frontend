import { useState, useEffect, useMemo } from 'react'
import { AdaptiveGrid, LoadMore, useLoadMore } from '../components/kit'
import { PageHero, Container, Chips, TournamentCard, EmptyState, Hud } from '../components/ui'
import {
  getTournaments,
  getMyRegistrations,
  normalizeTournament,
  NormalizedTournament,
} from '../services/tournaments'
import { getGames, Game } from '../services/games'
import { gameBy, inr, type Tournament as DesignTournament } from '../lib/data'
import { useAuthContext } from '../context/AuthContext'

const GAME_CHIPS = ['All Games', 'BGMI', 'Valorant', 'Free Fire', 'COD Mobile'] as const
const STATUS_CHIPS = ['All', 'My Registered', 'Registration Open', 'Upcoming', 'Live', 'Completed'] as const

const STATUS_MAP: Record<string, string> = {
  'Registration Open': 'REGISTRATION_OPEN',
  Upcoming: 'UPCOMING',
  Live: 'LIVE',
  Completed: 'COMPLETED',
}

export default function Tournaments() {
  const { isSignedIn } = useAuthContext()
  const [tournaments, setTournaments] = useState<NormalizedTournament[]>([])
  const [games, setGames] = useState<Game[]>([])
  const [registeredIds, setRegisteredIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  const [selectedGame, setSelectedGame] = useState<string>('All Games')
  const [selectedStatus, setSelectedStatus] = useState<string>('All')
  const [search, setSearch] = useState('')

  useEffect(() => {
    let isMounted = true
    Promise.all([
      getTournaments().catch(() => []),
      getGames().catch(() => []),
    ]).then(([tList, gList]) => {
      if (!isMounted) return
      setTournaments(tList.map(normalizeTournament))
      setGames(gList)
      setLoading(false)
    })
    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (isSignedIn) {
      getMyRegistrations()
        .then((regs) => {
          if (Array.isArray(regs)) {
            const ids = new Set<string>()
            regs.forEach((r) => {
              if (r.tournament_id) ids.add(r.tournament_id)
              if (r.tournament_slug) ids.add(r.tournament_slug)
            })
            setRegisteredIds(ids)
          }
        })
        .catch(() => {})
    } else {
      setRegisteredIds(new Set())
    }
  }, [isSignedIn])

  // Filter and map to card shape
  const list = useMemo(() => {
    let result = tournaments.filter((t) => {
      if (t.status === 'CANCELLED') return false

      if (selectedGame !== 'All Games') {
        const gameMatch = games.find(
          (g) =>
            g.name.toLowerCase() === selectedGame.toLowerCase() ||
            g.slug === selectedGame.toLowerCase()
        )
        if (gameMatch && t.gameId !== gameMatch.slug && t.gameId !== gameMatch.id) {
          return false
        }
      }

      if (selectedStatus === 'My Registered') {
        const isReg = registeredIds.has(t.id) || registeredIds.has(t.slug) || !!t.isRegistered
        if (!isReg) return false
      } else if (selectedStatus !== 'All') {
        const targetStatus = STATUS_MAP[selectedStatus]
        if (
          t.status.toUpperCase() !== targetStatus &&
          t.status.toLowerCase() !== selectedStatus.toLowerCase()
        ) {
          return false
        }
      }

      if (search.trim()) {
        const query = search.toLowerCase()
        if (!t.title.toLowerCase().includes(query) && !t.gameId.toLowerCase().includes(query)) {
          return false
        }
      }

      return true
    })

    return result.map(
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
        teams: nt.registeredTeams, // EXACT AUTHORITATIVE COUNT (0 stays 0)
        max: nt.maxTeams,
        region: 'India',
        format: nt.format,
        isRegistered: registeredIds.has(nt.id) || registeredIds.has(nt.slug) || !!nt.isRegistered,
      })
    )
  }, [tournaments, games, registeredIds, selectedGame, selectedStatus, search])

  const page = useLoadMore(list, 9)

  return (
    <>
      <PageHero
        kicker="◇ Compete · Win · Repeat"
        title="TOURNAMENTS"
        sub="High-stakes competitive esports events with automated brackets and verified prize pools."
        photo={gameBy('valorant').photo}
        accent="#8b5cff"
      />

      {/* Filter Bar */}
      <div className="sticky top-20 z-20 border-y border-white/10 bg-void/85 backdrop-blur-md">
        <Container className="py-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Chips items={STATUS_CHIPS} value={selectedStatus} onChange={setSelectedStatus} />
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Search tournaments..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border border-white/10 bg-surface px-3 py-1.5 font-mono text-xs text-ink placeholder:text-dim outline-none focus:border-cyan"
              />
              <Hud>{list.length} Events</Hud>
            </div>
          </div>
          <Chips items={GAME_CHIPS} value={selectedGame} onChange={setSelectedGame} />
        </Container>
      </div>

      <Container className="py-12 md:py-16">
        {loading ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="aspect-[16/11] border border-white/10 bg-surface/40 animate-pulse"
              />
            ))}
          </div>
        ) : list.length === 0 ? (
          <EmptyState
            code="00"
            title="No tournaments found"
            body={
              selectedStatus === 'My Registered'
                ? "You haven't entered any tournaments matching this filter yet."
                : 'Try adjusting your filters or search keywords.'
            }
            cta="Clear filters"
            onClick={() => {
              setSelectedGame('All Games')
              setSelectedStatus('All')
              setSearch('')
            }}
          />
        ) : (
          <>
            <AdaptiveGrid count={page.shown.length} min={340}>
              {page.shown.map((t) => (
                <TournamentCard key={t.id} t={t} />
              ))}
            </AdaptiveGrid>
            <LoadMore more={page.more} rest={page.rest} onClick={page.next} />
          </>
        )}
      </Container>
    </>
  )
}
