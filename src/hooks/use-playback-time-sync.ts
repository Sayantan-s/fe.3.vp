"use client";

import { useEffect } from "react";
import { usePlayback } from "@/components/stories/organisms/player";
import { usePlaybackTimeStore } from "@/components/feat/studio/context/playback-time/use-playback-time";

export function usePlaybackTimeSync() {
  const playback = usePlayback();
  const store = usePlaybackTimeStore();

  useEffect(() => {
    store.setTime(playback.currentTime);
  }, [playback.currentTime, store]);

  useEffect(() => {
    store.setSeekHandler((time) => playback.seek(time));
  }, [playback.seek, store]);
}
