"use client";

import { useMemo } from "react";
import type { PlaybackTimeStore } from "@/components/feat/studio/context/playback-time/store";
import { findWordAtTime } from "../utils/find-word-at-time";
import type { Word } from "../utils/word-schema";

export interface WordIndexStore {
  getIndex: () => number;
  subscribe: (listener: () => void) => () => void;
}

function createWordIndexStore(
  timeStore: PlaybackTimeStore,
  words: Word[],
): WordIndexStore {
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
    getIndex: () => currentIndex,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) unsubscribe();
      };
    },
  };
}

/**
 * Memoizes a WordIndexStore per (timeStore, words) pair.
 * Runs findWordAtTime once per playback tick, shared across all consumers.
 */
export function useWordIndexStore(
  timeStore: PlaybackTimeStore | null,
  words: Word[] | null,
): WordIndexStore | null {
  return useMemo(() => {
    if (!timeStore || !words) return null;
    return createWordIndexStore(timeStore, words);
  }, [timeStore, words]);
}
