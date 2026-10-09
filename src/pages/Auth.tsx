import { useEffect, useState } from 'react'
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
  ShieldCheck,
  Lock,
  Loader2,
  Check,
  X,
} from 'lucide-react'
import StarBackground from '../components/StarBackground'
import CelestialArc from '../components/CelestialArc'
import { useAuthContext } from '../context/AuthContext'
import { checkUsernameAvailability, updateUserProfile } from '../services/auth'
import { ametheusClerkAppearance } from '../lib/clerkTheme'

/**
 * Clean, minimal authentication footer.
 * Contains only Ametheus branding and Back to Home link.
 */
function AuthFooter() {
  return (
    <footer className="relative z-10 w-full border-t border-white/10 px-6 py-5">
      <div className="max-w-4xl mx-auto flex items-center justify-between text-xs font-mono text-dim">
        <span className="uppercase tracking-wider font-semibold text-white/70">Ametheus</span>
        <Link
          to="/"
          className="text-dim hover:text-white transition-colors tracking-wider"
        >
          Back to Home
        </Link>
      </div>
    </footer>
  )
}

/**
 * Minimal header displaying only Ametheus branding.
 */
function AuthHeader() {
  return (
    <header className="relative z-10 w-full max-w-4xl mx-auto flex items-center justify-between px-6 pt-8 pb-4">
      <Link
        to="/"
        className="font-display text-xl font-black tracking-[0.25em] text-white hover:text-cyan transition-colors uppercase"
        aria-label="Ametheus Home"
      >
        Ametheus
      </Link>
    </header>
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
  const isUnauthorizedSignIn =
    pathname === '/unauthorized-sign-in' ||
    pathname.startsWith('/unauthorized-sign-in/')
  const isUnauthorized =
    (pathname === '/unauthorized' || pathname.startsWith('/unauthorized/')) &&
    !isUnauthorizedSignIn

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
      setError('Please choose an available, valid username.')
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

  // =========================================================================
  // 1. OAuth SSO Callback screen
  // =========================================================================
  if (isSsoCallback) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center bg-void text-white overflow-hidden">
        <StarBackground variant="continuation" />
        <CelestialArc variant="subtle" />
        <div className="relative z-10 flex flex-col items-center gap-4 p-8">
          <div className="size-9 animate-spin rounded-full border-2 border-cyan border-t-transparent shadow-[0_0_16px_rgba(0,245,255,0.4)]" />
          <p className="font-mono text-xs uppercase tracking-widest text-white/80">
            Completing authentication...
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
    if (
      isSignedIn &&
      (profile?.needs_username === true || !profile?.has_chosen_username)
    ) {
      return (
        <div className="relative min-h-screen flex flex-col justify-between bg-void text-white overflow-hidden">
          <StarBackground variant="continuation" />
          <CelestialArc variant="major" />

          <AuthHeader />

          {/* Floating Username Form without cards/containers */}
          <main className="relative z-10 my-auto w-full max-w-[380px] mx-auto px-6 py-8">
            <div className="mb-6">
              <h1 className="font-display text-3xl font-black uppercase tracking-tight text-white">
                Choose username
              </h1>
              <p className="font-sans text-xs text-dim mt-1.5 leading-relaxed">
                Set your username to continue to Ametheus.
              </p>
            </div>

            {error && (
              <div className="mb-5 flex items-start gap-2.5 border border-live/40 bg-live/10 p-3 text-xs leading-relaxed text-live">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-live" />
                <span className="flex-1 font-mono text-[11px]">{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="mb-5 flex items-start gap-2.5 border border-ok/40 bg-ok/10 p-3 text-xs leading-relaxed text-ok">
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
                  Username <span className="text-cyan" aria-hidden="true">*</span>
                </label>
                <div className="relative">
                  <span
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm text-cyan font-bold select-none"
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
                    className="h-11 w-full border border-white/15 bg-white/[0.04] pl-8 pr-10 text-sm text-white placeholder:text-dim/40 transition-all focus:border-cyan focus:bg-white/[0.08] focus:outline-none"
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2" aria-hidden="true">
                    {usernameStatus === 'checking' && (
                      <Loader2 size={16} className="animate-spin text-cyan" />
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
                      <Loader2 size={11} className="animate-spin text-cyan" aria-hidden="true" />
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
                    <span className="text-dim/60">3–30 characters</span>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="continue-displayname"
                  className="block font-mono text-[11px] uppercase tracking-wider text-slate-300 font-medium mb-1.5"
                >
                  Display Name <span className="text-dim/50 font-normal">(Optional)</span>
                </label>
                <input
                  id="continue-displayname"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Shadow Fox"
                  disabled={isLoading}
                  autoComplete="name"
                  className="h-11 w-full border border-white/15 bg-white/[0.04] px-3.5 text-sm text-white placeholder:text-dim/40 transition-all focus:border-cyan focus:bg-white/[0.08] focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading || usernameStatus !== 'available'}
                  className="flex h-11 w-full items-center justify-center gap-2 bg-cyan hover:bg-cyan/90 disabled:opacity-40 disabled:cursor-not-allowed font-display text-sm font-black uppercase tracking-wider text-void transition-all cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin text-void" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </main>

          <AuthFooter />
        </div>
      )
    }

    // Unfinished sign-up continuation via Clerk
    return (
      <div className="relative min-h-screen flex flex-col justify-between bg-void text-white overflow-hidden">
        <StarBackground variant="continuation" />
        <CelestialArc variant="major" />

        <AuthHeader />

        <main className="relative z-10 my-auto w-full max-w-[400px] mx-auto px-6 py-8">
          <SignUp
            path="/sign-up"
            routing="path"
            signInUrl="/sign-in"
            fallbackRedirectUrl={destination}
            appearance={ametheusClerkAppearance}
          />
        </main>

        <AuthFooter />
      </div>
    )
  }

  // =========================================================================
  // 3. /unauthorized-sign-in Screen (Unrecognized Device Session Revocation)
  // =========================================================================
  if (isUnauthorizedSignIn) {
    const errorParam = searchParams.get('error') || searchParams.get('error_code')
    const hasError = Boolean(errorParam)
    const errorMessage =
      searchParams.get('message') ||
      (errorParam === 'session_expired' || errorParam === 'expired'
        ? 'This revocation link has expired.'
        : errorParam
        ? `Revocation issue encountered: ${errorParam}`
        : '')

    return (
      <div className="relative min-h-screen flex flex-col justify-between bg-void text-white overflow-hidden">
        <StarBackground variant="continuation" />
        <CelestialArc variant={hasError ? 'subtle' : 'major'} />

        <AuthHeader />

        <main className="relative z-10 my-auto w-full max-w-[420px] mx-auto px-6 py-8">
          {hasError ? (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <ShieldAlert size={24} className="text-rose-400 shrink-0" />
                <h1 className="font-display text-2xl font-black uppercase tracking-tight text-white">
                  Revocation Unsuccessful
                </h1>
              </div>

              <div className="border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-200/90 font-mono leading-relaxed">
                {errorMessage || 'The revocation link could not be verified or has already expired.'}
              </div>

              <p className="font-sans text-xs text-dim leading-relaxed">
                If you suspect unauthorized activity on your account, please update your password and inspect your active sessions.
              </p>

              <div className="space-y-2.5 pt-2">
                <Link
                  to="/settings?tab=Security"
                  className="flex h-11 w-full items-center justify-center gap-2 bg-cyan hover:bg-cyan/90 font-display text-xs font-black uppercase tracking-wider text-void transition-all cursor-pointer"
                >
                  <Lock size={14} />
                  <span>Update Password & Sessions</span>
                </Link>

                <Link
                  to="/sign-in"
                  className="flex h-11 w-full items-center justify-center gap-2 border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] text-white font-mono text-xs uppercase tracking-wider transition-all"
                >
                  <span>Sign In</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <ShieldCheck size={24} className="text-emerald-400 shrink-0" />
                <h1 className="font-display text-2xl font-black uppercase tracking-tight text-white">
                  Session Terminated
                </h1>
              </div>

              <div className="border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-200/90 font-mono leading-relaxed">
                The unauthorized session was revoked on the authentication server. Access from that device has been terminated.
              </div>

              <div className="space-y-1.5 text-xs text-dim">
                <p className="font-sans leading-relaxed">Recommended next steps:</p>
                <ul className="list-disc pl-4 space-y-1 font-sans text-white/80">
                  <li>Review active logins under Security settings.</li>
                  <li>Update your password if your credentials may be compromised.</li>
                </ul>
              </div>

              <div className="space-y-2.5 pt-2">
                <Link
                  to="/settings?tab=Security"
                  className="flex h-11 w-full items-center justify-center gap-2 bg-cyan hover:bg-cyan/90 font-display text-xs font-black uppercase tracking-wider text-void transition-all cursor-pointer"
                >
                  <ShieldCheck size={14} />
                  <span>Review Active Sessions</span>
                </Link>

                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/sign-in"
                    className="flex h-10 items-center justify-center gap-1.5 border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] text-white font-mono text-xs uppercase tracking-wider transition-all"
                  >
                    <span>Sign In</span>
                    <ArrowRight size={13} />
                  </Link>
                  <Link
                    to="/"
                    className="flex h-10 items-center justify-center gap-1.5 border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] text-dim hover:text-white font-mono text-xs uppercase tracking-wider transition-all"
                  >
                    <span>Back to Home</span>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </main>

        <AuthFooter />
      </div>
    )
  }

  // =========================================================================
  // 4. /unauthorized Screen (403 Permission Screen)
  // =========================================================================
  if (isUnauthorized) {
    return (
      <div className="relative min-h-screen flex flex-col justify-between bg-void text-white overflow-hidden">
        <StarBackground variant="continuation" />
        <CelestialArc variant="subtle" />

        <AuthHeader />

        <main className="relative z-10 my-auto w-full max-w-[420px] mx-auto px-6 py-8">
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <ShieldAlert size={24} className="text-rose-400 shrink-0" />
              <h1 className="font-display text-2xl font-black uppercase tracking-tight text-white">
                Access Restricted
              </h1>
            </div>

            <p className="font-sans text-xs text-dim leading-relaxed">
              This area requires verified credentials or elevated permissions. Please authenticate with an authorized account.
            </p>

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={() => navigate('/sign-in')}
                className="flex h-11 w-full items-center justify-center gap-2 bg-cyan hover:bg-cyan/90 font-display text-xs font-black uppercase tracking-wider text-void transition-all cursor-pointer"
              >
                <span>Sign In to Ametheus</span>
                <ArrowRight size={14} />
              </button>

              <Link
                to="/"
                className="flex h-11 w-full items-center justify-center gap-2 border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] text-white font-mono text-xs uppercase tracking-wider transition-all"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </main>

        <AuthFooter />
      </div>
    )
  }

  // =========================================================================
  // 5. MAIN APPLICATION-HOSTED AUTHENTICATION (SIGN-IN & SIGN-UP)
  // Clean floating forms with no artificial outer cards or banner panels.
  // =========================================================================
  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-void text-white overflow-hidden">
      <StarBackground variant="standard" />
      <CelestialArc variant="sweeping" />

      <AuthHeader />

      {/* Floating Center Form: Naturally Integrated into Page Background */}
      <main className="relative z-10 my-auto w-full max-w-[400px] mx-auto px-6 py-8">
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
      </main>

      <AuthFooter />
    </div>
  )
}
