"use client";

import { useEffect } from "react";
import { usePlayback } from "@/components/stories/organisms/player/context/use-playback";
import { usePlaybackTimeStore } from "@/components/feat/context/playback-time/use-playback-time";

/**
 * Renders nothing. Bridges the player's PlaybackContext (inside Player.Canvas)
 * to the cross-panel PlaybackTimeStore (at StudioProvider level).
 *
 * - Pushes currentTime into the store on every update
 * - Registers a seek handler so the transcript can seek the player
 */
export function PlaybackTimeBridge() {
  const playback = usePlayback();
  const store = usePlaybackTimeStore();

  useEffect(() => {
    store.setTime(playback.currentTime);
  }, [playback.currentTime, store]);

  useEffect(() => {
    store.setSeekHandler((time) => playback.seek(time));
  }, [playback.seek, store]);

  return null;
}
