import { lazy, Suspense, useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import {
  AuthenticateWithRedirectCallback,
  useAuth,
  useUser,
} from '@clerk/react'
import { useSignIn, useSignUp } from '@clerk/react/legacy'
import {
  Eye,
  EyeOff,
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
import { GAMES } from '../lib/data'
import { getGames, Game as ApiGame } from '../services/games'
import { useAuthContext } from '../context/AuthContext'
import { checkUsernameAvailability, updateUserProfile } from '../services/auth'

const Scene3D = lazy(() => import('../components/Scene3D'))

type AuthMode =
  | 'login'
  | 'signup'
  | 'setup'
  | 'unauthorized'
  | 'forgot-password'
  | 'verify-email'
  | 'reset-password-code'

/**
 * Unified full-width authentication footer matching celestial glass aesthetic.
 * Shared across all authentication endpoints.
 */
function AuthFooter() {
  return (
    <footer className="relative z-20 w-full border-t border-white/[0.08] bg-black/40 backdrop-blur-md px-6 py-4 sm:px-10 lg:px-16">
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-dim">
        <span className="tracking-wider uppercase text-dim/90 font-medium">
          AMETHEUS — COMPETITIVE PLATFORM
        </span>

        <Link
          to="/"
          className="text-dim/80 hover:text-white transition-colors tracking-wider"
        >
          Back to Home
        </Link>

        <Link
          to="/sign-in"
          className="tracking-wider uppercase text-dim/90 hover:text-white transition-colors"
        >
          AMETHEUS LOGIN
        </Link>
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

  // Clerk hooks
  const { isLoaded: isSignInLoaded, signIn, setActive } = useSignIn()
  const { isLoaded: isSignUpLoaded, signUp, setActive: setSignUpActive } = useSignUp()

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

  const isForgotPasswordRoute = pathname.includes('/forgot-password')
  const isVerifyRoute = pathname === '/verify' || pathname.startsWith('/verify/')
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

  // Determine active form mode
  const getInitialMode = (path: string): AuthMode => {
    if (isContinuationRoute) return 'setup'
    if (isUnauthorized) return 'unauthorized'
    if (isSignUpRoute) return 'signup'
    if (isForgotPasswordRoute) return 'forgot-password'
    if (isVerifyRoute) return 'verify-email'
    return 'login'
  }

  const [mode, setMode] = useState<AuthMode>(() => getInitialMode(pathname))

  useEffect(() => {
    if (isSsoCallback) return
    setMode(getInitialMode(pathname))
  }, [pathname])

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
  }, [
    isSignedIn,
    profile?.needs_username,
    profile?.has_chosen_username,
    isContinuationRoute,
    isSignInRoute,
    isSignUpRoute,
    navigate,
    destination,
  ])

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
    if (!/^[a-zA-Z0-9_\-.]+$/.test(clean)) {
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
          setUsernameMessage('Username is available')
        } else {
          setUsernameStatus('taken')
          setUsernameMessage('Username is already taken')
        }
      } catch {
        setUsernameStatus('available')
        setUsernameMessage('Username format valid')
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [username])

  // Social / Google OAuth sign in & sign up
  const handleOAuth = async (strategy: 'oauth_google') => {
    setError('')
    setIsLoading(true)
    try {
      if (mode === 'signup' || isSignUpRoute) {
        if (!isSignUpLoaded || !signUp) {
          throw new Error('Authentication gateway initializing. Please wait a moment.')
        }
        await signUp.authenticateWithRedirect({
          strategy,
          redirectUrl: '/sso-callback',
          redirectUrlComplete: destination,
          continueSignUp: true,
        })
      } else {
        if (!isSignInLoaded || !signIn) {
          throw new Error('Authentication gateway initializing. Please wait a moment.')
        }
        await signIn.authenticateWithRedirect({
          strategy,
          redirectUrl: '/sso-callback',
          redirectUrlComplete: destination,
          continueSignUp: true,
        })
      }
    } catch (err: any) {
      setIsLoading(false)
      const msg =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        err?.message ||
        'Google authentication failed. Please try again.'
      setError(msg)
    }
  }

  // Standard Email / Password Sign In
  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Please enter both email and password.')
      return
    }
    setIsLoading(true)
    setError('')
    try {
      if (!isSignInLoaded || !signIn) {
        throw new Error('Authentication gateway initializing. Please wait a moment.')
      }
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

  // Standard Email / Password Sign Up
  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Please fill in your email and password.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }
    setIsLoading(true)
    setError('')
    try {
      if (!isSignUpLoaded || !signUp) {
        throw new Error('Authentication gateway initializing. Please wait a moment.')
      }
      const result = await signUp.create({
        emailAddress: email.trim(),
        password,
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
        navigate('/sign-up/continue')
      } else {
        setMode('verify-email')
      }
    } catch (err: any) {
      const msg =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        err?.message ||
        'Failed to create account. Please check details and try again.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  // Email Verification Handler
  const handleVerifyEmail = async (e: FormEvent) => {
    e.preventDefault()
    if (!verificationCode) {
      setError('Please enter the 6-digit confirmation code.')
      return
    }
    setIsLoading(true)
    setError('')
    try {
      if (!isSignUpLoaded || !signUp) {
        throw new Error('Authentication gateway initializing. Please wait a moment.')
      }
      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode.trim(),
      })
      if (result.status === 'complete') {
        await setSignUpActive({ session: result.createdSessionId })
        await refreshProfile()
        navigate('/sign-up/continue', { replace: true })
      } else {
        setError('Verification incomplete. Please check the code and retry.')
      }
    } catch (err: any) {
      const msg =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        err?.message ||
        'Invalid verification code. Please check your email and try again.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  // Password Reset Code Request
  const handleRequestPasswordReset = async (e: FormEvent) => {
    e.preventDefault()
    if (!email) {
      setError('Please enter your account email address.')
      return
    }
    setIsLoading(true)
    setError('')
    try {
      if (!isSignInLoaded || !signIn) {
        throw new Error('Authentication gateway initializing. Please wait a moment.')
      }
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email.trim(),
      })
      setMode('reset-password-code')
      setSuccessMessage(`Password recovery code sent to ${email}.`)
    } catch (err: any) {
      const msg =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        err?.message ||
        'Unable to send recovery code. Please check your email.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  // Password Reset Confirmation
  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault()
    if (!verificationCode || !newPassword) {
      setError('Please enter the code and a new password.')
      return
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.')
      return
    }
    setIsLoading(true)
    setError('')
    try {
      if (!isSignInLoaded || !signIn) {
        throw new Error('Authentication gateway initializing. Please wait a moment.')
      }
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
        'Failed to reset password. Please check the code and try again.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  // Contender Username Setup Form Submission
  const handleSaveUsername = async (e: FormEvent) => {
    e.preventDefault()
    const cleanUsername = username.trim()
    if (cleanUsername.length < 3) {
      setError('Username must be at least 3 characters.')
      return
    }
    if (usernameStatus === 'taken' || usernameStatus === 'invalid') {
      setError('Please choose an available, valid Ametheus handle.')
      return
    }

    setIsLoading(true)
    setError('')
    setSuccessMessage('')

    try {
      // 1. If completing pending Clerk signup
      if (signUp && (signUp.status === 'missing_requirements' || signUp.status === 'abandoned')) {
        try {
          const updatePayload: Record<string, any> = { username: cleanUsername }
          if (password) updatePayload.password = password
          const res = await signUp.update(updatePayload)
          if (res.status === 'complete') {
            await setSignUpActive({ session: res.createdSessionId })
            try {
              const token = await getToken()
              await updateUserProfile(
                {
                  username: cleanUsername,
                  display_name: displayName.trim() || cleanUsername,
                },
                token
              )
            } catch (profileSyncErr) {
              console.warn('Backend profile sync after signup:', profileSyncErr)
            }
            await refreshProfile()
            window.dispatchEvent(new CustomEvent('ametheus:profile_updated'))
            navigate(destination, { replace: true })
            return
          }
        } catch (clerkSignUpErr: any) {
          console.warn('Clerk signup update note:', clerkSignUpErr)
        }
      }

      // 2. Standard flow: user is signed in with Clerk session
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
        } catch {
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
        'Failed to save handle. Please try a different handle.'
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
  // 1. OAuth SSO Callback Screen
  // =========================================================================
  if (isSsoCallback) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#05060a] text-white overflow-hidden">
        <StarBackground variant="continuation" />
        <CelestialArc variant="subtle" />
        <div className="relative z-10 flex flex-col items-center gap-4 p-8">
          <div className="size-9 animate-spin rounded-full border-2 border-[#3ef2ff] border-t-transparent shadow-[0_0_16px_#3ef2ff]" />
          <p className="font-mono text-xs uppercase tracking-widest text-white/80">
            Completing Ametheus Authentication...
          </p>
        </div>
        <AuthenticateWithRedirectCallback
          signInFallbackRedirectUrl={destination}
          signUpFallbackRedirectUrl={destination}
          continueSignUpUrl="/sign-up/continue"
        />
      </div>
    )
  }

  // =========================================================================
  // 2. /unauthorized-sign-in Screen (Unrecognized Session Revocation)
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
      <div className="relative min-h-screen flex flex-col justify-between items-center px-6 py-6 sm:px-10 overflow-hidden bg-void">
        <StarBackground variant="continuation" />
        <CelestialArc variant={hasError ? 'subtle' : 'major'} />

        <div className="relative z-10 w-full max-w-4xl flex items-center justify-between pt-2">
          <Link
            to="/"
            className="font-display text-lg font-black tracking-[0.25em] text-white hover:text-[#3ef2ff] transition-colors uppercase"
            aria-label="Ametheus Home"
          >
            Ametheus
          </Link>
        </div>

        <div className="relative z-10 my-auto w-full max-w-[420px] mx-auto">
          <div className="mb-2">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-white/50 block mb-2">
              AMETHEUS
            </span>
          </div>
          {hasError ? (
            <div className="space-y-6">
              <div className="flex items-start gap-3.5">
                <div className="size-10 rounded-full border border-rose-500/40 bg-rose-500/15 flex items-center justify-center shrink-0">
                  <ShieldAlert size={22} className="text-rose-400" />
                </div>
                <div className="space-y-1">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-rose-400 block">
                    Security Notice
                  </span>
                  <h2 className="font-display text-2xl sm:text-3xl font-black uppercase tracking-tight text-white leading-tight">
                    Revocation Unsuccessful
                  </h2>
                </div>
              </div>

              <div className="rounded-md border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-200/90 font-mono leading-relaxed">
                {errorMessage || 'The revocation link could not be verified or has already expired.'}
              </div>

              <p className="font-sans text-xs text-slate-400 leading-relaxed">
                If you suspect unauthorized activity on your account, we strongly advise changing your password immediately and inspecting your active sessions.
              </p>

              <div className="space-y-2.5 pt-2">
                <Link
                  to="/settings?tab=Security"
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#3ef2ff] hover:bg-[#5ef5ff] font-display text-xs font-black uppercase tracking-wider text-black shadow-[0_0_20px_rgba(62,242,255,0.35)] transition-all cursor-pointer"
                >
                  <Lock size={14} />
                  <span>Update Password & Sessions</span>
                </Link>

                <Link
                  to="/sign-in"
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white font-mono text-xs uppercase tracking-wider transition-all"
                >
                  <span>Sign In</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-start gap-3.5">
                <div className="size-10 rounded-full border border-emerald-500/40 bg-emerald-500/15 flex items-center justify-center shrink-0">
                  <ShieldCheck size={22} className="text-emerald-400" />
                </div>
                <div className="space-y-1">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-400 block">
                    Security Action Confirmed
                  </span>
                  <h2 className="font-display text-2xl sm:text-3xl font-black uppercase tracking-tight text-white leading-tight">
                    Unrecognized Session Terminated
                  </h2>
                </div>
              </div>

              <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-200/90 font-mono leading-relaxed">
                The unauthorized session was revoked on the authentication server. Access from that device has been immediately terminated.
              </div>

              <div className="space-y-2 text-xs text-slate-400">
                <p className="font-sans leading-relaxed">
                  Recommended next steps to safeguard your Ametheus account:
                </p>
                <ul className="list-disc pl-4 space-y-1 font-sans text-white/80">
                  <li>Review all current active logins under Security settings.</li>
                  <li>Update your password if you suspect your credentials were leaked.</li>
                </ul>
              </div>

              <div className="space-y-2.5 pt-2">
                <Link
                  to="/settings?tab=Security"
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#3ef2ff] hover:bg-[#5ef5ff] font-display text-xs font-black uppercase tracking-wider text-black shadow-[0_0_20px_rgba(62,242,255,0.35)] transition-all cursor-pointer"
                >
                  <ShieldCheck size={14} />
                  <span>Review Active Sessions</span>
                </Link>

                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/sign-in"
                    className="flex h-10 items-center justify-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white font-mono text-xs uppercase tracking-wider transition-all"
                  >
                    <span>Sign In</span>
                    <ArrowRight size={13} />
                  </Link>
                  <Link
                    to="/"
                    className="flex h-10 items-center justify-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white font-mono text-xs uppercase tracking-wider transition-all"
                  >
                    <span>Return to Arena</span>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        <AuthFooter />
      </div>
    )
  }

  // =========================================================================
  // 3. /unauthorized Screen (Restricted Terminal)
  // =========================================================================
  if (isUnauthorized) {
    return (
      <div className="relative min-h-screen flex flex-col justify-between items-center px-6 py-6 sm:px-10 overflow-hidden bg-void">
        <StarBackground variant="continuation" />
        <CelestialArc variant="subtle" />

        <div className="relative z-10 w-full max-w-4xl flex items-center justify-between pt-2">
          <Link
            to="/"
            className="font-display text-lg font-black tracking-[0.25em] text-white hover:text-[#3ef2ff] transition-colors uppercase"
            aria-label="Ametheus Home"
          >
            Ametheus
          </Link>
        </div>

        <div className="relative z-10 my-auto w-full max-w-[420px] mx-auto">
          <div className="mb-2">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-white/50 block mb-2">
              AMETHEUS
            </span>
          </div>
          <div className="flex items-start gap-3">
            <ShieldAlert size={22} className="mt-0.5 shrink-0 text-rose-400" />
            <div className="space-y-1">
              <p className="font-mono text-xs font-bold uppercase tracking-wider text-rose-300">
                Restricted Arena Terminal
              </p>
              <p className="font-sans text-xs text-slate-400 leading-relaxed">
                The requested circuit arena requires verified contender credentials or elevated permissions. Please authenticate with an authorized account.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-2.5">
            <button
              type="button"
              onClick={() => navigate('/sign-in')}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#3ef2ff] hover:bg-[#5ef5ff] font-display text-sm font-black uppercase tracking-wider text-black shadow-[0_0_20px_rgba(62,242,255,0.35)] transition-all cursor-pointer"
            >
              <span>Sign In with Authorized Account</span>
              <span className="text-lg leading-none">→</span>
            </button>

            <Link
              to="/"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white font-mono text-xs uppercase tracking-wider transition-all"
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
  // 4. /sign-up/continue Screen (Contender Identity Setup)
  // =========================================================================
  if (isContinuationRoute) {
    return (
      <div className="relative min-h-screen flex flex-col justify-between items-center px-6 py-6 sm:px-10 overflow-hidden bg-void">
        <StarBackground variant="continuation" />
        <CelestialArc variant="major" />

        <div className="relative z-10 w-full max-w-4xl flex items-center justify-between pt-2">
          <Link
            to="/"
            className="font-display text-lg font-black tracking-[0.25em] text-white hover:text-[#3ef2ff] transition-colors uppercase"
            aria-label="Ametheus Home"
          >
            Ametheus
          </Link>
        </div>

        <div className="relative z-10 my-auto w-full max-w-[420px] mx-auto">
          <div className="mb-6">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-white/50 block mb-2">
              AMETHEUS
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-black uppercase tracking-tight text-white leading-tight">
              Complete Your Account
            </h2>
            <p className="font-sans text-xs text-slate-400 mt-1.5 leading-relaxed">
              Set your contender identity to finalize your profile
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
                className="block font-mono text-[11px] uppercase tracking-wider text-white/60 font-medium mb-1.5"
              >
                Username <span className="text-[#3ef2ff]" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <span
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm text-[#3ef2ff] font-bold select-none"
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
                  className="h-11 w-full rounded-md border border-white/10 bg-[#07090e]/80 pl-8 pr-10 text-sm text-white placeholder:text-white/20 backdrop-blur-sm transition-all focus:border-[#3ef2ff] focus:outline-none focus:ring-1 focus:ring-[#3ef2ff]/30"
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2" aria-hidden="true">
                  {usernameStatus === 'checking' && (
                    <Loader2 size={16} className="animate-spin text-[#3ef2ff]" />
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
                    <Loader2 size={11} className="animate-spin text-[#3ef2ff]" aria-hidden="true" />
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
              <label className="block font-mono text-[11px] uppercase tracking-wider text-white/60 font-medium mb-1.5">
                Display Name (Optional)
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                disabled={isLoading}
                className="h-11 w-full rounded-md border border-white/10 bg-[#07090e]/80 px-3.5 text-sm text-white placeholder:text-white/20 backdrop-blur-sm transition-all focus:border-[#3ef2ff] focus:outline-none focus:ring-1 focus:ring-[#3ef2ff]/30"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || (username.length >= 3 && usernameStatus === 'taken')}
              className="group relative flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#3ef2ff] hover:bg-[#5ef5ff] font-display text-base font-black uppercase tracking-wider text-black shadow-[0_0_20px_rgba(62,242,255,0.35)] transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer mt-5"
            >
              {isLoading ? (
                <>
                  <div className="size-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                  <span className="font-mono text-xs font-bold tracking-wider">
                    Saving Profile...
                  </span>
                </>
              ) : (
                <>
                  <span>Continue</span>
                  <span className="text-lg leading-none">→</span>
                </>
              )}
            </button>
          </form>
        </div>

        <AuthFooter />
      </div>
    )
  }

  // =========================================================================
  // 5. MAIN AUTHENTICATION INTERFACE (SPLIT SCREEN: 3D SPHERE + FORM)
  // Covers /sign-in, /sign-up, /forgot-password, /verify
  // =========================================================================
  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-void overflow-hidden">
      <StarBackground variant="standard" />
      <CelestialArc variant="sweeping" />

      {/* Main interactive grid: Left 3D Showcase (Desktop), Right Transparent Auth Panel */}
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
              className="font-display text-lg font-black tracking-[0.25em] text-white hover:text-[#3ef2ff] transition-colors uppercase"
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

        {/* RIGHT: TRANSPARENT APPLICATION-HOSTED AUTHENTICATION PANEL */}
        <div className="relative z-10 flex flex-col justify-between px-6 py-8 sm:px-10 lg:px-12 xl:px-14 overflow-hidden">
          {/* Top Mobile Brand Header */}
          <div className="relative z-10 flex items-center justify-between lg:hidden mb-4">
            <Link
              to="/"
              className="font-display text-base font-black tracking-[0.2em] text-white hover:text-[#3ef2ff] transition-colors uppercase"
              aria-label="Ametheus Home"
            >
              Ametheus
            </Link>
          </div>

          {/* Center: Option 2 Pixel-Perfect Form (NO OUTER CARD, NO BORDERS, NO SHADOWS) */}
          <div className="relative z-10 my-auto w-full max-w-[420px] mx-auto">
            {/* Header / Kicker */}
            <div className="mb-2">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-white/50 block mb-2">
                AMETHEUS
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-black uppercase tracking-tight text-white leading-tight">
                {mode === 'login' && 'WELCOME BACK'}
                {mode === 'signup' && 'CREATE ACCOUNT'}
                {mode === 'forgot-password' && 'RESET PASSWORD'}
                {mode === 'reset-password-code' && 'SET NEW PASSWORD'}
                {mode === 'verify-email' && 'VERIFY YOUR EMAIL'}
              </h2>
              <p className="font-sans text-xs text-slate-400 mt-1.5 leading-relaxed">
                {mode === 'login' &&
                  'Sign in to access your contender account and live circuits'}
                {mode === 'signup' &&
                  'Register your contender profile to compete in official tournaments'}
                {mode === 'forgot-password' &&
                  'Enter your email to receive recovery instructions'}
                {mode === 'reset-password-code' &&
                  'Enter the reset code dispatched to your email and your new password'}
                {mode === 'verify-email' &&
                  'Enter the 6-digit confirmation code dispatched to your inbox'}
              </p>
            </div>

            {/* Error Notification Banner */}
            {error && (
              <div className="my-4 flex items-start gap-2.5 rounded-md border border-live/40 bg-live/15 p-3 text-xs leading-relaxed text-live backdrop-blur-md animate-fadeIn">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-live" />
                <span className="flex-1 font-mono text-[11px]">{error}</span>
              </div>
            )}

            {/* Success Notification Banner */}
            {successMessage && (
              <div className="my-4 flex items-start gap-2.5 rounded-md border border-ok/40 bg-ok/15 p-3 text-xs leading-relaxed text-ok backdrop-blur-md animate-fadeIn">
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
                  disabled={isLoading || (mode === 'signup' ? !isSignUpLoaded : !isSignInLoaded)}
                  className="group relative flex h-11 w-full items-center justify-center gap-3 rounded-md border border-white/10 bg-[#090b10] hover:bg-[#121620] hover:border-white/20 px-4 font-sans text-xs font-semibold text-white/90 shadow-sm transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer mt-6"
                >
                  <svg className="size-4 shrink-0 transition-transform group-hover:scale-105" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.27 21.36 7.34 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.27 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                <div className="my-5 flex items-center justify-center">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-white/40">
                    OR CONTINUE WITH EMAIL
                  </span>
                </div>
              </>
            )}

            {/* 1. SIGN IN (LOGIN) */}
            {mode === 'login' && (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label
                    htmlFor="signin-email"
                    className="block font-mono text-[11px] uppercase tracking-wider text-white/60 font-medium mb-1.5"
                  >
                    EMAIL ADDRESS
                  </label>
                  <input
                    id="signin-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    disabled={isLoading}
                    autoComplete="email"
                    className="h-11 w-full rounded-md border border-white/10 bg-[#07090e]/80 px-3.5 text-sm text-white placeholder:text-white/20 backdrop-blur-sm transition-all focus:border-[#3ef2ff] focus:outline-none focus:ring-1 focus:ring-[#3ef2ff]/30"
                  />
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label
                      htmlFor="signin-password"
                      className="font-mono text-[11px] uppercase tracking-wider text-white/60 font-medium"
                    >
                      PASSWORD
                    </label>
                    <Link
                      to="/forgot-password"
                      className="font-mono text-[11px] text-[#22d3ee] hover:underline transition-colors cursor-pointer"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      id="signin-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      disabled={isLoading}
                      autoComplete="current-password"
                      className="h-11 w-full rounded-md border border-white/10 bg-[#07090e]/80 pl-3.5 pr-10 text-sm text-white placeholder:text-white/20 backdrop-blur-sm transition-all focus:border-[#3ef2ff] focus:outline-none focus:ring-1 focus:ring-[#3ef2ff]/30"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors cursor-pointer p-1"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#3ef2ff] hover:bg-[#5ef5ff] font-display text-base font-black uppercase tracking-wider text-black shadow-[0_0_20px_rgba(62,242,255,0.35)] transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer mt-5"
                >
                  {isLoading ? (
                    <>
                      <div className="size-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                      <span className="font-mono text-xs font-bold tracking-wider">
                        SIGNING IN...
                      </span>
                    </>
                  ) : (
                    <>
                      <span>SIGN IN</span>
                      <span className="text-lg leading-none">→</span>
                    </>
                  )}
                </button>

                <div className="mt-5 text-center font-sans text-xs text-slate-400">
                  Don't have an account?{' '}
                  <Link
                    to="/sign-up"
                    className="font-mono font-semibold text-[#22d3ee] hover:underline transition-colors ml-1"
                  >
                    Sign up
                  </Link>
                </div>
              </form>
            )}

            {/* 2. SIGN UP */}
            {mode === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <label
                    htmlFor="signup-email"
                    className="block font-mono text-[11px] uppercase tracking-wider text-white/60 font-medium mb-1.5"
                  >
                    EMAIL ADDRESS
                  </label>
                  <input
                    id="signup-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    disabled={isLoading}
                    autoComplete="email"
                    className="h-11 w-full rounded-md border border-white/10 bg-[#07090e]/80 px-3.5 text-sm text-white placeholder:text-white/20 backdrop-blur-sm transition-all focus:border-[#3ef2ff] focus:outline-none focus:ring-1 focus:ring-[#3ef2ff]/30"
                  />
                </div>

                <div>
                  <label
                    htmlFor="signup-password"
                    className="block font-mono text-[11px] uppercase tracking-wider text-white/60 font-medium mb-1.5"
                  >
                    PASSWORD
                  </label>
                  <div className="relative">
                    <input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      disabled={isLoading}
                      autoComplete="new-password"
                      className="h-11 w-full rounded-md border border-white/10 bg-[#07090e]/80 pl-3.5 pr-10 text-sm text-white placeholder:text-white/20 backdrop-blur-sm transition-all focus:border-[#3ef2ff] focus:outline-none focus:ring-1 focus:ring-[#3ef2ff]/30"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors cursor-pointer p-1"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#3ef2ff] hover:bg-[#5ef5ff] font-display text-base font-black uppercase tracking-wider text-black shadow-[0_0_20px_rgba(62,242,255,0.35)] transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer mt-5"
                >
                  {isLoading ? (
                    <>
                      <div className="size-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                      <span className="font-mono text-xs font-bold tracking-wider">
                        CREATING ACCOUNT...
                      </span>
                    </>
                  ) : (
                    <>
                      <span>CREATE ACCOUNT</span>
                      <span className="text-lg leading-none">→</span>
                    </>
                  )}
                </button>

                <div className="mt-5 text-center font-sans text-xs text-slate-400">
                  Already have an account?{' '}
                  <Link
                    to="/sign-in"
                    className="font-mono font-semibold text-[#22d3ee] hover:underline transition-colors ml-1"
                  >
                    Sign in
                  </Link>
                </div>
              </form>
            )}

            {/* 3. EMAIL VERIFICATION */}
            {mode === 'verify-email' && (
              <form onSubmit={handleVerifyEmail} className="space-y-4">
                <div>
                  <label
                    htmlFor="verify-code"
                    className="block font-mono text-[11px] uppercase tracking-wider text-white/60 font-medium mb-1.5"
                  >
                    CONFIRMATION CODE
                  </label>
                  <input
                    id="verify-code"
                    type="text"
                    required
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="123456"
                    disabled={isLoading}
                    autoComplete="one-time-code"
                    className="h-11 w-full rounded-md border border-white/10 bg-[#07090e]/80 px-3.5 text-center font-mono text-lg tracking-widest text-white placeholder:text-white/20 backdrop-blur-sm transition-all focus:border-[#3ef2ff] focus:outline-none focus:ring-1 focus:ring-[#3ef2ff]/30"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#3ef2ff] hover:bg-[#5ef5ff] font-display text-base font-black uppercase tracking-wider text-black shadow-[0_0_20px_rgba(62,242,255,0.35)] transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer mt-5"
                >
                  {isLoading ? (
                    <>
                      <div className="size-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                      <span className="font-mono text-xs font-bold tracking-wider">
                        VERIFYING...
                      </span>
                    </>
                  ) : (
                    <>
                      <span>VERIFY & CONTINUE</span>
                      <span className="text-lg leading-none">→</span>
                    </>
                  )}
                </button>

                <div className="mt-5 text-center font-sans text-xs text-slate-400">
                  Didn't receive the code?{' '}
                  <button
                    type="button"
                    onClick={async () => {
                      if (signUp && isSignUpLoaded) {
                        try {
                          await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
                          setSuccessMessage('A fresh confirmation code was dispatched.')
                        } catch (err: any) {
                          setError(err?.message || 'Failed to resend verification code.')
                        }
                      }
                    }}
                    className="font-mono font-semibold text-[#22d3ee] hover:underline transition-colors ml-1 cursor-pointer"
                  >
                    Resend Code
                  </button>
                </div>
              </form>
            )}

            {/* 4. FORGOT PASSWORD REQUEST */}
            {mode === 'forgot-password' && (
              <form onSubmit={handleRequestPasswordReset} className="space-y-4">
                <div>
                  <label
                    htmlFor="reset-email"
                    className="block font-mono text-[11px] uppercase tracking-wider text-white/60 font-medium mb-1.5"
                  >
                    EMAIL ADDRESS
                  </label>
                  <input
                    id="reset-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    disabled={isLoading}
                    autoComplete="email"
                    className="h-11 w-full rounded-md border border-white/10 bg-[#07090e]/80 px-3.5 text-sm text-white placeholder:text-white/20 backdrop-blur-sm transition-all focus:border-[#3ef2ff] focus:outline-none focus:ring-1 focus:ring-[#3ef2ff]/30"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#3ef2ff] hover:bg-[#5ef5ff] font-display text-base font-black uppercase tracking-wider text-black shadow-[0_0_20px_rgba(62,242,255,0.35)] transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer mt-5"
                >
                  {isLoading ? (
                    <>
                      <div className="size-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                      <span className="font-mono text-xs font-bold tracking-wider">
                        SENDING CODE...
                      </span>
                    </>
                  ) : (
                    <>
                      <span>SEND RECOVERY CODE</span>
                      <span className="text-lg leading-none">→</span>
                    </>
                  )}
                </button>

                <div className="mt-5 text-center font-sans text-xs text-slate-400">
                  Remembered your credentials?{' '}
                  <Link
                    to="/sign-in"
                    className="font-mono font-semibold text-[#22d3ee] hover:underline transition-colors ml-1"
                  >
                    Sign in
                  </Link>
                </div>
              </form>
            )}

            {/* 5. RESET PASSWORD CONFIRMATION */}
            {mode === 'reset-password-code' && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label
                    htmlFor="reset-code"
                    className="block font-mono text-[11px] uppercase tracking-wider text-white/60 font-medium mb-1.5"
                  >
                    RECOVERY CODE
                  </label>
                  <input
                    id="reset-code"
                    type="text"
                    required
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="123456"
                    disabled={isLoading}
                    className="h-11 w-full rounded-md border border-white/10 bg-[#07090e]/80 px-3.5 text-center font-mono text-base tracking-widest text-white placeholder:text-white/20 backdrop-blur-sm transition-all focus:border-[#3ef2ff] focus:outline-none focus:ring-1 focus:ring-[#3ef2ff]/30"
                  />
                </div>

                <div>
                  <label
                    htmlFor="reset-newpassword"
                    className="block font-mono text-[11px] uppercase tracking-wider text-white/60 font-medium mb-1.5"
                  >
                    NEW PASSWORD
                  </label>
                  <div className="relative">
                    <input
                      id="reset-newpassword"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      disabled={isLoading}
                      autoComplete="new-password"
                      className="h-11 w-full rounded-md border border-white/10 bg-[#07090e]/80 pl-3.5 pr-10 text-sm text-white placeholder:text-white/20 backdrop-blur-sm transition-all focus:border-[#3ef2ff] focus:outline-none focus:ring-1 focus:ring-[#3ef2ff]/30"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors cursor-pointer p-1"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#3ef2ff] hover:bg-[#5ef5ff] font-display text-base font-black uppercase tracking-wider text-black shadow-[0_0_20px_rgba(62,242,255,0.35)] transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer mt-5"
                >
                  {isLoading ? (
                    <>
                      <div className="size-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                      <span className="font-mono text-xs font-bold tracking-wider">
                        UPDATING PASSWORD...
                      </span>
                    </>
                  ) : (
                    <>
                      <span>UPDATE PASSWORD</span>
                      <span className="text-lg leading-none">→</span>
                    </>
                  )}
                </button>

                <div className="mt-5 text-center font-sans text-xs text-slate-400">
                  <Link
                    to="/sign-in"
                    className="font-mono font-semibold text-[#22d3ee] hover:underline transition-colors"
                  >
                    Cancel and return to Sign in
                  </Link>
                </div>
              </form>
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
