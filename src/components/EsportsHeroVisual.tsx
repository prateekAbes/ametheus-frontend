import React from 'react'

export type HeroVisualVariant =
  | 'home'
  | 'games'
  | 'tournaments'
  | 'matches'
  | 'category'
  | 'leaderboard'
  | 'support'
  | 'wallet'
  | 'default'

interface EsportsHeroVisualProps {
  variant?: HeroVisualVariant
  accent?: string
  className?: string
}

export default function EsportsHeroVisual({
  variant = 'default',
  accent = '#3ef2ff',
  className = '',
}: EsportsHeroVisualProps) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden select-none ${className}`}
      aria-hidden="true"
    >
      {/* Dynamic atmospheric radial flares */}
      <div
        className="absolute inset-0 transition-opacity duration-1000"
        style={{
          background:
            variant === 'home'
              ? 'radial-gradient(ellipse at 50% 120%, #8b5cff4d, transparent 60%), radial-gradient(ellipse at 85% -10%, #3ef2ff26, transparent 50%)'
              : variant === 'games'
              ? `radial-gradient(ellipse at 80% 30%, ${accent}33, transparent 55%), radial-gradient(ellipse at 10% 90%, #8b5cff26, transparent 50%)`
              : variant === 'tournaments'
              ? `radial-gradient(ellipse at 20% 85%, ${accent}38, transparent 55%), radial-gradient(ellipse at 75% 15%, #3ef2ff22, transparent 50%)`
              : variant === 'matches'
              ? `radial-gradient(ellipse at 80% 20%, #ff3b4e33, transparent 55%), radial-gradient(ellipse at 25% 90%, #ff7a1a22, transparent 50%)`
              : variant === 'leaderboard'
              ? 'radial-gradient(ellipse at 70% 30%, #f59e0b33, transparent 55%), radial-gradient(ellipse at 20% 80%, #d9770622, transparent 50%)'
              : variant === 'support'
              ? 'radial-gradient(ellipse at 80% 30%, #06b6d433, transparent 55%), radial-gradient(ellipse at 15% 90%, #0284c722, transparent 50%)'
              : variant === 'wallet'
              ? 'radial-gradient(ellipse at 80% 30%, #10b98133, transparent 55%), radial-gradient(ellipse at 15% 90%, #05966922, transparent 50%)'
              : `radial-gradient(ellipse at 70% 40%, ${accent}30, transparent 60%)`,
        }}
      />

      {/* Cybernetic Isometric Floor Grid */}
      <div
        className="absolute -inset-x-1/2 bottom-0 h-[60%] opacity-25"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.08) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          transform: 'perspective(400px) rotateX(60deg)',
          transformOrigin: 'bottom center',
        }}
      />

      {/* Subtle Vector Esports Artwork based on Page Variant */}
      {variant === 'games' && (
        <svg
          className="absolute -right-16 top-1/2 h-[520px] w-[520px] -translate-y-1/2 opacity-35"
          viewBox="0 0 400 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Hexagonal arena boundary */}
          <polygon
            points="200,30 350,115 350,285 200,370 50,285 50,115"
            stroke={accent}
            strokeWidth="1.5"
            strokeDasharray="8 6"
          />
          <polygon
            points="200,60 320,130 320,270 200,340 80,270 80,130"
            stroke="white"
            strokeWidth="0.75"
            strokeOpacity="0.3"
          />
          {/* Inner targeting crosshairs */}
          <circle cx="200" cy="200" r="80" stroke={accent} strokeWidth="1" strokeOpacity="0.4" />
          <circle cx="200" cy="200" r="40" stroke="white" strokeWidth="1" strokeOpacity="0.6" />
          <line x1="200" y1="100" x2="200" y2="300" stroke={accent} strokeWidth="1" strokeOpacity="0.4" />
          <line x1="100" y1="200" x2="300" y2="200" stroke={accent} strokeWidth="1" strokeOpacity="0.4" />
          {/* Corner tick marks */}
          <path d="M160 160 L175 160 M160 160 L160 175" stroke={accent} strokeWidth="2" />
          <path d="M240 160 L225 160 M240 160 L240 175" stroke={accent} strokeWidth="2" />
          <path d="M160 240 L175 240 M160 240 L160 225" stroke={accent} strokeWidth="2" />
          <path d="M240 240 L225 240 M240 240 L240 225" stroke={accent} strokeWidth="2" />
        </svg>
      )}

      {variant === 'tournaments' && (
        <svg
          className="absolute -right-20 top-1/2 h-[560px] w-[620px] -translate-y-1/2 opacity-35"
          viewBox="0 0 500 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Bracket tree circuit lines */}
          <path
            d="M 50 80 H 160 V 160 H 260 V 200 H 380"
            stroke={accent}
            strokeWidth="2"
            strokeDasharray="6 4"
          />
          <path
            d="M 50 240 H 160 V 160"
            stroke={accent}
            strokeWidth="2"
            strokeDasharray="6 4"
          />
          <path
            d="M 50 320 H 260 V 200"
            stroke="white"
            strokeWidth="1.5"
            strokeOpacity="0.4"
          />
          {/* Bracket nodes */}
          <circle cx="50" cy="80" r="5" fill={accent} />
          <circle cx="50" cy="240" r="5" fill={accent} />
          <circle cx="50" cy="320" r="5" fill="white" fillOpacity="0.6" />
          <circle cx="160" cy="160" r="6" fill={accent} />
          <circle cx="260" cy="200" r="7" fill={accent} />
          <circle cx="380" cy="200" r="9" stroke={accent} strokeWidth="2" fill="none" />
          {/* Championship diamond crest */}
          <polygon
            points="380,160 420,200 380,240 340,200"
            stroke={accent}
            strokeWidth="1.5"
            fill={accent}
            fillOpacity="0.1"
          />
          <polygon
            points="380,140 440,200 380,260 320,200"
            stroke="white"
            strokeWidth="0.75"
            strokeOpacity="0.2"
          />
        </svg>
      )}

      {variant === 'matches' && (
        <svg
          className="absolute -right-12 top-1/2 h-[520px] w-[520px] -translate-y-1/2 opacity-35"
          viewBox="0 0 400 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Live combat radar telemetry */}
          <circle cx="200" cy="200" r="160" stroke="#ff3b4e" strokeWidth="1.5" strokeOpacity="0.5" />
          <circle cx="200" cy="200" r="120" stroke="white" strokeWidth="0.75" strokeOpacity="0.25" strokeDasharray="4 4" />
          <circle cx="200" cy="200" r="75" stroke="#ff3b4e" strokeWidth="1" strokeOpacity="0.6" />
          <circle cx="200" cy="200" r="6" fill="#ff3b4e" />
          <line x1="200" y1="20" x2="200" y2="380" stroke="#ff3b4e" strokeWidth="0.75" strokeOpacity="0.3" />
          <line x1="20" y1="200" x2="380" y2="200" stroke="#ff3b4e" strokeWidth="0.75" strokeOpacity="0.3" />
          {/* Sweep radius wedge */}
          <path
            d="M 200 200 L 340 100 A 160 160 0 0 0 200 40 Z"
            fill="url(#radarGradient)"
            opacity="0.3"
          />
          <defs>
            <radialGradient id="radarGradient" cx="200" cy="200" r="160" gradientUnits="userSpaceOnUse">
              <stop stopColor="#ff3b4e" stopOpacity="0.6" />
              <stop offset="1" stopColor="#ff3b4e" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      )}

      {variant === 'leaderboard' && (
        <svg
          className="absolute -right-12 top-1/2 h-[500px] w-[500px] -translate-y-1/2 opacity-30"
          viewBox="0 0 400 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Apex podium tier vector geometry */}
          <polygon points="200,50 260,180 200,160 140,180" stroke="#f59e0b" strokeWidth="1.5" fill="#f59e0b" fillOpacity="0.1" />
          <polygon points="200,80 320,320 80,320" stroke="#f59e0b" strokeWidth="1" strokeDasharray="6 4" />
          <circle cx="200" cy="50" r="10" stroke="#f59e0b" strokeWidth="2" fill="none" />
          <line x1="120" y1="240" x2="280" y2="240" stroke="white" strokeWidth="0.75" strokeOpacity="0.4" />
          <line x1="100" y1="280" x2="300" y2="280" stroke="white" strokeWidth="0.75" strokeOpacity="0.4" />
        </svg>
      )}

      {variant === 'support' && (
        <svg
          className="absolute -right-12 top-1/2 h-[480px] w-[480px] -translate-y-1/2 opacity-30"
          viewBox="0 0 400 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Cyber shield & signal vectors */}
          <path
            d="M 200 60 L 320 110 V 220 C 320 290 200 350 200 350 C 200 350 80 290 80 220 V 110 Z"
            stroke="#06b6d4"
            strokeWidth="1.5"
            strokeDasharray="8 6"
          />
          <path
            d="M 200 90 L 290 130 V 210 C 290 265 200 310 200 310 C 200 310 110 265 110 210 V 130 Z"
            stroke="white"
            strokeWidth="0.75"
            strokeOpacity="0.3"
          />
          <circle cx="200" cy="190" r="30" stroke="#06b6d4" strokeWidth="1.5" />
          <path d="M 185 190 H 215 M 200 175 V 205" stroke="#06b6d4" strokeWidth="2" />
        </svg>
      )}

      {/* Decorative corner framing ticks */}
      <div className="absolute right-8 top-8 hidden md:block">
        <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">
          <span className="size-1 rounded-full bg-cyan animate-pulse" />
          <span>ESPORTS PROTOCOL // SYS-READY</span>
        </div>
      </div>
    </div>
  )
}
