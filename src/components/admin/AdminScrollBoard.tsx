import { useRef, useState, useEffect } from 'react'
import { inr } from '../../lib/data'
import { Hud, Panel } from '../ui'
import { AdminStats } from '../../services/admin'

interface AdminScrollBoardProps {
  stats: AdminStats | null
  loading: boolean
  tournamentsCount: number
  activeTournamentsCount: number
  gamesCount: number
  genresCount: number
  usersCount: number
  paymentsCount: number
  payoutsCount: number
  ticketsCount: number
  matchesCount: number
  onNavigateTab: (tab: string) => void
}

export function AdminScrollBoard({
  stats,
  loading,
  tournamentsCount,
  activeTournamentsCount,
  gamesCount,
  genresCount,
  usersCount,
  paymentsCount,
  payoutsCount,
  ticketsCount,
  matchesCount,
  onNavigateTab,
}: AdminScrollBoardProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeftPos, setScrollLeftPos] = useState(0)
  const [hasScrolled, setHasScrolled] = useState(false)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  // Native wheel listener for smooth vertical-to-horizontal wheel translation
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const handleWheel = (e: WheelEvent) => {
      // If user holds Shift, browser handles horizontal scroll natively.
      // If normal vertical mouse wheel, translate deltaY directly into horizontal scroll.
      if (e.deltaY !== 0 && !e.shiftKey) {
        e.preventDefault()
        el.scrollLeft += e.deltaY * 1.2
      }
    }

    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      el.removeEventListener('wheel', handleWheel)
    }
  }, [])

  // Update scroll arrow boundaries
  const updateScrollState = () => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 10)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10)
    if (el.scrollLeft > 10) setHasScrolled(true)
  }

  useEffect(() => {
    updateScrollState()
    window.addEventListener('resize', updateScrollState)
    return () => window.removeEventListener('resize', updateScrollState)
  }, [loading])

  // Drag-to-scroll handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const el = scrollRef.current
    if (!el) return
    setIsDragging(true)
    setStartX(e.pageX - el.offsetLeft)
    setScrollLeftPos(el.scrollLeft)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    const el = scrollRef.current
    if (!el) return
    e.preventDefault()
    const x = e.pageX - el.offsetLeft
    const walk = (x - startX) * 1.5
    el.scrollLeft = scrollLeftPos - walk
    updateScrollState()
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleMouseLeave = () => {
    setIsDragging(false)
  }

  const scrollByAmount = (direction: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    const scrollAmount = 340
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    })
    setTimeout(updateScrollState, 350)
  }

  // Cards definitions - 100% database-driven from real backend state
  const cards = [
    {
      id: 'vault',
      title: 'AMETHEUS VAULT',
      value: loading ? null : inr(stats?.platform_escrow_vault ?? 0),
      sub: 'Platform escrow collateral & player fund vault',
      badge: 'SECURED',
      badgeColor: 'text-ok border-ok/40 bg-ok/10',
      accentColor: 'text-ok',
      borderColor: 'border-ok/30 hover:border-ok/70',
      actionLabel: 'Inspect Ledger →',
      targetTab: 'PAYOUTS LEDGER',
    },
    {
      id: 'tournaments',
      title: 'ACTIVE TOURNAMENTS',
      value: loading ? null : String(stats?.active_tournaments ?? activeTournamentsCount),
      sub: `${tournamentsCount} total sanctioned competitive events`,
      badge: 'LIVE LADDER',
      badgeColor: 'text-cyan border-cyan/40 bg-cyan/10',
      accentColor: 'text-cyan',
      borderColor: 'border-cyan/30 hover:border-cyan/70',
      actionLabel: 'Manage Brackets →',
      targetTab: 'TOURNAMENTS',
    },
    {
      id: 'users',
      title: 'TOTAL CONTENDERS',
      value: loading ? null : String(stats?.total_users ?? usersCount),
      sub: 'Registered players, team captains & organizers',
      badge: 'COMMUNITY',
      badgeColor: 'text-purple-400 border-purple-500/40 bg-purple-500/10',
      accentColor: 'text-purple-400',
      borderColor: 'border-purple-500/30 hover:border-purple-500/70',
      actionLabel: 'User Directory →',
      targetTab: 'USERS & ROLES',
    },
    {
      id: 'games',
      title: 'GAMES CATALOG',
      value: loading ? null : String(gamesCount),
      sub: 'Official competitive titles & ladders',
      badge: 'SANCTIONED',
      badgeColor: 'text-blue-400 border-blue-500/40 bg-blue-500/10',
      accentColor: 'text-blue-400',
      borderColor: 'border-blue-500/30 hover:border-blue-500/70',
      actionLabel: 'Configure Catalog →',
      targetTab: 'GAMES CATALOG',
    },
    {
      id: 'genres',
      title: 'DISCIPLINES & CATEGORIES',
      value: loading ? null : String(genresCount),
      sub: 'Esports tournament disciplines & categories',
      badge: 'DISCIPLINE',
      badgeColor: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
      accentColor: 'text-amber-400',
      borderColor: 'border-amber-500/30 hover:border-amber-500/70',
      actionLabel: 'Manage Genres →',
      targetTab: 'GENRES & CATEGORIES',
    },
    {
      id: 'payments',
      title: 'PENDING PAYMENTS',
      value: loading ? null : String(stats?.pending_payments_count ?? paymentsCount),
      sub: 'Bank UTR submissions pending reconciliation',
      badge: (stats?.pending_payments_count ?? paymentsCount) > 0 ? 'ATTENTION' : 'CLEAR',
      badgeColor:
        (stats?.pending_payments_count ?? paymentsCount) > 0
          ? 'text-warn border-warn/40 bg-warn/10 animate-pulse'
          : 'text-ok border-ok/40 bg-ok/10',
      accentColor: 'text-warn',
      borderColor: 'border-warn/30 hover:border-warn/70',
      actionLabel: 'Verify UTRs →',
      targetTab: 'PENDING PAYMENTS',
    },
    {
      id: 'tickets',
      title: 'ACTIVE SUPPORT TICKETS',
      value: loading ? null : String(stats?.open_tickets_count ?? ticketsCount),
      sub: 'Helpdesk requests and contender inquiries',
      badge: (stats?.open_tickets_count ?? ticketsCount) > 0 ? 'ACTION REQ' : 'RESOLVED',
      badgeColor:
        (stats?.open_tickets_count ?? ticketsCount) > 0
          ? 'text-rose-400 border-rose-500/40 bg-rose-500/10'
          : 'text-ok border-ok/40 bg-ok/10',
      accentColor: 'text-rose-400',
      borderColor: 'border-rose-500/30 hover:border-rose-500/70',
      actionLabel: 'Open Helpdesk →',
      targetTab: 'SUPPORT TICKETS',
    },
    {
      id: 'matches',
      title: 'LIVE MATCHES',
      value: loading ? null : String(stats?.live_matches ?? matchesCount),
      sub: 'Active lobbies, stream links & scoreboards',
      badge: 'BROADCAST',
      badgeColor: 'text-live border-live/40 bg-live/10',
      accentColor: 'text-live',
      borderColor: 'border-live/30 hover:border-live/70',
      actionLabel: 'Live Encounters →',
      targetTab: 'LIVE MATCHES',
    },
    {
      id: 'payouts',
      title: 'PAYOUTS DISBURSED',
      value: loading ? null : String(payoutsCount),
      sub: 'Completed winner prize money disbursements',
      badge: 'DISBURSED',
      badgeColor: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
      accentColor: 'text-emerald-400',
      borderColor: 'border-emerald-500/30 hover:border-emerald-500/70',
      actionLabel: 'Review Ledger →',
      targetTab: 'PAYOUTS LEDGER',
    },
  ]

  return (
    <div className="relative">
      {/* Scroll Board Header with Navigation Chevrons */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Hud className="text-cyan font-bold">METRICS SCROLL BOARD</Hud>
          <span className="font-mono text-[10px] text-dim uppercase">
            Horizontal scroll enabled · {cards.length} Core Telemetries
          </span>
        </div>

        {/* Navigation Chevrons (Arrow Buttons) */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => scrollByAmount('left')}
            disabled={!canScrollLeft}
            aria-label="Scroll left"
            className={`border px-3 py-1 font-mono text-xs uppercase transition-all flex items-center gap-1 cursor-pointer ${
              canScrollLeft
                ? 'border-cyan/50 bg-cyan/10 text-cyan hover:bg-cyan/20'
                : 'border-white/10 bg-surface/30 text-dim/40 cursor-not-allowed'
            }`}
          >
            <span>←</span>
            <span className="hidden sm:inline">Prev</span>
          </button>
          <button
            onClick={() => scrollByAmount('right')}
            disabled={!canScrollRight}
            aria-label="Scroll right"
            className={`border px-3 py-1 font-mono text-xs uppercase transition-all flex items-center gap-1 cursor-pointer ${
              canScrollRight
                ? 'border-cyan/50 bg-cyan/10 text-cyan hover:bg-cyan/20'
                : 'border-white/10 bg-surface/30 text-dim/40 cursor-not-allowed'
            }`}
          >
            <span className="hidden sm:inline">Next</span>
            <span>→</span>
          </button>
        </div>
      </div>

      {/* Horizontally Scrollable Board */}
      <div
        ref={scrollRef}
        onScroll={updateScrollState}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        className={`flex gap-4 overflow-x-auto pb-4 pt-1 transition-all select-none cursor-grab active:cursor-grabbing ${
          isDragging ? 'cursor-grabbing' : ''
        }`}
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#3ef2ff33 #05060a',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {cards.map((c) => (
          <Panel
            key={c.id}
            className={`min-w-[280px] max-w-[320px] shrink-0 p-5 border transition-all duration-300 flex flex-col justify-between ${c.borderColor} bg-surface/50 hover:bg-surface/80 hover:shadow-[0_4px_24px_rgba(0,0,0,0.4)]`}
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <Hud className="text-dim text-[11px] truncate">{c.title}</Hud>
                <span
                  className={`border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider shrink-0 font-bold ${c.badgeColor}`}
                >
                  {c.badge}
                </span>
              </div>

              {/* Value display: Skeleton during load, real database value once ready */}
              <div className="mt-3 min-h-[44px] flex items-baseline">
                {loading || c.value === null ? (
                  <div className="h-10 w-28 animate-pulse bg-white/10 rounded" />
                ) : (
                  <p className={`font-display text-4xl font-black tracking-tight ${c.accentColor}`}>
                    {c.value}
                  </p>
                )}
              </div>

              <p className="mt-2 text-xs text-dim font-mono leading-relaxed">{c.sub}</p>
            </div>

            <div className="mt-5 pt-3 border-t border-white/10">
              <button
                onClick={() => onNavigateTab(c.targetTab)}
                className="w-full text-left font-mono text-xs text-dim hover:text-cyan hover:underline transition-colors cursor-pointer flex items-center justify-between"
              >
                <span>{c.actionLabel}</span>
              </button>
            </div>
          </Panel>
        ))}
      </div>

      {/* Styled sleek scroll progress helper hint */}
      <div className="mt-1 flex items-center justify-between text-[10px] font-mono text-dim px-1">
        <span>← Mouse wheel / trackpad / drag to scroll all metrics →</span>
        <span>
          {canScrollLeft && canScrollRight
            ? 'Scroll for more'
            : canScrollLeft
            ? 'End of board'
            : 'Start of board'}
        </span>
      </div>
    </div>
  )
}
