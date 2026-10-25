import { useMemo } from 'react'
import { Hud, Dot } from '../ui'

interface LiveBroadcastProps {
  streamUrl?: string | null
  title?: string
  isLive?: boolean
}

/**
 * Parses any incoming stream URL (YouTube Watch, YouTube Live, YouTube Embed, Twitch)
 * into a safe, valid embeddable iframe URL.
 * Returns null if the URL is missing, invalid, or unconfigured.
 */
export function getEmbedStreamUrl(rawUrl?: string | null): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null
  const trimmed = rawUrl.trim()
  if (!trimmed) return null

  try {
    // 1. YouTube Live or Watch URL
    // Examples: https://www.youtube.com/watch?v=VIDEO_ID
    //           https://youtu.be/VIDEO_ID
    //           https://www.youtube.com/live/VIDEO_ID
    //           https://www.youtube.com/embed/VIDEO_ID
    const ytMatch = trimmed.match(
      /(?:youtube\.com\/(?:watch\?v=|live\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    )
    if (ytMatch && ytMatch[1]) {
      return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=0&rel=0`
    }

    // 2. Twitch Stream
    // Example: https://www.twitch.tv/CHANNEL_NAME
    const twitchMatch = trimmed.match(/twitch\.tv\/([a-zA-Z0-9_]{3,25})/)
    if (twitchMatch && twitchMatch[1]) {
      const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
      return `https://player.twitch.tv/?channel=${twitchMatch[1]}&parent=${hostname}&autoplay=false`
    }

    // 3. Direct embed iframe URL (must be valid HTTPS)
    if (trimmed.startsWith('https://')) {
      return trimmed
    }
  } catch {
    return null
  }

  return null
}

export function LiveBroadcast({ streamUrl, title, isLive }: LiveBroadcastProps) {
  const embedUrl = useMemo(() => getEmbedStreamUrl(streamUrl), [streamUrl])

  // If no broadcast is configured, NEVER render a broken or fabricated player
  if (!embedUrl) {
    return null
  }

  return (
    <section className="border border-white/10 bg-surface/50 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2.5">
          {isLive ? (
            <>
              <Dot c="bg-live" pulse />
              <Hud className="text-live font-bold">OFFICIAL LIVE STREAM</Hud>
            </>
          ) : (
            <>
              <Dot c="bg-cyan" />
              <Hud className="text-cyan">OFFICIAL BROADCAST</Hud>
            </>
          )}
          {title && (
            <span className="hidden font-mono text-xs text-dim sm:inline truncate max-w-md">
              — {title}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase text-dim tracking-wider border border-white/10 px-2 py-0.5">
            Embed Broadcast Feed
          </span>
        </div>
      </div>

      <div className="relative mt-4 aspect-video w-full overflow-hidden border border-white/10 bg-void">
        <iframe
          src={embedUrl}
          title={title || 'Tournament Live Broadcast'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 size-full border-0"
        />
      </div>
    </section>
  )
}
