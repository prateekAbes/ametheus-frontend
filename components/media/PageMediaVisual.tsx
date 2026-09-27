"use client";

import React, { useState, useEffect } from "react";
import { PageMediaConfig, getPageMedia } from "@/lib/api/media";

interface Props {
  pageId: string;
  className?: string;
  defaultMediaUrl?: string;
  defaultFallbackUrl?: string;
  defaultMediaType?: "gif" | "image";
  defaultOpacity?: number;
  maskGradient?: string;
  blendMode?: string;
  children?: React.ReactNode;
}

export default function PageMediaVisual({
  pageId,
  className = "",
  defaultMediaUrl,
  defaultFallbackUrl,
  defaultOpacity = 0.30,
  maskGradient = "radial-gradient(ellipse 70% 60% at 50% 45%, #000 25%, transparent 100%)",
  blendMode = "mix-blend-screen",
  children,
}: Props) {
  const [config, setConfig] = useState<PageMediaConfig | null>(null);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    getPageMedia(pageId)
      .then((cfg) => {
        if (isMounted && cfg) {
          setConfig(cfg);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [pageId]);

  const active = config ? config.is_active : true;
  if (!active) return null;

  const mediaUrl = config?.media_url || defaultMediaUrl;
  const fallbackUrl = config?.fallback_url || defaultFallbackUrl;
  const opacityVal = config?.opacity ?? defaultOpacity;

  if (!mediaUrl && !fallbackUrl) return null;

  const currentSrc = isError && fallbackUrl ? fallbackUrl : (mediaUrl || fallbackUrl);
  if (!currentSrc) return null;

  return (
    <div
      aria-hidden="true"
      style={{ WebkitMaskImage: maskGradient, maskImage: maskGradient }}
      className={`absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center z-0 ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={currentSrc}
        alt=""
        onError={() => setIsError(true)}
        style={{ opacity: opacityVal }}
        className={`w-full h-full object-cover object-center ${blendMode} scale-110 filter saturate-150 contrast-125 transition-opacity duration-1000`}
      />
      {children}
    </div>
  );
}
