import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { img, type CatalogGame, type HeroSlide, type Tx, inr } from '../lib/data'
import { Hud, Badge, Cta, Media, Crest, Dot } from './ui'
import { reducedMotion } from '../lib/motion'
import DynamicImage from './DynamicImage'
import { resolveMediaUrl } from '../services/apiClient'

/* ---------- layout primitives ---------- */

/**
 * Grid that adapts to how many items it holds — 1 fills, 2 halves, 3 thirds, 4 → 2×2 on md/4-up on xl, 5+ auto-fills.
 * Never leaves a lonely orphan column; pair with `useLoadMore` for long lists.
 */
export function AdaptiveGrid({ count, children, min = 300, className = '' }: { count: number; children: ReactNode; min?: number; className?: string }) {
  const cols = count <= 1 ? 'grid-cols-1' : count === 2 ? 'md:grid-cols-2' : count === 3 ? 'md:grid-cols-3' : count === 4 ? 'sm:grid-cols-2 xl:grid-cols-4' : ''
  const style = count > 4 ? { gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, ${min}px), 1fr))` } : undefined
  return <div className={`grid gap-4 md:gap-5 ${cols} ${className}`} style={style}>{children}</div>
}

/** Paginate any array client-side. */
export function useLoadMore<T>(items: T[], step = 6) {
  const [n, setN] = useState(step)
  useEffect(() => setN(step), [items.length, step])
  return { shown: items.slice(0, n), more: n < items.length, rest: items.length - n, next: () => setN((v) => v + step) }
}
export function LoadMore({ more, rest, onClick, label = 'Load more' }: { more: boolean; rest: number; onClick: () => void; label?: string }) {
  if (!more) return null
  return <div className="mt-10 flex justify-center"><Cta ghost small onClick={onClick} arrow={false}>{label} · {rest}</Cta></div>
}

/** Render children only when there's content — sections collapse instead of leaving dead space. */
export function Collapse<T>({ items, children }: { items: T[] | undefined | null; children: (items: T[]) => ReactNode }) {
  return items && items.length ? <>{children(items)}</> : null
}

/* ---------- loading ---------- */

export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden className={`skeleton ${className}`} />
}
/** Lightweight loading placeholder matching card geometry, so swap-in never shifts layout. */
export function LoadingState({ count = 3, kind = 'card' }: { count?: number; kind?: 'card' | 'row' }) {
  return (
    <div role="status" aria-label="Loading" className={kind === 'card' ? 'grid gap-5 md:grid-cols-3' : 'space-y-2'}>
      {Array.from({ length: count }).map((_, i) => kind === 'card'
        ? <div key={i} className="border border-white/10 bg-surface"><Skeleton className="aspect-[16/9]" /><div className="space-y-3 p-5"><Skeleton className="h-7 w-3/4" /><Skeleton className="h-3 w-1/2" /><Skeleton className="mt-6 h-8" /></div></div>
        : <Skeleton key={i} className="h-16" />)}
    </div>
  )
}

/* ---------- filters / modal ---------- */

export type Filter = { key: string; label: string; options: readonly string[] }
/** Search + any number of select filters. Stateless — parent owns values. */
export function FilterBar({ search, onSearch, filters = [], values = {}, onChange, count, placeholder = 'Search' }: { search?: string; onSearch?: (v: string) => void; filters?: Filter[]; values?: Record<string, string>; onChange?: (k: string, v: string) => void; count?: number; placeholder?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2 border border-white/10 bg-graphite p-2">
      {onSearch && <input value={search} onChange={(e) => onSearch(e.target.value)} placeholder={placeholder} className="min-w-[180px] flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-dim" />}
      {filters.map((f) => (
        <label key={f.key} className="flex items-center gap-2 border border-white/10 px-3 py-2">
          <Hud>{f.label}</Hud>
          <select value={values[f.key] ?? f.options[0]} onChange={(e) => onChange?.(f.key, e.target.value)} className="bg-graphite font-mono text-[11px] uppercase tracking-[0.15em] text-ink outline-none">
            {f.options.map((o) => <option key={o}>{o}</option>)}
          </select>
        </label>
      ))}
      {count != null && <Hud className="ml-auto px-3">{count} results</Hud>}
    </div>
  )
}

export { Modal } from './Modal'

/* ---------- cards ---------- */

/** Game card — works for active and locked worlds, with or without artwork. `feature` = larger type. */
export function GameCard({ g, i, feature }: { g: CatalogGame; i?: number; feature?: boolean }) {
  const soon = g.status === 'soon'
  const title = g.name || g.short
  const body = (
    <>
      <DynamicImage
        src={resolveMediaUrl(g.photo || (g as any).bannerUrl || (g as any).banner_url)}
        alt={`${title} artwork`}
        className="absolute inset-0 h-full w-full object-cover opacity-50 grayscale-[50%] transition-[transform,opacity] duration-700 group-hover:scale-105 group-hover:opacity-75"
      />
      <div className="absolute inset-0" style={{ background: `linear-gradient(to top, #05060a 10%, transparent 70%), radial-gradient(ellipse at 0% 100%, ${g.accent}${soon ? '22' : '44'}, transparent 60%)` }} />
      <span className="absolute inset-x-0 top-0 h-[2px] origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100" style={{ background: g.accent }} />
      <div className="absolute left-5 top-5 right-5 flex items-center justify-between gap-3">
        <Hud className="truncate">{i != null && <span className="text-ink">{String(i + 1).padStart(2, '0')} · </span>}{g.genre}</Hud>
        {soon && <Badge s="soon" />}
      </div>
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 md:p-6">
        <div className="min-w-0">
          <h3 className={`text-balance break-words font-display font-black uppercase leading-[0.85] ${soon ? 'text-white/50 group-hover:text-ink' : ''} ${feature ? 'text-6xl md:text-8xl' : title.length > 14 ? 'text-3xl md:text-4xl' : 'text-4xl md:text-5xl'}`}>{title}</h3>
          <Hud className="mt-2 block">{g.platform}</Hud>
        </div>
      </div>
    </>
  )
  const cls = `group relative block overflow-hidden border border-white/10 bg-graphite transition-colors hover:border-white/25 ${feature ? 'aspect-[4/5] md:aspect-auto md:h-full md:min-h-[520px]' : 'aspect-[4/5]'}`
  return soon ? <div className={cls}>{body}</div> : <Link to={`/games/${g.slug}`} className={cls}>{body}</Link>
}

