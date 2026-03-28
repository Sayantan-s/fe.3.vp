"use client";

import { useEffect } from "react";
import type { PlaybackSource, VideoAppearanceStore } from "../types";

interface UseControlledSyncArgs {
  playbackSource: PlaybackSource | null;
  appearanceStore: VideoAppearanceStore;
  playing?: boolean;
  currentTime?: number;
  volume?: number;
  muted?: boolean;
  playbackRate?: number;
  padding?: number;
  rounding?: number;
}

export function useControlledSync(args: UseControlledSyncArgs) {
  const { playbackSource, appearanceStore } = args;

  useEffect(() => {
    if (playbackSource) {
      playbackSource.syncControlled({
        playing: args.playing,
        currentTime: args.currentTime,
        volume: args.volume,
        muted: args.muted,
        playbackRate: args.playbackRate,
      });
    }
  }, [playbackSource, args.playing, args.currentTime, args.volume, args.muted, args.playbackRate]);

  useEffect(() => {
    appearanceStore.syncControlled({
      padding: args.padding,
      rounding: args.rounding,
    });
  }, [appearanceStore, args.padding, args.rounding]);
}
