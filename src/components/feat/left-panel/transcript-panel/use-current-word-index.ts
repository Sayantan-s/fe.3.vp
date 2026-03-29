"use client";

import { use, useCallback, useSyncExternalStore } from "react";
import { PlaybackTimeContext } from "@/components/feat/context/playback-time/context";
import { useTranscriptState } from "@/components/feat/context/transcript/use-transcript-state";
import { findWordAtTime } from "./find-word-at-time";

const NOOP_SUBSCRIBE = (_listener: () => void) => () => {};

/**
 * Derives the current word index from the playback time store.
 * Only triggers a re-render when the active word index actually changes,
 * not on every ~4Hz timeupdate tick.
 */
export function useCurrentWordIndex(): number {
  const store = use(PlaybackTimeContext);
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