export function TeamCard({ name, game, members, max, role, accent = '#3ef2ff', to = '/teams' }: { name: string; game?: string; members?: number; max?: number; role?: string; accent?: string; to?: string }) {
  return (
    <Link to={to} className="group flex items-center gap-4 border border-white/10 bg-surface p-4 transition-colors hover:border-white/25">
      <Crest name={name} size={48} color={accent} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-xl font-black uppercase">{name}</p>
        <Hud className="block truncate">{[game, members != null && `${members}${max ? '/' + max : ''} players`, role].filter(Boolean).join(' · ')}</Hud>
      </div>
      <span className="text-dim transition-transform group-hover:translate-x-1 group-hover:text-cyan">→</span>
    </Link>
  )
}

export function NotificationCard({ glyph, title, body, meta, unread, onClick }: { glyph: string; title: string; body?: string; meta?: string; unread?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`relative flex w-full items-start gap-4 p-4 text-left transition-colors hover:bg-white/[0.03] md:p-5 ${unread ? 'bg-cyan/[0.03]' : ''}`}>
      {unread && <span className="absolute inset-y-0 left-0 w-[3px] bg-cyan" />}
      <span className={`grid size-11 shrink-0 place-items-center border text-lg ${unread ? 'border-cyan/40 text-cyan' : 'border-white/10 text-dim'}`}>{glyph}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2"><p className={`font-display text-lg font-black uppercase ${unread ? '' : 'text-ink/70'}`}>{title}</p>{unread && <Dot c="bg-cyan" />}</div>
        {body && <p className="mt-0.5 text-sm text-dim">{body}</p>}
        {meta && <Hud className="mt-2 block">{meta}</Hud>}
      </div>
    </button>
  )
}

const TX_ICON: Record<Tx['type'], string> = { 'Wallet Deposit': '↓', 'Tournament Entry': '⚔', Winnings: '♛', Withdrawal: '↑', Refund: '↺' }
export function TransactionCard({ tx: t }: { tx: Tx }) {
  const pos = t.amount > 0
  return (
    <div className="grid grid-cols-[48px_1fr_auto] items-center gap-4 border-b border-white/5 p-4 transition-colors last:border-0 hover:bg-white/[0.03] md:grid-cols-[48px_1fr_140px_150px_130px] md:p-5">
      <span className={`grid size-11 place-items-center border text-lg ${pos ? 'border-ok/40 text-ok' : 'border-white/15 text-dim'}`}>{TX_ICON[t.type] ?? '·'}</span>
      <div className="min-w-0"><p className="truncate font-display text-lg font-black uppercase">{t.type}</p>{t.note && <p className="truncate text-sm text-dim">{t.note}</p>}</div>
      <span className="hidden font-mono text-xs text-dim md:block">{t.id}<br />{t.date}</span>
      <span className={`text-right font-display text-2xl font-black tabular-nums md:text-left ${pos ? 'text-ok' : ''}`}>{pos ? '+' : '−'}{inr(Math.abs(t.amount))}</span>
      <div className="col-span-3 flex items-center justify-between md:col-span-1 md:justify-end">
        <span className="font-mono text-[10px] text-dim md:hidden">{t.id} · {t.date}</span>
        <Badge s={t.status} />
      </div>
    </div>
  )
}

