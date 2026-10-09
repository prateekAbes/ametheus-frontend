import { useEffect, useLayoutEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation, useOutlet, ScrollRestoration } from 'react-router'
import { useClerk } from '@clerk/react'
import { motion } from 'framer-motion'
import { useGsapPage } from '../lib/motion'
import { useAuthContext } from '../context/AuthContext'
import { getNotifications } from '../services/notifications'
import AccountMenu from './AccountMenu'
import { Hud } from './ui'
import { ME, inr } from '../lib/data'

const MAIN = [
  ['Home', '/'],
  ['Games', '/games'],
  ['Tournaments', '/tournaments'],
  ['Matches', '/matches'],
  ['Leaderboard', '/leaderboard'],
  ['Teams', '/teams'],
  ['Wallet', '/wallet'],
  ['Support', '/support'],
] as const
const PROFILE = [
  ['Profile', '/profile'],
  ['My Team', '/teams'],
  ['My Registrations', '/my/registrations'],
  ['My Matches', '/my/matches'],
  ['Wallet', '/wallet'],
  ['Transactions', '/transactions'],
  ['Settings', '/settings'],
] as const

export function Logo() {
  return (
    <Link to="/" className="group flex items-center gap-2.5 outline-none select-none">
      <span className="relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded border border-white/10 bg-surface/60 p-1 transition-colors duration-300 group-hover:border-cyan/50">
        <svg
          width="20"
          height="18"
          viewBox="0 0 30 28"
          fill="none"
          aria-hidden
          className="shrink-0 transition-transform duration-300 origin-center group-hover:scale-105"
        >
          <polygon points="3,7 25,7 27,2 5,2" fill="#3ef2ff" />
          <polygon points="7,15 21,15 23,10 9,10" fill="#3ef2ff" />
          <polygon points="11,23 17,23 19,18 13,18" fill="#3ef2ff" />
        </svg>
      </span>
      <span className="font-display text-xl font-black tracking-[0.18em] text-white transition-colors duration-300 group-hover:text-cyan">
        AMETHEUS
      </span>
    </Link>
  )
}

