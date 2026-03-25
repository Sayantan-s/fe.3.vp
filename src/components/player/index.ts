'use client'

import { PlayerCanvas } from './canvas'
import { CanvasBackground } from './canvas-background'
import { CanvasVideo } from './canvas-video'

// Assemble compound component
const Canvas = Object.assign(PlayerCanvas, {
  Background: CanvasBackground,
  Video: CanvasVideo,
})

export const Player = { Canvas }

// Hooks
export { usePlayback } from './use-playback'
export { useAppearance } from './use-appearance'

// Context (escape hatch)
export { PlayerContext } from './context'

// Types
export type {
  PlayerContextValue,
  PlayerState,
  PlayerMeta,
  PlaybackSource,
  PlaybackState,
  VideoAppearance,
  VideoAppearanceStore,
  UsePlaybackReturn,
  UseAppearanceReturn,
  PlayerCanvasProps,
  CanvasBackgroundProps,
  CanvasVideoProps,
} from './types'
