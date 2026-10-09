import React from 'react'
import { Link } from 'react-router'
import { LeaderboardEntry } from '../../services/leaderboard'
import { resolveMediaUrl } from '../../services/apiClient'
import DynamicImage from '../DynamicImage'
import { inr } from '../../lib/data'

interface PodiumColumnProps {
  entry: LeaderboardEntry
  rank: 1 | 2 | 3
  selectedCategory: string
  isCurrentUser?: boolean
  isDisqualified?: boolean
}

export function PodiumColumn({
  entry,
  rank,
  selectedCategory,
  isCurrentUser = false,
  isDisqualified = false,
}: PodiumColumnProps) {
  // Rank-specific color themes:
  // 1st: Elevated Gold Champion with Neon Emerald/Green cyber highlights (inspired by reference)
  // 2nd: Silver Runner-Up with Cyan/Platinum highlights
  // 3rd: Bronze 3rd Place with Amber/Copper highlights
  const isFirst = rank === 1
  const isSecond = rank === 2
  const isThird = rank === 3

  // Dimensions & heights based on rank (1st tallest, 2nd medium, 3rd lowest)
  const heightClasses = isFirst
    ? 'min-h-[290px] sm:min-h-[340px] md:min-h-[380px] lg:min-h-[420px]'
    : isSecond
    ? 'min-h-[230px] sm:min-h-[270px] md:min-h-[300px] lg:min-h-[340px]'
    : 'min-h-[190px] sm:min-h-[230px] md:min-h-[260px] lg:min-h-[290px]'

  const theme = isFirst
    ? {
        rankLabel: '#1',
        rankOrdinal: '01',
        badgeTitle: 'CHAMPION',
        accentColor: '#3dff9a', // Neon green
        accentGlow: 'rgba(61, 255, 154, 0.45)',
        borderClass: 'border-[#3dff9a]/60 hover:border-[#3dff9a]',
        bgGradient: 'from-[#3dff9a]/15 via-surface/95 to-void/98',
        topSurfaceBg: 'linear-gradient(180deg, rgba(61,255,154,0.18) 0%, rgba(13,18,24,0.95) 100%)',
        rimBorder: '#3dff9a',
        badgeBg: 'bg-[#3dff9a]/15 text-[#3dff9a] border-[#3dff9a]/40',
        textAccent: 'text-[#3dff9a]',
        glowShadow: 'shadow-[0_0_30px_rgba(61,255,154,0.22),0_20px_50px_rgba(0,0,0,0.85)]',
        statColor: 'text-[#3dff9a]',
        avatarRing: 'ring-2 ring-[#3dff9a] shadow-[0_0_20px_rgba(61,255,154,0.4)]',
      }
    : isSecond
    ? {
        rankLabel: '#2',
        rankOrdinal: '02',
        badgeTitle: 'RUNNER-UP',
        accentColor: '#cbd5e1', // Silver
        accentGlow: 'rgba(203, 213, 225, 0.35)',
        borderClass: 'border-slate-300/40 hover:border-slate-200',
        bgGradient: 'from-slate-300/10 via-surface/90 to-void/98',
        topSurfaceBg: 'linear-gradient(180deg, rgba(203,213,225,0.12) 0%, rgba(13,18,24,0.95) 100%)',
        rimBorder: '#cbd5e1',
        badgeBg: 'bg-slate-300/10 text-slate-200 border-slate-300/30',
        textAccent: 'text-slate-200',
        glowShadow: 'shadow-[0_0_22px_rgba(203,213,225,0.12),0_15px_35px_rgba(0,0,0,0.7)]',
        statColor: 'text-slate-100',
        avatarRing: 'ring-2 ring-slate-300 shadow-[0_0_16px_rgba(203,213,225,0.3)]',
      }
    : {
        rankLabel: '#3',
        rankOrdinal: '03',
        badgeTitle: '3RD PLACE',
        accentColor: '#f59e0b', // Bronze / Warm Amber
        accentGlow: 'rgba(245, 158, 11, 0.35)',
        borderClass: 'border-amber-600/40 hover:border-amber-500',
        bgGradient: 'from-amber-600/10 via-surface/90 to-void/98',
        topSurfaceBg: 'linear-gradient(180deg, rgba(217,119,6,0.12) 0%, rgba(13,18,24,0.95) 100%)',
        rimBorder: '#d97706',
        badgeBg: 'bg-amber-600/10 text-amber-300 border-amber-600/30',
        textAccent: 'text-amber-300',
        glowShadow: 'shadow-[0_0_20px_rgba(217,119,6,0.12),0_15px_35px_rgba(0,0,0,0.7)]',
        statColor: 'text-amber-200',
        avatarRing: 'ring-2 ring-amber-600 shadow-[0_0_16px_rgba(217,119,6,0.3)]',
      }

  // Format primary leaderboard metric according to selected category
  const renderPrimaryMetric = () => {
    switch (selectedCategory) {
      case 'win_rate':
        return {
          label: 'WIN RATE',
          value: `${entry.win_rate ?? 0}%`,
          sub: `${entry.wins ?? 0}W - ${entry.losses ?? 0}L`,
        }
      case 'earnings':
        return {
          label: 'TOTAL PRIZE',
          value: inr(Number(entry.earnings || 0)),
          sub: `${entry.matches_played ?? 0} matches`,
        }
      case 'wins':
        return {
          label: 'MATCH WINS',
          value: `${entry.wins ?? 0} W`,
          sub: `${entry.losses ?? 0} losses (${entry.win_rate ?? 0}%)`,
        }
      case 'matches_played':
        return {
          label: 'MATCHES',
          value: `${entry.matches_played ?? 0}`,
          sub: `${entry.wins ?? 0} victories`,
        }
      case 'overall':
      default:
        return {
          label: 'COMPETITIVE RATING',
          value: `${entry.rating ?? 1500} ELO`,
          sub: `${entry.win_rate ?? 0}% win rate`,
        }
    }
  }

  const primary = renderPrimaryMetric()
  const avatarUrl = resolveMediaUrl(entry.logo_url)
  const initial = (entry.name || 'C').charAt(0).toUpperCase()

  const avatarContent = avatarUrl ? (
    <DynamicImage
      src={avatarUrl}
      alt={`${entry.name} avatar`}
      className="size-full object-cover"
    />
  ) : (
    <div
      className={`flex size-full items-center justify-center font-display font-black text-ink ${
        isFirst ? 'text-3xl sm:text-4xl' : 'text-xl sm:text-2xl'
      }`}
      style={{
        background: `linear-gradient(135deg, ${theme.accentColor}22 0%, #12141d 100%)`,
      }}
    >
      {initial}
    </div>
  )

  return (
    <div
      className={`group relative flex flex-col items-center justify-end transition-all duration-500 ${
        isFirst ? 'z-20 md:-translate-y-4' : 'z-10'
      }`}
    >
      {/* ============================================================== */}
      {/* 1. PERCHED AVATAR ATOP THE 3D PLATFORM                         */}
      {/* ============================================================== */}
      <div className="relative mb-3 flex flex-col items-center select-none">
        {/* Player Avatar with Rank Rim & Cyber Accent */}
        <div className="relative z-20">
          {isCurrentUser ? (
            <Link
              to="/profile"
              title="View your profile"
              className={`relative block overflow-hidden bg-surface transition-transform duration-300 group-hover:scale-105 ${
                isFirst
                  ? 'size-18 sm:size-22 md:size-26'
                  : 'size-14 sm:size-18 md:size-20'
              } rounded-full ${theme.avatarRing}`}
            >
              {avatarContent}
            </Link>
          ) : (
            <div
              className={`relative overflow-hidden bg-surface transition-transform duration-300 group-hover:scale-105 ${
                isFirst
                  ? 'size-18 sm:size-22 md:size-26'
                  : 'size-14 sm:size-18 md:size-20'
              } rounded-full ${theme.avatarRing}`}
            >
              {avatarContent}
            </div>
          )}

          {/* Rank Badge attached to avatar */}
          <div
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full border px-2 py-0.5 font-mono text-[9px] sm:text-[10px] font-black uppercase tracking-wider backdrop-blur-md"
            style={{
              borderColor: theme.accentColor,
              backgroundColor: '#05060aee',
              color: theme.accentColor,
              boxShadow: `0 0 10px ${theme.accentGlow}`,
            }}
          >
            #{rank}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. THREE-DIMENSIONAL PERSPECTIVE PODIUM BODY */}
      {/* ============================================================== */}
      <div className="w-full flex flex-col relative">
        {/* TOP SURFACE: Perspective 3D Platform Face */}
        <div
          className="relative h-7 sm:h-9 md:h-11 w-full overflow-hidden border-t border-x"
          style={{
            background: theme.topSurfaceBg,
            borderColor: `${theme.accentColor}55`,
            clipPath: 'polygon(8% 0%, 92% 0%, 100% 100%, 0% 100%)',
          }}
          aria-hidden="true"
        >
          {/* Subtle isometric grid floor lines inside top face */}
          <div
            className="absolute inset-0 opacity-25"
            style={{
              backgroundImage: `linear-gradient(to right, ${theme.accentColor} 1px, transparent 1px), linear-gradient(to bottom, ${theme.accentColor} 1px, transparent 1px)`,
              backgroundSize: '16px 8px',
            }}
          />

          {/* Central neon glowing spot directly beneath avatar */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-16 rounded-full blur-sm opacity-60"
            style={{ background: theme.accentColor }}
          />

          {/* Neon front edge beam */}
          <div
            className="absolute bottom-0 inset-x-0 h-[2px]"
            style={{
              background: `linear-gradient(90deg, transparent, ${theme.accentColor}, transparent)`,
              boxShadow: `0 0 8px ${theme.accentColor}`,
            }}
          />
        </div>

        {/* FRONT FACE: Vertical Podium Pillar */}
        <div
          className={`relative flex flex-col justify-between border-x border-b bg-gradient-to-b ${
            theme.bgGradient
          } ${heightClasses} p-3 sm:p-4 md:p-5 transition-all duration-300 ${
            theme.borderClass
          } ${theme.glowShadow}`}
          style={{
            borderColor: `${theme.accentColor}66`,
          }}
        >
          {/* Cybernetic Grid Overlay on Front Face */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Top highlight line */}
          <div
            className="pointer-events-none absolute top-0 inset-x-0 h-px"
            style={{
              background: `linear-gradient(90deg, transparent, ${theme.accentColor}, transparent)`,
            }}
          />

          {/* Current User Ribbon Indicator */}
          {isCurrentUser && (
            <div className="absolute top-2 right-2 z-20">
              <span className="border border-cyan bg-cyan/20 text-cyan px-1.5 py-0.5 font-mono text-[8px] sm:text-[9px] font-bold uppercase tracking-wider">
                YOU
              </span>
            </div>
          )}

          {/* Disqualification Ribbon */}
          {isDisqualified && (
            <div className="absolute top-2 left-2 z-20">
              <span className="border border-live/80 bg-live/25 text-live px-1.5 py-0.5 font-mono text-[8px] sm:text-[9px] font-bold uppercase tracking-wider animate-pulse">
                DQ
              </span>
            </div>
          )}

          {/* FRONT TOP: Giant Cybernetic Rank Watermark & Contender Name */}
          <div className="relative z-10 text-center">
            {/* Massive Rank Cutout Badge */}
            <div className="flex items-center justify-center gap-1.5 leading-none">
              <span
                className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter opacity-90 drop-shadow-md select-none"
                style={{ color: theme.accentColor }}
              >
                {theme.rankLabel}
              </span>
            </div>

            {/* Tier / Title Badge */}
            <div className="mt-1 flex justify-center">
              <span
                className={`inline-block border px-2 py-0.5 font-mono text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-widest ${theme.badgeBg}`}
              >
                {theme.badgeTitle}
              </span>
            </div>

            {/* Contender Name & Tag */}
            <div className="mt-2 sm:mt-3">
              {isCurrentUser ? (
                <Link
                  to="/profile"
                  title="View your profile"
                  className="font-display text-xs sm:text-xl md:text-2xl lg:text-3xl font-black uppercase tracking-tight text-ink hover:text-[#3dff9a] transition-colors truncate block leading-tight"
                >
                  {entry.name}
                </Link>
              ) : (
                <h3
                  title={entry.name}
                  className="font-display text-xs sm:text-xl md:text-2xl lg:text-3xl font-black uppercase tracking-tight text-ink truncate leading-tight"
                >
                  {entry.name}
                </h3>
              )}
              <div className="mt-0.5 flex items-center justify-center gap-1 font-mono text-[9px] sm:text-xs">
                {entry.tag && (
                  <span className="font-bold shrink-0" style={{ color: theme.accentColor }}>
                    [{entry.tag}]
                  </span>
                )}
                <span className="text-white/20 select-none">·</span>
                <span className="text-dim truncate max-w-[60px] sm:max-w-[130px]">
                  {entry.game_name || entry.game_slug || 'Esports'}
                </span>
              </div>
              {entry.captain && (
                <p className="mt-0.5 font-mono text-[8px] sm:text-[10px] text-dim truncate">
                  Lead: <span className="text-ink font-semibold">{entry.captain}</span>
                </p>
              )}
            </div>
          </div>

          {/* FRONT BOTTOM: Primary Leaderboard Metric & Stat Matrix */}
          <div className="relative z-10 mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-white/10">
            {/* Primary Highlighted Metric */}
            <div
              className="rounded border p-1.5 sm:p-2.5 text-center transition-colors"
              style={{
                borderColor: `${theme.accentColor}33`,
                background: 'rgba(5, 6, 10, 0.75)',
              }}
            >
              <span className="block font-mono text-[7px] sm:text-[9px] uppercase tracking-wider text-dim">
                {primary.label}
              </span>
              <p
                className={`font-display text-sm sm:text-2xl md:text-3xl font-black tracking-tight ${theme.statColor} truncate mt-0.5`}
              >
                {primary.value}
              </p>
              <span className="block font-mono text-[8px] sm:text-[10px] text-dim truncate">
                {primary.sub}
              </span>
            </div>

            {/* Compact Secondary Metrics Grid (screens >= sm) */}
            <div className="mt-2 hidden sm:grid grid-cols-2 gap-1.5 font-mono text-[9px] sm:text-[10px] text-dim">
              <div className="bg-surface/50 border border-white/5 p-1 text-center rounded-xs overflow-hidden">
                <span className="block text-[8px] text-dim/70 uppercase truncate">Rating</span>
                <span className="font-bold text-ink truncate block">{entry.rating ?? 1500}</span>
              </div>
              <div className="bg-surface/50 border border-white/5 p-1 text-center rounded-xs overflow-hidden">
                <span className="block text-[8px] text-dim/70 uppercase truncate">Win Rate</span>
                <span className="font-bold text-ink truncate block">{entry.win_rate ?? 0}%</span>
              </div>
              <div className="bg-surface/50 border border-white/5 p-1 text-center rounded-xs overflow-hidden">
                <span className="block text-[8px] text-dim/70 uppercase truncate">W - L</span>
                <span className="font-bold text-ink truncate block">
                  <span className="text-ok">{entry.wins ?? 0}</span>-
                  <span className="text-rose-400">{entry.losses ?? 0}</span>
                </span>
              </div>
              <div className="bg-surface/50 border border-white/5 p-1 text-center rounded-xs overflow-hidden">
                <span className="block text-[8px] text-dim/70 uppercase truncate">Prize</span>
                <span className="font-bold text-ink truncate block">
                  {inr(Number(entry.earnings || 0))}
                </span>
              </div>
            </div>

            {/* Ultra-compact mobile summary row (< sm screens) */}
            <div className="mt-1.5 flex sm:hidden items-center justify-around bg-surface/60 border border-white/10 px-1 py-1 rounded-xs font-mono text-[8px] text-dim">
              <span><span className="text-ok font-bold">{entry.wins ?? 0}</span>W</span>
              <span className="text-white/20 select-none">·</span>
              <span><span className="text-ink font-bold">{entry.win_rate ?? 0}%</span> WR</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
