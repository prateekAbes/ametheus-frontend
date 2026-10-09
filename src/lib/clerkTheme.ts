/**
 * Ametheus — Clerk Component Appearance Configuration
 * Seamlessly integrates into Ametheus's native dark esports design system.
 * Removes all outer cards, artificial panels, and glassmorphic wrappers so forms
 * float naturally against the dark background.
 */

export const ametheusClerkAppearance = {
  variables: {
    colorPrimary: '#00F5FF',
    colorBackground: 'transparent',
    colorInputBackground: '#0d1117',
    colorInputText: '#FFFFFF',
    colorText: '#FFFFFF',
    colorTextSecondary: '#94A3B8',
    colorTextOnPrimaryBackground: '#05060A',
    colorDanger: '#F43F5E',
    colorSuccess: '#22C55E',
    colorWarning: '#EAB308',
    colorNeutral: '#FFFFFF',
    borderRadius: '0px',
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: '0.875rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'w-full max-w-[400px] shadow-none bg-transparent',
    card: 'bg-transparent border-0 shadow-none p-0 w-full',
    headerTitle: 'font-display text-2xl sm:text-3xl font-black uppercase tracking-tight text-white',
    headerSubtitle: 'text-xs text-dim mt-1.5',
    socialButtonsBlockButton: 'bg-white/[0.04] hover:bg-white/[0.08] border border-white/15 hover:border-white/30 text-white text-xs font-semibold rounded-none transition-all h-11',
    socialButtonsBlockButtonText: 'text-white text-xs font-semibold',
    socialButtonsProviderIcon: 'size-4',
    dividerRow: 'my-5 border-white/10',
    dividerText: 'font-mono text-[10px] font-semibold uppercase tracking-widest text-dim bg-transparent px-2',
    dividerLine: 'bg-white/10',
    formButtonPrimary: 'h-11 rounded-none bg-cyan hover:bg-cyan/90 text-void font-display text-sm font-black uppercase tracking-wider transition-all border-none shadow-none cursor-pointer active:scale-[0.99]',
    formFieldLabel: 'font-mono text-[11px] uppercase tracking-wider text-slate-300 font-medium mb-1',
    formFieldInput: 'h-11 rounded-none border border-white/15 bg-white/[0.04] px-3.5 text-sm text-white placeholder:text-dim/40 transition-all focus:border-cyan focus:bg-white/[0.08] focus:outline-none',
    formFieldAction: 'font-mono text-[11px] text-cyan hover:underline transition-colors',
    footerActionLink: 'font-bold text-cyan hover:underline transition-colors',
    footerActionText: 'text-xs text-dim font-mono',
    footer: 'bg-transparent border-t border-white/10 pt-4 mt-6',
    identityPreviewText: 'text-sm text-white font-mono',
    identityPreviewEditButton: 'text-xs text-cyan hover:underline',
    formFieldErrorText: 'text-xs text-rose-400 font-mono mt-1',
    formFieldSuccessText: 'text-xs text-emerald-400 font-mono mt-1',
    alert: 'border border-white/15 bg-white/[0.04] text-xs text-slate-300 rounded-none p-3',
    alertText: 'text-xs text-slate-300',
    otpCodeFieldInput: 'border border-white/20 bg-white/[0.04] text-white rounded-none focus:border-cyan',
  },
}
