import { useRef, type ReactNode, type PointerEvent, type InputHTMLAttributes } from 'react'
import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { gameBy, img, type Tournament, type Match, inr } from '../lib/data'
import DynamicImage from './DynamicImage'
import { resolveMediaUrl } from '../services/apiClient'
import EsportsHeroVisual, { HeroVisualVariant } from './EsportsHeroVisual'

/* HUD micro label */
export function Hud({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`font-mono text-[10px] uppercase tracking-[0.22em] text-dim ${className}`}>{children}</span>
}
export function Dot({ c = 'bg-ok', pulse }: { c?: string; pulse?: boolean }) {
  return <span className={`inline-block size-1.5 shrink-0 rounded-full ${c} ${pulse ? 'animate-pulse' : ''}`} />
}
export function Brackets({ color = 'border-white/30' }: { color?: string }) {
  const b = `pointer-events-none absolute size-3 ${color}`
  return (
    <>
      <span className={`${b} left-0 top-0 border-l border-t`} />
      <span className={`${b} right-0 top-0 border-r border-t`} />
      <span className={`${b} bottom-0 left-0 border-b border-l`} />
      <span className={`${b} bottom-0 right-0 border-b border-r`} />
    </>
  )
}

const STATUS: Record<string, [string, string, string]> = {
  registration_open: ['Registration Open', 'bg-ok', 'text-ok'],
  'registration open': ['Registration Open', 'bg-ok', 'text-ok'],
  open: ['Open', 'bg-cyan', 'text-cyan'],
  upcoming: ['Upcoming', 'bg-cyan', 'text-cyan'],
  live: ['Live', 'bg-live', 'text-live'],
  completed: ['Completed', 'bg-dim', 'text-dim'],
  cancelled: ['Cancelled', 'bg-white/30', 'text-white/40'],
  soon: ['Coming Soon', 'bg-warn', 'text-warn'],
  success: ['Success', 'bg-ok', 'text-ok'],
  pending: ['Pending', 'bg-warn', 'text-warn'],
  failed: ['Failed', 'bg-live', 'text-live'],
  'in progress': ['In Progress', 'bg-amber-400', 'text-amber-400'],
  'in_progress': ['In Progress', 'bg-amber-400', 'text-amber-400'],
  'waiting for user': ['Waiting for User', 'bg-warn', 'text-warn'],
  'waiting_for_user': ['Waiting for User', 'bg-warn', 'text-warn'],
  resolved: ['Resolved', 'bg-ok', 'text-ok'],
  closed: ['Closed', 'bg-dim', 'text-dim'],
  confirmed: ['Confirmed', 'bg-ok', 'text-ok'],
  active: ['Active', 'bg-cyan', 'text-cyan'],
}
/** Status badge. Accepts any key in STATUS (case-insensitive). */
export function Badge({ s, label }: { s: string; label?: string }) {
  const m = STATUS[s.toLowerCase()] ?? [s, 'bg-dim', 'text-dim']
  return (
    <span className={`inline-flex items-center gap-2 whitespace-nowrap border border-current/30 bg-void/80 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] ${m[2]}`}>
      <Dot c={m[1]} pulse={s === 'live'} /> {label ?? m[0]}
    </span>
  )
}

/** Magnetic CTA. Pointer offset written straight to style via rAF — no React re-render. */
export function Cta({ children, ghost, to, onClick, className = '', small, arrow = true, type, disabled }: { children: ReactNode; ghost?: boolean; to?: string; onClick?: () => void; className?: string; small?: boolean; arrow?: boolean; type?: 'submit' | 'button'; disabled?: boolean }) {
  const raf = useRef(0)
  const move = (e: PointerEvent<HTMLElement>) => {
    if (e.pointerType !== 'mouse' || raf.current) return
    const el = e.currentTarget, x = e.clientX, y = e.clientY
    raf.current = requestAnimationFrame(() => {
      raf.current = 0
      const r = el.getBoundingClientRect()
      el.style.transform = `translate(${(x - r.left - r.width / 2) * 0.16}px, ${(y - r.top - r.height / 2) * 0.28}px)`
    })
  }
  const leave = (e: PointerEvent<HTMLElement>) => { cancelAnimationFrame(raf.current); raf.current = 0; e.currentTarget.style.transform = '' }
  const cls = `sweep group inline-flex items-center justify-center gap-3 font-display font-extrabold uppercase tracking-[0.08em] transition-[gap,background,color,border-color,transform,box-shadow] duration-300 ease-out hover:gap-5 disabled:pointer-events-none disabled:opacity-35 motion-reduce:transform-none ${small ? 'px-4 py-2.5 text-sm' : 'px-7 py-4 text-lg'} ${ghost ? 'border border-white/25 text-ink hover:border-cyan hover:text-cyan' : 'bg-ink text-void hover:bg-cyan hover:shadow-[0_14px_40px_-14px_rgb(62_242_255/.7)]'} ${className}`
  const inner = <>{children}{arrow && <span className="transition-transform group-hover:translate-x-1">→</span>}</>
  const handlers = { onPointerMove: move, onPointerLeave: leave }
  if (to) return <Link to={to} className={cls} {...handlers}>{inner}</Link>
  return <button type={type ?? 'button'} disabled={disabled} onClick={onClick} className={cls} {...handlers}>{inner}</button>
}
export const CTAButton = Cta

