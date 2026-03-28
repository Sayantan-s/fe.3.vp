"use client";

import { useRef, use } from "react";
import { PlayerInternalContext } from "./context";
import { useVideoMesh } from "./hooks/use-video-mesh";
import type { CanvasVideoProps } from "./types";

export function CanvasVideo({ videoSrc, "aria-label": ariaLabel }: CanvasVideoProps) {
  const internal = use(PlayerInternalContext);
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
      style={{
        position: "absolute",
        width: "1px",
        height: "1px",
        overflow: "hidden",
        clip: "rect(0, 0, 0, 0)",
      }}
    />
  );
}

CanvasVideo.displayName = "CanvasVideo";
