import { useMemo, useState, useEffect, useRef, type FormEvent } from 'react'
import { Badge, Container, Cta, Field, Hud, Panel, SectionHead, EmptyState, Brackets, Modal } from '../components/ui'
import EsportsHeroVisual from '../components/EsportsHeroVisual'
import {
  getSupportTickets,
  createSupportTicket,
  formatTicketStatus,
  type SupportTicket,
} from '../services/support'
import { useAuthContext } from '../context/AuthContext'

const CATS = [
  { n: 'Account', slug: 'account', g: '◉', d: 'Login, profile, game ID verification', span: 'md:col-span-2 md:row-span-2' },
  { n: 'Teams', slug: 'teams', g: '⬡', d: 'Rosters, invites, captain controls', span: '' },
  { n: 'Tournament Registration', slug: 'tournaments', g: '◈', d: 'Slots, check-in, eligibility', span: 'md:col-span-2' },
  { n: 'Payments', slug: 'payments', g: '₹', d: 'UPI QR, 12-digit UTR, gateway fees', span: '' },
  { n: 'Wallet', slug: 'wallet', g: '▣', d: 'Prize vault guarantee, withdrawals', span: '' },
  { n: 'Matches', slug: 'matches', g: '⚔', d: 'Lobbies, custom credentials, disputes', span: 'md:col-span-2' },
  { n: 'Rules', slug: 'rules', g: '§', d: 'Fair play, anti-cheat, formats', span: '' },
  { n: 'Technical Issues', slug: 'technical', g: '⚠', d: 'Bugs, connection lag, client errors', span: 'md:col-span-2' },
]

const CAT_SLUGS: Record<string, string> = {
  account: 'Account',
  teams: 'Teams',
  tournaments: 'Tournament Registration',
  registration: 'Tournament Registration',
  payments: 'Payments',
  wallet: 'Wallet',
  matches: 'Matches',
  rules: 'Rules',
  technical: 'Technical Issues',
  'technical-issues': 'Technical Issues',
}