/** Section heading: index + kicker + big display title. */
export function SectionHead({ idx, kicker, title, sub, right, className = '', size = 'lg' }: { idx?: string; kicker: string; title: ReactNode; sub?: ReactNode; right?: ReactNode; className?: string; size?: 'lg' | 'md' }) {
  return (
    <div className={`flex flex-col gap-6 md:flex-row md:items-end md:justify-between ${className}`}>
      <div>
        <div className="mb-5 flex items-center gap-4">
          {idx && <Hud className="text-cyan">{idx}</Hud>}
          <span className="h-px w-12 bg-cyan/50" />
          <Hud>{kicker}</Hud>
        </div>
        <h2 className={`font-display font-black uppercase leading-[0.85] ${size === 'lg' ? 'text-[clamp(3rem,8vw,8rem)]' : 'text-[clamp(2.25rem,5vw,4.5rem)]'}`}>{title}</h2>
        {sub && <p className="mt-5 max-w-lg text-lg text-dim">{sub}</p>}
      </div>
      {right}
    </div>
  )
}

/** Cinematic page header used by inner pages with procedural esports visual backgrounds. */
export function PageHero({
  kicker,
  title,
  sub,
  photo,
  accent = '#3ef2ff',
  variant = 'default',
  children,
  tall,
}: {
  kicker: string
  title: ReactNode
  sub?: ReactNode
  photo?: string
  accent?: string
  variant?: HeroVisualVariant
  children?: ReactNode
  tall?: boolean
}) {
  return (
    <section className={`relative overflow-hidden bg-void ${tall ? 'min-h-[86svh]' : 'min-h-[52svh]'} flex items-end`}>
      <EsportsHeroVisual variant={variant} accent={accent} />
      {photo && (
        <div className="absolute inset-0 overflow-hidden">
          <DynamicImage
            src={resolveMediaUrl(photo)}
            alt=""
            eager
            className="absolute inset-0 h-[120%] w-full -translate-y-[8%] object-cover opacity-20 mix-blend-luminosity"
          />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-void via-void/50 to-transparent" />
      <div className="relative mx-auto w-full max-w-[1600px] px-5 pb-14 pt-36 md:px-10 md:pb-20">
        <div className="mb-6 flex items-center gap-4">
          <span className="h-px w-12" style={{ background: accent }} />
          <Hud className="text-ink">{kicker}</Hud>
        </div>
        <h1 className={`${typeof title === 'string' ? 'reveal-chars' : 'reveal'} font-display text-[clamp(3.5rem,12vw,12rem)] font-black uppercase leading-[0.8] text-balance break-words`}>
          {title}
        </h1>
        {sub && <p className="mt-6 max-w-xl text-lg text-ink/75">{sub}</p>}
        {children && <div className="mt-10">{children}</div>}
      </div>
    </section>
  )
}

export function Container({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1600px] px-5 md:px-10 ${className}`}>{children}</div>
}

/** Underlined tab strip with animated indicator. */
export function Tabs<T extends string>({ tabs, value, onChange, className = '' }: { tabs: readonly T[]; value: T; onChange: (t: T) => void; className?: string }) {
  return (
    <div className={`no-scrollbar flex gap-1 overflow-x-auto border-b border-white/10 ${className}`} role="tablist">
      {tabs.map((t) => (
        <button key={t} role="tab" aria-selected={value === t} onClick={() => onChange(t)} className={`relative shrink-0 px-4 py-4 font-mono text-[11px] uppercase tracking-[0.2em] transition-colors ${value === t ? 'text-ink' : 'text-dim hover:text-ink'}`}>
          {t}
          {value === t && <motion.span layoutId={`tab-${tabs.join('')}`} transition={{ type: 'spring', stiffness: 420, damping: 34 }} className="absolute inset-x-2 -bottom-px h-[2px] bg-cyan" />}
        </button>
      ))}
    </div>
  )
}

/** Pill filter chips. */
export function Chips<T extends string>({ items, value, onChange }: { items: readonly T[]; value: T; onChange: (t: T) => void }) {
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto">
      {items.map((i) => (
        <button key={i} onClick={() => onChange(i)} className={`relative shrink-0 border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors ${value === i ? 'border-cyan text-void' : 'border-white/15 text-dim hover:border-white/40 hover:text-ink'}`}>
          {value === i && <motion.span layoutId={`chip-${items.join('')}`} transition={{ type: 'spring', stiffness: 420, damping: 34 }} className="absolute inset-0 bg-cyan" />}
          <span className="relative">{i}</span>
        </button>
      ))}
    </div>
  )
}

export function Field({ label, hint, className = '', ...p }: { label: string; hint?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={`group block ${className}`}>
      <Hud className="group-focus-within:text-cyan">{label}</Hud>
      <input {...p} className="mt-2 w-full border-b border-white/15 bg-transparent py-3 text-lg text-ink outline-none transition-colors placeholder:text-white/25 focus:border-cyan" />
      {hint && <span className="mt-1.5 block text-xs text-dim">{hint}</span>}
    </label>
  )
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={`relative h-6 w-11 shrink-0 border transition-colors ${on ? 'border-cyan bg-cyan/20' : 'border-white/20'}`}>
      <span className={`absolute top-1 size-3.5 transition-all ${on ? 'left-6 bg-cyan' : 'left-1 bg-white/40'}`} />
    </button>
  )
}

export function Avatar({ id, size = 40, className = '' }: { id: string; size?: number; className?: string }) {
  const url = resolveMediaUrl(id)
  if (!url) {
    return (
      <span
        style={{ width: size, height: size }}
        className={`grid shrink-0 place-items-center bg-surface font-mono text-xs uppercase text-dim [clip-path:polygon(0_0,100%_0,100%_78%,78%_100%,0_100%)] ${className}`}
      >
        {id.slice(0, 2).toUpperCase()}
      </span>
    )
  }
  return <img src={url} alt="" style={{ width: size, height: size }} className={`shrink-0 bg-surface object-cover [clip-path:polygon(0_0,100%_0,100%_78%,78%_100%,0_100%)] ${className}`} />
}

/** Team crest generated from initials. */
export function Crest({ name, size = 44, color = '#3ef2ff' }: { name: string; size?: number; color?: string }) {
  const ini = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <span style={{ width: size, height: size, borderColor: color + '66', color }} className="grid shrink-0 place-items-center border bg-void font-display text-sm font-black [clip-path:polygon(50%_0,100%_25%,100%_75%,50%_100%,0_75%,0_25%)]">
      <span style={{ fontSize: size * 0.36 }}>{ini}</span>
    </span>
  )
}

/** Tournament card — banner, metadata, progress, hover lift. */
/** Pointer tilt + glare. CSS vars set via rAF, transform-only, desktop mouse only. */
export function Tilt({ children, className = '', max = 6 }: { children: ReactNode; className?: string; max?: number }) {
  const raf = useRef(0)
  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || raf.current) return
    const el = e.currentTarget, x = e.clientX, y = e.clientY
    raf.current = requestAnimationFrame(() => {
      raf.current = 0
      const b = el.getBoundingClientRect(), px = (x - b.left) / b.width, py = (y - b.top) / b.height
      el.style.setProperty('--rx', `${(0.5 - py) * max * 2}deg`); el.style.setProperty('--ry', `${(px - 0.5) * max * 2}deg`)
      el.style.setProperty('--gx', `${px * 100}%`); el.style.setProperty('--gy', `${py * 100}%`)
    })
  }
  const leave = (e: PointerEvent<HTMLDivElement>) => { cancelAnimationFrame(raf.current); raf.current = 0; e.currentTarget.style.setProperty('--rx', '0deg'); e.currentTarget.style.setProperty('--ry', '0deg') }
  return (
    <div className={`group/tilt [perspective:1200px] ${className}`} onPointerMove={move} onPointerLeave={leave}>
      <div className="relative h-full transition-transform duration-300 ease-out [transform:rotateX(var(--rx,0deg))_rotateY(var(--ry,0deg))] motion-reduce:[transform:none]">
        {children}
        <span className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-300 group-hover/tilt:opacity-100 [background:radial-gradient(420px_circle_at_var(--gx,50%)_var(--gy,50%),rgb(255_255_255/.07),transparent_45%)]" />
      </div>
    </div>
  )
}

/** Reserved-ratio image: never shifts layout, lazy by default, falls back to a tinted plate. */
export function Media({ id, w = 1000, alt = '', className = '', eager, sizes = '(min-width:1024px) 33vw, 100vw', ...rest }: { id?: string; w?: number; alt?: string; className?: string; eager?: boolean; sizes?: string; 'data-speed'?: string }) {
  const url = resolveMediaUrl(id)
  if (!url) return null
  return <img {...rest} src={url} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" fetchPriority={eager ? 'high' : 'auto'} className={className} />
}

/**
 * Tournament card. Every field except `name` is optional at render time — missing data collapses.
 * Long names clamp to 2 lines with balanced wrapping; title size steps down by length.
 */
export function TournamentCard({ t, wide, tilt = true }: { t: Partial<Tournament> & Pick<Tournament, 'id' | 'name'>; wide?: boolean; tilt?: boolean }) {
  const gameKey = (t as any).game || (t as any).gameSlug || (t as any).game_slug || (t as any).gameId || (t as any).game_id
  const g = gameKey ? gameBy(gameKey) : undefined
  const accent = g?.accent ?? '#3ef2ff'
  const long = t.name.length > 28
  const meta = [t.date, g?.squad, t.format].filter(Boolean).join(' · ')
  const bannerSrc = (t as any).bannerUrl || (t as any).banner_url || (t as any).bannerTabletUrl || (t as any).banner_tablet_url || (t as any).bannerMobileUrl || (t as any).banner_mobile_url || g?.photo || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop'
  const stats = [
    t.prize != null && ['Prize', inr(t.prize), accent],
    t.entry != null && ['Entry', t.entry ? inr(t.entry) : 'FREE'],
    t.max ? ['Teams', <>{t.teams ?? 0}<span className="text-dim">/{t.max}</span></>] : null,
  ].filter(Boolean) as [string, ReactNode, string?][]
  const card = (
    <Link to={`/tournaments/${t.id}`} className={`group relative flex h-full flex-col overflow-hidden border border-white/10 bg-surface transition-colors duration-300 hover:border-white/25`}>
      <div className={`relative overflow-hidden bg-graphite ${wide ? 'aspect-[16/8]' : 'aspect-[16/9]'}`}>
        <DynamicImage
          src={resolveMediaUrl(bannerSrc)}
          alt={`${t.name} banner`}
          mode="cover"
          className="size-full object-cover object-center opacity-85 transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(to top, #12141d, transparent 65%), linear-gradient(120deg, ${accent}33, transparent 50%)` }} />
        <div className="absolute left-4 top-4 flex flex-wrap gap-1.5">
          {t.status && (
            <Badge
              s={t.status}
              label={
                t.status?.toLowerCase() === 'open' || t.status?.toUpperCase() === 'REGISTRATION_OPEN'
                  ? 'Registration Open'
                  : undefined
              }
            />
          )}
          {(t as any).isRegistered && <Badge s="confirmed" label="REGISTERED" />}
        </div>
        {g && <span className="absolute right-4 top-3 font-display text-sm font-black tracking-[0.15em]" style={{ color: accent }}>{g.short}</span>}
      </div>
      <div className="relative flex flex-1 flex-col p-5 md:p-6">
        <h3 title={t.name} className={`line-clamp-2 text-balance break-words font-display font-black uppercase leading-[0.92] ${long ? 'text-2xl md:text-[1.7rem]' : 'text-3xl md:text-4xl'}`}>{t.name}</h3>
        {meta && <Hud className="mt-2 line-clamp-1">{meta}</Hud>}
        {stats.length > 0 && (
          <div className="mt-auto grid gap-3 pt-6" style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0,1fr))` }}>
            {stats.map(([k, v, c]) => <div key={k} className="min-w-0"><Hud>{k}</Hud><p className="truncate font-display text-2xl font-black tabular-nums" style={{ color: c }}>{v}</p></div>)}
          </div>
        )}
        {t.max ? <div className="mt-4 h-[2px] bg-white/10"><div className="h-full origin-left" style={{ transform: `scaleX(${Math.min((t.teams ?? 0) / t.max, 1)})`, background: accent }} /></div> : null}
        <span className={`inline-flex items-center gap-2 font-display text-base font-extrabold uppercase tracking-[0.08em] transition-[gap,color] group-hover:gap-4 group-hover:text-cyan ${stats.length ? 'mt-5' : 'mt-auto pt-6'}`}>View Tournament <span>→</span></span>
      </div>
    </Link>
  )
  return tilt ? <Tilt className="h-full">{card}</Tilt> : card
}

/** Match row/card. Live state is loud. */
export function MatchCard({ m, perspective }: { m: Match; perspective?: string }) {
  const g = gameBy(m.game)
  const live = m.status === 'live'
  return (
    <Link to={`/matches/${m.id}`} className={`group relative grid grid-cols-[1fr_auto_1fr] items-center gap-4 overflow-hidden border p-5 transition-all duration-300 hover:bg-white/[0.03] md:grid-cols-[180px_1fr_auto_1fr_160px] md:p-6 ${live ? 'border-live/50 bg-live/[0.04]' : 'border-white/10'}`}>
      {live && <span className="absolute inset-y-0 left-0 w-[3px] bg-live" />}
      <div className="col-span-3 flex items-center justify-between gap-3 md:col-span-1 md:block">
        <span className="font-display text-sm font-black tracking-[0.15em]" style={{ color: g.accent }}>{g.short}</span>
        <Hud className="block md:mt-1">Match {String(m.no).padStart(2, '0')} · {m.round}</Hud>
      </div>
      <div className="flex items-center gap-3 justify-self-end text-right">
        <span className={`font-display text-xl font-black uppercase md:text-2xl ${perspective === m.a ? 'text-cyan' : ''}`}>{m.a}</span>
        <Crest name={m.a} size={36} color={g.accent} />
      </div>
      <div className="text-center">
        {m.score ? <p className="font-display text-3xl font-black tabular-nums">{m.score[0]}<span className="mx-1.5 text-dim">:</span>{m.score[1]}</p> : <p className="font-display text-2xl font-black text-dim">VS</p>}
        <Hud className="block">{m.format}</Hud>
      </div>
      <div className="flex items-center gap-3">
        <Crest name={m.b} size={36} color={g.accent} />
        <span className={`font-display text-xl font-black uppercase md:text-2xl ${perspective === m.b ? 'text-cyan' : ''}`}>{m.b}</span>
      </div>
      <div className="col-span-3 flex items-center justify-between gap-3 md:col-span-1 md:flex-col md:items-end">
        <Badge s={m.status} label={live ? 'Live · Watch' : undefined} />
        <Hud>{m.date} · {m.time}</Hud>
      </div>
    </Link>
  )
}

/** Gaming-themed empty / error state. */
export function EmptyState({ code = '00', title, body, cta, to, onClick }: { code?: string; title: string; body: string; cta?: string; to?: string; onClick?: () => void }) {
  return (
    <div className="relative overflow-hidden border border-dashed border-white/15 px-6 py-20 text-center">
      <span className="outline-text pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 font-display text-[9rem] font-black leading-none md:text-[14rem]">{code}</span>
      <div className="relative">
        <Hud className="text-cyan">◇ Signal lost</Hud>
        <h3 className="mt-3 font-display text-4xl font-black uppercase md:text-5xl">{title}</h3>
        <p className="mx-auto mt-3 max-w-sm text-dim">{body}</p>
        {cta && (to ? <div className="mt-8"><Cta to={to} small>{cta}</Cta></div> : onClick ? <div className="mt-8"><Cta onClick={onClick} small>{cta}</Cta></div> : null)}
      </div>
    </div>
  )
}

export function Stat({ k, v, accent }: { k: string; v: ReactNode; accent?: string }) {
  return (
    <div>
      <Hud>{k}</Hud>
      <p className="mt-1 font-display text-3xl font-black md:text-4xl" style={{ color: accent }}>{v}</p>
    </div>
  )
}

export function Particles({ n = 30 }: { n?: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 hidden overflow-hidden md:block motion-reduce:hidden">
      {Array.from({ length: Math.min(n, 16) }).map((_, i) => (
        <span key={i} className="particle absolute block rounded-full bg-cyan" style={{ left: `${(i * 37) % 100}%`, top: `${100 + ((i * 53) % 60)}%`, width: i % 5 ? 2 : 3, height: i % 5 ? 2 : 3, opacity: 0.2 + (i % 4) * 0.15, animationDuration: `${14 + (i % 9) * 3}s`, animationDelay: `-${i * 1.3}s` }} />
      ))}
    </div>
  )
}

/** Glass panel used for forms and side rails. */
export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`relative border border-white/10 bg-surface ${className}`}>{children}</div>
}

export { Modal, PortalModal, Portal } from './Modal'
export type { ModalProps } from './Modal'

export const SectionHeader = SectionHead
export const StatusBadge = Badge

