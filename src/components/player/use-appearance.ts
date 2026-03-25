'use client'

import { use, useSyncExternalStore } from 'react'
import { AppearanceContext } from './context'
import type { UseAppearanceReturn } from './types'

export function useAppearance(): UseAppearanceReturn {
  const store = use(AppearanceContext)

  if (!store) {
    throw new Error('useAppearance must be used inside <Player.Canvas>')
  }

  const appearance = useSyncExternalStore(store.subscribe, store.getAppearance, store.getAppearance)

  return {
    ...appearance,
    setPadding: store.setPadding,
    setRounding: store.setRounding,
  }
}
