import { useMemo } from 'react'
import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/react'
import { useAuthContext } from '../context/AuthContext'

export default function AccountMenu() {
  const { profile, isOrganizer, isSuperAdmin } = useAuthContext()

  const balanceDisplay = useMemo(() => {
    if (!profile) return '₹0'
    if (typeof profile.inr_balance_paise === 'number') {
      return '₹' + Math.floor(profile.inr_balance_paise / 100).toLocaleString('en-IN')
    }
    const cleanNum = String(profile.inr_balance || '0').replace(/[^0-9.]/g, '')
    const val = Number(cleanNum)
    return isNaN(val) ? '₹0' : '₹' + val.toLocaleString('en-IN')
  }, [profile])

  return (
    <div className="relative flex items-center">
      <Show when="signed-out">
        <div className="flex items-center gap-2">
          <SignInButton mode="modal">
            <button
              type="button"
              aria-label="Sign in"
              className="group relative flex items-center gap-2 rounded-full border border-cyan/40 bg-void/80 px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-cyan backdrop-blur-md transition-all duration-200 hover:border-cyan hover:bg-cyan/15 hover:shadow-[0_0_12px_rgba(62,242,255,0.25)] cursor-pointer"
            >
              <span className="size-1.5 rounded-full bg-cyan animate-pulse" />
              <span className="hidden sm:inline">Sign In</span>
              <span className="sm:hidden">Login</span>
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button
              type="button"
              aria-label="Sign up"
              className="hidden sm:flex items-center gap-1.5 rounded-full border border-white/20 bg-surface/60 px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-ink backdrop-blur-md transition-all duration-200 hover:border-white/40 hover:bg-white/10 cursor-pointer"
            >
              <span>Sign Up</span>
            </button>
          </SignUpButton>
        </div>
      </Show>

      <Show when="signed-in">
        <div className="flex items-center">
          <UserButton
            appearance={{
              elements: {
                rootBox: 'flex items-center justify-center',
                avatarBox: 'size-9 md:size-10 rounded-full border border-white/20 hover:border-cyan/50 transition-colors',
                userButtonPopoverCard: 'bg-[#0a0d14] border border-white/10 text-white shadow-2xl backdrop-blur-xl',
                userButtonPopoverActionButton: 'text-white/80 hover:text-cyan hover:bg-white/5 font-mono text-xs',
                userButtonPopoverActionButtonText: 'text-white/80 hover:text-cyan font-mono text-xs',
                userButtonPopoverCustomItemButton: 'text-white/80 hover:text-cyan hover:bg-white/5 font-mono text-xs',
              },
            }}
          >
            <UserButton.MenuItems>
              <UserButton.Link
                label="My Profile"
                href="/profile"
                labelIcon={<span className="text-cyan text-xs font-mono">◆</span>}
              />
              <UserButton.Link
                label="My Team"
                href="/teams"
                labelIcon={<span className="text-cyan text-xs font-mono">👥</span>}
              />
              <UserButton.Link
                label="My Registrations"
                href="/my/registrations"
                labelIcon={<span className="text-cyan text-xs font-mono">🏆</span>}
              />
              <UserButton.Link
                label="My Matches"
                href="/my/matches"
                labelIcon={<span className="text-cyan text-xs font-mono">⚔</span>}
              />
              <UserButton.Link
                label={`Wallet (${balanceDisplay})`}
                href="/wallet"
                labelIcon={<span className="text-cyan text-xs font-mono">₹</span>}
              />
              <UserButton.Link
                label="Settings"
                href="/settings"
                labelIcon={<span className="text-cyan text-xs font-mono">⚙</span>}
              />
              {isOrganizer && (
                <UserButton.Link
                  label="Organizer Portal"
                  href="/organizer"
                  labelIcon={<span className="text-cyan text-xs font-mono">★</span>}
                />
              )}
              {isSuperAdmin && (
                <UserButton.Link
                  label="Super Admin"
                  href="/admin"
                  labelIcon={<span className="text-magenta text-xs font-mono">⚡</span>}
                />
              )}
            </UserButton.MenuItems>
          </UserButton>
        </div>
      </Show>
    </div>
  )
}
