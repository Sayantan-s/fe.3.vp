"use client";

import { useEffect } from "react";
import type { Word } from "../utils/word-schema";
import { findWordAtTime } from "../utils/find-word-at-time";

interface PlaybackTimeStore {
  seek: (time: number) => void;
  subscribe: (listener: () => void) => () => void;
  getTime: () => number;
}

const LOOKAHEAD_BUFFER = 0.25; // seconds

/**
 * Auto-seeks past skipped regions during playback.
 * Uses lookahead to seek BEFORE the skipped word starts playing,
 * compensating for ~250ms timeupdate interval + React render delay.
 */
export function useSkipAutoSeek(
  words: Word[] | null,
  skippedIndices: Set<number>,
  store: PlaybackTimeStore,
) {
  useEffect(() => {
    if (!words || skippedIndices.size === 0) return;

    function seekPastSkipped(fromIdx: number) {
      let target = fromIdx;
      while (target < words!.length && skippedIndices.has(target)) {
        target++;
      }
      if (target < words!.length) {
        store.seek(words![target].start);
      } else {
        store.seek(words![words!.length - 1].end);
      }
    }

    return store.subscribe(() => {
      const time = store.getTime();
      const idx = findWordAtTime(words, time);
      if (idx < 0) return;

      if (skippedIndices.has(idx)) {
        seekPastSkipped(idx);
        return;
      }

      if (time > words[idx].end) {
        const next = idx + 1;
        if (next < words.length && skippedIndices.has(next)) {
          seekPastSkipped(next);
          return;
        }
      }

      const next = idx + 1;
      if (
        next < words.length &&
        skippedIndices.has(next) &&
        words[next].start - time <= LOOKAHEAD_BUFFER
      ) {
        seekPastSkipped(next);
      }
    });
  }, [words, skippedIndices, store]);
}
