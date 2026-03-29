import { createSubscribable } from "@/components/stories/organisms/player/utils/create-subscribable";

export interface PlaybackTimeStore {
  getTime: () => number;
  setTime: (time: number) => void;
  subscribe: (listener: () => void) => () => void;
  setSeekHandler: (handler: (time: number) => void) => void;
  seek: (time: number) => void;
}

export function createPlaybackTimeStore(): PlaybackTimeStore {
  const { notify, subscribe, clear: _clear } = createSubscribable();
  let currentTime = 0;
  let seekHandler: ((time: number) => void) | null = null;

  return {
    getTime: () => currentTime,
    setTime: (time: number) => {
      if (time !== currentTime) {
        currentTime = time;
        notify();
      }
    },
    subscribe,
    setSeekHandler: (handler: (time: number) => void) => {
      seekHandler = handler;
    },
    seek: (time: number) => {
      seekHandler?.(time);
    },
  };
}
