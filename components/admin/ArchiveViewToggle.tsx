'use client';

import React from "react";
import { Archive, Inbox, Filter, History, AlertCircle } from "lucide-react";

interface ArchiveViewToggleProps {
  activeView: "active" | "archived";
  onViewChange: (view: "active" | "archived") => void;
  activeCount?: number;
  archivedCount?: number;
  sectionName: string;
  onOpenArchiveModal: () => void;
  disabled?: boolean;
}

export const ArchiveViewToggle: React.FC<ArchiveViewToggleProps> = ({
  activeView,
  onViewChange,
  activeCount,
  archivedCount,
  sectionName,
  onOpenArchiveModal,
  disabled = false,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/80 border border-slate-800 rounded-xl mb-4">
      {/* Segmented active/archived toggle */}
      <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
        <button
          type="button"
          onClick={() => onViewChange("active")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold tracking-wider uppercase transition-all duration-200 ${
            activeView === "active"
              ? "bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md shadow-orange-950/40"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
          }`}
        >
          <Inbox className="w-3.5 h-3.5" />
          <span>Active</span>
          {typeof activeCount === "number" && (
            <span
              className={`ml-1 px-1.5 py-0.2 rounded text-[10px] ${
                activeView === "active"
                  ? "bg-black/30 text-white"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              {activeCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => onViewChange("archived")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold tracking-wider uppercase transition-all duration-200 ${
            activeView === "archived"
              ? "bg-amber-600/90 text-white shadow-md shadow-amber-950/40"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
          }`}
        >
          <Archive className="w-3.5 h-3.5" />
          <span>Archived</span>
          {typeof archivedCount === "number" && (
            <span
              className={`ml-1 px-1.5 py-0.2 rounded text-[10px] ${
                activeView === "archived"
                  ? "bg-black/30 text-white"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              {archivedCount}
            </span>
          )}
        </button>
      </div>

      {/* Action and context status */}
      <div className="flex items-center gap-3">
        {activeView === "archived" ? (
          <div className="flex items-center gap-2 text-xs text-amber-400/90 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
            <History className="w-3.5 h-3.5" />
            <span>Viewing historical / archived {sectionName.toLowerCase()}</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenArchiveModal}
            disabled={disabled}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/90 hover:bg-amber-500/10 hover:border-amber-500/40 hover:text-amber-400 text-slate-300 text-xs font-medium rounded-lg border border-slate-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
            title={`Open Cleanup & Archival Filters for ${sectionName}`}
          >
            <Filter className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-400" />
            <span>Clear / Archive {sectionName}</span>
          </button>
        )}
      </div>
    </div>
  );
};
