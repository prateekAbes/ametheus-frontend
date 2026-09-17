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
  const connectRef = useRef<() => void>(() => {});

  const connect = useCallback(() => {
    if (typeof window === "undefined") return;

    try {
      const url = getWsUrl();
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);

        // Keepalive ping every 25s
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping" }));
          }
        }, 25000);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const tickerItem: TickerEvent = {
            id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            event: data.event || "UNKNOWN",
            timestamp: new Date().toLocaleTimeString(),
            data: data.data || data,
          };
          setEvents((prev) => [tickerItem, ...prev.slice(0, 19)]);
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
          connectRef.current();
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
    connectRef.current = connect;
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
