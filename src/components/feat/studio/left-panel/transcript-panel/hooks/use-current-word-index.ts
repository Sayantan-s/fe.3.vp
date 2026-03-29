"use client";

import { useCallback, useSyncExternalStore } from "react";
import { usePlaybackTimeStore } from "@/components/feat/studio/context/playback-time/use-playback-time";
import { useTranscriptState } from "./use-transcript-state";
import { findWordAtTime } from "../utils/find-word-at-time";

const NOOP_SUBSCRIBE = (_listener: () => void) => () => {};

/**
 * Derives the current word index from the playback time store.
 * Only triggers a re-render when the active word index actually changes,
 * not on every ~4Hz timeupdate tick.
 */
export function useCurrentWordIndex(): number {
  const store = usePlaybackTimeStore();
  const { words } = useTranscriptState();

  const getSnapshot = useCallback(() => {
    if (!store || !words) return -1;
    return findWordAtTime(words, store.getTime());
  }, [store, words]);

  return useSyncExternalStore(
    store?.subscribe ?? NOOP_SUBSCRIBE,
    getSnapshot,
    () => -1,
  );
}
