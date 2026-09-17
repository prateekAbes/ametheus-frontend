import { useState, useEffect, useRef, useCallback } from "react";

export interface TickerEvent {
  event: "CONNECTED" | "MATCH_SCORE_SUBMITTED" | "MATCH_VERIFIED" | string;
  match_id?: string;
  tournament_id?: string;
  score?: string;
  winner_id?: string;
  message?: string;
  timestamp: string;
}

function getWsUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const wsProto = base.startsWith("https") ? "wss" : "ws";
  const host = base.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  return `${wsProto}://${host}/ws/ticker`;
}

export function useMatchTicker(onEvent?: (event: TickerEvent) => void) {
  const [isConnected, setIsConnected] = useState(false);
  const [events, setEvents] = useState<TickerEvent[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (typeof window === "undefined") return;

    try {
      const url = getWsUrl();
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        // Start keepalive ping every 25 seconds
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send("ping");
          }
        }, 25000);
      };

      ws.onmessage = (msgEvent) => {
        try {
          if (msgEvent.data === "pong") return;
          const parsed = JSON.parse(msgEvent.data);
          const tickerItem: TickerEvent = {
            ...parsed,
            timestamp: new Date().toLocaleTimeString(),
          };

          setEvents((prev) => [tickerItem, ...prev].slice(0, 10));
          if (onEvent) {
            onEvent(tickerItem);
          }
        } catch {
          // Ignore non-json frames
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        // Reconnect with 5 second delay
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 5000);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      // Reconnection handled by onclose
    }
  }, [onEvent]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return {
    isConnected,
    events,
    latestEvent: events[0] || null,
  };
}
