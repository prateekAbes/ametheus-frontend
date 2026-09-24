"use client";

import React from "react";
import { TickerEvent } from "@/lib/hooks/useMatchTicker";
import { Radio, ShieldCheck, Zap } from "lucide-react";

interface Props {
  isConnected: boolean;
  events: TickerEvent[];
  latestEvent: TickerEvent | null;
}

export default function LiveTickerBar({ isConnected, latestEvent }: Props) {
  return (
    <div className="w-full bg-[#0B0E16] border-y border-[#242C3D] py-2.5 px-4">
      <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#161A24] border border-[#242C3D]">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
              }`}
            />
            <span className="font-mono text-[11px] text-[#94A3B8] uppercase font-bold">
              {isConnected ? "WEBSOCKET TELEMETRY: LIVE" : "TELEMETRY: CONNECTING..."}
            </span>
          </div>

          <span className="hidden md:inline-block text-[#565E74] font-mono">•</span>
          <span className="hidden md:inline-block text-[#94A3B8] font-mono text-[11px]">
            Real-time Bracket & Match Results
          </span>
        </div>

        <div className="flex items-center gap-3 overflow-hidden text-ellipsis whitespace-nowrap">
          {latestEvent && latestEvent.event !== "CONNECTED" ? (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-300">
              {latestEvent.event === "MATCH_VERIFIED" ? (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <Zap className="w-3.5 h-3.5 text-[#E56A10] shrink-0" />
              )}
              <span className="font-mono text-white text-[11px]">
                {latestEvent.event === "MATCH_SCORE_SUBMITTED" && (
                  <>
                    <strong className="text-[#E56A10]">SCORE SUBMITTED:</strong> Match {latestEvent.match_id?.slice(0, 8)}... (Score: {latestEvent.score})
                  </>
                )}
                {latestEvent.event === "MATCH_VERIFIED" && (
                  <>
                    <strong className="text-emerald-400">MATCH VERIFIED:</strong> Match {latestEvent.match_id?.slice(0, 8)}... Winner Confirmed
                  </>
                )}
              </span>
              <span className="text-[10px] text-[#565E74] font-mono">[{latestEvent.timestamp}]</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[#94A3B8] font-mono text-[11px]">
              <Radio className="w-3 h-3 text-[#E56A10] animate-pulse" />
              <span>Listening for live tournament matches and bracket advances...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
