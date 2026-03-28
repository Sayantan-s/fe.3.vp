"use client";

import { useRef, useState } from "react";
import type { Mesh, Scene } from "three";
import type {
  PlayerInternalContextValue,
  PlayerState,
  PlaybackSource,
  VideoAppearanceStore,
} from "../types";
import type { MeshEntry } from "../utils/mesh-layout";

interface UsePlayerInternalArgs {
  sceneRef: React.RefObject<Scene | null>;
  meshesRef: React.RefObject<Map<string, MeshEntry>>;
  requestResizeRef: React.RefObject<(() => void) | null>;
  onError?: (error: Error) => void;
  onReady?: () => void;
}

export function usePlayerInternal(args: UsePlayerInternalArgs) {
  const { sceneRef, meshesRef, requestResizeRef } = args;

  const [playbackSource, setPlaybackSource] = useState<PlaybackSource | null>(null);
  const [playerState, setPlayerState] = useState<PlayerState>({ isReady: false, error: null });
  const [announcement, setAnnouncement] = useState("");

  const onErrorRef = useRef(args.onError);
  onErrorRef.current = args.onError;
  const onReadyRef = useRef(args.onReady);
  onReadyRef.current = args.onReady;

  const internalRef = useRef<PlayerInternalContextValue>(null);
  if (internalRef.current === null) {
    internalRef.current = {
      registerMesh(id: string, mesh: Mesh, zIndex: number, aspectRatio?: number) {
        mesh.position.z = zIndex;
        meshesRef.current.set(id, { mesh, zIndex, aspectRatio });
        sceneRef.current?.add(mesh);
        requestResizeRef.current?.();
      },
      unregisterMesh(id: string) {
        const entry = meshesRef.current.get(id);
        if (entry) {
          sceneRef.current?.remove(entry.mesh);
          meshesRef.current.delete(id);
        }
      },
      registerPlayback(source: PlaybackSource) {
        setPlaybackSource(source);
        setPlayerState((prev) => ({ ...prev, isReady: true }));
        onReadyRef.current?.();
        setAnnouncement("Video ready");
      },
      unregisterPlayback() {
        setPlaybackSource(null);
        setPlayerState((prev) => ({ ...prev, isReady: false }));
      },
      registerAppearance(_store: VideoAppearanceStore) {},
      unregisterAppearance() {},
      reportError(error: Error) {
        setPlayerState((prev) => ({ ...prev, error }));
        onErrorRef.current?.(error);
        setAnnouncement(`Error: ${error.message}`);
      },
      clearError() {
        setPlayerState((prev) => ({ ...prev, error: null }));
      },
    };
  }

  return {
    internalValue: internalRef.current,
    playbackSource,
    playerState,
    announcement,
    setAnnouncement,
  };
}
