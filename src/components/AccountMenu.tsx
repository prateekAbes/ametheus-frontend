import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router'
import { useClerk } from '@clerk/clerk-react'
import { useAuthContext } from '../context/AuthContext'
import { Crest } from './ui'
import { GAMES, TOURNAMENTS, gameBy } from '../lib/data'

const I = {
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></>,
  team: <><circle cx="9" cy="9" r="3.2" /><circle cx="17" cy="10" r="2.4" /><path d="M3 20c1-3.4 3.4-5 6-5s5 1.6 6 5M15 15.5c2.6 0 4.6 1.4 5.5 4.5" /></>,
  reg: <><path d="M5 3h10l4 4v14H5z" /><path d="M9 12h6M9 16h4" /></>,
  match: <><path d="M4 20 14 10M10 4l10 10M14 4h6v6" /></>,
  wallet: <><rect x="3" y="6" width="18" height="13" rx="1" /><path d="M16 12.5h2M3 9h18" /></>,
  bell: <><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></>,
  support: <><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></>,
  gear: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" /></>,
  organizer: <><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></>,
  admin: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></>,
  in: <><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></>,
  out: <><path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10" /></>,
}

const MOTION: Record<keyof typeof I, string> = {
  user: 'group-hover:scale-110',
  team: 'group-hover:translate-x-0.5',
  reg: 'group-hover:-translate-y-0.5',
  match: 'group-hover:translate-x-0.5 group-hover:-translate-y-0.5',
  wallet: 'group-hover:scale-[1.08]',
  bell: 'group-hover:-rotate-12',
  support: 'group-hover:rotate-12',
  gear: 'group-hover:rotate-45',
  organizer: 'group-hover:scale-110',
  admin: 'group-hover:scale-110',
  in: 'group-hover:translate-x-0.5',
  out: 'group-hover:-translate-x-0.5',
}

function useAccent(pathname: string) {
  const [, kind, id] = pathname.split('/')
  if (kind === 'games') return GAMES.find((g) => g.slug === id)?.accent ?? '#3ef2ff'
  if (kind === 'tournaments' && id) {
    const t = TOURNAMENTS.find((x) => x.id === id)
    if (t) return gameBy(t.game).accent
  }
  return '#3ef2ff'
}

type Box = { x: number; y: number; w: number; h: number; k: number }

const SHAPES = [
  '14px 20px 16px 12px / 12px 16px 20px 14px',
  '20px 13px 18px 15px / 16px 12px 14px 19px',
  '13px 18px 12px 21px / 18px 14px 16px 12px',
  '18px 15px 20px 13px / 13px 19px 12px 17px',
]
const PAD_X = 10,
  PAD_Y = 6

type Row = {
  key: keyof typeof I
  to: string
  label: string
  hint?: string
  trail?: ReactNode
  group: number
}

