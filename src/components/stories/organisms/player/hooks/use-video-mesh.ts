"use client";

import { useEffect, useRef } from "react";
import { Mesh, PlaneGeometry, type ShaderMaterial } from "three";
import { createPlaybackSource } from "../state/playback-source";
import { createVideoMaterial } from "../utils/create-video-material";
import type { PlayerInternalContextValue, PlaybackSource } from "../types";

export function useVideoMesh(
  videoSrc: string,
  internal: PlayerInternalContextValue | null,
  videoRef: React.RefObject<HTMLVideoElement | null>,
) {
  const meshRef = useRef<Mesh | null>(null);
  const materialRef = useRef<ShaderMaterial | null>(null);
  const playbackRef = useRef<PlaybackSource | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !internal) return;

    const ctx = internal;
    let disposed = false;

    function onCanPlay() {
      if (disposed) return;
      const material = createVideoMaterial(video!);
      const mesh = new Mesh(new PlaneGeometry(1, 1), material);
      meshRef.current = mesh;
      materialRef.current = material;

      const ar = video!.videoWidth / video!.videoHeight || undefined;
      ctx.registerMesh("video", mesh, 1, ar);

      const source = createPlaybackSource(video!);
      playbackRef.current = source;
      ctx.registerPlayback(source);
    }

    function onError() {
      if (!disposed) ctx.reportError(new Error(`Failed to load video: ${videoSrc}`));
    }

    video.src = videoSrc;
    video.addEventListener("error", onError);

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
      if (playbackRef.current) { ctx.unregisterPlayback(); playbackRef.current.destroy(); playbackRef.current = null; }
      ctx.unregisterMesh("video");
      meshRef.current?.geometry.dispose();
      meshRef.current = null;
      if (materialRef.current) { materialRef.current.uniforms.videoTexture.value?.dispose(); materialRef.current.dispose(); materialRef.current = null; }
      video.pause();
    };
  }, [videoSrc, internal]);
}
