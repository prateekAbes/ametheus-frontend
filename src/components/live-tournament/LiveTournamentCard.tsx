import { useMemo } from 'react'
import { Link } from 'react-router'
import type { LiveTournamentItem } from './types'
import { Hud, Dot } from '../ui'
import { inr } from '../../lib/data'

interface LiveTournamentCardProps {
  tournament: LiveTournamentItem
  onSelect?: (tournament: LiveTournamentItem) => void
}

export function LiveTournamentCard({ tournament, onSelect }: LiveTournamentCardProps) {
  const isLive = tournament.lifecycleStatus === 'LIVE'
  const isCompleted = tournament.lifecycleStatus === 'COMPLETED'
  const isScheduled = tournament.lifecycleStatus === 'SCHEDULED'

  const formattedDate = useMemo(() => {
    const raw = tournament.startDate || tournament.startsAt
    if (!raw) return 'Schedule Pending'
    try {
      const d = new Date(raw)
      if (isNaN(d.getTime())) return 'Schedule Pending'
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    } catch {
      return 'Schedule Pending'
    }
  }, [tournament.startDate, tournament.startsAt])

  const detailUrl = `/live-tournaments/${tournament.slug || tournament.id}`

  return (
    <div
      className={`group relative flex flex-col justify-between border transition-all duration-300 ${
        isLive
          ? 'border-live/60 bg-surface shadow-[0_0_20px_rgba(255,59,48,0.12)] hover:border-live'
          : 'border-white/10 bg-surface/40 hover:border-white/30 hover:bg-surface/70'
      }`}
    >
      <div>
        {/* Card Header Media/Thumbnail */}
        <div className="relative aspect-[16/8] w-full overflow-hidden border-b border-white/10 bg-void">
          {tournament.bannerUrl || tournament.heroBannerUrl ? (
            <img
              src={tournament.bannerUrl || tournament.heroBannerUrl}
              alt={tournament.title}
              className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-white/[0.02]">
              <span className="font-display text-4xl font-black text-white/10">
                {tournament.gameName || 'ESPORTS'}
              </span>
            </div>
          )}

          {/* Top Status and Format Badges Overlay */}
          <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">
            {/* Status Pill */}
            {isLive ? (
              <span className="flex items-center gap-1.5 border border-live/80 bg-void/90 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-live backdrop-blur-sm">
                <Dot c="bg-live" pulse />
                LIVE NOW
              </span>
            ) : isCompleted ? (
              <span className="border border-white/20 bg-void/90 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-ok backdrop-blur-sm">
                ✓ COMPLETED
              </span>
            ) : (
              <span className="border border-white/20 bg-void/90 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-dim backdrop-blur-sm">
                SCHEDULED
              </span>
            )}

            {/* Competition Format Badge */}
            <span
              className={`border px-2.5 py-1 font-mono text-[10px] uppercase font-bold tracking-wider backdrop-blur-sm ${
                tournament.competitionFormat === 'BATTLE_ROYALE'
                  ? 'border-cyan/50 bg-void/90 text-cyan'
                  : 'border-magenta/50 bg-void/90 text-magenta'
              }`}
            >
              {tournament.competitionFormat === 'BATTLE_ROYALE' ? 'Battle Royale' : 'Knockout'}
            </span>
          </div>

          {/* Participant Format Bottom Pill */}
          <div className="absolute bottom-2 left-3">
            <span className="border border-white/20 bg-void/90 px-2 py-0.5 font-mono text-[10px] uppercase text-ink/80 backdrop-blur-sm">
              {tournament.participantFormat === 'SOLO' ? 'Solo Contenders' : 'Team (Squad)'}
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-5 space-y-4">
          <div>
            <Hud className="text-cyan text-[11px] truncate">{tournament.gameName}</Hud>
            <h3 className="mt-1 font-display text-xl font-black uppercase text-ink line-clamp-1 group-hover:text-cyan transition-colors">
              {tournament.title}
            </h3>
          </div>

          {/* Meta Specifications */}
          <div className="grid grid-cols-2 gap-2 border-t border-white/10 pt-3 text-xs font-mono">
            <div>
              <span className="block text-[10px] uppercase text-dim">Schedule</span>
              <span className="text-ink truncate block" title={formattedDate}>
                {formattedDate}
              </span>
            </div>
            <div>
              <span className="block text-[10px] uppercase text-dim">Contenders</span>
              <span className="text-ink truncate block">
                {tournament.registeredTeams} / {tournament.maxTeams} {tournament.participantFormat === 'SOLO' ? 'Players' : 'Teams'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Card Action Link */}
      <div className="border-t border-white/10 p-4 bg-void/40">
        <Link
          to={detailUrl}
          onClick={() => onSelect && onSelect(tournament)}
          className={`flex items-center justify-between w-full border px-4 py-2 font-mono text-xs uppercase tracking-wider transition-colors ${
            isLive
              ? 'border-live bg-live text-void font-bold hover:bg-live/90'
              : 'border-white/20 bg-surface text-ink hover:border-cyan hover:text-cyan'
          }`}
        >
          <span>{isLive ? 'Watch Live Center' : isCompleted ? 'View Final Results' : 'View Tournament Details'}</span>
          <span>→</span>
        </Link>
      </div>
    </div>
  )
}
