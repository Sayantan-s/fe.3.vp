"use client";

import { use, useSyncExternalStore } from "react";
import { noop } from "es-toolkit/function";
import { PlaybackContext } from "./context";
import type { UsePlaybackReturn, PlaybackState } from "../types";

const IDLE_STATE: PlaybackState = {
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  isMuted: false,
  playbackRate: 1,
  isBuffering: false,
  isSeeking: false,
  isEnded: false,
};

const IDLE_SUBSCRIBE = (_listener: () => void) => noop;
const IDLE_GET_STATE = () => IDLE_STATE;

export function usePlayback(): UsePlaybackReturn {
  const source = use(PlaybackContext);

  const state = useSyncExternalStore(
    source?.subscribe ?? IDLE_SUBSCRIBE,
    source?.getState ?? IDLE_GET_STATE,
    IDLE_GET_STATE,
  );

  return {
    ...state,
    play: source?.play ?? noop,
    pause: source?.pause ?? noop,
    seek: source?.seek ?? noop,
    setVolume: source?.setVolume ?? noop,
    setMuted: source?.setMuted ?? noop,
    setPlaybackRate: source?.setPlaybackRate ?? noop,
  };
}
