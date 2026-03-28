import type { RefObject } from "react";
import type { WebGLRenderer, Scene, Mesh } from "three";
import type { PlaybackSource } from "./playback";
import type { VideoAppearanceStore } from "./appearance";

export interface PlayerState {
  isReady: boolean;
  error: Error | null;
}

export interface PlayerMeta {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  rendererRef: RefObject<WebGLRenderer | null>;
  sceneRef: RefObject<Scene | null>;
}

export interface PlayerContextValue {
  state: PlayerState;
  meta: PlayerMeta;
}

export interface PlayerInternalContextValue {
  registerMesh: (
    id: string,
    mesh: Mesh,
    zIndex: number,
    aspectRatio?: number,
  ) => void;
  unregisterMesh: (id: string) => void;
  registerPlayback: (playback: PlaybackSource) => void;
  unregisterPlayback: () => void;
  registerAppearance: (store: VideoAppearanceStore) => void;
  unregisterAppearance: () => void;
  reportError: (error: Error) => void;
  clearError: () => void;
}
