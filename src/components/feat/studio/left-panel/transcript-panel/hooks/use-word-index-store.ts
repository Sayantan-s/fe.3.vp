"use client";

import { useEffect, useRef } from "react";
import type { PlaybackTimeStore } from "@/components/feat/studio/context/playback-time/store";
import { findWordAtTime } from "../utils/find-word-at-time";
import type { Word } from "../utils/word-schema";

export interface WordIndexStore {
  getIndex: () => number;
  subscribe: (listener: () => void) => () => void;
}

interface WordIndexStoreInternal {
  store: WordIndexStore;
  cleanup: () => void;
}

function createWordIndexStore(
  timeStore: PlaybackTimeStore,
  words: Word[],
): WordIndexStoreInternal {
  let currentIndex = -1;
  const listeners = new Set<() => void>();

  const unsubscribe = timeStore.subscribe(() => {
    const next = findWordAtTime(words, timeStore.getTime());
    if (next !== currentIndex) {
      currentIndex = next;
      for (const fn of listeners) fn();
    }
  });

  return {
    store: {
      getIndex: () => currentIndex,
      subscribe: (listener: () => void) => {
        listeners.add(listener);
        return () => {
          listeners.delete(listener);
        };
      },
    },
    cleanup: unsubscribe,
  };
}

/**
 * Creates a WordIndexStore per (timeStore, words) pair.
 * Runs findWordAtTime once per playback tick, shared across all consumers.
 * Properly cleans up the timeStore subscription on unmount or dep change.
 */
export function useWordIndexStore(
  timeStore: PlaybackTimeStore | null,
  words: Word[] | null,
): WordIndexStore | null {
  const ref = useRef<WordIndexStoreInternal | null>(null);

  useEffect(() => {
    if (!timeStore || !words) {
      ref.current = null;
      return;
    }
    const internal = createWordIndexStore(timeStore, words);
    ref.current = internal;
    return internal.cleanup;
  }, [timeStore, words]);

  return ref.current?.store ?? null;
}
