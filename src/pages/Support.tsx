import { useMemo, useState, useEffect, type FormEvent } from 'react'
import { Badge, Container, Cta, Field, Hud, Panel, SectionHead, EmptyState, Brackets } from '../components/ui'
import {
  getSupportTickets,
  createSupportTicket,
  type SupportTicket,
} from '../services/support'
import { useAuthContext } from '../context/AuthContext'

const CATS = [
  { n: 'Account', g: '◉', d: 'Login, profile, verification', span: 'md:col-span-2 md:row-span-2' },
  { n: 'Teams', g: '⬡', d: 'Rosters, invites, captains', span: '' },
  { n: 'Tournament Registration', g: '◈', d: 'Slots, check-in, eligibility', span: 'md:col-span-2' },
  { n: 'Payments', g: '₹', d: 'Entry fees, UPI, cards', span: '' },
  { n: 'Wallet', g: '▣', d: 'Balance, withdrawals, winnings', span: '' },
  { n: 'Matches', g: '⚔', d: 'Schedules, results, disputes', span: 'md:col-span-2' },
  { n: 'Rules', g: '§', d: 'Fair play, penalties, formats', span: '' },
  { n: 'Technical Issues', g: '⚠', d: 'Bugs, lag, app crashes', span: 'md:col-span-2' },
]

const FAQ = [
  { c: 'Account', q: 'How do I verify my account?', a: 'Enter the 6-digit code we email you after sign up. Codes expire in 10 minutes; you can request a new one from the verification screen.' },
  { c: 'Teams', q: 'How many players can be on a roster?', a: 'Rosters can hold the squad size plus one substitute. BGMI and Free Fire allow 5, Valorant and CODM allow 6.' },
  { c: 'Tournament Registration', q: 'When does registration close?', a: 'Registration closes 2 hours before the first match or when all slots are filled, whichever comes first.' },
  { c: 'Payments', q: "My payment went through but I'm not registered.", a: 'Payments can take up to 15 minutes to confirm. If it still shows pending, raise a ticket with your transaction ID and we will reconcile it.' },
  { c: 'Wallet', q: 'How long do withdrawals take?', a: 'Withdrawals to UPI are processed within 24 hours. Bank transfers can take up to 3 business days.' },
  { c: 'Matches', q: 'How do I dispute a match result?', a: 'Open the match page and select Report Issue within 30 minutes of the match ending. Attach screenshots or recordings.' },
  { c: 'Rules', q: 'Are emulators allowed in mobile tournaments?', a: 'No. Mobile tournaments are device-only. Emulator use results in disqualification of the full team.' },
  { c: 'Technical Issues', q: "The app won't load my bracket.", a: 'Clear your cache and refresh. If it persists, include your device and browser in a support ticket.' },
]

const sel =
  'mt-2 w-full border-b border-white/15 bg-transparent py-3 text-lg text-ink outline-none focus:border-cyan [&>option]:bg-surface'

