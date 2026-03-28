"use client";

import { useEffect, useRef, use } from "react";
import {
  VideoTexture,
  PlaneGeometry,
  ShaderMaterial,
  Mesh,
  LinearFilter,
  SRGBColorSpace,
  Vector2,
} from "three";
import { PlayerInternalContext } from "./context";
import { createPlaybackSource } from "./playback-source";
import { roundedVideoVert, roundedVideoFrag } from "./shaders";
import type { CanvasVideoProps, PlaybackSource } from "./types";

const LAYER_ID = "video";
const Z_INDEX = 1;

export function CanvasVideo({
  videoSrc,
  "aria-label": ariaLabel,
}: CanvasVideoProps) {
  const internal = use(PlayerInternalContext);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const meshRef = useRef<Mesh | null>(null);
  const materialRef = useRef<ShaderMaterial | null>(null);
  const playbackRef = useRef<PlaybackSource | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Capture non-null internal for use inside closures (TS narrowing)
    const ctx = internal;

    let disposed = false;

    function onCanPlay() {
      if (disposed) return;

      const texture = new VideoTexture(video!);
      texture.minFilter = LinearFilter;
      texture.magFilter = LinearFilter;
      texture.colorSpace = SRGBColorSpace;

      const geometry = new PlaneGeometry(1, 1);
      const material = new ShaderMaterial({
        uniforms: {
          videoTexture: { value: texture },
          resolution: { value: new Vector2(1, 1) },
          radius: { value: 0 },
        },
        vertexShader: roundedVideoVert,
        fragmentShader: roundedVideoFrag,
        transparent: true,
      });

      const mesh = new Mesh(geometry, material);
      meshRef.current = mesh;
      materialRef.current = material;

      ctx?.registerMesh(LAYER_ID, mesh, Z_INDEX);

      // Create and register PlaybackSource
      const source = createPlaybackSource(video!);
      playbackRef.current = source;
      ctx?.registerPlayback(source);
    }

    function onError() {
      if (!disposed) {
        ctx?.reportError(new Error(`Failed to load video: ${videoSrc}`));
      }
    }

    // Ensure src is set — cleanup may have removed it (React strict mode)
    video.src = videoSrc;
    video.addEventListener("error", onError);

    // If the video is already loaded (browser cache), fire immediately.
    // Otherwise wait for canplay. readyState >= HAVE_CURRENT_DATA means
    // at least one frame is available for rendering.
    if (video.readyState >= 2) {
      onCanPlay();
    } else {
      video.addEventListener("canplay", onCanPlay, { once: true });
      video.load();
    }

    return () => {
      disposed = true;

      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("error", onError);

      if (playbackRef.current) {
        ctx?.unregisterPlayback();
        playbackRef.current.destroy();
        playbackRef.current = null;
      }

      ctx?.unregisterMesh(LAYER_ID);

      if (meshRef.current) {
        meshRef.current.geometry.dispose();
        meshRef.current = null;
      }

      if (materialRef.current) {
        materialRef.current.uniforms.videoTexture.value?.dispose();
        materialRef.current.dispose();
        materialRef.current = null;
      }

      video.pause();
    };
  }, [videoSrc, internal]);

  if (!internal) {
    throw new Error("Player.Canvas.Video must be used inside <Player.Canvas>");
  }

  // Video element in DOM for a11y + media pipeline, visually hidden
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
