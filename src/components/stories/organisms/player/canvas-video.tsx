"use client";

import { useRef } from "react";
import { useVideoMesh } from "./hooks/use-video-mesh";
import { SR_ONLY } from "./utils/sr-only";
import type { CanvasVideoProps } from "./types";
import { usePlayerInternalCtx } from "./context/use-player-internal-ctx";

export function CanvasVideo({
  videoSrc,
  "aria-label": ariaLabel,
}: CanvasVideoProps) {
  const internal = usePlayerInternalCtx();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useVideoMesh(videoSrc, internal, videoRef);

  if (!internal) return null;

  return (
    <video
      ref={videoRef}
      crossOrigin="anonymous"
      playsInline
      preload="auto"
      src={videoSrc}
      aria-label={ariaLabel ?? "Video"}
      tabIndex={-1}
      style={SR_ONLY}
    />
  );
}

CanvasVideo.displayName = "CanvasVideo";
