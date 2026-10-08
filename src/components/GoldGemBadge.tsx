import React from 'react'

export interface GoldGemBadgeProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'pill' | 'crest' | 'shield'
  label?: string
  sublabel?: string
  className?: string
  showSublabel?: boolean
}

/**
 * GoldGemBadge — Genuine Collectible Esports Tier / Status Badge
 * Features a multifaceted geometric gold gemstone with integrated '01' numeral,
 * champagne metallic gradients, refined edge reflection, and subtle warm halo.
 */
export function GoldGemBadge({
  size = 'md',
  variant = 'pill',
  label = '01 GOLD GEM',
  sublabel = 'TIER 01 · ELITE',
  className = '',
  showSublabel = true,
}: GoldGemBadgeProps) {
  // Size metrics
  const isSm = size === 'sm'
  const isLg = size === 'lg'

  return (
    <div
      className={`relative inline-flex items-center select-none group transition-all duration-300 ${className}`}
      role="status"
      aria-label="Tier 01 Gold Gem Contender"
    >
      {/* Soft warm halo ambient glow */}
      <div className="absolute -inset-1 rounded-sm bg-gradient-to-r from-amber-500/20 via-yellow-400/25 to-amber-600/20 blur-md opacity-80 group-hover:opacity-100 transition-opacity pointer-events-none" />

      {/* Main Badge Container */}
      <div
        className={`relative inline-flex items-center overflow-hidden rounded-[3px] border border-amber-400/80 bg-gradient-to-r from-[#1E1609]/95 via-[#291F0E]/90 to-[#181105]/95 shadow-[inset_0_1px_1px_rgba(254,240,138,0.3),0_4px_16px_rgba(0,0,0,0.6)] backdrop-blur-md ${
          isSm
            ? 'gap-1.5 px-2 py-0.5'
            : isLg
            ? 'gap-3 px-4 py-2'
            : 'gap-2 px-3 py-1'
        }`}
      >
        {/* Directional light sweep overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/30" />
        <div className="pointer-events-none absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-200/70 to-transparent" />

        {/* 1. Integrated Insignia: Faceted Geometric Gold Gemstone + '01' Numeral */}
        <div className="relative shrink-0 flex items-center justify-center">
          {/* Faceted Gemstone SVG */}
          <svg
            className={`${isSm ? 'size-4' : isLg ? 'size-7' : 'size-5'} filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]`}
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Champagne Top Highlight Gradient */}
              <linearGradient id="gem-highlight" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FFFBEB" />
                <stop offset="50%" stopColor="#FDE047" />
                <stop offset="100%" stopColor="#F59E0B" />
              </linearGradient>

              {/* Brushed Amber Mid-tone Gradient */}
              <linearGradient id="gem-mid" x1="0" y1="0" x2="0" y2="28" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FBBF24" />
                <stop offset="50%" stopColor="#D97706" />
                <stop offset="100%" stopColor="#92400E" />
              </linearGradient>

              {/* Deep Gold Pavilion Shadow */}
              <linearGradient id="gem-shadow" x1="0" y1="14" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#B45309" />
                <stop offset="60%" stopColor="#78350F" />
                <stop offset="100%" stopColor="#451A03" />
              </linearGradient>

              {/* Metallic Rim Accent */}
              <linearGradient id="gem-rim" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FEF08A" />
                <stop offset="50%" stopColor="#D97706" />
                <stop offset="100%" stopColor="#78350F" />
              </linearGradient>
            </defs>

            {/* Gem Base Silhouette / Rim */}
            <path
              d="M7 3L21 3L27 10L14 26L1 10L7 3Z"
              fill="url(#gem-mid)"
              stroke="url(#gem-rim)"
              strokeWidth="0.8"
              strokeLinejoin="round"
            />

            {/* Top Table Facet (Brilliant Light Refraction) */}
            <polygon
              points="10,3 18,3 21,9 7,9"
              fill="url(#gem-highlight)"
              opacity="0.95"
            />

            {/* Top Left Bevel */}
            <polygon
              points="7,3 10,3 7,9 1,10"
              fill="#FEF08A"
              opacity="0.8"
            />

            {/* Top Right Bevel */}
            <polygon
              points="18,3 21,3 27,10 21,9"
              fill="#F59E0B"
              opacity="0.85"
            />

            {/* Center Front Pavilion (Kite Facet) */}
            <polygon
              points="14,26 7,9 21,9"
              fill="url(#gem-shadow)"
            />

            {/* Left Pavilion Triangle */}
            <polygon
              points="1,10 7,9 14,26"
              fill="#92400E"
              opacity="0.9"
            />

            {/* Right Pavilion Triangle */}
            <polygon
              points="27,10 21,9 14,26"
              fill="#78350F"
              opacity="0.95"
            />

            {/* Center Prism Core Highlight */}
            <polygon
              points="14,11 17,17 14,23 11,17"
              fill="#FEF08A"
              opacity="0.5"
            />

            {/* Diamond Glint Sparkle */}
            <circle cx="10" cy="6" r="1" fill="#FFFFFF" opacity="0.95" />
          </svg>
        </div>

        {/* 2. Integrated '01' Technical Numeral Crest */}
        <div className="flex items-center gap-1.5 border-l border-amber-500/30 pl-2">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 leading-none">
              <span
                className={`font-mono font-black tracking-tight text-amber-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] ${
                  isSm ? 'text-[10px]' : isLg ? 'text-sm' : 'text-xs'
                }`}
              >
                01
              </span>
              <span className="text-amber-500/70 text-[9px] font-mono">·</span>
              <span
                className={`font-display font-black uppercase tracking-wider bg-gradient-to-r from-amber-100 via-amber-300 to-amber-400 bg-clip-text text-transparent drop-shadow-sm ${
                  isSm ? 'text-[10px]' : isLg ? 'text-sm' : 'text-xs'
                }`}
              >
                GOLD GEM
              </span>
            </div>

            {showSublabel && (
              <span
                className={`font-mono tracking-[0.18em] uppercase text-amber-400/70 font-semibold mt-0.5 leading-none ${
                  isSm ? 'text-[7px]' : isLg ? 'text-[9px]' : 'text-[8px]'
                }`}
              >
                {sublabel}
              </span>
            )}
          </div>
        </div>

        {/* Micro Corner Spec Notch */}
        <div className="absolute top-0 right-0 size-1.5 border-t border-r border-amber-300/80 pointer-events-none" />
      </div>
    </div>
  )
}

export default GoldGemBadge
