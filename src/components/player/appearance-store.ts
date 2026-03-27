import { clamp } from 'es-toolkit/math'
import type { VideoAppearance, VideoAppearanceStore, ControlledAppearanceProps } from './types'

export function createAppearanceStore(initial: {
  defaultPadding?: number
  defaultRounding?: number
}): VideoAppearanceStore {
  let appearance: VideoAppearance = {
    padding: clamp(initial.defaultPadding ?? 0, 0, 100),
    rounding: clamp(initial.defaultRounding ?? 0, 0, 100),
  }

  const listeners = new Set<() => void>()

  function notify() {
    listeners.forEach((fn) => fn())
  }

  function getAppearance(): VideoAppearance {
    // Return the same reference — appearance is already replaced with a
    // new object in setPadding/setRounding/syncControlled when values change.
    // No spread copy needed. useSyncExternalStore requires stable references.
    return appearance
  }

  function setPadding(value: number) {
    const clamped = clamp(value, 0, 100)
    if (clamped !== appearance.padding) {
      appearance = { ...appearance, padding: clamped }
      notify()
    }
  }

  function setRounding(value: number) {
    const clamped = clamp(value, 0, 100)
    if (clamped !== appearance.rounding) {
      appearance = { ...appearance, rounding: clamped }
      notify()
    }
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }

  function syncControlled(props: ControlledAppearanceProps) {
    let changed = false
    const next = { ...appearance }

    if (props.padding !== undefined) {
      const clamped = clamp(props.padding, 0, 100)
      if (clamped !== next.padding) {
        next.padding = clamped
        changed = true
      }
    }
    if (props.rounding !== undefined) {
      const clamped = clamp(props.rounding, 0, 100)
      if (clamped !== next.rounding) {
        next.rounding = clamped
        changed = true
      }
    }

    if (changed) {
      appearance = next
      notify()
    }
  }

  return { setPadding, setRounding, getAppearance, subscribe, syncControlled }
}
