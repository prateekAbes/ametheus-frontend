import { lazy, Suspense, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { useSignIn, useSignUp } from '@clerk/react/legacy'
import { AuthenticateWithRedirectCallback } from '@clerk/react'
import { Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react'
import { Hud, Particles } from '../components/ui'
import { Logo } from '../components/Layout'
import { GAMES } from '../lib/data'
import { getGames, Game as ApiGame } from '../services/games'
import { useAuthContext } from '../context/AuthContext'

const Scene3D = lazy(() => import('../components/Scene3D'))

type AuthMode = 'login' | 'signup' | 'forgot-password' | 'verify-email' | 'reset-password-code'

export default function Auth() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isSignedIn } = useAuthContext()
  const pathname = location.pathname

  // Clerk hooks
  const { isLoaded: isSignInLoaded, signIn, setActive } = useSignIn()
  const { isLoaded: isSignUpLoaded, signUp, setActive: setSignUpActive } = useSignUp()

  // Determine initial mode based on route
  const [mode, setMode] = useState<AuthMode>(() => {
    if (pathname.includes('/signup')) return 'signup'
    if (pathname.includes('/forgot-password')) return 'forgot-password'
    return 'login'
  })

  // Synchronize mode if pathname changes
  useEffect(() => {
    if (pathname.includes('/signup')) setMode('signup')
    else if (pathname.includes('/forgot-password')) setMode('forgot-password')
    else if (!pathname.includes('sso-callback')) setMode('login')
  }, [pathname])

  // Form State
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Games pool for the left 3D background animation (left side logic unchanged)
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

  // Redirect to requested page or home if already signed in
  const destination = (location.state as any)?.from?.pathname || '/'
  useEffect(() => {
    if (isSignedIn) {
      navigate(destination, { replace: true })
    }
  }, [isSignedIn, navigate, destination])

  // Left side visual attributes (UNTOUCHED)
  const rawG = gamesPool[gi % gamesPool.length]
  const g = {
    name: (rawG as any).name || 'Ametheus',
    short: (rawG as any).tag || (rawG as any).short || 'AMETHEUS',
    genre: (rawG as any).category || (rawG as any).genre || 'Esports',
    accent: (rawG as any).accent_color || (rawG as any).accentColor || (rawG as any).accent || '#3ef2ff',
    line: (rawG as any).announcement_text || (rawG as any).announcementText || (rawG as any).line || 'The Gaming Battleground',
    desc: (rawG as any).description || (rawG as any).desc || '',
  }

  // Handle OAuth SSO Callbacks cleanly
  if (location.pathname.includes('sso-callback')) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-void text-white">
        <div className="relative z-10 flex flex-col items-center gap-4 rounded-xl border border-white/10 bg-[#0c0e17]/90 p-8 shadow-2xl backdrop-blur-xl">
          <div className="size-8 animate-spin rounded-full border-2 border-cyan border-t-transparent" />
          <p className="font-mono text-xs uppercase tracking-wider text-dim">
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

  // Social / External OAuth Sign In
  const handleOAuth = async (strategy: 'oauth_google') => {
    setError('')
    setIsLoading(true)
    try {
      if (!isSignInLoaded || !signIn) {
        throw new Error('Authentication service is initializing. Please try again.')
      }
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: '/sso-callback',
        redirectUrlComplete: destination,
        continueSignUp: true,
      })
    } catch (err: any) {
      setIsLoading(false)
      const msg =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        err?.message ||
        'External authentication failed.'
      setError(msg)
    }
  }

  // Standard Email / Password Sign In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isSignInLoaded || !signIn) return
    if (!email || !password) {
      setError('Please enter both email and password.')
      return
    }
    setIsLoading(true)
    setError('')
    try {
      const result = await signIn.create({
        identifier: email.trim(),
        password,
      })
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        navigate(destination, { replace: true })
      } else if (result.status === 'needs_first_factor') {
        setError('Additional identity verification is required.')
      } else {
        setError(`Authentication status: ${result.status}`)
      }
    } catch (err: any) {
      const msg =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        err?.message ||
        'Invalid email or password.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  // Sign Up Flow
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isSignUpLoaded || !signUp) return
    if (!email || !password) {
      setError('Please fill in your email and password.')
      return
    }
    setIsLoading(true)
    setError('')
    try {
      const result = await signUp.create({
        emailAddress: email.trim(),
        password,
        username: username.trim() || undefined,
      })
      if (result.status === 'complete') {
        await setSignUpActive({ session: result.createdSessionId })
        navigate(destination, { replace: true })
      } else if (result.unverifiedFields.includes('email_address')) {
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
        setMode('verify-email')
        setSuccessMessage(`A 6-digit confirmation code was sent to ${email}.`)
      } else {
        setMode('verify-email')
      }
    } catch (err: any) {
      const msg =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        err?.message ||
        'Failed to create account.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  // Email Verification (Sign Up confirmation)
  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isSignUpLoaded || !signUp) return
    if (!verificationCode) {
      setError('Please enter the verification code.')
      return
    }
    setIsLoading(true)
    setError('')
    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode.trim(),
      })
      if (result.status === 'complete') {
        await setSignUpActive({ session: result.createdSessionId })
        navigate(destination, { replace: true })
      } else {
        setError('Verification incomplete. Please check the code and retry.')
      }
    } catch (err: any) {
      const msg =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        err?.message ||
        'Invalid verification code.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  // Request Password Reset Code
  const handleRequestPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isSignInLoaded || !signIn) return
    if (!email) {
      setError('Please enter your account email.')
      return
    }
    setIsLoading(true)
    setError('')
    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email.trim(),
      })
      setMode('reset-password-code')
      setSuccessMessage(`Password reset code dispatched to ${email}.`)
    } catch (err: any) {
      const msg =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        err?.message ||
        'Unable to send reset code.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  // Submit Password Reset Code & New Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isSignInLoaded || !signIn) return
    if (!verificationCode || !newPassword) {
      setError('Please enter the reset code and a new password.')
      return
    }
    setIsLoading(true)
    setError('')
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code: verificationCode.trim(),
        password: newPassword,
      })
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        navigate(destination, { replace: true })
      } else {
        setError('Password reset incomplete.')
      }
    } catch (err: any) {
      const msg =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        err?.message ||
        'Failed to reset password.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative grid min-h-screen lg:grid-cols-[1.1fr_1fr] bg-void">
      {/* LEFT: AMETHEUS DYNAMIC ANIMATION (CLEAN BACKGROUND, NO IMAGES — 100% UNTOUCHED) */}
      <div className="relative hidden overflow-hidden bg-void lg:block border-r border-white/10">
        <Suspense fallback={null}>
          <Scene3D
            accent={g.accent}
            className="pointer-events-none absolute inset-0 opacity-40"
          />
        </Suspense>
        <div
          className="absolute inset-0 transition-[background] duration-1000"
          style={{
            background: `radial-gradient(circle at 30% 30%, ${g.accent}40, transparent 65%), linear-gradient(to top, #05060a 10%, #05060a99 50%, #05060a66)`,
          }}
        />
        <div className="grid-floor absolute -inset-x-1/2 bottom-0 h-1/2 opacity-40" />
        <Particles n={24} />

        <div className="relative flex h-full flex-col justify-between p-12 lg:p-16">
          <Link to="/" aria-label="Ametheus Home">
            <Logo />
          </Link>

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

      {/* RIGHT: REDESIGNED PREMIUM AUTHENTICATION PANEL (STRICT REFERENCE MATCH) */}
      <div className="relative z-10 flex min-h-screen flex-col justify-between bg-[#06070a] px-6 py-8 sm:px-10 lg:px-12 xl:px-14 overflow-hidden">
        {/* Ambient atmospheric background glows */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(62,242,255,0.07),transparent)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(139,92,246,0.04),transparent)]" />

        {/* Top Header Row */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="lg:hidden">
            <Link to="/" aria-label="Ametheus Home">
              <Logo />
            </Link>
          </div>
          <div className="ml-auto flex items-center gap-2 rounded-full border border-white/10 bg-surface/60 px-3.5 py-1.5 font-mono text-[11px] text-dim backdrop-blur-md shadow-inner">
            <span className="size-1.5 rounded-full bg-cyan animate-pulse shadow-[0_0_8px_#3ef2ff]" />
            <span className="tracking-wider uppercase">Sanctioned Esports Gateway</span>
          </div>
        </div>

        {/* Center: Premium Authentication Card */}
        <div className="relative z-10 my-auto w-full max-w-[430px] mx-auto py-6">
          <div className="relative rounded-2xl border border-white/[0.09] bg-[#0c0e17]/90 p-7 sm:p-9 shadow-[0_24px_64px_rgba(0,0,0,0.85)] backdrop-blur-xl overflow-hidden">
            {/* Top specular accent line */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan/50 to-transparent" />
            {/* Soft inner ambient glow */}
            <div className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 size-40 rounded-full bg-cyan/10 blur-3xl" />

            {/* Brand Header */}
            <div className="mb-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-7 items-center justify-center rounded border border-cyan/40 bg-cyan/10 shadow-[0_0_12px_rgba(62,242,255,0.2)]">
                    <svg width="15" height="14" viewBox="0 0 30 28" fill="none">
                      <polygon points="3,7 25,7 27,2 5,2" fill="#3ef2ff" />
                      <polygon points="7,15 21,15 23,10 9,10" fill="#3ef2ff" />
                      <polygon points="11,23 17,23 19,18 13,18" fill="#3ef2ff" />
                    </svg>
                  </span>
                  <span className="font-display text-sm font-black tracking-[0.2em] text-white">
                    AMETHEUS <span className="text-cyan">ID</span>
                  </span>
                </div>
                <span className="rounded border border-white/10 bg-white/[0.03] px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-dim">
                  v2.6 SECURE
                </span>
              </div>

              <h2 className="font-display text-3xl font-black uppercase tracking-tight text-white leading-tight">
                {mode === 'login' && 'Welcome back'}
                {mode === 'signup' && 'Create account'}
                {mode === 'forgot-password' && 'Reset password'}
                {mode === 'verify-email' && 'Verify your email'}
                {mode === 'reset-password-code' && 'Set new password'}
              </h2>
              <p className="font-sans text-xs text-dim mt-1.5 leading-relaxed">
                {mode === 'login' && 'Sign in to continue to your contender account'}
                {mode === 'signup' && 'Create your contender profile to compete in official circuits'}
                {mode === 'forgot-password' && 'Enter your email to receive recovery instructions'}
                {mode === 'verify-email' && 'Enter the 6-digit confirmation code sent to your inbox'}
                {mode === 'reset-password-code' && 'Enter the reset code and choose your new password'}
              </p>
            </div>

            {/* Error Notification Banner */}
            {error && (
              <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-live/30 bg-live/10 p-3 text-xs leading-relaxed text-live animate-fadeIn">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-live" />
                <span className="flex-1 font-mono text-[11px]">{error}</span>
              </div>
            )}

            {/* Success Notification Banner */}
            {successMessage && (
              <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-ok/30 bg-ok/10 p-3 text-xs leading-relaxed text-ok animate-fadeIn">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-ok" />
                <span className="flex-1 font-mono text-[11px]">{successMessage}</span>
              </div>
            )}

            {/* Social / External Authentication (shown on Login & Signup) */}
            {(mode === 'login' || mode === 'signup') && (
              <>
                <button
                  type="button"
                  onClick={() => handleOAuth('oauth_google')}
                  disabled={isLoading || !isSignInLoaded}
                  className="group relative flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-white/10 bg-[#121522] px-4 font-sans text-xs font-semibold text-white shadow-sm transition-all hover:border-white/20 hover:bg-[#181d2e] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                >
                  <svg className="size-4 shrink-0 transition-transform group-hover:scale-105" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.27 21.36 7.34 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.27 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                  </svg>
                  <span>Continue with Google</span>
                </button>

                {/* Subtle Divider */}
                <div className="relative my-5 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/[0.08]" />
                  </div>
                  <span className="relative bg-[#0c0e17] px-3 font-mono text-[10px] font-semibold uppercase tracking-widest text-dim">
                    OR CONTINUE WITH EMAIL
                  </span>
                </div>
              </>
            )}

            {/* MODE 1: SIGN IN */}
            {mode === 'login' && (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-ink/80 font-medium mb-1.5">
                    Email address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    disabled={isLoading}
                    className="h-11 w-full rounded-lg border border-white/10 bg-[#07090f]/90 px-3.5 text-sm text-white placeholder:text-dim/40 transition-all focus:border-cyan/70 focus:outline-none focus:ring-1 focus:ring-cyan/30"
                  />
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="font-mono text-[11px] uppercase tracking-wider text-ink/80 font-medium">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot-password')
                        navigate('/forgot-password')
                        setError('')
                        setSuccessMessage('')
                      }}
                      className="font-mono text-[11px] text-cyan hover:underline transition-colors cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      disabled={isLoading}
                      className="h-11 w-full rounded-lg border border-white/10 bg-[#07090f]/90 px-3.5 pr-10 text-sm text-white placeholder:text-dim/40 transition-all focus:border-cyan/70 focus:outline-none focus:ring-1 focus:ring-cyan/30"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-dim hover:text-white transition-colors cursor-pointer p-1"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-cyan font-display text-base font-black uppercase tracking-wider text-void shadow-[0_0_20px_rgba(62,242,255,0.25)] transition-all hover:bg-[#5ef5ff] hover:shadow-[0_0_28px_rgba(62,242,255,0.4)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer mt-2"
                >
                  {isLoading ? (
                    <>
                      <div className="size-4 animate-spin rounded-full border-2 border-void border-t-transparent" />
                      <span className="font-mono text-xs font-bold tracking-wider">Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* MODE 2: SIGN UP */}
            {mode === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-ink/80 font-medium mb-1.5">
                    Contender Username (Optional)
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. shadow_striker"
                    disabled={isLoading}
                    className="h-11 w-full rounded-lg border border-white/10 bg-[#07090f]/90 px-3.5 text-sm text-white placeholder:text-dim/40 transition-all focus:border-cyan/70 focus:outline-none focus:ring-1 focus:ring-cyan/30"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-ink/80 font-medium mb-1.5">
                    Email address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    disabled={isLoading}
                    className="h-11 w-full rounded-lg border border-white/10 bg-[#07090f]/90 px-3.5 text-sm text-white placeholder:text-dim/40 transition-all focus:border-cyan/70 focus:outline-none focus:ring-1 focus:ring-cyan/30"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-ink/80 font-medium mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      disabled={isLoading}
                      className="h-11 w-full rounded-lg border border-white/10 bg-[#07090f]/90 px-3.5 pr-10 text-sm text-white placeholder:text-dim/40 transition-all focus:border-cyan/70 focus:outline-none focus:ring-1 focus:ring-cyan/30"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-dim hover:text-white transition-colors cursor-pointer p-1"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-cyan font-display text-base font-black uppercase tracking-wider text-void shadow-[0_0_20px_rgba(62,242,255,0.25)] transition-all hover:bg-[#5ef5ff] hover:shadow-[0_0_28px_rgba(62,242,255,0.4)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer mt-2"
                >
                  {isLoading ? (
                    <>
                      <div className="size-4 animate-spin rounded-full border-2 border-void border-t-transparent" />
                      <span className="font-mono text-xs font-bold tracking-wider">Creating Profile...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Account</span>
                      <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* MODE 3: EMAIL VERIFICATION CODE (AFTER SIGNUP) */}
            {mode === 'verify-email' && (
              <form onSubmit={handleVerifyEmail} className="space-y-4">
                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-ink/80 font-medium mb-1.5">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    required
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    disabled={isLoading}
                    className="h-11 w-full rounded-lg border border-white/10 bg-[#07090f]/90 px-3.5 text-center font-mono text-base tracking-widest text-white placeholder:text-dim/40 transition-all focus:border-cyan/70 focus:outline-none focus:ring-1 focus:ring-cyan/30"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-cyan font-display text-base font-black uppercase tracking-wider text-void shadow-[0_0_20px_rgba(62,242,255,0.25)] transition-all hover:bg-[#5ef5ff] hover:shadow-[0_0_28px_rgba(62,242,255,0.4)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <div className="size-4 animate-spin rounded-full border-2 border-void border-t-transparent" />
                      <span className="font-mono text-xs font-bold tracking-wider">Verifying...</span>
                    </>
                  ) : (
                    <span>Complete Verification</span>
                  )}
                </button>
              </form>
            )}

            {/* MODE 4: FORGOT PASSWORD (REQUEST CODE) */}
            {mode === 'forgot-password' && (
              <form onSubmit={handleRequestPasswordReset} className="space-y-4">
                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-ink/80 font-medium mb-1.5">
                    Account Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    disabled={isLoading}
                    className="h-11 w-full rounded-lg border border-white/10 bg-[#07090f]/90 px-3.5 text-sm text-white placeholder:text-dim/40 transition-all focus:border-cyan/70 focus:outline-none focus:ring-1 focus:ring-cyan/30"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-cyan font-display text-base font-black uppercase tracking-wider text-void shadow-[0_0_20px_rgba(62,242,255,0.25)] transition-all hover:bg-[#5ef5ff] hover:shadow-[0_0_28px_rgba(62,242,255,0.4)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <div className="size-4 animate-spin rounded-full border-2 border-void border-t-transparent" />
                      <span className="font-mono text-xs font-bold tracking-wider">Sending Code...</span>
                    </>
                  ) : (
                    <span>Send Reset Code</span>
                  )}
                </button>
              </form>
            )}

            {/* MODE 5: SET NEW PASSWORD (WITH CODE) */}
            {mode === 'reset-password-code' && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-ink/80 font-medium mb-1.5">
                    Reset Code
                  </label>
                  <input
                    type="text"
                    required
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="Enter reset code"
                    disabled={isLoading}
                    className="h-11 w-full rounded-lg border border-white/10 bg-[#07090f]/90 px-3.5 text-center font-mono text-sm tracking-widest text-white placeholder:text-dim/40 transition-all focus:border-cyan/70 focus:outline-none focus:ring-1 focus:ring-cyan/30"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-ink/80 font-medium mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      disabled={isLoading}
                      className="h-11 w-full rounded-lg border border-white/10 bg-[#07090f]/90 px-3.5 pr-10 text-sm text-white placeholder:text-dim/40 transition-all focus:border-cyan/70 focus:outline-none focus:ring-1 focus:ring-cyan/30"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-dim hover:text-white transition-colors cursor-pointer p-1"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-cyan font-display text-base font-black uppercase tracking-wider text-void shadow-[0_0_20px_rgba(62,242,255,0.25)] transition-all hover:bg-[#5ef5ff] hover:shadow-[0_0_28px_rgba(62,242,255,0.4)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <div className="size-4 animate-spin rounded-full border-2 border-void border-t-transparent" />
                      <span className="font-mono text-xs font-bold tracking-wider">Updating Password...</span>
                    </>
                  ) : (
                    <span>Update Password &amp; Sign In</span>
                  )}
                </button>
              </form>
            )}

            {/* Bottom Mode Switcher */}
            <div className="mt-6 border-t border-white/[0.06] pt-4 text-center font-mono text-xs text-dim">
              {mode === 'login' && (
                <p>
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup')
                      navigate('/signup')
                      setError('')
                      setSuccessMessage('')
                    }}
                    className="font-bold text-cyan hover:underline transition-colors cursor-pointer"
                  >
                    Sign up
                  </button>
                </p>
              )}
              {mode === 'signup' && (
                <p>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login')
                      navigate('/login')
                      setError('')
                      setSuccessMessage('')
                    }}
                    className="font-bold text-cyan hover:underline transition-colors cursor-pointer"
                  >
                    Sign in
                  </button>
                </p>
              )}
              {(mode === 'forgot-password' || mode === 'reset-password-code' || mode === 'verify-email') && (
                <button
                  type="button"
                  onClick={() => {
                    setMode('login')
                    navigate('/login')
                    setError('')
                    setSuccessMessage('')
                  }}
                  className="font-bold text-cyan hover:underline transition-colors cursor-pointer"
                >
                  ← Back to Sign in
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="relative z-10 flex items-center justify-between border-t border-white/[0.06] pt-4 font-mono text-[10px] uppercase tracking-widest text-dim">
          <span>AMETHEUS BATTLEGROUND</span>
          <Link to="/" className="text-cyan hover:text-white transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
