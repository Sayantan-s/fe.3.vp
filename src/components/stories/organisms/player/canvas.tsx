"use client";

import { useRef } from "react";
import {
  PlayerContext,
  PlayerInternalContext,
  PlaybackContext,
  AppearanceContext,
} from "./context/context";
import { createAppearanceStore } from "./state/appearance-store";
import { usePlayerInternal } from "./hooks/use-player-internal";
import { useThreeRenderer } from "./hooks/use-three-renderer";
import { usePlaybackEvents } from "./hooks/use-playback-events";
import { useAppearanceEvents } from "./hooks/use-appearance-events";
import { useControlledSync } from "./hooks/use-controlled-sync";
import { SR_ONLY } from "./utils/sr-only";
import type { PlayerCanvasProps } from "./types";
import type { MeshEntry } from "./utils/mesh-layout";

export function PlayerCanvas(props: PlayerCanvasProps) {
  const {
    "aria-label": ariaLabel,
    children,
    className,
    style,
    playing,
    currentTime,
    volume,
    muted,
    playbackRate,
    padding,
    rounding,
    defaultPadding,
    defaultRounding,
    onPlay,
    onPause,
    onEnded,
    onTimeUpdate,
    onDurationChange,
    onSeeking,
    onSeeked,
    onReady,
    onBuffering,
    onVolumeChange,
    onPaddingChange,
    onRoundingChange,
    onError,
  } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const meshesRef = useRef<Map<string, MeshEntry>>(new Map());

  const appearanceStore = createAppearanceStore({
    defaultPadding,
    defaultRounding,
  });

  const { rendererRef, sceneRef, requestResizeRef } = useThreeRenderer({
    containerRef,
    canvasRef,
    meshesRef,
    appearanceStore,
    reportError: (e: Error) => onError?.(e),
    clearError: () => {},
  });

  const {
    internalValue,
    playbackSource,
    playerState,
    announcement,
    setAnnouncement,
  } = usePlayerInternal({
    sceneRef,
    meshesRef,
    requestResizeRef,
    onError,
    onReady,
  });

  useControlledSync({
    playbackSource,
    appearanceStore,
    playing,
    currentTime,
    volume,
    muted,
    playbackRate,
    padding,
    rounding,
  });

  usePlaybackEvents({
    playbackSource,
    setAnnouncement,
    onPlay,
    onPause,
    onEnded,
    onTimeUpdate,
    onDurationChange,
    onSeeking,
    onSeeked,
    onBuffering,
    onVolumeChange,
  });

  useAppearanceEvents({ appearanceStore, onPaddingChange, onRoundingChange });

  return (
    <PlayerContext
      value={{ state: playerState, meta: { canvasRef, rendererRef, sceneRef } }}
    >
      <PlayerInternalContext value={internalValue}>
        <PlaybackContext value={playbackSource}>
          <AppearanceContext value={appearanceStore}>
            <div
              ref={containerRef}
              role="group"
              aria-label={ariaLabel}
              className={className}
              style={{ position: "relative", ...style }}
            >
              <canvas
                ref={canvasRef}
                aria-hidden="true"
                style={{ display: "block", width: "100%", height: "100%" }}
              />
            </div>
            {children}
          </AppearanceContext>
        </PlaybackContext>
      </PlayerInternalContext>
    </PlayerContext>
  );
}
