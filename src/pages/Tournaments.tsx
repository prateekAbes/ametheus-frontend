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
import { TournamentCardSkeleton } from '../components/Skeleton'
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
    const trimmedSearch = search.trim().toLowerCase()
    const searchTerms = trimmedSearch ? trimmedSearch.split(/\s+/).filter(Boolean) : []

    const filterTournament = (t: NormalizedTournament, matchStrictTerms: boolean) => {
      // 1. Exclude deleted/cancelled
      if (t.status === 'CANCELLED' || (t as any).status === 'DELETED') return false

      // 2. Resolve associated game metadata
      const rawGId = (t.gameId || '').toLowerCase()
      const rawGName = (t.gameName || '').toLowerCase()
      const rawGIdClean = rawGId.replace(/[-_\s]+/g, '')
      const rawGNameClean = rawGName.replace(/[-_\s]+/g, '')

      const associatedGame =
        games.find(
          (g) =>
            (g.id && g.id === t.gameId) ||
            ((g as any)._id && (g as any)._id === t.gameId) ||
            (g.slug && g.slug.toLowerCase().replace(/[-_\s]+/g, '') === rawGIdClean) ||
            (g.name && g.name.toLowerCase().replace(/[-_\s]+/g, '') === rawGNameClean)
        ) || gameBy(t.gameId || t.gameName)

      // 3. Game Filter
      if (selectedGame !== 'All Games') {
        const targetClean = selectedGame.toLowerCase().replace(/[-_\s]+/g, '')
        const matchSlugClean = (associatedGame?.slug || '').toLowerCase().replace(/[-_\s]+/g, '')
        const matchNameClean = (associatedGame?.name || '').toLowerCase().replace(/[-_\s]+/g, '')
        const matchShortClean = ((associatedGame as any)?.short || (associatedGame as any)?.tag || '').toLowerCase().replace(/[-_\s]+/g, '')

        const isGameMatch =
          rawGIdClean === targetClean ||
          rawGNameClean === targetClean ||
          matchSlugClean === targetClean ||
          matchNameClean === targetClean ||
          matchShortClean === targetClean ||
          matchNameClean.includes(targetClean) ||
          targetClean.includes(matchNameClean) ||
          (targetClean === 'bgmi' &&
            (matchSlugClean.includes('bgmi') || matchNameClean.includes('battlegrounds'))) ||
          (targetClean === 'codmobile' &&
            (matchSlugClean.includes('cod') || matchNameClean.includes('duty'))) ||
          (targetClean === 'freefire' &&
            (matchSlugClean.includes('freefire') || matchNameClean.includes('fire'))) ||
          (targetClean === 'valorant' && matchSlugClean.includes('val'))

        if (!isGameMatch) return false
      }

      // 4. Status Filter
      if (selectedStatus === 'My Registered') {
        const isReg = registeredIds.has(t.id) || registeredIds.has(t.slug) || !!t.isRegistered
        if (!isReg) return false
      } else if (selectedStatus !== 'All') {
        const sUpper = (t.status || '').toUpperCase().trim()
        let matchesStatus = false
        if (selectedStatus === 'Registration Open') {
          matchesStatus = sUpper === 'REGISTRATION_OPEN' || sUpper === 'OPEN'
        } else if (selectedStatus === 'Upcoming') {
          matchesStatus = sUpper === 'UPCOMING' || sUpper === 'COMING_SOON' || sUpper === 'DRAFT'
        } else if (selectedStatus === 'Live') {
          matchesStatus = sUpper === 'LIVE' || sUpper === 'ONGOING' || sUpper === 'IN_PROGRESS'
        } else if (selectedStatus === 'Completed') {
          matchesStatus = sUpper === 'COMPLETED' || sUpper === 'FINISHED' || sUpper === 'ENDED'
        } else {
          matchesStatus = sUpper === selectedStatus.toUpperCase()
        }
        if (!matchesStatus) return false
      }

      // 5. Search Filter
      if (searchTerms.length > 0) {
        const corpus = [
          t.title,
          t.slug,
          t.slug ? t.slug.replace(/[-_]+/g, ' ') : '',
          t.id,
          t.gameName,
          t.gameId,
          associatedGame?.name,
          (associatedGame as any)?.short || (associatedGame as any)?.tag,
          associatedGame?.slug,
          (associatedGame as any)?.genre || (associatedGame as any)?.genre_name || (associatedGame as any)?.category,
          associatedGame?.platform,
          t.description,
          t.format,
          t.serverRegion,
          t.status,
          t.announcementText,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        if (matchStrictTerms) {
          const matchesAll = searchTerms.every((term) => corpus.includes(term))
          if (!matchesAll) return false
        } else {
          const matchesAny = searchTerms.some((term) => corpus.includes(term))
          if (!matchesAny) return false
        }
      }

      return true
    }

    // First attempt strict match (all terms must be present)
    let result = tournaments.filter((t) => filterTournament(t, true))

    // If multi-word search returned 0 strict matches, try lenient matching
    if (result.length === 0 && searchTerms.length > 1) {
      result = tournaments.filter((t) => filterTournament(t, false))
    }

    return result.map(
      (nt): Partial<DesignTournament> & Pick<DesignTournament, 'id' | 'name'> => ({
        id: nt.slug || nt.id,
        name: nt.title,
        game: nt.gameName || nt.gameId,
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
        bannerUrl: nt.bannerUrl,
        isRegistered: registeredIds.has(nt.id) || registeredIds.has(nt.slug) || !!nt.isRegistered,
        mediaConfig: nt.mediaConfig || nt.media_config,
      })
    )
  }, [tournaments, games, registeredIds, selectedGame, selectedStatus, search])

  const page = useLoadMore(list, 9)

  useEffect(() => {
    page.reset?.()
  }, [search, selectedGame, selectedStatus])

  return (
    <>
      <PageHero
        title="TOURNAMENTS"
        sub="High-stakes competitive esports events with automated brackets and verified prize pools."
        variant="tournaments"
        accent="#3ef2ff"
      />

      {/* Filter Bar */}
      <div className="sticky top-16 z-30 border-y border-white/10 bg-void/90 backdrop-blur-md md:top-[72px]">
        <Container className="py-3 space-y-2.5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="overflow-x-auto no-scrollbar">
              <Chips items={STATUS_CHIPS} value={selectedStatus} onChange={setSelectedStatus} />
            </div>
            <div className="flex items-center gap-3">
              <div className="relative flex items-center w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Search tournaments..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setSearch('')
                  }}
                  className="w-full sm:w-64 border border-white/10 bg-surface pl-3 pr-8 py-1.5 font-mono text-xs text-ink placeholder:text-dim outline-none focus:border-cyan transition-colors"
                />
                {search ? (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    title="Clear search"
                    className="absolute right-2.5 text-dim hover:text-ink font-mono text-xs transition-colors"
                  >
                    ✕
                  </button>
                ) : (
                  <span className="absolute right-2.5 text-dim/40 pointer-events-none text-xs">
                    ⌕
                  </span>
                )}
              </div>
              <Hud className="shrink-0">{list.length} {list.length === 1 ? 'Event' : 'Events'}</Hud>
            </div>
          </div>
          <div className="overflow-x-auto no-scrollbar">
            <Chips items={GAME_CHIPS} value={selectedGame} onChange={setSelectedGame} />
          </div>
        </Container>
      </div>

      <Container className="py-12 md:py-16">
        {loading ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <TournamentCardSkeleton key={n} />
            ))}
          </div>
        ) : list.length === 0 ? (
          <EmptyState
            code="00"
            title={search.trim() ? "No tournaments found for your search" : "No tournaments found"}
            body={
              search.trim()
                ? `No tournaments matched "${search.trim()}". Check your spelling or try clearing your active filters.`
                : selectedStatus === 'My Registered'
                ? "You haven't entered any tournaments matching this filter yet."
                : 'Try adjusting your filters or search keywords.'
            }
            cta={search.trim() ? "Clear search" : "Clear filters"}
            onClick={() => {
              if (search.trim()) {
                setSearch('')
              } else {
                setSelectedGame('All Games')
                setSelectedStatus('All')
                setSearch('')
              }
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
