import { describe, it, expect, vi } from 'vitest'
import { createAppearanceStore } from '../state/appearance-store'

describe('VideoAppearanceStore', () => {
  it('returns defaults when no initial values', () => {
    const store = createAppearanceStore({})
    expect(store.getAppearance()).toEqual({ padding: 0, rounding: 0 })
  })

  it('accepts initial values', () => {
    const store = createAppearanceStore({ defaultPadding: 20, defaultRounding: 12 })
    expect(store.getAppearance()).toEqual({ padding: 20, rounding: 12 })
  })

  it('setPadding updates padding and notifies', () => {
    const store = createAppearanceStore({})
    const listener = vi.fn()
    store.subscribe(listener)
    store.setPadding(50)
    expect(store.getAppearance().padding).toBe(50)
    expect(listener).toHaveBeenCalled()
  })

  it('setRounding updates rounding and notifies', () => {
    const store = createAppearanceStore({})
    const listener = vi.fn()
    store.subscribe(listener)
    store.setRounding(30)
    expect(store.getAppearance().rounding).toBe(30)
    expect(listener).toHaveBeenCalled()
  })

  it('clamps padding to 0-100', () => {
    const store = createAppearanceStore({})
    store.setPadding(-10)
    expect(store.getAppearance().padding).toBe(0)
    store.setPadding(200)
    expect(store.getAppearance().padding).toBe(100)
  })

  it('clamps rounding to 0-100', () => {
    const store = createAppearanceStore({})
    store.setRounding(-5)
    expect(store.getAppearance().rounding).toBe(0)
    store.setRounding(150)
    expect(store.getAppearance().rounding).toBe(100)
  })

  it('unsubscribe stops notifications', () => {
    const store = createAppearanceStore({})
    const listener = vi.fn()
    const unsub = store.subscribe(listener)
    unsub()
    store.setPadding(50)
    expect(listener).not.toHaveBeenCalled()
  })

  it('syncControlled overrides values when props provided', () => {
    const store = createAppearanceStore({ defaultPadding: 10, defaultRounding: 5 })
    store.syncControlled({ padding: 80, rounding: 40 })
    expect(store.getAppearance()).toEqual({ padding: 80, rounding: 40 })
  })

  it('syncControlled ignores undefined props', () => {
    const store = createAppearanceStore({ defaultPadding: 10, defaultRounding: 5 })
    store.syncControlled({ padding: 80 })
    expect(store.getAppearance()).toEqual({ padding: 80, rounding: 5 })
  })

  it('does not notify when value unchanged', () => {
    const store = createAppearanceStore({ defaultPadding: 50 })
    const listener = vi.fn()
    store.subscribe(listener)
    store.setPadding(50) // same value
    expect(listener).not.toHaveBeenCalled()
  })
})
