import React from 'react'
import { Navigate, useLocation } from 'react-router'
import { useAuthContext } from '../context/AuthContext'
import { Hud, Cta } from './ui'

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoading, profile } = useAuthContext()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-void">
        <Hud className="text-cyan animate-pulse">AUTHENTICATING CONTENDER...</Hud>
      </div>
    )
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />
  }

  if (profile && (profile.needs_username === true || !profile.has_chosen_username)) {
    return <Navigate to="/sign-up/continue" state={{ from: location }} replace />
  }

  return <>{children}</>
}

export function RequireOrganizer({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isOrganizer, isLoading } = useAuthContext()

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-void">
        <Hud className="text-cyan animate-pulse">VERIFYING ORGANIZER PERMISSIONS...</Hud>
      </div>
    )
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />
  }

  if (!isOrganizer) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-void px-6 text-center">
        <span className="font-mono text-5xl text-warn">403</span>
        <h1 className="mt-4 font-display text-4xl font-black uppercase">Organizer Clearance Required</h1>
        <p className="mt-2 max-w-md text-dim">
          Your account has Player privileges. Organizer or Super Admin credentials are required to access this console.
        </p>
        <div className="mt-8">
          <Cta to="/">Return to Safety</Cta>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export function RequireSuperAdmin({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isSuperAdmin, isLoading } = useAuthContext()

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-void">
        <Hud className="text-live animate-pulse">CHECKING SUPER ADMIN CLEARANCE...</Hud>
      </div>
    )
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />
  }

  if (!isSuperAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-void px-6 text-center">
        <span className="font-mono text-5xl text-live">403</span>
        <h1 className="mt-4 font-display text-4xl font-black uppercase">Root Access Restricted</h1>
        <p className="mt-2 max-w-md text-dim">
          Super Admin root privileges are required to access the Platform Command Center.
        </p>
        <div className="mt-8">
          <Cta to="/">Return to Safety</Cta>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
