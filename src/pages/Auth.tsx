import { lazy, Suspense, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import {
  AuthenticateWithRedirectCallback,
  SignIn,
  SignUp,
  useAuth,
  useUser,
} from '@clerk/react'
import {
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Loader2,
  Check,
  X,
} from 'lucide-react'
import StarBackground from '../components/StarBackground'
import CelestialArc from '../components/CelestialArc'
import { GAMES } from '../lib/data'
import { getGames, Game as ApiGame } from '../services/games'
import { useAuthContext } from '../context/AuthContext'
import { checkUsernameAvailability, updateUserProfile } from '../services/auth'
import { ametheusClerkAppearance } from '../lib/clerkTheme'

const Scene3D = lazy(() => import('../components/Scene3D'))

/**
 * Unified full-width authentication footer matching celestial glass aesthetic.
 */
function AuthFooter() {
  return (
    <footer className="relative z-20 w-full border-t border-white/[0.08] bg-black/40 backdrop-blur-md px-6 py-4 sm:px-10 lg:px-16">
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left font-mono text-xs text-dim">
        <span className="tracking-wider uppercase text-dim/90 flex-1 sm:text-left font-bold text-white/90">
          Ametheus
        </span>

        {/* Official External Links */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <a
            href="https://discord.gg/VzkfuK7We"
            target="_blank"
            rel="noopener noreferrer"
            className="text-dim/80 hover:text-[#5865F2] transition-colors tracking-wider"
          >
            Discord
          </a>
          <span className="text-white/20">·</span>
          <a
            href="https://www.instagram.com/official.ametheus"
            target="_blank"
            rel="noopener noreferrer"
            className="text-dim/80 hover:text-[#E1306C] transition-colors tracking-wider"
          >
            Instagram
          </a>
          <span className="text-white/20">·</span>
          <a
            href="https://www.youtube.com/@official.ametheus.goodgame"
            target="_blank"
            rel="noopener noreferrer"
            className="text-dim/80 hover:text-[#FF0000] transition-colors tracking-wider"
          >
            YouTube
          </a>
        </div>

        <div className="flex items-center gap-4 flex-1 justify-end">
          <Link
            to="/"
            className="text-dim/80 hover:text-cyan transition-colors tracking-wider"
          >
            Back to Home
          </Link>
          <Link
            to="/sign-in"
            className="tracking-wider uppercase text-dim/90 hover:text-[#6C47FF] transition-colors"
          >
            Ametheus Login
          </Link>
        </div>
      </div>
    </footer>
  )
}

export default function Auth() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isSignedIn, profile, refreshProfile } = useAuthContext()
  const { getToken } = useAuth()
  const { user } = useUser()
  const pathname = location.pathname

  // Canonical route determination
  const isSignInRoute =
    pathname === '/sign-in' ||
    pathname.startsWith('/sign-in/') ||
    pathname === '/login' ||
    pathname.startsWith('/login/')

  const isSignUpRoute =
    pathname === '/sign-up' ||
    pathname.startsWith('/sign-up/') ||
    pathname === '/signup' ||
    (pathname.startsWith('/signup/') && !pathname.includes('continue'))

  const isContinuationRoute =
    pathname.includes('/sign-up/continue') ||
    pathname.includes('/signup/continue') ||
    pathname.includes('/setup') ||
    pathname.includes('/onboarding')

  const isSsoCallback = pathname.includes('/sso-callback')
  const isUnauthorized = pathname.includes('/unauthorized')

  // Destination redirect handling
  const searchParams = new URLSearchParams(location.search)
  const destination =
    searchParams.get('redirect_url') ||
    (location.state as any)?.from?.pathname ||
    '/'

  // Canonicalize legacy /login and /signup paths to /sign-in and /sign-up
  useEffect(() => {
    if (pathname === '/login' || pathname.startsWith('/login/')) {
      const rest = pathname.replace(/^\/login/, '/sign-in')
      navigate(rest + location.search, { replace: true })
    } else if (
      pathname === '/signup' ||
      (pathname.startsWith('/signup/') && !pathname.includes('continue'))
    ) {
      const rest = pathname.replace(/^\/signup/, '/sign-up')
      navigate(rest + location.search, { replace: true })
    }
  }, [pathname, location.search, navigate])

  // Handle redirect if user is already signed in
  useEffect(() => {
    if (isSignedIn) {
      const needsUsername =
        profile?.needs_username === true ||
        (profile && !profile.has_chosen_username)

      if (needsUsername && !isContinuationRoute) {
        navigate('/sign-up/continue', { replace: true })
      } else if (!needsUsername && (isSignInRoute || isSignUpRoute)) {
        navigate(destination, { replace: true })
      }
    }
  }, [isSignedIn, profile?.needs_username, profile?.has_chosen_username, isContinuationRoute, isSignInRoute, isSignUpRoute, navigate, destination])

  // Contender Username setup form state
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Real-time username availability validation
  const [usernameStatus, setUsernameStatus] = useState<
    'idle' | 'checking' | 'available' | 'taken' | 'invalid'
  >('idle')
  const [usernameMessage, setUsernameMessage] = useState<string>('')

  useEffect(() => {
    const clean = username.trim()
    if (!clean) {
      setUsernameStatus('idle')
      setUsernameMessage('')
      return
    }
    if (clean.length < 3) {
      setUsernameStatus('invalid')
      setUsernameMessage('Username must be at least 3 characters.')
      return
    }
    if (!/^[a-zA-Z0-9_\-\.]+$/.test(clean)) {
      setUsernameStatus('invalid')
      setUsernameMessage('Letters, numbers, underscores, hyphens, and dots only.')
      return
    }

    setUsernameStatus('checking')
    setUsernameMessage('Checking availability...')

    const timer = setTimeout(async () => {
      try {
        const res = await checkUsernameAvailability(clean)
        if (res.available) {
          setUsernameStatus('available')
          setUsernameMessage(`✓ @${res.username} is available`)
        } else {
          setUsernameStatus('taken')
          setUsernameMessage(`✕ ${res.message || 'Username is already taken'}`)
        }
      } catch {
        setUsernameStatus('idle')
        setUsernameMessage('')
      }
    }, 320)

    return () => clearTimeout(timer)
  }, [username])

  // Contender Handle Setup / Profile finalization submission
  const handleSaveUsername = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanUsername = username.trim()
    if (cleanUsername.length < 3) {
      setError('Username must be at least 3 characters.')
      return
    }
    if (usernameStatus === 'taken' || usernameStatus === 'invalid') {
      setError('Please choose an available, valid Ametheus username.')
      return
    }
    setIsLoading(true)
    setError('')
    try {
      const token = await getToken()
      await updateUserProfile(
        {
          username: cleanUsername,
          display_name: displayName.trim() || cleanUsername,
        },
        token
      )

      if (user) {
        try {
          await user.update({
            username: cleanUsername,
            unsafeMetadata: {
              ...user.unsafeMetadata,
              username: cleanUsername,
              has_chosen_username: true,
            },
          })
        } catch (clerkSyncErr) {
          try {
            await user.update({
              unsafeMetadata: {
                ...user.unsafeMetadata,
                username: cleanUsername,
                has_chosen_username: true,
              },
            })
          } catch (metaErr) {
            console.warn('Clerk metadata update warning:', metaErr)
          }
        }
      }

      await refreshProfile()
      window.dispatchEvent(new CustomEvent('ametheus:profile_updated'))
      navigate(destination, { replace: true })
    } catch (err: any) {
      const msg =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        err?.message ||
        'Failed to save username. Please try a different handle.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  // Games pool for the left 3D background animation
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

  const rawG = gamesPool[gi % gamesPool.length]
  const g = {
    name: (rawG as any).name || 'Ametheus',
    short: (rawG as any).tag || (rawG as any).short || 'AMETHEUS',
    genre: (rawG as any).category || (rawG as any).genre || 'Esports',
    accent:
      (rawG as any).accent_color ||
      (rawG as any).accentColor ||
      (rawG as any).accent ||
      '#6C47FF',
    line:
      (rawG as any).announcement_text ||
      (rawG as any).announcementText ||
      (rawG as any).line ||
      'The Gaming Battleground',
    desc: (rawG as any).description || (rawG as any).desc || '',
  }

  // =========================================================================
  // 1. OAuth SSO Callback screen
  // =========================================================================
  if (isSsoCallback) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#05060a] text-white overflow-hidden">
        <StarBackground variant="continuation" />
        <CelestialArc variant="subtle" />
        <div className="relative z-10 flex flex-col items-center gap-4 p-8">
          <div className="size-9 animate-spin rounded-full border-2 border-[#6C47FF] border-t-transparent shadow-[0_0_16px_#6C47FF]" />
          <p className="font-mono text-xs uppercase tracking-widest text-white/80">
            Completing Ametheus Authentication...
          </p>
        </div>
        <AuthenticateWithRedirectCallback
          signInFallbackRedirectUrl={destination}
          signUpFallbackRedirectUrl={destination}
        />
      </div>
    )
  }

  // =========================================================================
  // 2. /sign-up/continue — Dedicated Username Setup OR Incomplete Signup
  // =========================================================================
  if (isContinuationRoute) {
    // If user is already signed in with Clerk and needs a username: show contender setup form
    if (
      isSignedIn &&
      (profile?.needs_username === true || !profile?.has_chosen_username)
    ) {
      return (
        <div className="relative min-h-screen flex flex-col justify-between items-center px-6 py-6 sm:px-10 overflow-hidden bg-void">
          <StarBackground variant="continuation" />
          <CelestialArc variant="major" />

          {/* Top Header Row */}
          <div className="relative z-10 w-full max-w-4xl flex items-center justify-between pt-2">
            <Link
              to="/"
              className="font-display text-lg font-black tracking-[0.25em] text-white hover:text-[#6C47FF] transition-colors uppercase"
              aria-label="Ametheus Home"
            >
              Ametheus
            </Link>
          </div>

          {/* Center: Contender Identity Setup Panel */}
          <div className="relative z-10 my-auto w-full max-w-[440px] mx-auto p-8 sm:p-10 rounded-2xl border border-white/[0.12] bg-[#090A0F]/95 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.7),0_0_35px_rgba(108,71,255,0.15)]">
            <div className="mb-6">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#6C47FF] block mb-1">
                Account Setup
              </span>
              <h2 className="font-display text-3xl font-black uppercase tracking-tight text-white leading-tight">
                Choose Contender Handle
              </h2>
              <p className="font-sans text-xs text-dim mt-2 leading-relaxed">
                Set your unique username to compete in tournaments and appear on leaderboards.
              </p>
            </div>

            {error && (
              <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-live/40 bg-live/15 p-3 text-xs leading-relaxed text-live backdrop-blur-md animate-fadeIn">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-live" />
                <span className="flex-1 font-mono text-[11px]">{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-ok/40 bg-ok/15 p-3 text-xs leading-relaxed text-ok backdrop-blur-md animate-fadeIn">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-ok" />
                <span className="flex-1 font-mono text-[11px]">{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleSaveUsername} className="space-y-4">
              <div>
                <label
                  htmlFor="continue-username"
                  className="block font-mono text-[11px] uppercase tracking-wider text-slate-300 font-medium mb-1.5"
                >
                  Username <span className="text-[#6C47FF]" aria-hidden="true">*</span>
                </label>
                <div className="relative">
                  <span
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm text-[#6C47FF] font-bold select-none"
                    aria-hidden="true"
                  >
                    @
                  </span>
                  <input
                    id="continue-username"
                    type="text"
                    required
                    autoFocus
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="shadowfox"
                    disabled={isLoading}
                    autoComplete="username"
                    aria-describedby="continue-username-feedback"
                    aria-invalid={usernameStatus === 'taken' || usernameStatus === 'invalid'}
                    className="h-12 w-full rounded-md border border-white/15 bg-black/60 pl-8 pr-10 text-sm text-white placeholder:text-dim/40 backdrop-blur-sm transition-all focus:border-[#6C47FF] focus:bg-black/80 focus:outline-none focus:ring-1 focus:ring-[#6C47FF]/50"
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2" aria-hidden="true">
                    {usernameStatus === 'checking' && (
                      <Loader2 size={16} className="animate-spin text-[#6C47FF]" />
                    )}
                    {usernameStatus === 'available' && (
                      <Check size={16} className="text-ok" />
                    )}
                    {usernameStatus === 'taken' && (
                      <X size={16} className="text-live" />
                    )}
                  </div>
                </div>

                <div
                  id="continue-username-feedback"
                  className="mt-1.5 min-h-[18px] px-1 font-mono text-[11px]"
                  aria-live="polite"
                >
                  {usernameStatus === 'checking' && (
                    <span className="text-dim flex items-center gap-1.5">
                      <Loader2 size={11} className="animate-spin text-[#6C47FF]" aria-hidden="true" />
                      Checking availability...
                    </span>
                  )}
                  {usernameStatus === 'available' && (
                    <span className="text-ok font-semibold">{usernameMessage}</span>
                  )}
                  {usernameStatus === 'taken' && (
                    <span className="text-live font-semibold">{usernameMessage}</span>
                  )}
                  {usernameStatus === 'invalid' && (
                    <span className="text-warn">{usernameMessage}</span>
                  )}
                  {usernameStatus === 'idle' && (
                    <span className="text-dim/60">3–30 chars (letters, numbers, _, -, .)</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-300 font-medium mb-1.5">
                  Display Name (Optional)
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  disabled={isLoading}
                  className="h-12 w-full rounded-md border border-white/15 bg-black/60 px-3.5 text-sm text-white placeholder:text-dim/40 backdrop-blur-sm transition-all focus:border-[#6C47FF] focus:bg-black/80 focus:outline-none focus:ring-1 focus:ring-[#6C47FF]/50"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || (username.length >= 3 && usernameStatus === 'taken')}
                className="group relative flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#6C47FF] hover:bg-[#5835ea] font-display text-base font-black uppercase tracking-wider text-white shadow-[0_0_24px_rgba(108,71,255,0.35)] transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer mt-5"
              >
                {isLoading ? (
                  <>
                    <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span className="font-mono text-xs font-bold tracking-wider">
                      Saving Profile...
                    </span>
                  </>
                ) : (
                  <>
                    <span>Confirm Contender Handle</span>
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>
          </div>

          <AuthFooter />
        </div>
      )
    }

    // Otherwise, render Clerk's SignUp continuation flow
    return (
      <div className="relative min-h-screen flex flex-col justify-between items-center px-6 py-6 sm:px-10 overflow-hidden bg-void">
        <StarBackground variant="continuation" />
        <CelestialArc variant="major" />

        <div className="relative z-10 w-full max-w-4xl flex items-center justify-between pt-2">
          <Link
            to="/"
            className="font-display text-lg font-black tracking-[0.25em] text-white hover:text-[#6C47FF] transition-colors uppercase"
            aria-label="Ametheus Home"
          >
            Ametheus
          </Link>
        </div>

        <div className="relative z-10 my-auto w-full max-w-[440px] mx-auto">
          <SignUp
            path="/sign-up"
            routing="path"
            signInUrl="/sign-in"
            fallbackRedirectUrl={destination}
            appearance={ametheusClerkAppearance}
          />
        </div>

        <AuthFooter />
      </div>
    )
  }

  // =========================================================================
  // 3. /unauthorized Screen
  // =========================================================================
  if (isUnauthorized) {
    return (
      <div className="relative min-h-screen flex flex-col justify-between items-center px-6 py-6 sm:px-10 overflow-hidden bg-void">
        <StarBackground variant="continuation" />
        <CelestialArc variant="subtle" />

        <div className="relative z-10 w-full max-w-4xl flex items-center justify-between pt-2">
          <Link
            to="/"
            className="font-display text-lg font-black tracking-[0.25em] text-white hover:text-cyan transition-colors uppercase"
            aria-label="Ametheus Home"
          >
            Ametheus
          </Link>
        </div>

        <div className="relative z-10 my-auto w-full max-w-[440px] mx-auto p-8 rounded-2xl border border-rose-500/30 bg-[#090A0F]/95 backdrop-blur-xl shadow-2xl">
          <div className="flex items-start gap-3">
            <ShieldAlert size={22} className="mt-0.5 shrink-0 text-rose-400" />
            <div className="space-y-1">
              <p className="font-mono text-xs font-bold uppercase tracking-wider text-rose-300">
                Restricted Arena Terminal
              </p>
              <p className="font-sans text-xs text-dim leading-relaxed">
                The requested circuit arena requires verified contender credentials or elevated permissions. Please authenticate with an authorized account.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-2.5">
            <button
              type="button"
              onClick={() => navigate('/sign-in')}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#6C47FF] hover:bg-[#5835ea] font-display text-sm font-black uppercase tracking-wider text-white shadow-[0_0_20px_rgba(108,71,255,0.35)] transition-all cursor-pointer"
            >
              <span>Sign In with Authorized Account</span>
              <ArrowRight size={16} />
            </button>

            <Link
              to="/"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white font-mono text-xs uppercase tracking-wider transition-all"
            >
              Return to Arena
            </Link>
          </div>
        </div>

        <AuthFooter />
      </div>
    )
  }

  // =========================================================================
  // 4. MAIN APPLICATION-HOSTED AUTHENTICATION (SIGN-IN & SIGN-UP)
  // =========================================================================
  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-void overflow-hidden">
      <StarBackground variant="standard" />
      <CelestialArc variant="sweeping" />

      {/* Main interactive grid: Left 3D Showcase (Desktop), Right Clerk Auth Panel */}
      <div className="relative z-10 flex-1 grid lg:grid-cols-[1.1fr_1fr] items-stretch">
        {/* LEFT: 3D SPHERE SHOWCASE */}
        <div className="relative hidden overflow-hidden lg:flex lg:flex-col justify-between p-12 lg:p-16">
          <Suspense fallback={null}>
            <Scene3D
              accent={g.accent}
              scale={0.90}
              className="pointer-events-none absolute inset-0 opacity-80"
            />
          </Suspense>

          {/* Top Brand Text Header */}
          <div className="relative z-10">
            <Link
              to="/"
              className="font-display text-lg font-black tracking-[0.25em] text-white hover:text-cyan transition-colors uppercase"
              aria-label="Ametheus Home"
            >
              Ametheus
            </Link>
          </div>

          {/* Center Esports Game Highlights */}
          <div className="relative z-10 my-auto py-12">
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

          <div className="relative z-10" />
        </div>

        {/* RIGHT: APPLICATION-HOSTED CLERK AUTHENTICATION COMPONENT */}
        <div className="relative z-10 flex flex-col justify-between px-6 py-8 sm:px-10 lg:px-12 xl:px-14 overflow-hidden">
          {/* Top Mobile Brand Header */}
          <div className="relative z-10 flex items-center justify-between lg:hidden mb-4">
            <Link
              to="/"
              className="font-display text-base font-black tracking-[0.2em] text-white hover:text-cyan transition-colors uppercase"
              aria-label="Ametheus Home"
            >
              Ametheus
            </Link>
          </div>

          {/* Center: Clerk Prebuilt Component Container */}
          <div className="relative z-10 my-auto w-full max-w-[440px] mx-auto">
            {isSignUpRoute ? (
              <SignUp
                path="/sign-up"
                routing="path"
                signInUrl="/sign-in"
                fallbackRedirectUrl={destination}
                appearance={ametheusClerkAppearance}
              />
            ) : (
              <SignIn
                path="/sign-in"
                routing="path"
                signUpUrl="/sign-up"
                fallbackRedirectUrl={destination}
                appearance={ametheusClerkAppearance}
              />
            )}
          </div>

          <div className="relative z-10" />
        </div>
      </div>

      {/* ONE UNIFIED FULL-WIDTH FOOTER */}
      <AuthFooter />
    </div>
  )
}
