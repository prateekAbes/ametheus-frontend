import { lazy, Suspense, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { SignIn, SignUp } from '@clerk/react'
import { Hud, Particles } from '../components/ui'
import { Logo } from '../components/Layout'
import { GAMES, img } from '../lib/data'
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

  useEffect(() => {
    if (isSignedIn) {
      navigate('/')
    }
  }, [isSignedIn, navigate])

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
  const isSignUp = pathname === '/signup'

  return (
    <div className="relative grid min-h-screen lg:grid-cols-[1.1fr_1fr] bg-void">
      {/* LEFT: 3D HERO VISUAL */}
      <div className="relative hidden overflow-hidden bg-void lg:block border-r border-white/10">
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
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 30% 30%, ${g.accent}40, transparent 65%), linear-gradient(to top, #05060a 10%, #05060a99 50%, #05060a66)`,
          }}
        />
        <div className="grid-floor absolute -inset-x-1/2 bottom-0 h-1/2 opacity-40" />
        <Particles n={24} />

        <div className="relative flex h-full flex-col justify-between p-12">
          <Link to="/">
            <Logo />
          </Link>

          <div>
            <span
              className="font-display text-sm font-black uppercase tracking-[0.2em]"
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

      {/* RIGHT: CLERK AUTH COMPONENT */}
      <div className="flex flex-col justify-center items-center px-6 py-12 lg:px-12 relative z-10">
        <div className="mb-6 lg:hidden">
          <Link to="/">
            <Logo />
          </Link>
        </div>

        <div className="w-full max-w-md flex justify-center">
          {isSignUp ? (
            <SignUp
              routing="path"
              path="/signup"
              signInUrl="/login"
              fallbackRedirectUrl="/"
              appearance={{
                elements: {
                  rootBox: 'w-full',
                  card: 'bg-[#0e111a] border border-white/15 shadow-2xl text-white',
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
                  footerActionLink: 'text-cyan hover:underline font-mono text-xs',
                  footerActionText: 'text-xs text-[#8c94a8]',
                },
              }}
            />
          ) : (
            <SignIn
              routing="path"
              path="/login"
              signUpUrl="/signup"
              fallbackRedirectUrl="/"
              appearance={{
                elements: {
                  rootBox: 'w-full',
                  card: 'bg-[#0e111a] border border-white/15 shadow-2xl text-white',
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
                  footerActionLink: 'text-cyan hover:underline font-mono text-xs',
                  footerActionText: 'text-xs text-[#8c94a8]',
                },
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
