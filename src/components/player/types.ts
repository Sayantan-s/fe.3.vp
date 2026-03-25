import { z } from 'zod'
import type { RefObject } from 'react'
import type { WebGLRenderer, Scene, Mesh } from 'three'

// --- Zod Schemas (single source of truth for runtime validation + types) ---

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
})

export const VideoAppearanceSchema = z.object({
  padding: z.number().min(0).max(100),
  rounding: z.number().min(0).max(100),
})

export const ControlledPlaybackPropsSchema = z.object({
  playing: z.boolean().optional(),
  currentTime: z.number().nonnegative().optional(),
  volume: z.number().min(0).max(1).optional(),
  muted: z.boolean().optional(),
  playbackRate: z.number().positive().optional(),
})

export const ControlledAppearancePropsSchema = z.object({
  padding: z.number().min(0).max(100).optional(),
  rounding: z.number().min(0).max(100).optional(),
})

export const CanvasBackgroundPropsSchema = z.object({
  backgroundSrc: z.string().min(1),
  'aria-label': z.string().optional(),
})

export const CanvasVideoPropsSchema = z.object({
  videoSrc: z.string().min(1),
  'aria-label': z.string().optional(),
})

// --- Derived Types (from Zod schemas) ---

export type PlaybackState = z.infer<typeof PlaybackStateSchema>
export type VideoAppearance = z.infer<typeof VideoAppearanceSchema>
export type ControlledPlaybackProps = z.infer<typeof ControlledPlaybackPropsSchema>
export type ControlledAppearanceProps = z.infer<typeof ControlledAppearancePropsSchema>
export type CanvasBackgroundProps = z.infer<typeof CanvasBackgroundPropsSchema>
export type CanvasVideoProps = z.infer<typeof CanvasVideoPropsSchema>

// --- Non-schema types (contain refs/functions — can't be Zod schemas) ---

export interface PlayerState {
  isReady: boolean
  error: Error | null
}

export interface PlayerMeta {
  canvasRef: RefObject<HTMLCanvasElement | null>
  rendererRef: RefObject<WebGLRenderer | null>
  sceneRef: RefObject<Scene | null>
}

export interface PlayerContextValue {
  state: PlayerState
  meta: PlayerMeta
}

export interface PlayerInternalContextValue {
  registerMesh: (id: string, mesh: Mesh, zIndex: number) => void
  unregisterMesh: (id: string) => void
  registerPlayback: (playback: PlaybackSource) => void
  unregisterPlayback: () => void
  registerAppearance: (store: VideoAppearanceStore) => void
  unregisterAppearance: () => void
  reportError: (error: Error) => void
  clearError: () => void
}

export interface PlaybackSource {
  play: () => void
  pause: () => void
  seek: (time: number) => void
  setVolume: (value: number) => void
  setMuted: (muted: boolean) => void
  setPlaybackRate: (rate: number) => void
  getState: () => PlaybackState
  subscribe: (listener: () => void) => () => void
  syncControlled: (props: ControlledPlaybackProps) => void
  destroy: () => void
}

export type UsePlaybackReturn = PlaybackState & {
  play: () => void
  pause: () => void
  seek: (time: number) => void
  setVolume: (value: number) => void
  setMuted: (muted: boolean) => void
  setPlaybackRate: (rate: number) => void
}

export interface VideoAppearanceStore {
  setPadding: (value: number) => void
  setRounding: (value: number) => void
  getAppearance: () => VideoAppearance
  subscribe: (listener: () => void) => () => void
  syncControlled: (props: ControlledAppearanceProps) => void
}

export type UseAppearanceReturn = VideoAppearance & {
  setPadding: (value: number) => void
  setRounding: (value: number) => void
}

export interface PlayerCanvasProps {
  'aria-label': string
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties

  // Controlled playback
  playing?: boolean
  currentTime?: number
  volume?: number
  muted?: boolean
  playbackRate?: number

  // Controlled appearance
  padding?: number
  rounding?: number
  defaultPadding?: number
  defaultRounding?: number

  // Event callbacks
  onPlay?: () => void
  onPause?: () => void
  onEnded?: () => void
  onTimeUpdate?: (time: number) => void
  onDurationChange?: (duration: number) => void
  onSeeking?: () => void
  onSeeked?: () => void
  onReady?: () => void
  onBuffering?: () => void
  onVolumeChange?: (volume: number, muted: boolean) => void
  onPaddingChange?: (value: number) => void
  onRoundingChange?: (value: number) => void
  onError?: (error: Error) => void
}
