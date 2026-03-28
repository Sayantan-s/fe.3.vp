"use client";

import { useEffect } from "react";
import { formatTime } from "../utils/format-time";
import type { PlaybackSource, PlaybackState } from "../types";

interface UsePlaybackEventsArgs {
  playbackSource: PlaybackSource | null;
  setAnnouncement: (msg: string) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onTimeUpdate?: (time: number) => void;
  onDurationChange?: (duration: number) => void;
  onSeeking?: () => void;
  onSeeked?: () => void;
  onBuffering?: () => void;
  onVolumeChange?: (volume: number, muted: boolean) => void;
}

export function usePlaybackEvents(args: UsePlaybackEventsArgs) {
  const { playbackSource, setAnnouncement } = args;

  useEffect(() => {
    if (!playbackSource) return;

    let prev: PlaybackState = playbackSource.getState();

    const unsub = playbackSource.subscribe(() => {
      const next = playbackSource.getState();

      if (!prev.isPlaying && next.isPlaying) {
        args.onPlay?.();
        setAnnouncement("Playing");
      }
      if (prev.isPlaying && !next.isPlaying && !next.isEnded) {
        args.onPause?.();
        setAnnouncement(`Paused at ${formatTime(next.currentTime)}`);
      }
      if (!prev.isEnded && next.isEnded) {
        args.onEnded?.();
        setAnnouncement("Video ended");
      }
      if (prev.currentTime !== next.currentTime) args.onTimeUpdate?.(next.currentTime);
      if (prev.duration !== next.duration) args.onDurationChange?.(next.duration);
      if (!prev.isSeeking && next.isSeeking) args.onSeeking?.();
      if (prev.isSeeking && !next.isSeeking) args.onSeeked?.();
      if (!prev.isBuffering && next.isBuffering) {
        args.onBuffering?.();
        setAnnouncement("Buffering");
      }
      if (prev.volume !== next.volume || prev.isMuted !== next.isMuted) {
        args.onVolumeChange?.(next.volume, next.isMuted);
      }

      prev = next;
    });

    return unsub;
  }, [playbackSource]);
}
