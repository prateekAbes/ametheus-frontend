import { useState } from 'react'
import { Avatar, Badge, Chips, Container, Crest, Cta, EmptyState, Field, Hud, SectionHead, Tabs, Toggle } from '../components/ui'
import { AVATARS } from '../lib/data'

const COLORS = [['void', 'bg-void'], ['graphite', 'bg-graphite'], ['surface', 'bg-surface'], ['ink', 'bg-ink'], ['dim', 'bg-dim'], ['cyan', 'bg-cyan'], ['violet', 'bg-violet'], ['magenta', 'bg-magenta'], ['live', 'bg-live'], ['ok', 'bg-ok'], ['warn', 'bg-warn']]
const STATES = [
  { code: '404', title: 'Page not found', body: "You've dropped outside the zone. This page doesn't exist.", cta: 'Back to base', to: '/' },
  { code: '403', title: 'Access denied', body: "You don't have clearance for this area.", cta: 'Log in', to: '/sign-in' },
  { code: '500', title: 'Server error', body: "The server got knocked. We're reviving it.", cta: 'Retry', to: '/states' },
  { code: '0T', title: 'No tournaments', body: 'No tournaments match these filters. New brackets drop every week.', cta: 'Browse all', to: '/tournaments' },
  { code: '0S', title: 'No teams', body: "You're flying solo. Create a squad or accept an invite.", cta: 'Create team', to: '/teams' },
  { code: 'VS', title: 'No matches', body: 'No matches scheduled yet. Register for a tournament to get on the board.', cta: 'Find tournaments', to: '/tournaments' },
  { code: '₹0', title: 'No transactions', body: 'Your wallet history is empty. Add funds to enter paid tournaments.', cta: 'Open wallet', to: '/wallet' },
  { code: '00', title: 'No notifications', body: "All quiet on the comms. We'll ping you when something drops." },
  { code: 'REG', title: 'No registrations', body: "You haven't registered for anything yet. Your first bracket is waiting.", cta: 'Register now', to: '/tournaments' },
]

export default function States() {
  const [tab, setTab] = useState<'Overview' | 'Brackets' | 'Results'>('Overview')
  const [chip, setChip] = useState<'All' | 'BGMI' | 'Valorant'>('All')
  const [on, setOn] = useState(true)
  return (
    <div className="bg-void pb-28 pt-32">
      <Container>
        <SectionHead idx="00" kicker="Design reference" title="System" />

        <div className="mt-14 grid gap-12 lg:grid-cols-2">
          <div><Hud>Colors</Hud>
            <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6">
              {COLORS.map(([n, c]) => <div key={n}><div className={`h-14 border border-white/10 ${c}`} /><Hud className="mt-1 block">{n}</Hud></div>)}
            </div>
          </div>
          <div><Hud>Type scale</Hud>
            <div className="mt-4 space-y-2">
              <p className="font-display text-7xl font-black uppercase leading-none">Display</p>
              <p className="font-display text-4xl font-black uppercase">Heading 2</p>
              <p className="text-lg">Body — Instrument Sans for readable copy.</p>
              <Hud>Mono HUD label · JetBrains Mono</Hud>
            </div>
          </div>
          <div><Hud>Buttons</Hud><div className="mt-4 flex flex-wrap gap-3"><Cta>Primary</Cta><Cta ghost>Ghost</Cta><Cta small>Small</Cta><Cta small disabled>Disabled</Cta></div></div>
          <div><Hud>Badges</Hud><div className="mt-4 flex flex-wrap gap-2">{['open', 'upcoming', 'live', 'completed', 'cancelled', 'pending', 'failed', 'in progress', 'resolved', 'closed'].map((s) => <Badge key={s} s={s} />)}</div></div>
          <div><Hud>Inputs</Hud><div className="mt-4 grid gap-6 sm:grid-cols-2"><Field label="Username" placeholder="VYRUS" /><Field label="Email" placeholder="you@email.com" hint="We never share it." /></div><div className="mt-6 flex items-center gap-3"><Toggle label="Toggle" on={on} onChange={setOn} /><Hud>Toggle {on ? 'on' : 'off'}</Hud></div></div>
          <div><Hud>Tabs & chips</Hud><Tabs className="mt-2" tabs={['Overview', 'Brackets', 'Results'] as const} value={tab} onChange={setTab} /><div className="mt-4"><Chips items={['All', 'BGMI', 'Valorant'] as const} value={chip} onChange={setChip} /></div></div>
          <div><Hud>Tooltip</Hud>
            <div className="mt-4"><span className="group relative inline-block cursor-help border-b border-dashed border-dim">Prize pool split
              <span className="pointer-events-none absolute bottom-full left-0 mb-3 w-56 border border-white/15 bg-surface p-3 text-sm text-dim opacity-0 transition-opacity group-hover:opacity-100">50% / 30% / 20% to the top three squads.</span>
            </span></div>
          </div>
          <div><Hud>Avatar & crest</Hud><div className="mt-4 flex items-center gap-4">{AVATARS.slice(0, 3).map((a) => <Avatar key={a} id={a} size={48} />)}<Crest name="Team Alpha" /><Crest name="Night Wolves" color="#ff3dbb" /></div></div>
        </div>

        <SectionHead className="mt-28" idx="01" kicker="Empty & error states" title="States" size="md" />
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {STATES.map((s) => <EmptyState key={s.title} {...s} />)}
        </div>
      </Container>
    </div>
  )
}
