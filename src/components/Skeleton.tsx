interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`animate-pulse bg-white/10 ${className}`} aria-hidden />
}

// Preset skeletons for common cards
export function GameCardSkeleton() {
  return (
    <div className="relative min-h-[220px] overflow-hidden border border-white/10 bg-surface/50 p-6 flex flex-col justify-between">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <Skeleton className="h-3 w-24 rounded" />
        <Skeleton className="h-4 w-12 rounded" />
      </div>
      <div className="space-y-3 py-5">
        <Skeleton className="h-8 w-3/4 rounded" />
        <Skeleton className="h-3 w-1/3 rounded" />
      </div>
      <div className="flex items-center justify-between border-t border-white/5 pt-4">
        <Skeleton className="h-3 w-20 rounded" />
        <Skeleton className="h-3 w-24 rounded" />
      </div>
    </div>
  )
}

export function TournamentCardSkeleton() {
  return (
    <div className="border border-white/10 bg-surface/30 p-6 aspect-[4/5] flex flex-col justify-between">
      <Skeleton className="h-4 w-1/3 rounded" />
      <div className="space-y-2">
        <Skeleton className="h-6 w-3/4 rounded" />
        <Skeleton className="h-4 w-1/2 rounded" />
      </div>
    </div>
  )
}

export function HeroSkeleton() {
  return (
    <div className="relative h-[100svh] min-h-[720px] overflow-hidden bg-void">
      <Skeleton className="absolute inset-0" />
    </div>
  )
}

export function ImageSkeleton({ className = '' }: { className?: string }) {
  return <Skeleton className={`${className}`} />
}

export function GallerySkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="aspect-video rounded" />
      ))}
    </div>
  )
}
