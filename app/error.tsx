"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log telemetry to console
    console.error("Platform Runtime Error caught by error boundary:", error);
  }, [error]);

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center p-6 text-center bg-[#F8F9FF] dark:bg-[#0B0E16] text-[#0F172A] dark:text-white transition-colors">
      <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 mb-4">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <span className="text-xs font-mono font-bold text-rose-500 tracking-widest uppercase mb-1">
        ARENA TELEMETRY INTERRUPTED
      </span>
      <h1 className="text-2xl sm:text-3xl font-bold font-headline mb-3 text-[#0F172A] dark:text-white">
        Match Data Temporarily Unavailable
      </h1>
      <p className="text-sm text-[#64748B] dark:text-[#94A3B8] max-w-md mb-8">
        An unexpected error occurred while synchronizing platform state. Our anti-cheat and tournament monitors have logged the event.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => reset()}
          className="px-5 py-2.5 bg-[#E56A10] hover:bg-[#D45900] text-white text-xs font-mono font-bold uppercase rounded transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reload Arena</span>
        </button>
        <Link
          href="/"
          className="px-5 py-2.5 bg-white dark:bg-[#161A24] border border-[#CBD5E1] dark:border-[#242C3D] text-[#0F172A] dark:text-white text-xs font-mono font-bold uppercase rounded hover:bg-[#F1F3F5] dark:hover:bg-[#202534] transition-colors flex items-center gap-2"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Platform Home</span>
        </Link>
      </div>
    </div>
  );
}