const FAQ = [
  {
    c: 'Account',
    q: 'How do I verify my account and connect game IDs?',
    a: 'Visit your Profile or Settings page to link your in-game identities (Riot ID for Valorant, BGMI UID, Free Fire UID, or Steam ID). Linking your game ID allows arbiters to verify match lobby rosters seamlessly.',
  },
  {
    c: 'Account',
    q: 'Can I update my registered phone number or gamer handle?',
    a: 'Yes. You can edit your player handle and contact details in Settings. Game IDs cannot be changed while actively registered in an ongoing tournament bracket to preserve competitive integrity.',
  },
  {
    c: 'Teams',
    q: 'How do I form a competitive team and invite teammates?',
    a: 'Captains can create a team directly from the game hub (e.g. Games → Valorant → Create Team). Once created, you receive a unique 6-character cryptographic invite code. Teammates enter this code to join your roster instantly.',
  },
  {
    c: 'Teams',
    q: 'Can captains remove members or transfer captaincy?',
    a: 'Yes. Captains possess full roster controls on the team page, including kicking inactive members, designating substitutes, and assigning captaincy, provided the team is not currently locked in a live tournament round.',
  },
  {
    c: 'Tournament Registration',
    q: 'When does tournament registration close?',
    a: 'Registration closes 2 hours before the first scheduled match or when all maximum roster slots are filled, whichever comes first. Brackets generate immediately following registration lock.',
  },
  {
    c: 'Tournament Registration',
    q: 'Can players participate in multiple tournaments simultaneously?',
    a: 'Yes, as long as the match schedules do not overlap. If scheduled matches occur at the same hour, the forfeit grace countdown applies independently to each match lobby.',
  },
  {
    c: 'Payments',
    q: 'How do UPI QR payments and 12-digit UTR verifications work?',
    a: 'When registering for an entry-fee tournament or topping up your wallet, Ametheus generates an official dynamic UPI QR code. Pay using any UPI app (GPay, PhonePe, Paytm, CRED) and submit the 12-digit numeric UTR/Reference number. The system verifies and approves it promptly.',
  },
  {
    c: 'Payments',
    q: "My payment went through but my team still shows payment pending.",
    a: 'Bank IMPS/UPI gateways occasionally experience a 2–5 minute confirmation delay. If your status does not update after 10 minutes, submit a support ticket with your 12-digit UTR number and our payment operations team will reconcile it.',
  },
  {
    c: 'Wallet',
    q: 'How does the AMETHEUS Platform Prize Vault Guarantee operate?',
    a: 'Every tournament entry fee is locked into a tamper-evident prize holding vault prior to bracket generation. Upon match certification by arbiters, prize pool funds disburse directly to winning teams and players automatically within 30 minutes.',
  },
  {
    c: 'Wallet',
    q: 'What happens if a tournament is cancelled by the organizer?',
    a: 'If a tournament is cancelled, 100% of collected entry fees are automatically returned to player wallet balances within 2 hours, logged tamper-evidently to the platform audit ledger.',
  },
  {
    c: 'Wallet',
    q: 'How long do prize withdrawals to UPI take?',
    a: 'Withdrawals from your wallet balance to your UPI VPA are processed within 24 hours (usually under 2 hours during peak match hours). Bank transfers take up to 24–48 business hours.',
  },
  {
    c: 'Matches',
    q: 'What is the check-in protocol and forfeit grace period?',
    a: 'All participating teams must check in within their Match Lobby before scheduled match time. A strict 15-minute grace countdown begins at match hour. If a roster fails to check in before the timer expires, the match automatically records a forfeit loss.',
  },
  {
    c: 'Matches',
    q: 'Where do we receive custom lobby credentials and passwords?',
    a: 'Match lobby codes and passwords unlock directly inside the Match Lobby page once both opposing rosters complete check-in. Matches are hosted exclusively on official low-latency Mumbai AWS servers (ap-south-1).',
  },
  {
    c: 'Rules',
    q: 'How do I file a match dispute or submit anti-cheat evidence?',
    a: 'Click "Report Dispute" on the Match page within 30 minutes of match completion. Provide screenshots, replay links, or video timestamps. Official arbiters review dispute logs and lock final results.',
  },
  {
    c: 'Rules',
    q: 'Are emulators allowed in mobile tournaments?',
    a: 'No. BGMI and Free Fire tournaments are strictly mobile device-only. Emulator or third-party virtualization software results in immediate disqualification and competitive bans.',
  },
  {
    c: 'Technical Issues',
    q: "The app won't load my tournament bracket or lobby.",
    a: 'Perform a hard refresh (Ctrl+Shift+R / Cmd+Shift+R) or clear browser cache. If the issue persists, submit a support ticket including your device and browser details.',
  },
  {
    c: 'Technical Issues',
    q: 'What server regions does Ametheus host matches on?',
    a: 'All official tournaments operate on Indian low-latency dedicated server clusters (Mumbai & Pune, ~14ms average ping) with DDoS mitigation.',
  },
]

const sel =
  'mt-2 w-full border border-white/15 bg-surface p-3 text-sm text-ink outline-none focus:border-cyan [&>option]:bg-graphite'

