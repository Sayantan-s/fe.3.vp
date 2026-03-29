"use client";

import { useSyncExternalStore } from "react";
import { usePlaybackTimeStore } from "@/components/feat/studio/context/playback-time/use-playback-time";
import { useTranscriptState } from "./use-transcript-state";
import { useWordIndexStore } from "./use-word-index-store";

const NOOP_SUBSCRIBE = (_listener: () => void) => () => {};
const NEG_ONE = () => -1;

/**
 * Derives the current word index from the shared WordIndexStore.
 * Only triggers a re-render when the active word index actually changes.
 */
export function useCurrentWordIndex(): number {
  const store = usePlaybackTimeStore();
  const { words } = useTranscriptState();
  const wordIndexStore = useWordIndexStore(store, words);

  return useSyncExternalStore(
    wordIndexStore?.subscribe ?? NOOP_SUBSCRIBE,
    wordIndexStore?.getIndex ?? NEG_ONE,
    NEG_ONE,
  );
}
