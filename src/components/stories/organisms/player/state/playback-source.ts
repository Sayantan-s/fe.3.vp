import { clamp } from "es-toolkit/math";
import { createSubscribable } from "../utils/create-subscribable";
import { buildPlaybackState, playbackStateChanged } from "../utils/playback-state";
import type { PlaybackSource, PlaybackState, ControlledPlaybackProps } from "../types";

const VIDEO_EVENTS = [
  "play", "pause", "timeupdate", "durationchange", "volumechange",
  "ratechange", "seeking", "seeked", "waiting", "canplay", "ended", "error",
] as const;

export function createPlaybackSource(video: HTMLVideoElement): PlaybackSource {
  const { notify, subscribe, clear } = createSubscribable();
  let cachedState: PlaybackState = buildPlaybackState(video);

  function onVideoEvent() { notify(); }

  for (const event of VIDEO_EVENTS) {
    video.addEventListener(event, onVideoEvent);
  }

  function getState(): PlaybackState {
    const next = buildPlaybackState(video);
    if (playbackStateChanged(cachedState, next)) cachedState = next;
    return cachedState;
  }

  function syncControlled(props: ControlledPlaybackProps) {
    if (props.playing !== undefined) {
      if (props.playing && video.paused) video.play();
      if (!props.playing && !video.paused) video.pause();
    }
    if (props.currentTime !== undefined && Math.abs(video.currentTime - props.currentTime) > 0.1) {
      video.currentTime = props.currentTime;
    }
    if (props.volume !== undefined) video.volume = clamp(props.volume, 0, 1);
    if (props.muted !== undefined) video.muted = props.muted;
    if (props.playbackRate !== undefined) video.playbackRate = props.playbackRate;
  }

  function destroy() {
    for (const event of VIDEO_EVENTS) {
      video.removeEventListener(event, onVideoEvent);
    }
    clear();
  }

  return {
    play: () => { video.play(); },
    pause: () => { video.pause(); },
    seek: (time: number) => { video.currentTime = time; },
    setVolume: (value: number) => { video.volume = clamp(value, 0, 1); },
    setMuted: (muted: boolean) => { video.muted = muted; },
    setPlaybackRate: (rate: number) => { video.playbackRate = rate; },
    getState, subscribe, syncControlled, destroy,
  };
}