export default function Support() {
  const { isSignedIn, profile } = useAuthContext()
  const faqSectionRef = useRef<HTMLDivElement>(null)

  const [q, setQ] = useState('')
  const [cat, setCat] = useState<string | null>(null)
  const [open, setOpen] = useState<number | null>(0)
  const [form, setForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sentTicketNumber, setSentTicketNumber] = useState('')
  const [userTickets, setUserTickets] = useState<SupportTicket[]>([])

  // Form fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Account')
  const [paymentType, setPaymentType] = useState('UPI')
  const [message, setMessage] = useState('')

  // Pre-fill user data when modal opens
  useEffect(() => {
    if (profile) {
      if (!name) setName(profile.display_name || profile.username || '')
      if (!email) setEmail(profile.email || '')
    }
  }, [profile, form])

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

  // Hash deep-linking
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase()
      if (hash && CAT_SLUGS[hash]) {
        setCat(CAT_SLUGS[hash])
        setTimeout(() => {
          if (faqSectionRef.current) {
            const y = faqSectionRef.current.getBoundingClientRect().top + window.scrollY - 110
            window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' })
          }
        }, 120)
      }
    }
    handleHash()
    window.addEventListener('hashchange', handleHash)
    return () => window.removeEventListener('hashchange', handleHash)
  }, [])

  const handleSelectCat = (categoryName: string) => {
    const next = cat === categoryName ? null : categoryName
    setCat(next)
    if (next) {
      const slug = Object.entries(CAT_SLUGS).find(([_, v]) => v === next)?.[0] || 'faq'
      window.history.replaceState(null, '', `#${slug}`)
      setTimeout(() => {
        if (faqSectionRef.current) {
          const y = faqSectionRef.current.getBoundingClientRect().top + window.scrollY - 110
          window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' })
        }
      }, 50)
    } else {
      window.history.replaceState(null, '', window.location.pathname)
    }
  }

  const list = useMemo(
    () =>
      FAQ.filter(
        (f) => (!cat || f.c === cat) && (f.q + f.a).toLowerCase().includes(q.toLowerCase())
      ),
    [q, cat]
  )

  const isPaymentCategory = ['Payments', 'Wallet', 'Tournament Registration'].includes(selectedCategory)

  const handleSubmitTicket = async (e: FormEvent) => {
    e.preventDefault()
    if (!message.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const res = await createSupportTicket({
        name: name.trim() || 'Contender',
        email: email.trim() || 'support@ametheus.games',
        subject: subject.trim() || message.trim().slice(0, 50),
        category: selectedCategory,
        payment_type: isPaymentCategory ? paymentType : undefined,
        description: message.trim(),
        message: message.trim(),
      })
      const ticketNum = res?.ticket_id || res?.ticket_number || res?.id || 'AMT-TICKET'
      setSentTicketNumber(String(ticketNum).toUpperCase())
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
        <EsportsHeroVisual variant="support" />
        <div className="grid-floor absolute -inset-x-1/2 bottom-0 h-1/2 opacity-50" />
        <Container className="relative">
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
        <SectionHead title="Browse topics" size="md" />
        <div className="mt-10 grid auto-rows-[160px] grid-cols-2 gap-3 md:grid-cols-5">
          {CATS.map((c) => (
            <button
              key={c.n}
              id={`cat-${c.slug}`}
              onClick={() => handleSelectCat(c.n)}
              className={`group relative flex flex-col justify-between overflow-hidden border p-5 text-left transition-all hover:-translate-y-0.5 ${
                c.span
              } ${
                cat === c.n
                  ? 'border-cyan bg-cyan/10'
                  : 'border-white/10 bg-surface hover:border-white/30'
              }`}
            >
              <span className="inline-block font-display text-4xl text-cyan origin-left transition-transform duration-300 group-hover:scale-110">
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

      <div ref={faqSectionRef} className="scroll-mt-28" />

      <Container className="grid gap-16 pb-20 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="flex items-center justify-between">
            <SectionHead title="Knowledge Base & FAQ" size="md" />
            {cat && (
              <button
                onClick={() => {
                  setCat(null)
                  window.history.replaceState(null, '', window.location.pathname)
                }}
                className="font-mono text-xs uppercase text-cyan hover:underline"
              >
                Show All Topics
              </button>
            )}
          </div>
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
              <div key={f.q} id={`faq-${i}`} className="scroll-mt-28">
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
                  <p className="overflow-hidden text-dim leading-relaxed">{f.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <SectionHead title="Tickets" size="md" />
          <Panel className="mt-8 p-6">
            <Hud>Direct Arbiter & Staff Assistance</Hud>
            <p className="mt-2 text-dim text-sm">
              Our operations crew answers tickets within 4 hours. You will receive an official email confirmation and real-time status updates.
            </p>
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

          <div className="mt-10 flex items-center justify-between border-b border-white/15 pb-4">
            <h3 className="font-display text-2xl font-black uppercase tracking-wider text-white">
              My Open Tickets
            </h3>
            <span className="font-mono text-xs sm:text-sm font-black text-cyan bg-cyan/15 border border-cyan/40 px-3 py-1 rounded-sm shadow-xs">
              {userTickets.length} {userTickets.length === 1 ? 'Ticket' : 'Tickets'}
            </span>
          </div>
          <ul className="mt-4 space-y-3 font-mono text-xs">
            {userTickets.length === 0 ? (
              <li className="border border-white/15 bg-surface/50 p-8 text-center rounded-sm">
                <p className="font-display text-lg md:text-xl font-bold uppercase tracking-wide text-white">
                  {isSignedIn ? 'No support ticket raised yet' : 'Sign in to view your open support tickets'}
                </p>
                <p className="mt-2 text-xs md:text-sm text-dim">
                  {isSignedIn
                    ? 'Need assistance? Use the button above to reach our 24/7 arbiter operations crew.'
                    : 'Access your ticket history and check arbiter resolutions.'}
                </p>
              </li>
            ) : (
              userTickets.map((t) => (
                <li
                  key={t.id || (t as any).ticket_id}
                  className="flex flex-wrap items-center justify-between gap-3 border border-white/10 bg-surface/50 p-4"
                >
                  <div>
                    <Hud>
                      {t.ticket_id || t.id.slice(0, 8)} · {t.category} ·{' '}
                      {new Date(t.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </Hud>
                    <p className="mt-1 font-semibold text-ink font-sans text-sm">
                      {t.subject || t.description?.slice(0, 45) || 'Support Inquiry'}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider font-bold ${
                      formatTicketStatus(t.status).badgeClass
                    }`}
                  >
                    <span className="size-1.5 rounded-full bg-current" />
                    {formatTicketStatus(t.status).label}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </Container>

      {/* CREATE TICKET MODAL */}
      {form && (
        <Modal
          open={Boolean(form)}
          onClose={() => setForm(false)}
          raw
          maxWidth="max-w-2xl"
          className="p-6 md:p-10"
        >
          <div className="relative">
            <button
              onClick={() => setForm(false)}
              className="absolute right-0 top-0 font-mono text-xs text-dim hover:text-ink cursor-pointer"
              aria-label="Close"
            >
              ESC ✕
            </button>

            {sentTicketNumber ? (
              <div className="py-10 text-center">
                <Hud className="text-ok">◆ Ticket Logged Successfully</Hud>
                <h3 className="mt-3 font-display text-4xl md:text-5xl font-black uppercase text-cyan">
                  {sentTicketNumber}
                </h3>
                <p className="mx-auto mt-4 max-w-md text-dim text-sm">
                  We have registered your ticket in the platform support database. An official acknowledgement has been recorded and an arbiter will review your request.
                </p>
                <Cta className="mt-8" small onClick={() => setForm(false)}>
                  Back to Help Center
                </Cta>
              </div>
            ) : (
              <form onSubmit={handleSubmitTicket} className="space-y-4">
                <div>
                  <h3 className="font-display text-3xl font-black uppercase text-ink">
                    New Support Ticket
                  </h3>
                  <p className="text-xs text-dim mt-1">Submit an official support request to platform arbiters.</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs text-dim font-mono">Your Name</label>
                    <input
                      required
                      placeholder="Player or Captain Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-dim font-mono">Contact Email</label>
                    <input
                      required
                      type="email"
                      placeholder="you@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan text-sm"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs text-dim font-mono">Topic Category</label>
                    <select
                      className={sel}
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                      {CATS.map((c) => (
                        <option key={c.n} value={c.n}>{c.n}</option>
                      ))}
                    </select>
                  </div>

                  {isPaymentCategory ? (
                    <div>
                      <label className="text-xs text-dim font-mono">Payment / Transaction Method</label>
                      <select
                        className={sel}
                        value={paymentType}
                        onChange={(e) => setPaymentType(e.target.value)}
                      >
                        <option value="UPI">UPI App (GPay / PhonePe / Paytm)</option>
                        <option value="WALLET">Wallet Balance</option>
                        <option value="REGISTRATION_PAYMENT">Tournament Registration Fee</option>
                        <option value="WITHDRAWAL">Prize Vault Withdrawal</option>
                        <option value="OTHER">Other Method</option>
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="text-xs text-dim font-mono">Subject / Brief</label>
                      <input
                        placeholder="e.g. Lobby credentials or Bracket question"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan text-sm"
                      />
                    </div>
                  )}
                </div>

                {isPaymentCategory && (
                  <div>
                    <label className="text-xs text-dim font-mono">Subject / Reference Title</label>
                    <input
                      placeholder="e.g. UTR Reconcile / Wallet Topup Issue"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan text-sm"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs text-dim font-mono">Description / Issue Details (Include UTR or Match IDs)</label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Provide detailed information, 12-digit UTR numbers, or match lobby references..."
                    className="mt-1 w-full resize-none border border-white/15 bg-surface p-3 text-ink outline-none placeholder:text-white/25 focus:border-cyan text-sm"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setForm(false)}
                    className="border border-white/20 px-4 py-2 font-mono text-xs uppercase text-dim hover:text-ink"
                  >
                    Cancel
                  </button>
                  <Cta type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Submitting...' : 'Submit Support Ticket'}
                  </Cta>
                </div>
              </form>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}
