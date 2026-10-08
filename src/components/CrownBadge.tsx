import React from 'react'

/**
 * Premium esports championship crown badge with circular visual framing
 * and smooth, slow, continuous 360-degree circular motion.
 * Respects prefers-reduced-motion. Fully uncropped with generous spacing.
 */
export default function CrownBadge({ className = '' }: { className?: string }) {
  return (
    <div
      className={`relative mx-auto flex items-center justify-center my-3 select-none ${className}`}
      aria-label="Ametheus Championship Crown"
    >
      {/* Outer ambient atmospheric glow */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: '76px',
          height: '76px',
          background:
            'radial-gradient(circle, rgba(168, 85, 247, 0.28) 0%, rgba(99, 102, 241, 0.12) 55%, transparent 75%)',
          filter: 'blur(10px)',
        }}
        aria-hidden="true"
      />

      {/* Rotating continuous orbital ring (Smooth, slow, continuous 360-degree rotation) */}
      <div
        className="absolute rounded-full pointer-events-none ametheus-crown-orbit"
        style={{
          width: '68px',
          height: '68px',
          border: '1px dashed rgba(192, 132, 252, 0.35)',
        }}
        aria-hidden="true"
      >
        {/* Primary bright orbital star satellite */}
        <div
          className="absolute rounded-full"
          style={{
            width: '5px',
            height: '5px',
            top: '-2.5px',
            left: 'calc(50% - 2.5px)',
            background: '#ffffff',
            boxShadow:
              '0 0 8px 2px rgba(216, 180, 254, 0.95), 0 0 14px 4px rgba(168, 85, 247, 0.7)',
          }}
        />
        {/* Secondary subtle orbital stardust dot */}
        <div
          className="absolute rounded-full"
          style={{
            width: '3px',
            height: '3px',
            bottom: '-1.5px',
            left: 'calc(50% - 1.5px)',
            background: 'rgba(165, 243, 252, 0.85)',
            boxShadow: '0 0 6px 1px rgba(165, 243, 252, 0.75)',
          }}
        />
      </div>

      {/* Circular translucent glass badge housing the crown */}
      <div
        className="relative flex items-center justify-center rounded-full"
        style={{
          width: '56px',
          height: '56px',
          background:
            'radial-gradient(circle at 35% 30%, rgba(168, 85, 247, 0.22) 0%, rgba(14, 8, 38, 0.70) 100%)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(192, 132, 252, 0.36)',
          boxShadow:
            '0 6px 20px rgba(0, 0, 0, 0.45), 0 0 15px rgba(168, 85, 247, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.22)',
          padding: '10px',
        }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-7 h-7"
          style={{
            filter: 'drop-shadow(0 2px 8px rgba(168, 85, 247, 0.55))',
          }}
          aria-hidden="true"
        >
          <defs>
            <linearGradient
              id="ametCrownGradVite"
              x1="2"
              y1="3"
              x2="22"
              y2="21"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="40%" stopColor="#e9d5ff" />
              <stop offset="75%" stopColor="#c084fc" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>

          {/* Crown Base Band */}
          <path
            d="M3.5 19.5H20.5"
            stroke="url(#ametCrownGradVite)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />

          {/* Crown Peaks & Body */}
          <path
            d="M3.5 17L5 7.5L9 11.5L12 4.5L15 11.5L19 7.5L20.5 17H3.5Z"
            fill="url(#ametCrownGradVite)"
            fillOpacity="0.28"
            stroke="url(#ametCrownGradVite)"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Apex Jewels (Centered & uncropped) */}
          <circle cx="12" cy="4.5" r="1.3" fill="#ffffff" />
          <circle cx="5" cy="7.5" r="1.0" fill="#fef08a" />
          <circle cx="19" cy="7.5" r="1.0" fill="#fef08a" />

          {/* Center Gem */}
          <circle cx="12" cy="14" r="1.3" fill="#ffffff" fillOpacity="0.85" />
        </svg>
      </div>

      <style>{`
        @keyframes crownContinuousRotateVite {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        .ametheus-crown-orbit {
          animation: crownContinuousRotateVite 22s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .ametheus-crown-orbit {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  )
}