/* ---------- hero ---------- */

/**
 * Campaign hero. Accepts 1..n slides; each may be image, GIF (as image) or video (+poster).
 * One slide = static, no controls. Media layers: void base → static gradient → poster image → optional video.
 * Auto-advance pauses on hover, off-screen, and for reduced motion.
 */
export function HeroSection({ slides, interval = 7000, aside }: { slides: HeroSlide[]; interval?: number; aside?: ReactNode }) {
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)
  const ref = useRef<HTMLElement>(null)
  const s = slides[i] ?? slides[0]
  useEffect(() => {
    if (slides.length < 2 || paused || reducedMotion()) return
    const t = setTimeout(() => setI((v) => (v + 1) % slides.length), interval)
    return () => clearTimeout(t)
  }, [i, paused, slides.length, interval])
  useEffect(() => {
    if (!ref.current) return
    const io = new IntersectionObserver(([e]) => setPaused(!e.isIntersecting))
    io.observe(ref.current); return () => io.disconnect()
  }, [])
  if (!s) return null
  const long = s.title.length > 9
  return (
    <section ref={ref} onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)} className="relative isolate h-[100svh] min-h-[640px] overflow-hidden bg-void">
      {/* media stack — all slides mounted, crossfaded with opacity only */}
      {slides.map((x, k) => (
        <div key={x.id} aria-hidden={k !== i} className={`absolute inset-0 transition-opacity duration-1000 ${k === i ? 'opacity-100' : 'opacity-0'}`}>
          {x.photo && (
            <DynamicImage
              src={resolveMediaUrl(x.photo)}
              alt=""
              eager={k === 0}
              className="absolute inset-0 h-full w-full object-cover opacity-25"
            />
          )}
          {x.video && k === i && <video className="absolute inset-0 h-full w-full object-cover opacity-30 motion-reduce:hidden" src={x.video} autoPlay muted loop playsInline preload="none" />}
        </div>
      ))}
      {aside}
      <div className="absolute inset-0 bg-gradient-to-b from-void/40 via-transparent to-void" />

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
        <div key={s.id} className="page-in flex flex-col items-center">
          <Hud className="mb-6 text-cyan"><Dot pulse /> &nbsp;{s.kicker}</Hud>
          <h1 className={`select-none text-balance break-words font-display font-black uppercase leading-[0.8] ${long ? 'text-[clamp(3.5rem,13vw,13rem)]' : 'text-[clamp(4.5rem,20vw,21rem)]'}`}>
            <span className="bg-gradient-to-b from-white via-white to-white/35 bg-clip-text text-transparent">{s.title}</span>
          </h1>
          <p className="mt-4 text-balance font-display text-xl font-bold uppercase tracking-[0.3em] md:text-3xl md:tracking-[0.4em]" style={{ color: s.accent === '#8b5cff' ? undefined : s.accent }}>{s.tagline}</p>
          <p className="mt-5 max-w-md text-dim">{s.sub}</p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Cta to={s.cta[1]}>{s.cta[0]}</Cta>
            {s.cta2 && <Cta ghost to={s.cta2[1]}>{s.cta2[0]}</Cta>}
          </div>
        </div>
      </div>

      {slides.length > 1 && (
        <div className="absolute inset-x-0 bottom-8 z-10 mx-auto flex max-w-[1600px] items-center gap-3 px-5 md:px-10">
          <Hud className="tabular-nums text-ink">{String(i + 1).padStart(2, '0')}<span className="text-dim"> / {String(slides.length).padStart(2, '0')}</span></Hud>
          <div className="flex flex-1 gap-2">
            {slides.map((x, k) => (
              <button key={x.id} onClick={() => setI(k)} aria-label={`Show ${x.title}`} className="group relative h-6 flex-1 max-w-40">
                <span className="absolute inset-x-0 top-1/2 h-px bg-white/20" />
                <span key={k === i ? `${x.id}-${i}` : x.id} className={`absolute inset-x-0 top-1/2 h-px origin-left bg-cyan ${k === i ? (paused ? 'scale-x-100' : 'hero-progress') : k < i ? 'scale-x-100' : 'scale-x-0'}`} style={{ animationDuration: `${interval}ms` }} />
              </button>
            ))}
          </div>
          <Hud className="hidden md:block">{slides[(i + 1) % slides.length].title} next</Hud>
        </div>
      )}
    </section>
  )
}
