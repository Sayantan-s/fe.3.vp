import type { PlaybackState } from "../types";

export function buildPlaybackState(video: HTMLVideoElement): PlaybackState {
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
  };
}

export function playbackStateChanged(
  a: PlaybackState,
  b: PlaybackState,
): boolean {
  return (
    a.isPlaying !== b.isPlaying ||
    a.currentTime !== b.currentTime ||
    a.duration !== b.duration ||
    a.volume !== b.volume ||
    a.isMuted !== b.isMuted ||
    a.playbackRate !== b.playbackRate ||
    a.isBuffering !== b.isBuffering ||
    a.isSeeking !== b.isSeeking ||
    a.isEnded !== b.isEnded
  );
}
