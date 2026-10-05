import { lazy, Suspense, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { SignIn } from '@clerk/react'
import { Hud, Particles } from '../components/ui'
import { Logo } from '../components/Layout'
import { GAMES } from '../lib/data'
import { getGames, Game as ApiGame } from '../services/games'
import DynamicImage from '../components/DynamicImage'
import { resolveMediaUrl } from '../services/apiClient'
import { useAuthContext } from '../context/AuthContext'

const Scene3D = lazy(() => import('../components/Scene3D'))

export default function Auth() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { isSignedIn } = useAuthContext()

  const [apiGames, setApiGames] = useState<ApiGame[]>([])
  useEffect(() => {
    getGames()
      .then((res) => {
        if (Array.isArray(res) && res.length > 0) setApiGames(res)
      })
      .catch(() => {})
  }, [])

  const gamesPool = apiGames.length > 0 ? apiGames : GAMES

  const [gi, setGi] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setGi((i) => (i + 1) % gamesPool.length), 3200)
    return () => clearInterval(t)
  }, [gamesPool.length])

  // Redirect to home if signed in
  useEffect(() => {
    if (isSignedIn) {
      navigate('/', { replace: true })
    }
  }, [isSignedIn, navigate])

  // Redirect /signup to /login (single auth action: Sign In only)
  useEffect(() => {
    if (pathname === '/signup') {
      navigate('/login', { replace: true })
    }
  }, [pathname, navigate])

  const rawG = gamesPool[gi % gamesPool.length]
  const g = {
    name: (rawG as any).name || 'Ametheus',
    short: (rawG as any).tag || (rawG as any).short || 'AMETHEUS',
    genre: (rawG as any).category || (rawG as any).genre || 'Esports',
    accent: (rawG as any).accent_color || (rawG as any).accentColor || (rawG as any).accent || '#3ef2ff',
    bannerUrl: (rawG as any).banner_url || (rawG as any).bannerUrl || '',
    line: (rawG as any).announcement_text || (rawG as any).announcementText || (rawG as any).line || 'The Gaming Battleground',
    desc: (rawG as any).description || (rawG as any).desc || '',
  }

  return (
    <div className="relative grid min-h-screen lg:grid-cols-[1fr_1.15fr] bg-void">
      {/* LEFT: AUTHENTICATION (BLACK / DARK AREA) */}
      <div className="relative z-10 flex min-h-screen flex-col justify-between border-r border-white/5 bg-void px-6 py-10 lg:px-14 lg:py-12">
        {/* Top Header: Logo + Secured by Clerk indicator */}
        <div className="flex items-center justify-between">
          <Link to="/" aria-label="Ametheus Home">
            <Logo />
          </Link>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 font-mono text-[11px] text-dim shadow-inner">
            <span className="size-1.5 rounded-full bg-cyan animate-pulse" />
            <span className="tracking-wider uppercase">Secured by Clerk</span>
          </div>
        </div>

        {/* Center: Clerk SignIn Component */}
        <div className="my-auto flex flex-col items-center justify-center py-8">
          <div className="w-full max-w-md">
            <SignIn
              routing="path"
              path="/login"
              fallbackRedirectUrl="/"
              signUpUrl={undefined}
              appearance={{
                elements: {
                  rootBox: 'w-full',
                  card: 'bg-[#0e111a] border border-white/15 shadow-2xl text-white rounded-none',
                  headerTitle: 'font-display font-black text-2xl uppercase tracking-wider text-white',
                  headerSubtitle: 'text-xs text-[#8c94a8]',
                  socialButtonsBlockButton:
                    'bg-[#161a26] border border-white/10 text-white hover:bg-white/10 font-mono text-xs uppercase',
                  dividerLine: 'bg-white/10',
                  dividerText: 'text-xs text-[#8c94a8]',
                  formFieldLabel: 'font-mono text-xs uppercase tracking-wider text-[#8c94a8]',
                  formFieldInput:
                    'bg-[#06080e] border border-white/20 text-white focus:border-cyan text-sm',
                  formButtonPrimary:
                    'bg-cyan hover:bg-[#34d1dd] text-black font-display font-black uppercase tracking-wider text-sm py-2.5 shadow-md',
                  footerAction: 'hidden',
                  footerActionLink: 'hidden',
                  footerActionText: 'hidden',
                  footer: 'hidden',
                },
              }}
            />
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex items-center justify-between border-t border-white/5 pt-6 font-mono text-[10px] uppercase tracking-widest text-dim">
          <span>AMETHEUS BATTLEGROUND</span>
          <span className="text-cyan">AUTHENTICATION GATEWAY</span>
        </div>
      </div>

      {/* RIGHT: AMETHEUS DYNAMIC VISUAL */}
      <div className="relative hidden overflow-hidden bg-void lg:block">
        <Suspense fallback={null}>
          <Scene3D
            accent={g.accent}
            className="pointer-events-none absolute inset-0 opacity-40"
          />
        </Suspense>
        {g.bannerUrl && (
          <DynamicImage
            src={resolveMediaUrl(g.bannerUrl)}
            alt=""
            eager
            className="kenburns absolute inset-0 h-full w-full object-cover opacity-25"
          />
        )}
        <div
          className="absolute inset-0 transition-[background] duration-1000"
          style={{
            background: `radial-gradient(circle at 70% 30%, ${g.accent}40, transparent 65%), linear-gradient(to top, #05060a 10%, #05060a99 50%, #05060a66)`,
          }}
        />
        <div className="grid-floor absolute -inset-x-1/2 bottom-0 h-1/2 opacity-40" />
        <Particles n={24} />

        <div className="relative flex h-full flex-col justify-between p-12 lg:p-16">
          <div className="flex justify-end">
            <Hud className="text-cyan font-mono text-xs">◆ ONLINE NETWORK · VERIFIED</Hud>
          </div>

          <div>
            <span
              className="font-display text-sm font-black uppercase tracking-[0.2em] transition-colors duration-500"
              style={{ color: g.accent }}
            >
              {g.short} · {g.genre}
            </span>
            <p className="mt-3 font-display text-5xl font-black uppercase leading-[0.85] text-white">
              {g.line}
            </p>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-dim">{g.desc}</p>
          </div>

          <div className="flex items-center justify-between border-t border-white/10 pt-6">
            <Hud className="text-cyan">◆ AMETHEUS COMPETITIVE PLATFORM</Hud>
            <span className="font-mono text-xs text-dim">VERIFIED ESPORTS</span>
          </div>
        </div>
      </div>
    </div>
  )
}
