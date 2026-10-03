import { useState, useEffect, useRef, useCallback } from 'react'
import { API_BASE_URL } from '../services/apiClient'

export interface TickerEvent {
  id?: string
  event: 'CONNECTED' | 'MATCH_SCORE_SUBMITTED' | 'MATCH_VERIFIED' | string
  match_id?: string
  tournament_id?: string
  score?: string
  winner_id?: string
  message?: string
  timestamp: string
  data?: unknown
}

const MAX_RECONNECT_ATTEMPTS = 5

function getWsUrl(useApiPrefix = false): string {
  const wsProto = API_BASE_URL.startsWith('https') ? 'wss' : 'ws'
  const host = API_BASE_URL.replace(/^https?:\/\//, '').replace(/\/+$/, '')
  return useApiPrefix
    ? `${wsProto}://${host}/api/v1/ws/ticker`
    : `${wsProto}://${host}/ws/ticker`
}

export function useMatchTicker(onEvent?: (event: TickerEvent) => void) {
  const [isConnected, setIsConnected] = useState(false)
  const [events, setEvents] = useState<TickerEvent[]>([])
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<any>(null)
  const pingIntervalRef = useRef<any>(null)
  const retryCountRef = useRef(0)
  const tryPrefixRef = useRef(false)
  const isDestroyedRef = useRef(false)
  const connectRef = useRef<() => void>(() => {})

  const connect = useCallback(() => {
    if (typeof window === 'undefined' || isDestroyedRef.current) return

    if (retryCountRef.current >= MAX_RECONNECT_ATTEMPTS) {
      return
    }

    try {
      const url = getWsUrl(tryPrefixRef.current)
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        setIsConnected(true)
        retryCountRef.current = 0
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)

        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send('ping')
          }
        }, 25000)
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          const tickerItem: TickerEvent = {
            id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            event: data.event || data.type || 'UNKNOWN',
            match_id: data.match_id,
            tournament_id: data.tournament_id,
            score: data.score || (data.score_a !== undefined ? `${data.score_a} - ${data.score_b}` : undefined),
            winner_id: data.winner_id || data.winner_team_id,
            timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            data: data.data || data,
          }
          setEvents((prev) => [tickerItem, ...prev.slice(0, 19)])
          if (onEvent) {
            onEvent(tickerItem)
          }
        } catch {
          // Ignore non-json frames
        }
      }

      ws.onclose = () => {
        setIsConnected(false)
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current)

        if (isDestroyedRef.current) return

        retryCountRef.current += 1
        if (retryCountRef.current < MAX_RECONNECT_ATTEMPTS) {
          tryPrefixRef.current = !tryPrefixRef.current
          const delay = Math.min(1000 * Math.pow(2, retryCountRef.current - 1), 16000)
          reconnectTimeoutRef.current = setTimeout(() => {
            connectRef.current()
          }, delay)
        }
      }

      ws.onerror = () => {
        // Handled by onclose
      }
    } catch {
      // Ignored
    }
  }, [onEvent])

  useEffect(() => {
    connectRef.current = connect
  }, [connect])

  useEffect(() => {
    isDestroyedRef.current = false
    connect()

    return () => {
      isDestroyedRef.current = true
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current)
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [connect])

  return {
    isConnected,
    events,
    latestEvent: events[0] || null,
  }
}
