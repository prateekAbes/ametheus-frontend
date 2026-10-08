import React from 'react'

interface ChampionshipCrownProps {
  rank: 1 | 2 | 3
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function ChampionshipCrown({ rank, size = 'md', className = '' }: ChampionshipCrownProps) {
  // Dimensions based on size
  const dim = size === 'lg' ? 'w-24 h-16' : size === 'sm' ? 'w-14 h-10' : 'w-20 h-14'

  // Unique rank-specific gradient ID prefix
  const idPrefix = `crown-rank-${rank}`

  // Animation class: 1st place champion has floating + gentle rotation, 2nd & 3rd have gentle breathing float
  const animClass =
    rank === 1
      ? 'animate-champion-crown'
      : rank === 2
      ? 'animate-runnerup-crown'
      : 'animate-bronze-crown'

  return (
    <div
      className={`relative flex items-center justify-center pointer-events-none select-none ${animClass} ${className}`}
      aria-label={`Rank #${rank} Championship Crown`}
    >
      <svg
        viewBox="0 0 72 52"
        className={`${dim} overflow-visible`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Rank 1: Royal Esports Gold */}
          {rank === 1 && (
            <>
              <linearGradient id={`${idPrefix}-gold-peak`} x1="36" y1="4" x2="36" y2="44" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FFFBEB" />
                <stop offset="25%" stopColor="#FDE047" />
                <stop offset="60%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#B45309" />
              </linearGradient>
              <linearGradient id={`${idPrefix}-gold-light`} x1="8" y1="16" x2="64" y2="44" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FEF08A" />
                <stop offset="50%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#78350F" />
              </linearGradient>
              <linearGradient id={`${idPrefix}-gold-dark`} x1="64" y1="16" x2="8" y2="44" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#D97706" />
                <stop offset="50%" stopColor="#B45309" />
                <stop offset="100%" stopColor="#451A03" />
              </linearGradient>
              <linearGradient id={`${idPrefix}-crimson-gem`} x1="36" y1="38" x2="36" y2="48" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FF6B81" />
                <stop offset="50%" stopColor="#FF3B4E" />
                <stop offset="100%" stopColor="#991B1B" />
              </linearGradient>
              <filter id={`${idPrefix}-glow`} x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0" stdDeviation="4.5" floodColor="#F59E0B" floodOpacity="0.75" />
                <feDropShadow dx="0" dy="2" stdDeviation="8" floodColor="#FF3B4E" floodOpacity="0.35" />
              </filter>
            </>
          )}

          {/* Rank 2: Refined Platinum Silver */}
          {rank === 2 && (
            <>
              <linearGradient id={`${idPrefix}-silver-peak`} x1="36" y1="4" x2="36" y2="44" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="30%" stopColor="#F1F5F9" />
                <stop offset="70%" stopColor="#CBD5E1" />
                <stop offset="100%" stopColor="#64748B" />
              </linearGradient>
              <linearGradient id={`${idPrefix}-silver-light`} x1="8" y1="16" x2="64" y2="44" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="50%" stopColor="#E2E8F0" />
                <stop offset="100%" stopColor="#475569" />
              </linearGradient>
              <linearGradient id={`${idPrefix}-silver-dark`} x1="64" y1="16" x2="8" y2="44" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#94A3B8" />
                <stop offset="50%" stopColor="#64748B" />
                <stop offset="100%" stopColor="#334155" />
              </linearGradient>
              <linearGradient id={`${idPrefix}-cyan-gem`} x1="36" y1="38" x2="36" y2="48" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#E0F2FE" />
                <stop offset="50%" stopColor="#38BDF8" />
                <stop offset="100%" stopColor="#0369A1" />
              </linearGradient>
              <filter id={`${idPrefix}-glow`} x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#CBD5E1" floodOpacity="0.6" />
              </filter>
            </>
          )}

          {/* Rank 3: Burnished Esports Bronze */}
          {rank === 3 && (
            <>
              <linearGradient id={`${idPrefix}-bronze-peak`} x1="36" y1="4" x2="36" y2="44" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FFEDD5" />
                <stop offset="30%" stopColor="#FB923C" />
                <stop offset="70%" stopColor="#EA580C" />
                <stop offset="100%" stopColor="#7C2D12" />
              </linearGradient>
              <linearGradient id={`${idPrefix}-bronze-light`} x1="8" y1="16" x2="64" y2="44" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FED7AA" />
                <stop offset="50%" stopColor="#C2410C" />
                <stop offset="100%" stopColor="#431407" />
              </linearGradient>
              <linearGradient id={`${idPrefix}-bronze-dark`} x1="64" y1="16" x2="8" y2="44" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#9A3412" />
                <stop offset="50%" stopColor="#7C2D12" />
                <stop offset="100%" stopColor="#2A0B02" />
              </linearGradient>
              <linearGradient id={`${idPrefix}-amber-gem`} x1="36" y1="38" x2="36" y2="48" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FEF08A" />
                <stop offset="50%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#B45309" />
              </linearGradient>
              <filter id={`${idPrefix}-glow`} x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#EA580C" floodOpacity="0.55" />
              </filter>
            </>
          )}
        </defs>

        <g filter={`url(#${idPrefix}-glow)`}>
          {/* Main Crown Body Base Silhouette */}
          <path
            d="M8 22 L16 32 L24 16 L31 28 L36 8 L41 28 L48 16 L56 32 L64 22 L61 41 Q36 46 11 41 Z"
            fill={
              rank === 1
                ? `url(#${idPrefix}-gold-light)`
                : rank === 2
                ? `url(#${idPrefix}-silver-light)`
                : `url(#${idPrefix}-bronze-light)`
            }
            stroke={rank === 1 ? '#FDE047' : rank === 2 ? '#FFFFFF' : '#FFEDD5'}
            strokeWidth="0.75"
          />

          {/* Center Spire Left Facet (gives depth & shine) */}
          <path
            d="M36 8 L31 28 L36 39 Z"
            fill={
              rank === 1
                ? `url(#${idPrefix}-gold-peak)`
                : rank === 2
                ? `url(#${idPrefix}-silver-peak)`
                : `url(#${idPrefix}-bronze-peak)`
            }
            opacity="0.95"
          />
          {/* Center Spire Right Facet */}
          <path
            d="M36 8 L41 28 L36 39 Z"
            fill={
              rank === 1
                ? `url(#${idPrefix}-gold-dark)`
                : rank === 2
                ? `url(#${idPrefix}-silver-dark)`
                : `url(#${idPrefix}-bronze-dark)`
            }
            opacity="0.9"
          />

          {/* Secondary Left Spire Facet */}
          <path
            d="M24 16 L16 32 L24 39 L31 28 Z"
            fill={
              rank === 1
                ? `url(#${idPrefix}-gold-light)`
                : rank === 2
                ? `url(#${idPrefix}-silver-light)`
                : `url(#${idPrefix}-bronze-light)`
            }
            opacity="0.9"
          />

          {/* Secondary Right Spire Facet */}
          <path
            d="M48 16 L41 28 L48 39 L56 32 Z"
            fill={
              rank === 1
                ? `url(#${idPrefix}-gold-dark)`
                : rank === 2
                ? `url(#${idPrefix}-silver-dark)`
                : `url(#${idPrefix}-bronze-dark)`
            }
            opacity="0.95"
          />

          {/* Left Wing Facet */}
          <path
            d="M8 22 L11 41 L16 32 Z"
            fill={
              rank === 1
                ? `url(#${idPrefix}-gold-light)`
                : rank === 2
                ? `url(#${idPrefix}-silver-light)`
                : `url(#${idPrefix}-bronze-light)`
            }
            opacity="0.85"
          />
          {/* Right Wing Facet */}
          <path
            d="M64 22 L56 32 L61 41 Z"
            fill={
              rank === 1
                ? `url(#${idPrefix}-gold-dark)`
                : rank === 2
                ? `url(#${idPrefix}-silver-dark)`
                : `url(#${idPrefix}-bronze-dark)`
            }
            opacity="0.9"
          />

          {/* Base Rim Headband */}
          <path
            d="M10 40 Q36 44 62 40 L60 47 Q36 51 12 47 Z"
            fill={
              rank === 1
                ? `url(#${idPrefix}-gold-peak)`
                : rank === 2
                ? `url(#${idPrefix}-silver-peak)`
                : `url(#${idPrefix}-bronze-peak)`
            }
            stroke={rank === 1 ? '#FEF08A' : rank === 2 ? '#FFFFFF' : '#FED7AA'}
            strokeWidth="0.8"
          />

          {/* Apex Finial Star/Diamond atop center spire */}
          <polygon
            points="36,2 38.5,6 36,9.5 33.5,6"
            fill={rank === 1 ? '#FFFBEB' : rank === 2 ? '#FFFFFF' : '#FFEDD5'}
            stroke={rank === 1 ? '#F59E0B' : rank === 2 ? '#94A3B8' : '#EA580C'}
            strokeWidth="0.75"
          />

          {/* Flanking Orbs atop mid spires */}
          <circle cx="24" cy="15.5" r="2" fill={rank === 1 ? '#FEF08A' : rank === 2 ? '#F8FAFC' : '#FED7AA'} />
          <circle cx="48" cy="15.5" r="2" fill={rank === 1 ? '#F59E0B' : rank === 2 ? '#CBD5E1' : '#EA580C'} />

          {/* Outer Wing Orbs */}
          <circle cx="8" cy="21.5" r="1.5" fill={rank === 1 ? '#FEF08A' : rank === 2 ? '#FFFFFF' : '#FED7AA'} />
          <circle cx="64" cy="21.5" r="1.5" fill={rank === 1 ? '#D97706' : rank === 2 ? '#94A3B8' : '#C2410C'} />

          {/* Center Royal Gem Inlaid into Headband */}
          <polygon
            points="36,41 39.5,44 36,47 32.5,44"
            fill={
              rank === 1
                ? `url(#${idPrefix}-crimson-gem)`
                : rank === 2
                ? `url(#${idPrefix}-cyan-gem)`
                : `url(#${idPrefix}-amber-gem)`
            }
            stroke={rank === 1 ? '#FECDD3' : rank === 2 ? '#BAE6FD' : '#FEF08A'}
            strokeWidth="0.7"
          />
          {/* Side Small Gem Accents on Headband */}
          <circle cx="22" cy="44" r="1.4" fill={rank === 1 ? '#FEF08A' : rank === 2 ? '#E2E8F0' : '#FED7AA'} />
          <circle cx="50" cy="44" r="1.4" fill={rank === 1 ? '#FEF08A' : rank === 2 ? '#E2E8F0' : '#FED7AA'} />
        </g>
      </svg>
    </div>
  )
}

import { GoldGemBadge } from './GoldGemBadge'

interface PodiumMedalBadgeProps {
  rank: 1 | 2 | 3
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function PodiumMedalBadge({ rank, className = '', size = 'md' }: PodiumMedalBadgeProps) {
  if (rank === 1) {
    return (
      <GoldGemBadge
        size={size}
        label="01 GOLD GEM"
        sublabel="TIER 01 · CHAMPION"
        className={className}
      />
    )
  }

  if (rank === 2) {
    return (
      <div className={`relative inline-flex items-center select-none group transition-all duration-300 ${className}`}>
        <div className="absolute -inset-1 rounded-sm bg-slate-300/10 blur-sm opacity-80 group-hover:opacity-100 transition-opacity pointer-events-none" />
        <div className="relative inline-flex items-center gap-2 overflow-hidden rounded-[3px] border border-slate-300/70 bg-gradient-to-r from-[#141824]/95 via-[#1D2436]/90 to-[#101420]/95 px-3 py-1 shadow-[inset_0_1px_1px_rgba(241,245,249,0.3),0_4px_16px_rgba(0,0,0,0.6)] backdrop-blur-md">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/30" />
          <div className="pointer-events-none absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-slate-200/60 to-transparent" />
          <div className="flex items-center justify-center shrink-0">
            <svg className="size-4.5 filter drop-shadow" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L4 6V12C4 17.5 12 22 12 22C12 22 20 17.5 20 12V6L12 2Z" fill="url(#silver-grad)" stroke="#E2E8F0" strokeWidth="0.8" strokeLinejoin="round" />
              <polygon points="12,4 18,7 12,11 6,7" fill="#FFFFFF" opacity="0.4" />
              <polygon points="12,11 18,7 18,12 12,19" fill="#64748B" opacity="0.6" />
              <defs>
                <linearGradient id="silver-grad" x1="4" y1="2" x2="20" y2="22">
                  <stop offset="0%" stopColor="#F8FAFC" />
                  <stop offset="50%" stopColor="#94A3B8" />
                  <stop offset="100%" stopColor="#475569" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="flex items-center gap-1.5 border-l border-slate-400/30 pl-2">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-mono text-xs font-black text-slate-100">02</span>
                <span className="text-slate-400 text-[9px] font-mono">·</span>
                <span className="font-display text-xs font-black uppercase tracking-wider text-slate-100">
                  SILVER RUNNER-UP
                </span>
              </div>
              <span className="font-mono text-[8px] tracking-[0.18em] uppercase text-slate-400/80 font-semibold mt-0.5 leading-none">
                TIER 02 · CONTENDER
              </span>
            </div>
          </div>
          <div className="absolute top-0 right-0 size-1.5 border-t border-r border-slate-300/80 pointer-events-none" />
        </div>
      </div>
    )
  }

  return (
    <div className={`relative inline-flex items-center select-none group transition-all duration-300 ${className}`}>
      <div className="absolute -inset-1 rounded-sm bg-amber-700/10 blur-sm opacity-80 group-hover:opacity-100 transition-opacity pointer-events-none" />
      <div className="relative inline-flex items-center gap-2 overflow-hidden rounded-[3px] border border-amber-700/70 bg-gradient-to-r from-[#20150d]/95 via-[#2d1e13]/90 to-[#180f08]/95 px-3 py-1 shadow-[inset_0_1px_1px_rgba(254,215,170,0.2),0_4px_16px_rgba(0,0,0,0.6)] backdrop-blur-md">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/30" />
        <div className="pointer-events-none absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
        <div className="flex items-center justify-center shrink-0">
          <svg className="size-4.5 filter drop-shadow" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L4 6V12C4 17.5 12 22 12 22C12 22 20 17.5 20 12V6L12 2Z" fill="url(#bronze-grad)" stroke="#D97706" strokeWidth="0.8" strokeLinejoin="round" />
            <polygon points="12,4 18,7 12,11 6,7" fill="#FED7AA" opacity="0.4" />
            <polygon points="12,11 18,7 18,12 12,19" fill="#78350F" opacity="0.7" />
            <defs>
              <linearGradient id="bronze-grad" x1="4" y1="2" x2="20" y2="22">
                <stop offset="0%" stopColor="#FED7AA" />
                <stop offset="50%" stopColor="#B45309" />
                <stop offset="100%" stopColor="#78350F" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div className="flex items-center gap-1.5 border-l border-amber-700/30 pl-2">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-mono text-xs font-black text-amber-200">03</span>
              <span className="text-amber-700 text-[9px] font-mono">·</span>
              <span className="font-display text-xs font-black uppercase tracking-wider text-amber-200">
                BRONZE 3RD PLACE
              </span>
            </div>
            <span className="font-mono text-[8px] tracking-[0.18em] uppercase text-amber-400/70 font-semibold mt-0.5 leading-none">
              TIER 03 · FINALIST
            </span>
          </div>
        </div>
        <div className="absolute top-0 right-0 size-1.5 border-t border-r border-amber-500/80 pointer-events-none" />
      </div>
    </div>
  )
}
