import { lazy, Suspense, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { useSignIn, useSignUp } from '@clerk/react/legacy'
import { AuthenticateWithRedirectCallback, useAuth, useUser } from '@clerk/react'
import { Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight, ShieldAlert, Sparkles, Loader2, Check, X } from 'lucide-react'
import { Hud, Particles } from '../components/ui'
import { Logo } from '../components/Layout'
import StarBackground from '../components/StarBackground'
import CelestialArc from '../components/CelestialArc'
import { GAMES } from '../lib/data'
import { getGames, Game as ApiGame } from '../services/games'
import { useAuthContext } from '../context/AuthContext'
import { checkUsernameAvailability, updateUserProfile } from '../services/auth'

const Scene3D = lazy(() => import('../components/Scene3D'))

type AuthMode = 'login' | 'signup' | 'setup' | 'unauthorized' | 'forgot-password' | 'verify-email' | 'reset-password-code'

export default function Auth() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isSignedIn, profile, refreshProfile } = useAuthContext()
  const { getToken } = useAuth()
  const { user } = useUser()
  const pathname = location.pathname

  // Clerk hooks
  const { isLoaded: isSignInLoaded, signIn, setActive } = useSignIn()
  const { isLoaded: isSignUpLoaded, signUp, setActive: setSignUpActive } = useSignUp()

  // Determine initial mode based on route
  const getInitialMode = (path: string): AuthMode => {
    if (
      path.includes('/sign-up/continue') ||
      path.includes('/signup/continue') ||
      path.includes('/setup') ||
      path.includes('/onboarding')
    ) {
      return 'setup'
    }
    if (path.includes('/unauthorized')) return 'unauthorized'
    if (path.includes('/signup') || path.includes('/sign-up')) return 'signup'
    if (path.includes('/forgot-password')) return 'forgot-password'
    return 'login'
  }

  const [mode, setMode] = useState<AuthMode>(() => getInitialMode(pathname))

  // Synchronize mode when pathname changes
  useEffect(() => {
    if (pathname.includes('sso-callback')) return
    setMode(getInitialMode(pathname))
  }, [pathname])

  // Form State
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Real-time Username Availability Checking
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle')
  const [usernameMessage, setUsernameMessage] = useState<string>('')

  // Debounced username validator (used in both Setup and Signup flows)
  const targetUsername = username
  useEffect(() => {
    const clean = targetUsername.trim()
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
  }, [targetUsername])

  // Redirect handling:
  // - If signed in but needs username setup: lock to setup mode
  // - If signed in and has username: redirect to destination
  const destination = (location.state as any)?.from?.pathname || '/'
  useEffect(() => {
    if (isSignedIn) {
      // Check if user requires onboarding / username selection
      const needsSetup = profile?.needs_username === true || (profile && !profile.has_chosen_username)
      if (needsSetup) {
        setMode('setup')
      } else if (mode === 'setup' || mode === 'login' || mode === 'signup') {
        if (!pathname.includes('continue')) {
          navigate(destination, { replace: true })
        }
      }
    }
  }, [isSignedIn, profile?.needs_username, profile?.has_chosen_username, navigate, destination, mode, pathname])

  // Games pool for the left 3D background animation (left side logic 100% UNTOUCHED)
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
      <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#05060a] text-white overflow-hidden">
        <StarBackground variant="continuation" />
        <CelestialArc variant="subtle" />
        <div className="relative z-10 flex flex-col items-center gap-4 p-8">
          <div className="size-9 animate-spin rounded-full border-2 border-cyan border-t-transparent shadow-[0_0_16px_#3ef2ff]" />
          <p className="font-mono text-xs uppercase tracking-widest text-ink/80">
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

  // Social / External Google Authentication
  const handleOAuth = async (strategy: 'oauth_google') => {
    setError('')
    setIsLoading(true)
    try {
      if (!isSignInLoaded || !signIn) {
        throw new Error('Authentication gateway initializing. Please wait a moment.')
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
        await refreshProfile()
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
    if (username && usernameStatus === 'taken') {
      setError('The selected username is already taken. Please choose another.')
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
        await refreshProfile()
        navigate(destination, { replace: true })
      } else if (result.unverifiedFields.includes('email_address')) {
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
        setMode('verify-email')
        setSuccessMessage(`A 6-digit confirmation code was sent to ${email}.`)
      } else if (result.status === 'missing_requirements') {
        setMode('setup')
        navigate('/sign-up/continue')
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

  // Username Setup / Continuation Flow (Canonical User Identity)
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

      // Synchronize canonical username to Clerk user metadata so Clerk stays consistent
      if (user) {
        try {
          await user.update({
            unsafeMetadata: {
              ...user.unsafeMetadata,
              username: cleanUsername,
              has_chosen_username: true,
            },
          })
        } catch (clerkSyncErr) {
          console.warn('Clerk metadata update warning:', clerkSyncErr)
        }
      } else if (signUp && signUp.status === 'missing_requirements') {
        try {
          const res = await signUp.update({ username: cleanUsername })
          if (res.status === 'complete') {
            await setSignUpActive({ session: res.createdSessionId })
          }
        } catch (clerkSignUpErr) {
          console.warn('Clerk signUp update warning:', clerkSignUpErr)
        }
      }

      await refreshProfile()
      window.dispatchEvent(new CustomEvent('ametheus:profile_updated'))
      navigate(destination, { replace: true })
    } catch (err: any) {
      const msg =
        err?.message ||
        'Failed to save username. Please try a different handle.'
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
        await refreshProfile()
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
        await refreshProfile()
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

  const isContinuationScreen =
    mode === 'setup' ||
    pathname.includes('/sign-up/continue') ||
    pathname.includes('/signup/continue') ||
    pathname.includes('/setup') ||
    pathname.includes('/onboarding')

  // =========================================================================
  // 2. /sign-up/continue — USERNAME / CONTINUATION SCREEN (NO SPHERE, MAJOR CELESTIAL ARC, FULLY TRANSPARENT)
  // =========================================================================
  if (isContinuationScreen) {
    return (
      <div className="relative min-h-screen flex flex-col justify-between items-center px-6 py-8 sm:px-10 overflow-hidden bg-void">
        {/* Celestial arc deep in space, layered behind the multi-tier star field */}
        <CelestialArc variant="major" />
        <StarBackground variant="continuation" />

        {/* Top Header Row */}
        <div className="relative z-10 w-full max-w-4xl flex items-center justify-between">
          <Link to="/" aria-label="Ametheus Home">
            <Logo />
          </Link>
          <div className="flex items-center gap-2 rounded-full border border-white/[0.12] bg-black/40 px-3.5 py-1.5 font-mono text-[11px] text-dim backdrop-blur-md shadow-inner">
            <span className="size-1.5 rounded-full bg-cyan animate-pulse shadow-[0_0_8px_#3ef2ff]" />
            <span className="tracking-wider uppercase">Contender Identity Protocol</span>
          </div>
        </div>

        {/* Center: COMPLETELY TRANSPARENT FLOATING USERNAME SETUP FORM */}
        <div className="relative z-10 my-auto w-full max-w-[440px] mx-auto py-8">
          {/* Brand Header */}
          <div className="mb-8">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex size-7 items-center justify-center rounded border border-cyan/40 bg-cyan/10 shadow-[0_0_12px_rgba(62,242,255,0.25)]">
                  <svg width="15" height="14" viewBox="0 0 30 28" fill="none">
                    <polygon points="3,7 25,7 27,2 5,2" fill="#3ef2ff" />
                    <polygon points="7,15 21,15 23,10 9,10" fill="#3ef2ff" />
                    <polygon points="11,23 17,23 19,18 13,18" fill="#3ef2ff" />
                  </svg>
                </span>
                <span className="font-display text-sm font-black tracking-[0.2em] text-white">
                  AMETHEUS <span className="text-cyan">IDENTITY</span>
                </span>
              </div>
              <span className="rounded border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-dim">
                STEP 2 OF 2
              </span>
            </div>

            <h2 className="font-display text-3xl sm:text-4xl font-black uppercase tracking-tight text-white leading-tight">
              Choose your username
            </h2>
            <p className="font-sans text-xs text-dim mt-2 leading-relaxed">
              This is how players, squads, and tournament brackets will identify you on Ametheus
            </p>
          </div>

          {/* Error Notification Banner */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-live/40 bg-live/15 p-3 text-xs leading-relaxed text-live backdrop-blur-md animate-fadeIn">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-live" />
              <span className="flex-1 font-mono text-[11px]">{error}</span>
            </div>
          )}

          {/* Success Notification Banner */}
          {successMessage && (
            <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-ok/40 bg-ok/15 p-3 text-xs leading-relaxed text-ok backdrop-blur-md animate-fadeIn">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-ok" />
              <span className="flex-1 font-mono text-[11px]">{successMessage}</span>
            </div>
          )}

          {/* Floating Username Form */}
          <form onSubmit={handleSaveUsername} className="space-y-5">
            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-ink/90 font-medium mb-1.5">
                Ametheus Username <span className="text-cyan">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm text-cyan font-bold select-none">@</span>
                <input
                  type="text"
                  required
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="shadowfox"
                  disabled={isLoading}
                  className="h-12 w-full rounded-lg border border-white/15 bg-black/50 pl-8 pr-10 text-sm text-white placeholder:text-dim/40 backdrop-blur-sm transition-all focus:border-cyan/80 focus:bg-black/70 focus:outline-none focus:ring-1 focus:ring-cyan/40 focus:shadow-[0_0_20px_rgba(62,242,255,0.2)]"
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                  {usernameStatus === 'checking' && <Loader2 size={16} className="animate-spin text-cyan" />}
                  {usernameStatus === 'available' && <Check size={16} className="text-ok" />}
                  {usernameStatus === 'taken' && <X size={16} className="text-live" />}
                </div>
              </div>

              {/* Reserved space for live validation feedback (no panel jumping) */}
              <div className="mt-2 min-h-[20px] px-1 font-mono text-[11px]">
                {usernameStatus === 'checking' && (
                  <span className="text-dim flex items-center gap-1.5">
                    <Loader2 size={11} className="animate-spin text-cyan" /> Checking availability...
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
                  <span className="text-dim/70">Letters, numbers, underscores, hyphens, and dots (3-30 chars).</span>
                )}
              </div>
            </div>

            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-ink/90 font-medium mb-1.5">
                Display Name (Optional)
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Rahul Sharma or Shadow Fox"
                disabled={isLoading}
                className="h-12 w-full rounded-lg border border-white/15 bg-black/50 px-3.5 text-sm text-white placeholder:text-dim/40 backdrop-blur-sm transition-all focus:border-cyan/80 focus:bg-black/70 focus:outline-none focus:ring-1 focus:ring-cyan/40 focus:shadow-[0_0_20px_rgba(62,242,255,0.2)]"
              />
              <p className="mt-1.5 px-1 font-mono text-[10px] text-dim/70">
                Friendly display name shown in matches and player card. Defaults to your username.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || (username.length >= 3 && usernameStatus === 'taken')}
              className="group relative flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-cyan font-display text-base font-black uppercase tracking-wider text-void shadow-[0_0_24px_rgba(62,242,255,0.3)] transition-all hover:bg-[#5ef5ff] hover:shadow-[0_0_32px_rgba(62,242,255,0.45)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer mt-4"
            >
              {isLoading ? (
                <>
                  <div className="size-4 animate-spin rounded-full border-2 border-void border-t-transparent" />
                  <span className="font-mono text-xs font-bold tracking-wider">Finalizing Identity...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Complete Identity &amp; Enter Ametheus</span>
                </>
              )}
            </button>
          </form>

          {/* Bottom helper */}
          <div className="mt-8 border-t border-white/[0.08] pt-4 text-center font-mono text-[11px] text-dim/80">
            Step 2 of 2 · Official Contender Identity Registration
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="relative z-10 w-full max-w-4xl flex items-center justify-between border-t border-white/[0.08] pt-4 font-mono text-[10px] uppercase tracking-widest text-dim">
          <span>AMETHEUS BATTLEGROUND</span>
          <Link to="/" className="text-cyan hover:text-white transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    )
  }

  // =========================================================================
  // 1. INITIAL SIGN-IN / SIGN-UP (PRESERVE LEFT THREE.JS SPHERE, RIGHT CELESTIAL ARC, TRANSPARENT PANEL)
  // =========================================================================
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

      {/* RIGHT: COMPLETE AUTHENTICATION EXPERIENCE (TRANSPARENT FLOATING PANEL + RIGHT CELESTIAL ARC) */}
      <div className="relative z-10 flex min-h-screen flex-col justify-between px-6 py-8 sm:px-10 lg:px-12 xl:px-14 overflow-hidden">
        {/* Cinematic dark space + subtle right-side celestial arc */}
        <StarBackground variant="standard" />
        <CelestialArc variant="subtle" />

        {/* Top Header Row */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="lg:hidden">
            <Link to="/" aria-label="Ametheus Home">
              <Logo />
            </Link>
          </div>
          <div className="ml-auto flex items-center gap-2 rounded-full border border-white/[0.12] bg-black/40 px-3.5 py-1.5 font-mono text-[11px] text-dim backdrop-blur-md shadow-inner">
            <span className="size-1.5 rounded-full bg-cyan animate-pulse shadow-[0_0_8px_#3ef2ff]" />
            <span className="tracking-wider uppercase">Sanctioned Esports Gateway</span>
          </div>
        </div>

        {/* Center: COMPLETELY TRANSPARENT FLOATING AUTHENTICATION FORM */}
        <div className="relative z-10 my-auto w-full max-w-[420px] mx-auto py-6">
          {/* Brand Header */}
          <div className="mb-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex size-7 items-center justify-center rounded border border-cyan/40 bg-cyan/10 shadow-[0_0_12px_rgba(62,242,255,0.25)]">
                  <svg width="15" height="14" viewBox="0 0 30 28" fill="none">
                    <polygon points="3,7 25,7 27,2 5,2" fill="#3ef2ff" />
                    <polygon points="7,15 21,15 23,10 9,10" fill="#3ef2ff" />
                    <polygon points="11,23 17,23 19,18 13,18" fill="#3ef2ff" />
                  </svg>
                </span>
                <span className="font-display text-sm font-black tracking-[0.2em] text-white">
                  AMETHEUS <span className="text-cyan">PASSPORT</span>
                </span>
              </div>
              <span className="rounded border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-dim">
                {mode === 'unauthorized' ? 'RESTRICTED' : 'SECURE'}
              </span>
            </div>

            <h2 className="font-display text-3xl font-black uppercase tracking-tight text-white leading-tight">
              {mode === 'login' && 'Welcome back'}
              {mode === 'signup' && 'Create account'}
              {mode === 'unauthorized' && 'Access Restricted'}
              {mode === 'forgot-password' && 'Reset password'}
              {mode === 'verify-email' && 'Verify your email'}
              {mode === 'reset-password-code' && 'Set new password'}
            </h2>
            <p className="font-sans text-xs text-dim mt-1.5 leading-relaxed">
              {mode === 'login' && 'Sign in to access your contender account and live circuits'}
              {mode === 'signup' && 'Register your contender profile to compete in official tournaments'}
              {mode === 'unauthorized' && 'This circuit arena requires authorized contender credentials or elevated permissions'}
              {mode === 'forgot-password' && 'Enter your email to receive recovery instructions'}
              {mode === 'verify-email' && 'Enter the 6-digit confirmation code dispatched to your inbox'}
              {mode === 'reset-password-code' && 'Enter the reset code and choose your new password'}
            </p>
          </div>

          {/* Error Notification Banner */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-live/40 bg-live/15 p-3 text-xs leading-relaxed text-live backdrop-blur-md animate-fadeIn">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-live" />
              <span className="flex-1 font-mono text-[11px]">{error}</span>
            </div>
          )}

          {/* Success Notification Banner */}
          {successMessage && (
            <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-ok/40 bg-ok/15 p-3 text-xs leading-relaxed text-ok backdrop-blur-md animate-fadeIn">
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
                className="group relative flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-white/15 bg-black/40 hover:bg-black/60 hover:border-white/25 px-4 font-sans text-xs font-semibold text-white shadow-sm transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer backdrop-blur-sm"
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
                <span className="relative bg-void px-3 font-mono text-[10px] font-semibold uppercase tracking-widest text-dim">
                  OR CONTINUE WITH EMAIL
                </span>
              </div>
            </>
          )}

          {/* EXPERIENCE 1: SIGN IN (LOGIN) */}
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
                  className="h-11 w-full rounded-lg border border-white/15 bg-black/40 px-3.5 text-sm text-white placeholder:text-dim/50 backdrop-blur-sm transition-all focus:border-cyan/80 focus:bg-black/60 focus:outline-none focus:ring-1 focus:ring-cyan/40 focus:shadow-[0_0_16px_rgba(62,242,255,0.2)]"
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
                    className="h-11 w-full rounded-lg border border-white/15 bg-black/40 px-3.5 pr-10 text-sm text-white placeholder:text-dim/50 backdrop-blur-sm transition-all focus:border-cyan/80 focus:bg-black/60 focus:outline-none focus:ring-1 focus:ring-cyan/40 focus:shadow-[0_0_16px_rgba(62,242,255,0.2)]"
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

          {/* EXPERIENCE 2: SIGN UP */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-mono text-[11px] uppercase tracking-wider text-ink/80 font-medium">
                    Contender Handle (Optional)
                  </label>
                  <div className="min-h-[16px]">
                    {usernameStatus === 'checking' && (
                      <span className="font-mono text-[10px] text-cyan flex items-center gap-1">
                        <Loader2 size={10} className="animate-spin" /> checking...
                      </span>
                    )}
                    {usernameStatus === 'available' && (
                      <span className="font-mono text-[10px] text-ok flex items-center gap-1">
                        <Check size={10} /> available
                      </span>
                    )}
                    {usernameStatus === 'taken' && (
                      <span className="font-mono text-[10px] text-live flex items-center gap-1">
                        <X size={10} /> taken
                      </span>
                    )}
                  </div>
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. shadowfox"
                  disabled={isLoading}
                  className="h-11 w-full rounded-lg border border-white/15 bg-black/40 px-3.5 text-sm text-white placeholder:text-dim/50 backdrop-blur-sm transition-all focus:border-cyan/80 focus:bg-black/60 focus:outline-none focus:ring-1 focus:ring-cyan/40 focus:shadow-[0_0_16px_rgba(62,242,255,0.2)]"
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
                  className="h-11 w-full rounded-lg border border-white/15 bg-black/40 px-3.5 text-sm text-white placeholder:text-dim/50 backdrop-blur-sm transition-all focus:border-cyan/80 focus:bg-black/60 focus:outline-none focus:ring-1 focus:ring-cyan/40 focus:shadow-[0_0_16px_rgba(62,242,255,0.2)]"
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
                    className="h-11 w-full rounded-lg border border-white/15 bg-black/40 px-3.5 pr-10 text-sm text-white placeholder:text-dim/50 backdrop-blur-sm transition-all focus:border-cyan/80 focus:bg-black/60 focus:outline-none focus:ring-1 focus:ring-cyan/40 focus:shadow-[0_0_16px_rgba(62,242,255,0.2)]"
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

          {/* EXPERIENCE 4: UNAUTHORIZED SIGN-IN */}
          {mode === 'unauthorized' && (
            <div className="space-y-5">
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4.5 backdrop-blur-md">
                <div className="flex items-start gap-3">
                  <ShieldAlert size={20} className="mt-0.5 shrink-0 text-rose-400" />
                  <div className="space-y-1">
                    <p className="font-mono text-xs font-bold uppercase tracking-wider text-rose-300">
                      Restricted Arena Terminal
                    </p>
                    <p className="font-sans text-xs text-ink/80 leading-relaxed">
                      The requested circuit arena requires verified contender credentials or elevated permissions. Please authenticate with an authorized account to enter.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login')
                    navigate('/login')
                    setError('')
                    setSuccessMessage('')
                  }}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-cyan font-display text-base font-black uppercase tracking-wider text-void shadow-[0_0_20px_rgba(62,242,255,0.25)] transition-all hover:bg-[#5ef5ff] hover:shadow-[0_0_28px_rgba(62,242,255,0.4)] active:scale-[0.99] cursor-pointer"
                >
                  <span>Sign In with Authorized Account</span>
                  <ArrowRight size={16} />
                </button>

                <Link
                  to="/"
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20 text-white font-mono text-xs uppercase tracking-wider transition-all"
                >
                  Return to Ametheus Arena
                </Link>
              </div>
            </div>
          )}

          {/* EMAIL VERIFICATION CODE (AFTER SIGNUP) */}
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
                  className="h-11 w-full rounded-lg border border-white/15 bg-black/40 px-3.5 text-center font-mono text-base tracking-widest text-white placeholder:text-dim/50 backdrop-blur-sm transition-all focus:border-cyan/80 focus:bg-black/60 focus:outline-none focus:ring-1 focus:ring-cyan/40 focus:shadow-[0_0_16px_rgba(62,242,255,0.2)]"
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

          {/* FORGOT PASSWORD (REQUEST CODE) */}
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
                  className="h-11 w-full rounded-lg border border-white/15 bg-black/40 px-3.5 text-sm text-white placeholder:text-dim/50 backdrop-blur-sm transition-all focus:border-cyan/80 focus:bg-black/60 focus:outline-none focus:ring-1 focus:ring-cyan/40 focus:shadow-[0_0_16px_rgba(62,242,255,0.2)]"
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

          {/* SET NEW PASSWORD (WITH CODE) */}
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
                  className="h-11 w-full rounded-lg border border-white/15 bg-black/40 px-3.5 text-center font-mono text-sm tracking-widest text-white placeholder:text-dim/50 backdrop-blur-sm transition-all focus:border-cyan/80 focus:bg-black/60 focus:outline-none focus:ring-1 focus:ring-cyan/40 focus:shadow-[0_0_16px_rgba(62,242,255,0.2)]"
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
                    className="h-11 w-full rounded-lg border border-white/15 bg-black/40 px-3.5 pr-10 text-sm text-white placeholder:text-dim/50 backdrop-blur-sm transition-all focus:border-cyan/80 focus:bg-black/60 focus:outline-none focus:ring-1 focus:ring-cyan/40 focus:shadow-[0_0_16px_rgba(62,242,255,0.2)]"
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
          <div className="mt-6 border-t border-white/[0.08] pt-4 text-center font-mono text-xs text-dim">
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
            {(mode === 'forgot-password' || mode === 'reset-password-code' || mode === 'verify-email' || mode === 'unauthorized') && (
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

        {/* Bottom Bar */}
        <div className="relative z-10 flex items-center justify-between border-t border-white/[0.08] pt-4 font-mono text-[10px] uppercase tracking-widest text-dim">
          <span>AMETHEUS BATTLEGROUND</span>
          <Link to="/" className="text-cyan hover:text-white transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
