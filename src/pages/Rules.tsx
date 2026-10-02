import { Container, Hud, SectionHead } from '../components/ui'

const SECTIONS = [
  {
    title: 'Code of Conduct & Sportsmanship',
    rules: [
      'Respect all competitors, arbiters, organizers, and casters at all times.',
      'Harassment, toxic conduct, hate speech, or defamatory remarks will lead to an immediate and permanent account ban.',
      'Intentional disconnecting, game throwing, or forfeit collusion is strictly prohibited.',
    ],
  },
  {
    title: 'Anti-Cheat & Competitive Integrity',
    rules: [
      'Use of any unauthorized third-party software, macros, emulators, scripts, or client modifications is an instant disqualification and wallet forfeiture.',
      'Account sharing, smurfing, or playing under an identity other than your registered account is strictly forbidden.',
      'Arbiters reserve the right to request live stream evidence or gameplay screen recording at any stage.',
    ],
  },
  {
    title: 'Match Protocols & Check-in',
    rules: [
      'Check-in opens 30 minutes before your scheduled match time in the Match Lobby.',
      'Room credentials (ID & Password) will be revealed in your match room 10 minutes prior to match launch.',
      'Teams that fail to enter the lobby within 10 minutes of scheduled start time will be forfeited.',
    ],
  },
  {
    title: 'Disputes & Result Verification',
    rules: [
      'All disputes must be raised through the Match Room dispute interface within 15 minutes of match conclusion.',
      'Valid screenshot or video evidence showing end-game scoreboard or clear violation is required for dispute arbitration.',
      'Tournament Arbiters hold final decision-making authority on all rulings.',
    ],
  },
  {
    title: 'Prize Payouts & Refunds',
    rules: [
      'Tournament winnings are credited directly to your AMETHEUS wallet within 24 hours of final match verification.',
      'Entry fees are deducted upon registration and are non-refundable once registration closes, unless the tournament is cancelled by administration.',
      'Withdrawals via UPI are processed securely following bank verification.',
    ],
  },
]

export default function Rules() {
  return (
    <div className="min-h-screen bg-void pb-36 pt-28">
      <Container>
        <div className="border-b border-white/10 pb-8">
          <Hud className="text-cyan">COMPETITIVE REGULATIONS</Hud>
          <h1 className="mt-2 font-display text-[clamp(2.5rem,6vw,5.5rem)] font-black uppercase leading-none">
            Official Rulebook
          </h1>
          <p className="mt-2 text-dim max-w-xl">
            Governing rules, fair play standards, and match protocols across all AMETHEUS tournaments.
          </p>
        </div>

        <div className="mt-12 space-y-12">
          {SECTIONS.map((sec, idx) => (
            <div key={sec.title} className="border border-white/15 bg-graphite p-8">
              <div className="flex items-center gap-3">
                <span className="font-mono text-cyan text-sm">0{idx + 1}</span>
                <h2 className="font-display text-2xl font-black uppercase text-ink">{sec.title}</h2>
              </div>
              <ul className="mt-6 space-y-3 font-sans text-sm text-dim">
                {sec.rules.map((r, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-1 size-1.5 rounded-full bg-cyan shrink-0" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Container>
    </div>
  )
}
