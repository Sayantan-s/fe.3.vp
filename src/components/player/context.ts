'use client'

import { createContext } from 'react'
import type {
  PlayerContextValue,
  PlayerInternalContextValue,
  PlaybackSource,
  VideoAppearanceStore,
} from './types'

export const PlayerContext = createContext<PlayerContextValue | null>(null)

export const PlayerInternalContext =
  createContext<PlayerInternalContextValue | null>(null)

export const PlaybackContext = createContext<PlaybackSource | null>(null)

export const AppearanceContext = createContext<VideoAppearanceStore | null>(null)
