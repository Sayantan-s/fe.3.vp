"use client";

import { useEffect } from "react";
import type { Word } from "../utils/word-schema";
import type { WordIndexStore } from "./use-word-index-store";

interface SeekHandler {
  seek: (time: number) => void;
}

/**
 * Auto-seeks past skipped regions during playback.
 * Subscribes to the shared WordIndexStore (one binary search per tick)
 * instead of the raw time store.
 */
export function useSkipAutoSeek(
  words: Word[] | null,
  skippedIndices: Set<number>,
  seekHandler: SeekHandler,
  wordIndexStore: WordIndexStore | null,
) {
  useEffect(() => {
    if (!words || !wordIndexStore || skippedIndices.size === 0) return;

    let lastSeenIndex = -1;

    return wordIndexStore.subscribe(() => {
      const idx = wordIndexStore.getIndex();
      if (idx < 0 || idx === lastSeenIndex) return;
      lastSeenIndex = idx;

      if (!skippedIndices.has(idx)) return;

      // Scan forward past contiguous skipped words
      let target = idx;
      while (target < words.length && skippedIndices.has(target)) {
        target++;
      }
      if (target < words.length) {
        seekHandler.seek(words[target].start);
      } else {
        seekHandler.seek(words[words.length - 1].end);
      }
    });
  }, [words, skippedIndices, seekHandler, wordIndexStore]);
}