export default function AccountMenu() {
  const [open, setOpen] = useState(false)
  const [hover, setHover] = useState<string | null>(null)
  const [box, setBox] = useState<Box | null>(null)
  const groups = useRef<Record<string, HTMLElement | null>>({})
  const root = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLDivElement>(null)
  const { pathname } = useLocation()
  const acc = useAccent(pathname)

  const { profile, role, displayName, avatarUrl, isSignedIn, isOrganizer, isSuperAdmin } = useAuthContext()
  const clerk = useClerk()

  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    if (!open) {
      setHover(null)
      return
    }
    const down = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', down)
    document.addEventListener('keydown', key)
    return () => {
      document.removeEventListener('pointerdown', down)
      document.removeEventListener('keydown', key)
    }
  }, [open])

  const toggle = () => setOpen((o) => !o)

  const balanceDisplay = (() => {
    if (!profile) return '₹0'
    if (typeof profile.inr_balance_paise === 'number') {
      return '₹' + Math.floor(profile.inr_balance_paise / 100).toLocaleString('en-IN')
    }
    const cleanNum = String(profile.inr_balance || '0').replace(/[^0-9.]/g, '')
    const val = Number(cleanNum)
    return isNaN(val) ? '₹0' : '₹' + val.toLocaleString('en-IN')
  })()

  const [avatarErr, setAvatarErr] = useState(false)
  useEffect(() => {
    setAvatarErr(false)
  }, [avatarUrl])

  const userAvatar = (!avatarErr && avatarUrl) ? avatarUrl : null

  const rows: Row[] = useMemo(() => {
    if (isSignedIn) {
      const list: Row[] = [
        {
          key: 'user',
          to: '/profile',
          label: 'My Profile',
          hint: 'Player card & match stats',
          group: 0,
        },
        {
          key: 'team',
          to: '/teams',
          label: 'My Team',
          hint: 'View or manage squad',
          group: 0,
        },
        {
          key: 'reg',
          to: '/my/registrations',
          label: 'My Registrations',
          hint: 'Active tournament entries',
          group: 1,
        },
        {
          key: 'match',
          to: '/my/matches',
          label: 'My Matches',
          hint: 'Upcoming and completed',
          group: 1,
        },
        {
          key: 'wallet',
          to: '/wallet',
          label: 'Wallet',
          hint: 'Balance & withdrawals',
          trail: (
            <span className="font-mono text-[11px] tabular-nums text-ink/75">
              {balanceDisplay}
            </span>
          ),
          group: 2,
        },
        {
          key: 'bell',
          to: '/notifications',
          label: 'Notifications',
          group: 2,
        },
        {
          key: 'support',
          to: '/support',
          label: 'Support',
          hint: 'Ticket & arbitration',
          group: 2,
        },
        {
          key: 'gear',
          to: '/settings',
          label: 'Settings',
          hint: 'Game IDs & preferences',
          group: 3,
        },
      ]

      if (isOrganizer || isSuperAdmin) {
        list.push({
          key: 'organizer',
          to: '/organizer',
          label: 'Organizer Portal',
          hint: 'Tournaments & matches',
          trail: (
            <span
              className="font-mono text-[9px] uppercase tracking-[0.16em] px-1.5 py-0.5 border border-cyan/40 bg-cyan/10 text-cyan"
            >
              ORGANIZER
            </span>
          ),
          group: 4,
        })
      }

      if (isSuperAdmin) {
        list.push({
          key: 'admin',
          to: '/admin',
          label: 'Super Admin',
          hint: 'Full system management',
          trail: (
            <span className="font-mono text-[9px] uppercase tracking-[0.16em] px-1.5 py-0.5 border border-magenta/40 bg-magenta/10 text-magenta">
              ROOT
            </span>
          ),
          group: 4,
        })
      }
      return list
    }

    return [
      {
        key: 'in',
        to: '/login',
        label: 'Log In',
        hint: 'Access your account',
        group: 0,
      },
      {
        key: 'user',
        to: '/signup',
        label: 'Create Account',
        hint: 'Drop into competition',
        group: 0,
      },
      {
        key: 'support',
        to: '/support',
        label: 'Support',
        hint: 'Rules & help',
        group: 1,
      },
      {
        key: 'gear',
        to: '/about',
        label: 'About AMETHEUS',
        group: 1,
      },
    ]
  }, [
    isSignedIn,
    isOrganizer,
    isSuperAdmin,
    profile?.display_name,
    profile?.username,
    profile?.email,
    balanceDisplay,
    acc,
  ])

  const activeKey = rows.find((r) => r.to === pathname)?.key ?? null
  const target = open ? hover ?? activeKey : null

  useLayoutEffect(() => {
    if (!open || !target) {
      setBox((prev) => (prev === null ? null : null))
      return
    }
    const el = groups.current[target]
    const host = list.current
    if (!el || !host) {
      setBox((prev) => (prev === null ? null : null))
      return
    }

    const hostRect = host.getBoundingClientRect()
    const elRect = el.getBoundingClientRect()

    const x = Math.round(elRect.left - hostRect.left)
    const y = Math.round(elRect.top - hostRect.top)
    const w = Math.round(elRect.width)
    const h = Math.round(elRect.height)
    const idx = target === 'out' ? -1 : rows.findIndex((r) => r.key === target)

    const nextBox: Box = {
      x: x - PAD_X,
      y: y - PAD_Y,
      w: w + PAD_X * 2,
      h: h + PAD_Y * 2,
      k: idx,
    }

    setBox((prev) => {
      if (
        prev &&
        prev.x === nextBox.x &&
        prev.y === nextBox.y &&
        prev.w === nextBox.w &&
        prev.h === nextBox.h &&
        prev.k === nextBox.k
      ) {
        return prev
      }
      return nextBox
    })
  }, [open, target, rows])

  const item = (i: number): CSSProperties => ({
    transitionDelay: open ? `${70 + i * 18}ms` : '0ms',
  })
  const reveal = `transition-[opacity,transform] duration-200 ease-out ${
    open ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0'
  }`

  const handleSignOut = async () => {
    try {
      if (clerk && typeof clerk.signOut === 'function') {
        await clerk.signOut()
      }
    } catch {
      // Fallback
    }
    try {
      localStorage.removeItem('ametheus_auth_token')
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i)
        if (k && k.startsWith('ametheus_user_profile_')) {
          localStorage.removeItem(k)
        }
      }
    } catch {}
    window.location.href = '/'
  }

  return (
    <div ref={root} className="relative" style={{ ['--acc' as string]: acc }}>
      {/* 
        PROFILE TRIGGER:
        ONLY THE USER PROFILE IMAGE. No username next to it.
        Circular, object-fit: cover, correctly aligned, subtle on hover.
        When opened, it remains circular.
      */}
      {!isSignedIn ? (
        <Link
          to="/login"
          aria-label="Sign in"
          className="group relative flex items-center gap-2 rounded-full border border-cyan/40 bg-void/80 px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-cyan backdrop-blur-md transition-all duration-200 hover:border-cyan hover:bg-cyan/15 hover:shadow-[0_0_12px_rgba(62,242,255,0.25)]"
        >
          <span className="size-1.5 rounded-full bg-cyan animate-pulse" />
          <span className="hidden sm:inline">Sign In</span>
          <span className="sm:hidden">Login</span>
        </Link>
      ) : (
        <button
          onClick={toggle}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="Account menu"
          className="group relative grid size-11 place-items-center rounded-full md:size-12"
        >
          <span
            className={`block size-9 overflow-hidden rounded-full bg-surface transition-[transform,box-shadow,filter] duration-200 ease-out ${
              open
                ? 'brightness-110 shadow-[0_0_0_1.5px_var(--acc)]'
                : 'group-hover:scale-105 group-hover:brightness-110 shadow-[0_0_0_1px_rgb(255_255_255_/_0.15)]'
            }`}
          >
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={displayName || 'Account profile'}
                onError={() => setAvatarErr(true)}
                className="size-full rounded-full object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center bg-cyan/15 font-display text-sm font-bold text-cyan">
                {(displayName || profile?.username || 'P').charAt(0).toUpperCase()}
              </div>
            )}
          </span>
        </button>
      )}

      {/* Mobile scrim */}
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-[70] bg-void/50 transition-opacity duration-200 md:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* 
        USER DROPDOWN:
        Natural extension of the header. Same background, radius, border, typography, icons.
      */}
      <div
        role="menu"
        aria-label="Account"
        className={`fixed inset-x-0 bottom-0 z-[71] max-h-[85vh] origin-bottom overflow-hidden rounded-t-2xl md:absolute md:inset-x-auto md:bottom-auto md:right-0 md:top-[calc(100%+10px)] md:max-h-[calc(100vh-96px)] md:w-[340px] md:origin-top-right md:rounded-[10px]
          transition-[opacity,transform] ${
            open
              ? 'translate-y-0 scale-100 opacity-100 delay-[40ms] duration-[240ms] ease-[cubic-bezier(.2,.8,.2,1)]'
              : 'pointer-events-none translate-y-6 opacity-0 duration-150 ease-in md:-translate-y-2 md:scale-[0.94]'
          }`}
      >
        <div className="absolute inset-0 bg-void/80 backdrop-blur-[10px]" />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, ${acc}14, transparent 38%), linear-gradient(0deg, rgb(139 92 255 / .06), transparent 40%)`,
          }}
        />
        <div
          className="acct-drift pointer-events-none absolute -inset-1/4 opacity-60"
          style={{
            background: `radial-gradient(40% 30% at 75% 10%, ${acc}22, transparent 70%), radial-gradient(35% 30% at 15% 80%, rgb(139 92 255 / .14), transparent 70%)`,
          }}
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px overflow-hidden">
          <div
            className="acct-sweep h-full w-1/2"
            style={{
              background: `linear-gradient(90deg, transparent, ${acc}aa, transparent)`,
            }}
          />
        </div>
        <div className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0_0_0_1px_rgb(255_255_255/.06),0_30px_60px_-30px_rgb(0_0_0/.9)]" />
        <span
          className="pointer-events-none absolute right-1 top-0 hidden h-px w-10 md:block"
          style={{
            background: `linear-gradient(90deg, transparent, ${acc}, transparent)`,
          }}
        />

        <div className="relative max-h-[inherit] overflow-y-auto overscroll-contain pb-[max(env(safe-area-inset-bottom),10px)] md:pb-1.5">
          <div className="mx-auto mb-1 mt-2.5 h-1 w-10 rounded-full bg-white/15 md:hidden" />

          {/* Top User Identity Header Card */}
          {/* Top User Identity Header Card */}
          {isSignedIn ? (
            <div className="border-b border-white/[0.08] p-3 mx-1">
              <div className="flex items-center gap-3">
                <div className="relative size-11 shrink-0 overflow-hidden rounded-full border border-white/20 bg-surface">
                  {userAvatar ? (
                    <img
                      src={userAvatar}
                      alt={displayName}
                      onError={() => setAvatarErr(true)}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center bg-cyan/15 font-display text-base font-bold text-cyan">
                      {(displayName || profile?.username || 'P').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="truncate text-sm font-bold text-ink">
                      {displayName}
                    </span>
                    <span
                      className={`font-mono text-[9px] uppercase tracking-[0.16em] px-1.5 py-0.5 border shrink-0 ${
                        role === 'SUPER_ADMIN'
                          ? 'border-magenta/40 bg-magenta/10 text-magenta'
                          : role === 'ORGANIZER'
                          ? 'border-cyan/40 bg-cyan/10 text-cyan'
                          : 'border-white/20 bg-white/5 text-dim'
                      }`}
                    >
                      {role === 'SUPER_ADMIN' ? 'SUPER ADMIN' : role}
                    </span>
                  </div>
                  <div className="truncate font-mono text-[11px] text-dim">
                    {profile?.username ? `@${profile.username}` : profile?.email}
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs">
                    <span className="font-mono text-[10px] uppercase text-dim">Vault</span>
                    <span className="font-mono font-bold text-cyan">{balanceDisplay}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="border-b border-white/[0.08] p-4 mx-1 text-center">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan block mb-1">
                Ametheus Gaming
              </span>
              <p className="font-display text-base font-bold uppercase text-ink">
                Sign in to join tournaments
              </p>
              <div className="mt-3 flex gap-2">
                <Link
                  to="/login"
                  className="flex-1 border border-cyan bg-cyan/10 py-1.5 font-mono text-xs uppercase tracking-wider text-cyan transition-colors hover:bg-cyan/20"
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="flex-1 border border-white/20 bg-white/5 py-1.5 font-mono text-xs uppercase tracking-wider text-white transition-colors hover:bg-white/10"
                >
                  Sign Up
                </Link>
              </div>
            </div>
          )}

          {/* 
            DROPDOWN CONTENT-AWARE HIGHLIGHT:
            ONE shared highlight element.
            Dynamically moves and resizes around icon + text with 6-12px breathing room.
            Morphs organically, follows hover, returns to active item when pointer leaves.
          */}
          <div
            ref={list}
            onMouseLeave={() => setHover(null)}
            className="relative px-2 py-2"
          >
            <span
              aria-hidden
              className={`pointer-events-none absolute left-0 top-0 overflow-hidden border transition-[transform,width,height,border-radius,opacity] duration-[380ms] ease-[cubic-bezier(.25,1.25,.4,1)] ${
                box ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                transform: `translate3d(${box?.x ?? 0}px, ${box?.y ?? 0}px, 0)`,
                width: box?.w ?? 0,
                height: box?.h ?? 0,
                borderRadius: SHAPES[box ? (((box.k % SHAPES.length) + SHAPES.length) % SHAPES.length) : 0],
                borderColor: box?.k === -1 ? 'rgb(255 59 78 / .18)' : `${acc}26`,
                background:
                  box?.k === -1
                    ? 'rgb(255 59 78 / .07)'
                    : `linear-gradient(100deg, ${acc}1f, ${acc}0d)`,
              }}
            >
              <span
                className="absolute inset-y-0 w-2/3 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent transition-transform duration-700 ease-out"
                style={{
                  transform: `translateX(${(box?.k ?? 0) % 2 ? 60 : -10}%)`,
                }}
              />
            </span>

            {rows.map((r, i) => {
              const active = r.key === activeKey
              const lit = (hover ?? activeKey) === r.key
              const gap = i > 0 && rows[i - 1].group !== r.group
              return (
                <Link
                  key={r.key}
                  to={r.to}
                  role="menuitem"
                  onMouseEnter={() => setHover(r.key)}
                  onFocus={() => setHover(r.key)}
                  className={`group relative flex items-center gap-3 px-3 py-2 outline-none ${
                    gap ? 'mt-1.5' : ''
                  } ${reveal}`}
                  style={item(i + 2)}
                >
                  <span
                    ref={(el) => {
                      groups.current[r.key] = el
                    }}
                    className="flex min-w-0 items-center gap-3"
                  >
                    <span
                      className={`grid size-5 shrink-0 place-items-center transition-[transform,color,opacity] duration-300 ease-out ${
                        MOTION[r.key]
                      } ${active || lit ? 'text-[var(--acc)]' : 'text-dim'}`}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden
                      >
                        {I[r.key]}
                      </svg>
                    </span>
                    <span className="min-w-0">
                      <span
                        className={`block truncate text-[13px] font-medium leading-tight transition-colors duration-300 ${
                          lit ? 'text-ink' : 'text-ink/75'
                        }`}
                      >
                        {r.label}
                      </span>
                      {r.hint && (
                        <span
                          className={`block truncate text-[11px] leading-tight transition-colors duration-300 ${
                            lit ? 'text-ink/55' : 'text-dim'
                          }`}
                        >
                          {r.hint}
                        </span>
                      )}
                    </span>
                  </span>
                  <span className="ml-auto shrink-0">{r.trail}</span>
                </Link>
              )
            })}

            <div className="mx-3 my-1.5 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

            {isSignedIn && (
              <button
                type="button"
                onClick={handleSignOut}
                role="menuitem"
                onMouseEnter={() => setHover('out')}
                onFocus={() => setHover('out')}
                className={`group relative flex w-full items-center px-3 py-2 text-[13px] outline-none ${reveal}`}
                style={item(rows.length + 2)}
              >
                <span
                  ref={(el) => {
                    groups.current.out = el
                  }}
                  className={`flex items-center gap-3 transition-colors duration-300 ${
                    hover === 'out' ? 'text-live/85' : 'text-dim'
                  }`}
                >
                  <span
                    className={`grid size-5 place-items-center transition-transform duration-300 ${MOTION.out}`}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      {I.out}
                    </svg>
                  </span>
                  Log out
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
