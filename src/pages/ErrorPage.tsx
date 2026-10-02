import { lazy, Suspense } from 'react'
import { isRouteErrorResponse, useRouteError, useSearchParams } from 'react-router'
import { Cta, Hud, Particles } from '../components/ui'
const Scene3D = lazy(() => import('../components/Scene3D'))

const V: Record<string, { k: string; t: string; b: string }> = {
  '404': { k: 'Page not found', t: "You've dropped outside the zone.", b: "This page doesn't exist or was moved. Get back to safety before the circle closes." },
  '403': { k: 'Access denied', t: "You don't have clearance.", b: 'This area is restricted to registered squads or admins. Log in or check your team permissions.' },
  '500': { k: 'Server error', t: 'The server got knocked.', b: "Something broke on our end. We're reviving it — try again in a moment." },
}

export default function ErrorPage() {
  const err = useRouteError()
  const [sp] = useSearchParams()
  let code = sp.get('code') ?? '404'
  if (err) code = isRouteErrorResponse(err) ? String(err.status) : '500'
  const v = V[code] ?? V[code.startsWith('4') ? '404' : '500']

  return (
    <div className="relative flex min-h-svh items-center overflow-hidden bg-void pb-20 pt-32 text-ink">
      <div className="grid-floor absolute -inset-x-1/2 bottom-0 h-1/2 opacity-60" />
      <div className="radar pointer-events-none absolute left-1/2 top-1/2 size-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full" />
      <Suspense fallback={null}><Scene3D accent="#ff3dbb" /></Suspense>
      <div className="relative mx-auto w-full max-w-[1600px] px-5 md:px-10">
        <Hud className="text-live">● Error {code} · {v.k}</Hud>
        <div className="relative mt-4 select-none font-display text-[clamp(9rem,34vw,30rem)] font-black leading-[0.75]" aria-hidden>
          <span className="absolute inset-0 translate-x-[0.03em] text-cyan/60 mix-blend-screen [clip-path:inset(10%_0_55%_0)]">{code}</span>
          <span className="absolute inset-0 -translate-x-[0.03em] text-magenta/60 mix-blend-screen [clip-path:inset(55%_0_8%_0)]">{code}</span>
          <span className="relative">{code}</span>
        </div>
        <h1 className="mt-8 max-w-3xl font-display text-[clamp(2.5rem,6vw,5.5rem)] font-black uppercase leading-[0.85]">{v.t}</h1>
        <p className="mt-5 max-w-lg text-lg text-dim">{v.b}</p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Cta to="/">Back to base</Cta>
          <Cta ghost to="/tournaments">Find a tournament</Cta>
        </div>
      </div>
    </div>
  )
}