export default function Support() {
  const { isSignedIn, profile } = useAuthContext()

  const [q, setQ] = useState('')
  const [cat, setCat] = useState<string | null>(null)
  const [open, setOpen] = useState<number | null>(0)
  const [form, setForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sentTicketNumber, setSentTicketNumber] = useState('')
  const [userTickets, setUserTickets] = useState<SupportTicket[]>([])

  // Form fields
  const [subject, setSubject] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Account')
  const [message, setMessage] = useState('')

  const fetchTickets = () => {
    if (!isSignedIn) return
    getSupportTickets()
      .then((data) => {
        if (Array.isArray(data)) setUserTickets(data)
      })
      .catch(() => {})
  }

  useEffect(() => {
    fetchTickets()
  }, [isSignedIn])

  const list = useMemo(
    () =>
      FAQ.filter(
        (f) => (!cat || f.c === cat) && (f.q + f.a).toLowerCase().includes(q.toLowerCase())
      ),
    [q, cat]
  )

  const handleSubmitTicket = async (e: FormEvent) => {
    e.preventDefault()
    if (!subject.trim() || !message.trim()) return

    setIsSubmitting(true)
    try {
      const res = await createSupportTicket({
        subject: subject.trim(),
        category: selectedCategory,
        message: message.trim(),
        priority: 'MEDIUM',
      })
      setSentTicketNumber(res.ticket_number || res.id.slice(0, 8).toUpperCase())
      setSubject('')
      setMessage('')
      fetchTickets()
    } catch (err: any) {
      alert(err.message || 'Failed to submit ticket.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-void">
      <section className="relative overflow-hidden pb-20 pt-36">
        <div className="grid-floor absolute -inset-x-1/2 bottom-0 h-1/2 opacity-50" />
        <Container className="relative">
          <div className="mb-6 flex items-center gap-4">
            <span className="h-px w-12 bg-cyan" />
            <Hud className="text-ink">AMETHEUS Help Center</Hud>
          </div>
          <h1 className="reveal font-display text-[clamp(3.5rem,12vw,11rem)] font-black uppercase leading-[0.8]">
            How can<br /><span className="text-cyan">we help?</span>
          </h1>
          <div className="relative mt-12 max-w-3xl border border-white/15 bg-surface/60 focus-within:border-cyan">
            <Brackets color="border-cyan/60" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search for help..."
              aria-label="Search for help"
              className="w-full bg-transparent px-6 py-6 font-display text-2xl font-bold uppercase outline-none placeholder:text-white/25 md:text-4xl"
            />
            <Hud className="absolute right-5 top-1/2 -translate-y-1/2">{list.length} results</Hud>
          </div>
        </Container>
      </section>

      <Container className="py-20">
        <SectionHead idx="01" kicker="Categories" title="Browse topics" size="md" />
        <div className="mt-10 grid auto-rows-[160px] grid-cols-2 gap-3 md:grid-cols-5">
          {CATS.map((c) => (
            <button
              key={c.n}
              onClick={() => setCat(cat === c.n ? null : c.n)}
              className={`group relative flex flex-col justify-between overflow-hidden border p-5 text-left transition-all hover:-translate-y-0.5 ${
                c.span
              } ${
                cat === c.n
                  ? 'border-cyan bg-cyan/10'
                  : 'border-white/10 bg-surface hover:border-white/30'
              }`}
            >
              <span className="font-display text-4xl text-cyan transition-transform group-hover:scale-110">
                {c.g}
              </span>
              <span className="pointer-events-none absolute -right-4 -top-6 font-display text-[8rem] leading-none text-white/[0.03]">
                {c.g}
              </span>
              <div>
                <p className="font-display text-xl font-black uppercase leading-none md:text-2xl">
                  {c.n}
                </p>
                <Hud className="mt-2 block">{c.d}</Hud>
              </div>
            </button>
          ))}
        </div>
      </Container>

      <Container className="grid gap-16 pb-20 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <SectionHead idx="02" kicker={cat ?? 'All topics'} title="FAQ" size="md" />
          <div className="mt-8 divide-y divide-white/10 border-y border-white/10">
            {list.length === 0 && (
              <div className="py-6">
                <EmptyState
                  code="?"
                  title="No answers found"
                  body="Try different keywords or create a support ticket."
                />
              </div>
            )}
            {list.map((f, i) => (
              <div key={f.q}>
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  aria-expanded={open === i}
                  className="flex w-full items-center justify-between gap-6 py-6 text-left"
                >
                  <span>
                    <Hud className="text-cyan">{f.c}</Hud>
                    <span className="mt-1 block font-display text-2xl font-bold uppercase leading-tight">
                      {f.q}
                    </span>
                  </span>
                  <span
                    className={`font-display text-3xl text-cyan transition-transform ${
                      open === i ? 'rotate-45' : ''
                    }`}
                  >
                    +
                  </span>
                </button>
                <div
                  className={`grid transition-all duration-300 ${
                    open === i ? 'grid-rows-[1fr] pb-6' : 'grid-rows-[0fr]'
                  }`}
                >
                  <p className="overflow-hidden text-dim">{f.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <SectionHead idx="03" kicker="Support" title="Tickets" size="md" />
          <Panel className="mt-8 p-6">
            <Hud>Still stuck?</Hud>
            <p className="mt-2 text-dim">Our operations crew answers tickets within 4 hours.</p>
            <Cta
              className="mt-5 w-full"
              onClick={() => {
                setForm(true)
                setSentTicketNumber('')
              }}
            >
              Create Support Ticket
            </Cta>
          </Panel>
          <Hud className="mt-10 block">My tickets ({userTickets.length})</Hud>
          <ul className="mt-3 space-y-2">
            {userTickets.length === 0 ? (
              <li className="border border-white/10 p-4 text-xs text-dim text-center">
                No support tickets raised yet.
              </li>
            ) : (
              userTickets.map((t) => (
                <li
                  key={t.id}
                  className="flex flex-wrap items-center justify-between gap-3 border border-white/10 p-4"
                >
                  <div>
                    <Hud>
                      {t.ticket_number || t.id.slice(0, 8)} · {t.category} ·{' '}
                      {new Date(t.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </Hud>
                    <p className="mt-1 font-semibold">{t.subject}</p>
                  </div>
                  <Badge s={(t.status.toLowerCase() as any) || 'open'} />
                </li>
              ))
            )}
          </ul>
        </div>
      </Container>

      {form && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-void/85 p-4 md:items-center"
          role="dialog"
          aria-modal="true"
        >
          <Panel className="w-full max-w-2xl p-6 md:p-10 relative">
            <Brackets color="border-cyan/50" />
            <button
              onClick={() => setForm(false)}
              className="absolute right-5 top-5 font-mono text-xs text-dim hover:text-ink"
              aria-label="Close"
            >
              ESC ✕
            </button>
            {sentTicketNumber ? (
              <div className="py-10 text-center">
                <Hud className="text-ok">◆ Ticket received</Hud>
                <h3 className="mt-3 font-display text-5xl font-black uppercase">
                  {sentTicketNumber}
                </h3>
                <p className="mx-auto mt-3 max-w-sm text-dim">
                  We've logged your ticket in our database. Our team will review and reply within 4 hours.
                </p>
                <Cta className="mt-8" small onClick={() => setForm(false)}>
                  Back to Help Center
                </Cta>
              </div>
            ) : (
              <form onSubmit={handleSubmitTicket} className="grid gap-7 md:grid-cols-2">
                <h3 className="font-display text-4xl font-black uppercase md:col-span-2">
                  New Support Ticket
                </h3>
                <Field
                  label="Subject"
                  required
                  placeholder="e.g. UTR pending or Match dispute"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
                <label className="block">
                  <Hud>Category</Hud>
                  <select
                    className={sel}
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    {CATS.map((c) => (
                      <option key={c.n}>{c.n}</option>
                    ))}
                  </select>
                </label>
                <label className="block md:col-span-2">
                  <Hud>Description / Issue Details</Hud>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us what happened with any reference numbers..."
                    className="mt-2 w-full resize-none border border-white/15 bg-transparent p-3 text-ink outline-none placeholder:text-white/25 focus:border-cyan"
                  />
                </label>
                <div className="md:col-span-2">
                  <Cta type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? 'Submitting...' : 'Submit Support Ticket'}
                  </Cta>
                </div>
              </form>
            )}
          </Panel>
        </div>
      )}
    </div>
  )
}
