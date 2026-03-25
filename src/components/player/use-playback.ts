'use client'

import { use, useSyncExternalStore } from 'react'
import { PlaybackContext } from './context'
import type { UsePlaybackReturn } from './types'

export function usePlayback(): UsePlaybackReturn {
  const source = use(PlaybackContext)

  if (!source) {
    throw new Error('usePlayback must be used inside <Player.Canvas> with a <Player.Canvas.Video> child')
  }

  const state = useSyncExternalStore(source.subscribe, source.getState, source.getState)

  return {
    ...state,
    play: source.play,
    pause: source.pause,
    seek: source.seek,
    setVolume: source.setVolume,
    setMuted: source.setMuted,
    setPlaybackRate: source.setPlaybackRate,
  }
}
