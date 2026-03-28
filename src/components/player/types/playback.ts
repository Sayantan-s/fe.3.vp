import { z } from "zod";

// --- Zod Schemas ---

export const PlaybackStateSchema = z.object({
  isPlaying: z.boolean(),
  currentTime: z.number().nonnegative(),
  duration: z.number().nonnegative(),
  volume: z.number().min(0).max(1),
  isMuted: z.boolean(),
  playbackRate: z.number().positive(),
  isBuffering: z.boolean(),
  isSeeking: z.boolean(),
  isEnded: z.boolean(),
});

export const ControlledPlaybackPropsSchema = z.object({
  playing: z.boolean().optional(),
  currentTime: z.number().nonnegative().optional(),
  volume: z.number().min(0).max(1).optional(),
  muted: z.boolean().optional(),
  playbackRate: z.number().positive().optional(),
});

// --- Derived Types ---

export type PlaybackState = z.infer<typeof PlaybackStateSchema>;
export type ControlledPlaybackProps = z.infer<
  typeof ControlledPlaybackPropsSchema
>;

// --- Interface Types ---

export interface PlaybackSource {
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  setVolume: (value: number) => void;
  setMuted: (muted: boolean) => void;
  setPlaybackRate: (rate: number) => void;
  getState: () => PlaybackState;
  subscribe: (listener: () => void) => () => void;
  syncControlled: (props: ControlledPlaybackProps) => void;
  destroy: () => void;
}

export type UsePlaybackReturn = PlaybackState & {
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  setVolume: (value: number) => void;
  setMuted: (muted: boolean) => void;
  setPlaybackRate: (rate: number) => void;
};
