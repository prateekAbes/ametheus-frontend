import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { Container, Hud, Tabs, Badge, Cta, EmptyState } from '../components/ui'
import { gameBy, inr } from '../lib/data'
import { getMyRegistrations, type UserRegistrationItem } from '../services/tournaments'
import { useAuthContext } from '../context/AuthContext'

const T = ['Upcoming', 'Active', 'Completed', 'Cancelled'] as const

export default function MyRegistrations() {
  const { isSignedIn } = useAuthContext()
  const [tab, setTab] = useState<(typeof T)[number]>('Upcoming')
  const [regs, setRegs] = useState<UserRegistrationItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isSignedIn) {
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    getMyRegistrations()
      .then((data) => {
        if (Array.isArray(data)) setRegs(data)
      })
      .catch((err) => console.warn('Error fetching my registrations:', err))
      .finally(() => setIsLoading(false))
  }, [isSignedIn])

  const list = regs.filter((r) => {
    const s = (r.tournament_status || '').toUpperCase()
    if (tab === 'Upcoming')
      return (
        s === 'REGISTRATION_OPEN' ||
        s === 'REGISTRATION_CLOSED' ||
        s === 'UPCOMING' ||
        s === 'SCHEDULED'
      )
    if (tab === 'Active') return s === 'LIVE' || s === 'ONGOING' || s === 'IN_PROGRESS'
    if (tab === 'Completed') return s === 'COMPLETED' || s === 'FINISHED' || s === 'CONCLUDED'
    if (tab === 'Cancelled') return s === 'CANCELLED' || s === 'VOIDED'
    return true
  })

  return (
    <div className="relative min-h-screen bg-void pb-28 pt-32">
      <Container>
        <h1 className="reveal font-display text-[clamp(3rem,9vw,8rem)] font-black uppercase leading-[0.85]">
          My registrations
        </h1>
        <Tabs tabs={T} value={tab} onChange={setTab} className="mt-10" />
        <div className="mt-8 space-y-3">
          {isLoading ? (
            <div className="p-16 text-center border border-white/10 bg-surface/50">
              <div className="inline-block size-6 animate-spin rounded-full border-2 border-cyan border-t-transparent mb-3" />
              <Hud className="text-cyan">Checking your verified tournament entries...</Hud>
            </div>
          ) : list.length === 0 ? (
            <div className="border border-white/10 bg-surface/30 p-12 text-center flex flex-col items-center justify-center">
              <h3 className="font-display text-xl font-bold uppercase tracking-wider text-white mb-4">
                {tab === 'Upcoming'
                  ? 'No Upcoming Entries'
                  : tab === 'Active'
                  ? 'No Active Entries'
                  : tab === 'Completed'
                  ? 'No Completed Entries'
                  : 'No Canceled Entries'}
              </h3>
              {(tab === 'Upcoming' || tab === 'Active') && (
                <Link
                  to="/tournaments"
                  className="inline-flex items-center gap-2 border border-cyan bg-cyan/10 px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-cyan hover:bg-cyan hover:text-void transition-colors cursor-pointer"
                >
                  Browse Tournaments
                </Link>
              )}
            </div>
          ) : (
            list.map((r) => {
              const g = gameBy(r.game_slug || 'valorant')
              const isPaid = r.payment_status === 'PAID' || r.payment_status === 'FREE'
              return (
                <div
                  key={r.registration_id}
                  className="relative grid gap-5 overflow-hidden border border-white/10 bg-surface/50 p-5 md:grid-cols-[1fr_auto] md:items-center md:p-6"
                >
                  <span className="absolute inset-y-0 left-0 w-[3px]" style={{ background: g.accent }} />
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className="font-display text-sm font-black tracking-[0.15em]"
                        style={{ color: g.accent }}
                      >
                        {g.short}
                      </span>
                      <Badge
                        s={isPaid ? 'confirmed' : 'pending'}
                        label={isPaid ? 'Verified Entry' : r.payment_status}
                      />
                    </div>
                    <h3 className="mt-2 font-display text-3xl font-black uppercase md:text-4xl">
                      {r.tournament_title}
                    </h3>
                    <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                      {[
                        ['Team', r.team_name ? `${r.team_name} [${r.team_tag || 'TEAM'}]` : 'Solo Entry'],
                        ['Start Date', r.starts_at ? new Date(r.starts_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'TBD'],
                        ['Entry Fee', r.entry_fee_inr ? inr(r.entry_fee_inr) : 'Free Entry'],
                        ['Reg ID', r.registration_id.slice(0, 8).toUpperCase()],
                      ].map(([k, v]) => (
                        <div key={k}>
                          <Hud>{k}</Hud>
                          <p className="mt-1 text-sm">{v}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Cta small ghost to={`/tournaments/${r.tournament_slug || r.tournament_id}`}>
                    View tournament
                  </Cta>
                </div>
              )
            })
          )}
        </div>
      </Container>
    </div>
  )
}
