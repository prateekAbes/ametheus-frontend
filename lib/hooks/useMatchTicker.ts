import { useState, useEffect, useRef, useCallback } from "react";

export interface TickerEvent {
  id?: string;
  event: "CONNECTED" | "MATCH_SCORE_SUBMITTED" | "MATCH_VERIFIED" | string;
  match_id?: string;
  tournament_id?: string;
  score?: string;
  winner_id?: string;
  message?: string;
  timestamp: string;
  data?: unknown;
}

const MAX_RECONNECT_ATTEMPTS = 5;

function getWsUrl(useApiPrefix = false): string {
  const base = process.env.NEXT_PUBLIC_API_URL || "https://ametheus.duckdns.org";
  const wsProto = base.startsWith("https") ? "wss" : "ws";
  const host = base.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  return useApiPrefix
    ? `${wsProto}://${host}/api/v1/ws/ticker`
    : `${wsProto}://${host}/ws/ticker`;
}

export function useMatchTicker(onEvent?: (event: TickerEvent) => void) {
  const [isConnected, setIsConnected] = useState(false);
  const [events, setEvents] = useState<TickerEvent[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const tryPrefixRef = useRef(false);
  const isDestroyedRef = useRef(false);
  const connectRef = useRef<() => void>(() => {});

  const connect = useCallback(() => {
    if (typeof window === "undefined" || isDestroyedRef.current) return;

    if (retryCountRef.current >= MAX_RECONNECT_ATTEMPTS) {
      // Reached maximum retry budget — cleanly stop to avoid infinite spamming
      return;
    }

    try {
      const url = getWsUrl(tryPrefixRef.current);
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        retryCountRef.current = 0; // reset on successful connection
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);

        // Keepalive ping every 25s
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send("ping");
          }
        }, 25000);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const tickerItem: TickerEvent = {
            id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            event: data.event || data.type || "UNKNOWN",
            timestamp: new Date().toLocaleTimeString(),
            data: data.data || data,
          };
          setEvents((prev) => [tickerItem, ...prev.slice(0, 19)]);
          if (onEvent) {
            onEvent(tickerItem);
          }
        } catch {
          // Ignore non-json frames (e.g. "pong")
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);

        if (isDestroyedRef.current) return;

        retryCountRef.current += 1;
        if (retryCountRef.current < MAX_RECONNECT_ATTEMPTS) {
          // Alternate prefix attempt
          tryPrefixRef.current = !tryPrefixRef.current;
          // Exponential backoff: 1s, 2s, 4s, 8s, 16s
          const delay = Math.min(1000 * Math.pow(2, retryCountRef.current - 1), 16000);
          reconnectTimeoutRef.current = setTimeout(() => {
            connectRef.current();
          }, delay);
        }
      };

      ws.onerror = () => {
        // Will trigger onclose automatically
        try {
          ws.close();
        } catch {
          // ignore
        }
      };
    } catch {
      // Fallback handled by max retry limit
    }
  }, [onEvent]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  useEffect(() => {
    isDestroyedRef.current = false;
    retryCountRef.current = 0;
    connect();

    return () => {
      isDestroyedRef.current = true;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch {
          // ignore
        }
      }
    };
  }, [connect]);

  return {
    isConnected,
    events,
    latestEvent: events[0] || null,
  };
}
