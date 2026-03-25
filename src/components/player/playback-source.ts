import { clamp } from 'es-toolkit/math'
import type { PlaybackSource, PlaybackState, ControlledPlaybackProps } from './types'

const VIDEO_EVENTS = [
  'play',
  'pause',
  'timeupdate',
  'durationchange',
  'volumechange',
  'ratechange',
  'seeking',
  'seeked',
  'waiting',
  'canplay',
  'ended',
  'error',
] as const

export function createPlaybackSource(video: HTMLVideoElement): PlaybackSource {
  const listeners = new Set<() => void>()

  function notify() {
    listeners.forEach((fn) => fn())
  }

  function onVideoEvent() {
    notify()
  }

  for (const event of VIDEO_EVENTS) {
    video.addEventListener(event, onVideoEvent)
  }

  function getState(): PlaybackState {
    return {
      isPlaying: !video.paused && !video.ended,
      currentTime: video.currentTime,
      duration: Number.isFinite(video.duration) ? video.duration : 0,
      volume: video.volume,
      isMuted: video.muted,
      playbackRate: video.playbackRate,
      isBuffering: video.readyState < 3 && !video.paused,
      isSeeking: video.seeking,
      isEnded: video.ended,
    }
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }

  function play() {
    video.play()
  }

  function pause() {
    video.pause()
  }

  function seek(time: number) {
    video.currentTime = time
  }

  function setVolume(value: number) {
    video.volume = clamp(value, 0, 1)
  }

  function setMuted(muted: boolean) {
    video.muted = muted
  }

  function setPlaybackRate(rate: number) {
    video.playbackRate = rate
  }

  function syncControlled(props: ControlledPlaybackProps) {
    if (props.playing !== undefined) {
      if (props.playing && video.paused) video.play()
      if (!props.playing && !video.paused) video.pause()
    }
    if (props.currentTime !== undefined && Math.abs(video.currentTime - props.currentTime) > 0.1) {
      video.currentTime = props.currentTime
    }
    if (props.volume !== undefined) {
      video.volume = clamp(props.volume, 0, 1)
    }
    if (props.muted !== undefined) {
      video.muted = props.muted
    }
    if (props.playbackRate !== undefined) {
      video.playbackRate = props.playbackRate
    }
  }

  function destroy() {
    for (const event of VIDEO_EVENTS) {
      video.removeEventListener(event, onVideoEvent)
    }
    listeners.clear()
  }

  return {
    play,
    pause,
    seek,
    setVolume,
    setMuted,
    setPlaybackRate,
    getState,
    subscribe,
    syncControlled,
    destroy,
  }
}