function Nav() {
  const location = useLocation()
  const [drawer, setDrawer] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const { isSignedIn } = useAuthContext()
  const clerk = useClerk()
  useEffect(() => { setDrawer(false) }, [location.pathname])

  useEffect(() => {
    if (drawer) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [drawer])

  useEffect(() => {
    if (isSignedIn) {
      getNotifications()
        .then((items) => {
          if (Array.isArray(items)) {
            setUnreadCount(items.filter((n) => !n.is_read).length)
          } else {
            setUnreadCount(0)
          }
        })
        .catch(() => setUnreadCount(0))
    } else {
      setUnreadCount(0)
    }
  }, [isSignedIn, location.pathname])

  useEffect(() => {
    // sentinel observer: no scroll listener, state flips only at the threshold
    const s = document.createElement('div')
    s.style.cssText = 'position:absolute;top:0;left:0;height:40px;width:1px;pointer-events:none'
    document.body.prepend(s)
    const io = new IntersectionObserver(([e]) => setScrolled(!e.isIntersecting))
    io.observe(s)
    return () => { io.disconnect(); s.remove() }
  }, [])

  return (
    <>
      {/* Integrated header: a soft gradient over the hero at rest; a thin translucent surface fades in once scrolled. Only opacity animates. */}
      <header className="fixed inset-x-0 top-0 z-50">
        <div aria-hidden className={`pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-void/80 via-void/30 to-transparent transition-opacity duration-700 ${scrolled ? 'opacity-0' : 'opacity-100'}`} />
        <div aria-hidden className={`pointer-events-none absolute inset-0 border-b border-white/[0.06] bg-void/70 shadow-[0_10px_40px_-20px_rgb(0_0_0/.8)] backdrop-blur-md transition-opacity duration-700 ${scrolled ? 'opacity-100' : 'opacity-0'}`} />
        <nav className="relative mx-auto flex h-16 max-w-[1600px] items-center justify-between px-5 md:h-[72px] md:px-10">
          <Logo />
          <ul className="hidden items-center gap-1 xl:flex">
            {MAIN.map(([l, to]) => (
              <li key={l}>
                <NavLink to={to} end={to === '/'} className={({ isActive }) => `group relative block px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.22em] transition-[color,opacity] duration-300 ${isActive ? 'text-ink' : 'text-ink/55 hover:text-ink'}`}>
                  {({ isActive }) => (
                    <>
                      <span className="inline-block transition-transform duration-300 group-hover:-translate-y-px">{l}</span>
                      {isActive
                        ? <motion.span layoutId="nav-active" transition={{ type: 'spring', stiffness: 380, damping: 32 }} className="absolute inset-x-3.5 bottom-0.5 h-px bg-cyan shadow-[0_0_8px_rgb(62_242_255/.7)]" />
                        : <span className="absolute inset-x-3.5 bottom-0.5 h-px origin-left scale-x-0 bg-white/40 transition-transform duration-300 group-hover:scale-x-100" />}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-2">
            <Link to="/notifications" aria-label="Notifications" className="relative grid size-10 place-items-center text-ink/70 transition-colors hover:text-cyan">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 grid size-3.5 place-items-center rounded-full bg-magenta font-mono text-[8px] text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
            <AccountMenu />
            <button onClick={() => setDrawer(true)} className="grid size-10 place-items-center xl:hidden" aria-label="Open menu">
              <span className="flex flex-col gap-1"><span className="h-px w-4 bg-ink" /><span className="h-px w-2.5 self-end bg-cyan" /></span>
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Drawer Backdrop & Panel */}
      <div
        className={`fixed inset-0 z-[60] bg-black/80 backdrop-blur-md transition-opacity duration-300 xl:hidden ${
          drawer ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setDrawer(false)}
      >
        <div
          className={`absolute inset-x-0 top-0 max-h-[92vh] flex flex-col bg-void border-b border-white/10 transition-transform duration-300 ease-out shadow-2xl ${
            drawer ? 'translate-y-0' : '-translate-y-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-5 md:px-10">
            <Logo />
            <button
              onClick={() => setDrawer(false)}
              className="flex items-center gap-2 border border-white/15 bg-surface/50 px-3 py-1.5 font-mono text-[11px] font-bold tracking-[0.2em] text-ink hover:border-cyan hover:text-cyan transition-colors cursor-pointer"
            >
              CLOSE ✕
            </button>
          </div>
          <div className="no-scrollbar flex-1 overflow-y-auto px-6 pb-12 pt-6">
            <ul className="space-y-1">
              {MAIN.map(([l, to], i) => (
                <li key={l}>
                  <NavLink
                    to={to}
                    end={to === '/'}
                    onClick={() => setDrawer(false)}
                    className={({ isActive }) =>
                      `flex items-baseline gap-3 py-2 font-display text-[clamp(1.5rem,5.5vw,2.25rem)] font-black uppercase tracking-tight transition-colors ${
                        isActive ? 'text-cyan' : 'text-ink/80 hover:text-cyan'
                      }`
                    }
                  >
                    <span className="font-mono text-xs text-dim">0{i + 1}</span>
                    {l}
                  </NavLink>
                </li>
              ))}
            </ul>
            <div className="mt-8 grid grid-cols-2 gap-px border border-white/10 bg-white/10">
              {isSignedIn ? (
                <>
                  {PROFILE.map(([l, to]) => (
                    <Link
                      key={l}
                      to={to}
                      onClick={() => setDrawer(false)}
                      className="bg-void px-4 py-3 text-sm text-dim hover:text-ink font-mono"
                    >
                      {l}
                    </Link>
                  ))}
                  <button
                    type="button"
                    onClick={async () => {
                      setDrawer(false)
                      try {
                        await clerk.signOut()
                      } catch {}
                      window.location.href = '/'
                    }}
                    className="bg-void px-4 py-3 text-sm text-live font-mono text-left cursor-pointer"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/sign-in"
                    onClick={() => setDrawer(false)}
                    className="bg-void px-4 py-3 text-sm text-cyan hover:text-white font-mono uppercase tracking-wider"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/support"
                    onClick={() => setDrawer(false)}
                    className="bg-void px-4 py-3 text-sm text-dim hover:text-ink font-mono"
                  >
                    Support
                  </Link>
                  <Link
                    to="/about"
                    onClick={() => setDrawer(false)}
                    className="bg-void px-4 py-3 text-sm text-dim hover:text-ink font-mono"
                  >
                    About
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* mobile bottom nav */}
      <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 border border-white/10 bg-void/95 md:hidden">
        {([['Home', '/', '◆'], ['Games', '/games', '▲'], ['Events', '/tournaments', '✦'], ['Matches', '/matches', '●'], ['Me', '/profile', '■']] as const).map(([l, to, ic]) => (
          <NavLink key={l} to={to} end={to === '/'} className={({ isActive }) => `relative flex flex-col items-center gap-1 py-2.5 ${isActive ? 'text-cyan' : 'text-dim'}`}>
            {({ isActive }) => (<><span className={`absolute inset-x-4 top-0 h-[2px] bg-cyan transition-transform ${isActive ? 'scale-x-100' : 'scale-x-0'}`} /><span className="text-xs">{ic}</span><span className="font-mono text-[9px] uppercase tracking-[0.15em]">{l}</span></>)}
          </NavLink>
        ))}
      </nav>
    </>
  )
}

export function Footer() {
  const { pathname } = useLocation()
  const isHome = pathname === '/'

  const navColumns = [
    ['Platform', [['Games', '/games'], ['Tournaments', '/tournaments'], ['Matches / Live Matches', '/matches'], ['Leaderboard', '/leaderboard'], ['Teams', '/teams']]],
    ['Help & About', [['About', '/about'], ['Help', '/help'], ['Support', '/support'], ['Reviews', '/reviews']]],
    ...(!isHome ? [['Outlinks', [['Discord', 'https://discord.gg/VzkfuK7We', true], ['Instagram', 'https://www.instagram.com/official.ametheus', true], ['YouTube', 'https://www.youtube.com/@official.ametheus.goodgame', true]]]] : []),
  ] as [string, [string, string, boolean?][]][]

  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-void px-5 pb-24 pt-20 md:px-10 md:pb-0">
      <div className="mx-auto grid max-w-[1600px] gap-10 md:grid-cols-12 relative z-10">
        {/* Left Column: Premium Brand Block */}
        <div className="md:col-span-6 space-y-6">
          <Link to="/" className="group inline-block outline-none select-none">
            <span className="font-display text-xl font-black tracking-[0.18em] text-white transition-colors duration-300 group-hover:text-cyan">
              AMETHEUS
            </span>
          </Link>
          <p className="max-w-sm text-sm text-ink/60 leading-relaxed font-mono">
            India&apos;s competitive esports platform — verified skill ratings, structured tournaments, and sanctioned circuits built for serious players.
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
            <a
              href="https://discord.gg/VzkfuK7We"
              target="_blank"
              rel="noopener noreferrer"
              className="text-dim hover:text-cyan transition-colors flex items-center gap-1.5"
            >
              <span>Discord</span>
              <span className="text-[10px] text-cyan">↗</span>
            </a>
            <span className="text-white/20 select-none">·</span>
            <a
              href="https://www.instagram.com/official.ametheus"
              target="_blank"
              rel="noopener noreferrer"
              className="text-dim hover:text-cyan transition-colors flex items-center gap-1.5"
            >
              <span>Instagram</span>
              <span className="text-[10px] text-cyan">↗</span>
            </a>
            <span className="text-white/20 select-none">·</span>
            <a
              href="https://www.youtube.com/@official.ametheus.goodgame"
              target="_blank"
              rel="noopener noreferrer"
              className="text-dim hover:text-cyan transition-colors flex items-center gap-1.5"
            >
              <span>YouTube</span>
              <span className="text-[10px] text-cyan">↗</span>
            </a>
          </div>
        </div>

        {navColumns.map(([h, links]) => (
          <div key={h as string} className="md:col-span-2">
            <Hud className="text-cyan">{h as string}</Hud>
            <ul className="mt-4 space-y-2">
              {(links as any[]).map(([l, to, isExt]) => (
                <li key={l}>
                  {isExt ? (
                    <a
                      href={to}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-ink/70 transition-colors hover:text-cyan flex items-center gap-1.5"
                    >
                      <span>{l}</span>
                      <span className="text-[10px] text-cyan">↗</span>
                    </a>
                  ) : (
                    <Link to={to} className="text-sm text-ink/70 transition-colors hover:text-cyan">
                      {l}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p
        style={{ pointerEvents: 'none' }}
        className="pointer-events-none mt-16 select-none text-center font-display text-[22vw] font-black leading-[0.75] text-white/[0.05]"
      >
        AMETHEUS
      </p>
      <div className="relative z-10 pointer-events-auto mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 border-t border-white/10 py-6">
        <Hud className="text-dim">© 2026 AMETHEUS Esports · India · All rights reserved.</Hud>
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 font-mono text-xs text-dim">
          <Link to="/about" className="transition-colors hover:text-cyan">
            About
          </Link>
          <span className="text-white/20">·</span>
          <Link to="/help" className="transition-colors hover:text-cyan">
            Help
          </Link>
          <span className="text-white/20">·</span>
          <Link to="/support" className="transition-colors hover:text-cyan">
            Support
          </Link>
          <span className="text-white/20">·</span>
          <Link to="/reviews" className="transition-colors hover:text-cyan font-bold text-ink">
            ★ Reviews
          </Link>
          <span className="text-white/20">·</span>
          <Link to="/rules" className="transition-colors hover:text-cyan">
            Fair Play & Rules
          </Link>
          <span className="text-white/20">·</span>
          <Link to="/support" className="transition-colors hover:text-cyan">
            Terms & Privacy
          </Link>
        </div>
      </div>
    </footer>
  )
}

/** Mounted with each page so GSAP scans the new DOM, not the exiting one. */
function PageFx({ k, children }: { k: string; children: ReactNode }) {
  useGsapPage(k)
  return <>{children}</>
}

export default function Layout() {
  const { pathname, hash } = useLocation()
  const outlet = useOutlet()
  // jump to top instantly before paint unless intentionally navigating to a hash/anchor
  useLayoutEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      if (document.documentElement) document.documentElement.scrollTop = 0
      if (document.body) document.body.scrollTop = 0
    }
  }, [pathname, hash])
  return (
    <div className="min-h-screen bg-void text-ink">
      <ScrollRestoration />
      {/* Directional neon line-transfer beam triggered on route transitions */}
      <div
        key={`beam-${pathname}`}
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[2px] overflow-hidden"
      >
        <div className="line-transfer-beam h-full w-full bg-gradient-to-r from-transparent via-cyan to-transparent shadow-[0_0_12px_#3ef2ff]" />
      </div>
      <Nav />
      {/* Incoming page fades in over the static void base. No exit phase, no overlay, no filters:
          if the animation never runs, content is still fully visible (CSS `both` ends at opacity 1). */}
      <main key={pathname} className="page-in">
        <PageFx k={pathname}>{outlet}</PageFx>
      </main>
      <Footer />
    </div>
  )
}
