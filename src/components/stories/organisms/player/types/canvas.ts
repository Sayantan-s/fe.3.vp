import { z } from "zod";

// --- Zod Schemas ---

export const CanvasBackgroundPropsSchema = z.object({
  backgroundSrc: z.string().min(1),
  "aria-label": z.string().optional(),
  className: z.string().optional(),
});

export const CanvasVideoPropsSchema = z.object({
  videoSrc: z.string().min(1),
  "aria-label": z.string().optional(),
});

// --- Derived Types ---

export type CanvasBackgroundProps = z.infer<typeof CanvasBackgroundPropsSchema>;
export type CanvasVideoProps = z.infer<typeof CanvasVideoPropsSchema>;

// --- Component Props ---

export interface PlayerCanvasProps {
  "aria-label": string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;

  // Controlled playback
  playing?: boolean;
  currentTime?: number;
  volume?: number;
  muted?: boolean;
  playbackRate?: number;

  // Controlled appearance
  padding?: number;
  rounding?: number;
  defaultPadding?: number;
  defaultRounding?: number;

  // Event callbacks
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onTimeUpdate?: (time: number) => void;
  onDurationChange?: (duration: number) => void;
  onSeeking?: () => void;
  onSeeked?: () => void;
  onReady?: () => void;
  onBuffering?: () => void;
  onVolumeChange?: (volume: number, muted: boolean) => void;
  onPaddingChange?: (value: number) => void;
  onRoundingChange?: (value: number) => void;
  onError?: (error: Error) => void;
}
