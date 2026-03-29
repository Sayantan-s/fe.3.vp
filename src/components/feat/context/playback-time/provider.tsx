"use client";

import { useRef } from "react";
import { PlaybackTimeContext } from "./context";
import { createPlaybackTimeStore, type PlaybackTimeStore } from "./store";

interface PlaybackTimeProviderProps {
  children: React.ReactNode;
}

export function PlaybackTimeProvider({ children }: PlaybackTimeProviderProps) {
  const storeRef = useRef<PlaybackTimeStore | null>(null);
  if (storeRef.current === null) {
    storeRef.current = createPlaybackTimeStore();
  }

  return (
    <PlaybackTimeContext value={storeRef.current}>
      {children}
    </PlaybackTimeContext>
  );
}
