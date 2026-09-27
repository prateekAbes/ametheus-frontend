"use client";

import React, { useState, useEffect } from "react";
import {
  getAllPageMedia,
  updatePageMedia,
  uploadImageFile,
  PageMediaConfig,
} from "@/lib/api/media";
import {
  Sparkles,
  Upload,
  Image as ImageIcon,
  Film,
  Check,
  Save,
  RefreshCw,
  Eye,
  Sliders,
  AlertCircle,
  Plus,
} from "lucide-react";

const STANDARD_PAGES = [
  { id: "home", title: "Homepage Hero", desc: "Main hero background behind 'ENTER THE COMPETITION'" },
  { id: "tournaments", title: "Tournaments Hub", desc: "Top header background on /tournaments" },
  { id: "tournament_detail", title: "Tournament Arena", desc: "Header background on tournament detail hubs" },
  { id: "matches", title: "Live Matches & Schedules", desc: "Header background on /matches live hub" },
  { id: "teams", title: "Teams & Squads Hub", desc: "Header background on /teams squad roster hub" },
  { id: "leaderboard", title: "Global Leaderboard", desc: "Header background on /leaderboard hall of fame" },
];

export default function AdminPageMediaManager() {
  const [configs, setConfigs] = useState<PageMediaConfig[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string>("home");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form editing state
  const [mediaType, setMediaType] = useState<"gif" | "image">("gif");
  const [mediaUrl, setMediaUrl] = useState("");
  const [fallbackUrl, setFallbackUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [opacity, setOpacity] = useState(0.35);
  const [pageTitle, setPageTitle] = useState("");
  const [isUploadingPrimary, setIsUploadingPrimary] = useState(false);
  const [isUploadingFallback, setIsUploadingFallback] = useState(false);

  // Custom page creation
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);
  const [customPageId, setCustomPageId] = useState("");
  const [customPageTitle, setCustomPageTitle] = useState("");

  const loadAllConfigs = async () => {
    setIsLoading(true);
    try {
      const data = await getAllPageMedia();
      setConfigs(data);
    } catch {
      setStatusMsg({ type: "error", text: "Failed to load page visual configurations from backend." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllConfigs();
  }, []);

  // Sync form when selected page changes or configs load
  useEffect(() => {
    const activeCfg = configs.find((c) => c.page_id === selectedPageId);
    if (activeCfg) {
      setMediaType(activeCfg.media_type || "gif");
      setMediaUrl(activeCfg.media_url || "");
      setFallbackUrl(activeCfg.fallback_url || "");
      setIsActive(activeCfg.is_active !== undefined ? activeCfg.is_active : true);
      setOpacity(activeCfg.opacity !== undefined ? activeCfg.opacity : 0.35);
      setPageTitle(activeCfg.title || selectedPageId);
    } else {
      const std = STANDARD_PAGES.find((p) => p.id === selectedPageId);
      setPageTitle(std?.title || selectedPageId);
      setMediaType("gif");
      setMediaUrl("");
      setFallbackUrl("");
      setIsActive(true);
      setOpacity(0.35);
    }
  }, [selectedPageId, configs]);

  const handleFileUpload = async (file: File, isFallback: boolean) => {
    if (isFallback) {
      setIsUploadingFallback(true);
    } else {
      setIsUploadingPrimary(true);
    }

    try {
      const result = await uploadImageFile(file);
      if (result.url) {
        if (isFallback) {
          setFallbackUrl(result.url);
          setStatusMsg({ type: "success", text: `Fallback image "${file.name}" uploaded successfully.` });
        } else {
          setMediaUrl(result.url);
          if (file.name.toLowerCase().endsWith(".gif") || file.type.includes("gif")) {
            setMediaType("gif");
          } else {
            setMediaType("image");
          }
          setStatusMsg({ type: "success", text: `Primary visual "${file.name}" uploaded successfully.` });
        }
      }
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err?.message || "File upload failed" });
    } finally {
      if (isFallback) {
        setIsUploadingFallback(false);
      } else {
        setIsUploadingPrimary(false);
      }
      setTimeout(() => setStatusMsg(null), 4000);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaUrl.trim() && isActive) {
      setStatusMsg({ type: "error", text: "Please provide a valid media URL or upload an asset." });
      return;
    }

    setIsSaving(true);
    try {
      const updated = await updatePageMedia(selectedPageId, {
        page_id: selectedPageId,
        title: pageTitle,
        media_type: mediaType,
        media_url: mediaUrl.trim(),
        fallback_url: fallbackUrl.trim() || undefined,
        is_active: isActive,
        opacity: Number(opacity),
      });

      setStatusMsg({
        type: "success",
        text: `Visual configuration for "${pageTitle || selectedPageId}" saved and activated!`,
      });
      await loadAllConfigs();
    } catch (err: any) {
      setStatusMsg({
        type: "error",
        text: err?.message || "Failed to save configuration to backend.",
      });
    } finally {
      setIsSaving(false);
      setTimeout(() => setStatusMsg(null), 5000);
    }
  };

  const handleCreateCustomPage = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = customPageId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "_");
    if (!cleanId) return;

    setSelectedPageId(cleanId);
    setPageTitle(customPageTitle.trim() || cleanId);
    setIsCreatingCustom(false);
    setCustomPageId("");
    setCustomPageTitle("");
  };

  return (
    <div className="space-y-8 text-slate-100">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-[#121622] border border-[#242C3D] rounded-2xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1A2234] border border-[#242C3D] rounded text-[#E56A10] font-mono text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Dynamic Visual Media Engine
          </div>
          <h2 className="text-xl md:text-2xl font-bold font-headline text-white uppercase tracking-tight">
            Page Visuals &amp; Hero Media Control
          </h2>
          <p className="text-sm text-[#94A3B8] max-w-2xl mt-1">
            Configure dynamic animated GIFs or static images for the Homepage Hero and major platform pages.
            Changes take effect immediately across the live website without source code modifications.
          </p>
        </div>
        <button
          onClick={loadAllConfigs}
          disabled={isLoading}
          className="px-4 py-2 bg-[#1A2234] hover:bg-[#232D42] border border-[#242C3D] rounded-lg text-xs font-mono font-bold uppercase text-[#CBD5E1] flex items-center gap-2 transition-all cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[#E56A10]" : ""}`} />
          <span>Refresh Configs</span>
        </button>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-sm font-sans animate-in fade-in duration-300 ${
            statusMsg.type === "success"
              ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
              : "bg-red-950/40 border-red-500/40 text-red-300"
          }`}
        >
          {statusMsg.type === "success" ? (
            <Check className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Main Grid: Left = Page selector, Right = Editor & Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Target Page Selection */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#121622] border border-[#242C3D] rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-[#242C3D]">
              <span className="text-xs font-mono font-bold uppercase text-[#94A3B8] tracking-wider">
                Select Platform Page
              </span>
              <button
                type="button"
                onClick={() => setIsCreatingCustom(!isCreatingCustom)}
                className="text-[11px] font-mono font-bold text-[#E56A10] hover:text-[#FF8433] flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Page
              </button>
            </div>

            {isCreatingCustom && (
              <form onSubmit={handleCreateCustomPage} className="p-3 bg-[#1A2234] border border-[#E56A10]/40 rounded-xl space-y-2 mb-3">
                <div className="text-xs font-bold text-white uppercase font-mono">Add Custom Page</div>
                <input
                  type="text"
                  placeholder="page_slug (e.g. games, rules)"
                  value={customPageId}
                  onChange={(e) => setCustomPageId(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#0B0E16] border border-[#242C3D] rounded text-xs text-white font-mono"
                  required
                />
                <input
                  type="text"
                  placeholder="Page Title (e.g. Games Hub)"
                  value={customPageTitle}
                  onChange={(e) => setCustomPageTitle(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#0B0E16] border border-[#242C3D] rounded text-xs text-white"
                />
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsCreatingCustom(false)}
                    className="px-2.5 py-1 text-xs text-[#94A3B8] hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 bg-[#E56A10] text-white text-xs font-bold font-mono uppercase rounded"
                  >
                    Add
                  </button>
                </div>
              </form>
            )}

            {/* Standard and configured pages list */}
            <div className="space-y-2">
              {STANDARD_PAGES.map((page) => {
                const cfg = configs.find((c) => c.page_id === page.id);
                const isSelected = selectedPageId === page.id;
                const isCurrentActive = cfg ? cfg.is_active : true;

                return (
                  <button
                    key={page.id}
                    onClick={() => setSelectedPageId(page.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? "bg-[#1A2234] border-[#E56A10] shadow-md shadow-[#E56A10]/10"
                        : "bg-[#0B0E16]/60 border-[#242C3D] hover:bg-[#1A2234]/70 hover:border-[#38435C]"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold truncate ${isSelected ? "text-[#E56A10]" : "text-white"}`}>
                          {page.title}
                        </span>
                        {cfg?.media_type === "gif" ? (
                          <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded text-[10px] font-mono uppercase">
                            GIF
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded text-[10px] font-mono uppercase">
                            IMG
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#94A3B8] truncate mt-0.5">
                        {page.desc}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isCurrentActive ? "bg-emerald-400 animate-pulse" : "bg-slate-600"
                        }`}
                        title={isCurrentActive ? "Active" : "Inactive"}
                      />
                    </div>
                  </button>
                );
              })}

              {/* Any additional custom pages in configs */}
              {configs
                .filter((c) => !STANDARD_PAGES.some((p) => p.id === c.page_id))
                .map((cfg) => {
                  const isSelected = selectedPageId === cfg.page_id;
                  return (
                    <button
                      key={cfg.page_id}
                      onClick={() => setSelectedPageId(cfg.page_id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? "bg-[#1A2234] border-[#E56A10] shadow-md shadow-[#E56A10]/10"
                          : "bg-[#0B0E16]/60 border-[#242C3D] hover:bg-[#1A2234]/70 hover:border-[#38435C]"
                      }`}
                    >
                      <div className="min-w-0">
                        <span className={`text-sm font-bold truncate ${isSelected ? "text-[#E56A10]" : "text-white"}`}>
                          {cfg.title || cfg.page_id}
                        </span>
                        <div className="text-[11px] text-[#94A3B8] font-mono">
                          /{cfg.page_id}
                        </div>
                      </div>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          cfg.is_active ? "bg-emerald-400" : "bg-slate-600"
                        }`}
                      />
                    </button>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Right Column: Visual Media Configuration Form & Live Preview */}
        <div className="lg:col-span-8 space-y-6">
          <form onSubmit={handleSave} className="bg-[#121622] border border-[#242C3D] rounded-2xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#242C3D]">
              <div>
                <span className="text-xs font-mono font-bold uppercase text-[#E56A10] tracking-wider">
                  Configuring Target:
                </span>
                <h3 className="text-xl font-bold font-headline text-white mt-0.5">
                  {pageTitle || selectedPageId}
                </h3>
              </div>

              {/* Active Toggle Switch */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono uppercase text-[#94A3B8]">
                  Status:
                </span>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold uppercase flex items-center gap-1.5 transition-all cursor-pointer ${
                    isActive
                      ? "bg-emerald-950/60 border-emerald-500/60 text-emerald-300"
                      : "bg-slate-900 border-slate-700 text-slate-400"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isActive ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
                  <span>{isActive ? "Media Active" : "Disabled (Off)"}</span>
                </button>
              </div>
            </div>

            {/* Media Type Selector */}
            <div>
              <label className="block text-xs font-mono uppercase font-bold text-[#CBD5E1] mb-2">
                1. Select Visual Media Format
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setMediaType("gif")}
                  className={`p-4 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                    mediaType === "gif"
                      ? "bg-[#1A2234] border-[#E56A10] text-white shadow-sm"
                      : "bg-[#0B0E16] border-[#242C3D] text-[#94A3B8] hover:text-white hover:border-[#38435C]"
                  }`}
                >
                  <Film className={`w-5 h-5 ${mediaType === "gif" ? "text-[#E56A10]" : "text-[#64748B]"}`} />
                  <div className="text-left">
                    <div className="text-sm font-bold">Animated GIF</div>
                    <div className="text-[11px] text-[#94A3B8]">Smooth looped texture/motion</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setMediaType("image")}
                  className={`p-4 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                    mediaType === "image"
                      ? "bg-[#1A2234] border-[#E56A10] text-white shadow-sm"
                      : "bg-[#0B0E16] border-[#242C3D] text-[#94A3B8] hover:text-white hover:border-[#38435C]"
                  }`}
                >
                  <ImageIcon className={`w-5 h-5 ${mediaType === "image" ? "text-[#E56A10]" : "text-[#64748B]"}`} />
                  <div className="text-left">
                    <div className="text-sm font-bold">Static Image</div>
                    <div className="text-[11px] text-[#94A3B8]">High-res backdrop visual</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Primary Media URL & File Upload */}
            <div className="space-y-3">
              <label className="block text-xs font-mono uppercase font-bold text-[#CBD5E1]">
                2. Primary Media Asset ({mediaType === "gif" ? "GIF URL or Upload" : "Image URL or Upload"})
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="url"
                  placeholder={
                    mediaType === "gif"
                      ? "https://media.giphy.com/... or /api/v1/media/..."
                      : "https://images.unsplash.com/... or /api/v1/media/..."
                  }
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-[#0B0E16] border border-[#242C3D] focus:border-[#E56A10] rounded-xl text-xs font-mono text-white placeholder-[#64748B] outline-none"
                  required={isActive}
                />

                {/* Upload Button */}
                <label className="px-4 py-2.5 bg-[#1A2234] hover:bg-[#242D44] border border-[#242C3D] hover:border-[#E56A10] rounded-xl text-xs font-mono font-bold uppercase text-white flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0">
                  <Upload className={`w-4 h-4 ${isUploadingPrimary ? "animate-bounce text-[#E56A10]" : "text-[#CBD5E1]"}`} />
                  <span>{isUploadingPrimary ? "Uploading..." : "Upload File"}</span>
                  <input
                    type="file"
                    accept="image/*,.gif"
                    className="hidden"
                    disabled={isUploadingPrimary}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, false);
                    }}
                  />
                </label>
              </div>
            </div>

            {/* Static Fallback Asset (Essential when primary is a GIF) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-mono uppercase font-bold text-[#CBD5E1]">
                  3. Static Fallback Image (Recommended for GIFs)
                </label>
                <span className="text-[11px] text-[#94A3B8]">
                  Used if GIF fails to load or during poor network
                </span>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/... (optional fallback)"
                  value={fallbackUrl}
                  onChange={(e) => setFallbackUrl(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-[#0B0E16] border border-[#242C3D] focus:border-[#E56A10] rounded-xl text-xs font-mono text-white placeholder-[#64748B] outline-none"
                />

                <label className="px-4 py-2.5 bg-[#1A2234] hover:bg-[#242D44] border border-[#242C3D] hover:border-[#E56A10] rounded-xl text-xs font-mono font-bold uppercase text-white flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0">
                  <Upload className={`w-4 h-4 ${isUploadingFallback ? "animate-bounce text-[#E56A10]" : "text-[#CBD5E1]"}`} />
                  <span>{isUploadingFallback ? "Uploading..." : "Upload Fallback"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={isUploadingFallback}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, true);
                    }}
                  />
                </label>
              </div>
            </div>

            {/* Opacity Tuning Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-mono uppercase font-bold text-[#CBD5E1] flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[#E56A10]" />
                  <span>4. Background Blending Opacity</span>
                </label>
                <span className="text-xs font-mono font-bold text-[#E56A10]">
                  {Math.round(opacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.10"
                max="0.80"
                step="0.05"
                value={opacity}
                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-[#0B0E16] rounded-lg appearance-none cursor-pointer accent-[#E56A10]"
              />
              <div className="flex justify-between text-[10px] font-mono text-[#64748B]">
                <span>10% (Subtle ambient)</span>
                <span>35-45% (Recommended for hero text)</span>
                <span>80% (Prominent)</span>
              </div>
            </div>

            {/* Live Interactive Preview Box */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-[#94A3B8]">
                <Eye className="w-3.5 h-3.5 text-[#E56A10]" />
                <span>Live Blended Background Preview</span>
              </div>
              <div className="relative w-full h-44 rounded-xl overflow-hidden bg-[#0B0E16] border border-[#242C3D] flex items-center justify-center p-4">
                {/* Simulated background texture */}
                {mediaUrl ? (
                  <div
                    aria-hidden="true"
                    style={{
                      WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 50%, #000 25%, transparent 100%)",
                      maskImage: "radial-gradient(ellipse 70% 60% at 50% 50%, #000 25%, transparent 100%)",
                    }}
                    className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={mediaUrl}
                      alt="Preview"
                      style={{ opacity: opacity }}
                      className="w-full h-full object-cover object-center mix-blend-screen scale-110 filter saturate-150 contrast-125"
                      onError={(e) => {
                        if (fallbackUrl) {
                          (e.target as HTMLImageElement).src = fallbackUrl;
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className="text-xs font-mono text-[#64748B]">
                    No visual media URL entered. Enter a URL or upload a file above.
                  </div>
                )}

                {/* Simulated foreground text to verify readability */}
                <div className="relative z-10 text-center space-y-1">
                  <div className="text-lg md:text-xl font-bold font-headline text-white drop-shadow-md uppercase tracking-tight">
                    {pageTitle || "Page Title Preview"}
                  </div>
                  <div className="text-xs text-[#CBD5E1] drop-shadow-xs max-w-sm mx-auto">
                    Verified foreground contrast test over blended atmospheric texture.
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#242C3D]">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-3 bg-[#E56A10] hover:bg-[#C95B0A] text-white font-bold text-xs font-mono uppercase tracking-wider rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-[#E56A10]/20 hover:shadow-[#E56A10]/40 cursor-pointer disabled:opacity-50"
              >
                <Save className={`w-4 h-4 ${isSaving ? "animate-spin" : ""}`} />
                <span>{isSaving ? "Saving Configuration..." : "Save & Activate Media"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
