"use client";

import { use, useSyncExternalStore } from "react";
import { PlaybackTimeContext } from "./context";

/**
 * Returns the raw PlaybackTimeStore instance from context.
 * Use this when you need direct access (e.g., setTime, seek, setSeekHandler).
 */
export function usePlaybackTimeStore() {
  const store = use(PlaybackTimeContext);
  if (!store) {
    throw new Error("usePlaybackTimeStore must be used within PlaybackTimeProvider");
  }
  return store;
}

const ZERO = () => 0;
const NOOP_SUBSCRIBE = (_listener: () => void) => () => {};

/**
 * Subscribes to the current playback time via useSyncExternalStore.
 * Re-renders only when the time value changes.
 */
export function usePlaybackTime(): number {
  const store = use(PlaybackTimeContext);

  return useSyncExternalStore(
    store?.subscribe ?? NOOP_SUBSCRIBE,
    store?.getTime ?? ZERO,
    ZERO,
  );
}
