import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPlaybackSource } from '../state/playback-source'
import type { PlaybackSource } from '../types'

function createMockVideo(): HTMLVideoElement {
  const listeners: Record<string, Set<EventListener>> = {}
  const video = {
    currentTime: 0,
    duration: 100,
    volume: 1,
    muted: false,
    playbackRate: 1,
    paused: true,
    ended: false,
    readyState: 0,
    seeking: false,
    play: vi.fn(() => {
      video.paused = false
      listeners['play']?.forEach((fn) => fn(new Event('play')))
      return Promise.resolve()
    }),
    pause: vi.fn(() => {
      video.paused = true
      listeners['pause']?.forEach((fn) => fn(new Event('pause')))
    }),
    addEventListener: vi.fn((event: string, fn: EventListener) => {
      if (!listeners[event]) listeners[event] = new Set()
      listeners[event].add(fn)
    }),
    removeEventListener: vi.fn((event: string, fn: EventListener) => {
      listeners[event]?.delete(fn)
    }),
    _emit: (event: string) => {
      listeners[event]?.forEach((fn) => fn(new Event(event)))
    },
  } as unknown as HTMLVideoElement & { _emit: (e: string) => void }
  return video
}

describe('PlaybackSource', () => {
  let video: HTMLVideoElement & { _emit: (e: string) => void }
  let source: PlaybackSource

  beforeEach(() => {
    video = createMockVideo()
    source = createPlaybackSource(video)
  })

  it('returns initial state from paused video', () => {
    const state = source.getState()
    expect(state.isPlaying).toBe(false)
    expect(state.currentTime).toBe(0)
    expect(state.duration).toBe(100)
    expect(state.volume).toBe(1)
    expect(state.isMuted).toBe(false)
    expect(state.playbackRate).toBe(1)
    expect(state.isBuffering).toBe(false)
    expect(state.isSeeking).toBe(false)
    expect(state.isEnded).toBe(false)
  })

  it('play() calls video.play()', () => {
    source.play()
    expect(video.play).toHaveBeenCalled()
  })

  it('pause() calls video.pause()', () => {
    source.pause()
    expect(video.pause).toHaveBeenCalled()
  })

  it('seek() sets video.currentTime', () => {
    source.seek(42)
    expect(video.currentTime).toBe(42)
  })

  it('setVolume() clamps and sets video.volume', () => {
    source.setVolume(0.5)
    expect(video.volume).toBe(0.5)
    source.setVolume(-1)
    expect(video.volume).toBe(0)
    source.setVolume(2)
    expect(video.volume).toBe(1)
  })

  it('setMuted() sets video.muted', () => {
    source.setMuted(true)
    expect(video.muted).toBe(true)
  })

  it('setPlaybackRate() sets video.playbackRate', () => {
    source.setPlaybackRate(2)
    expect(video.playbackRate).toBe(2)
  })

  it('notifies subscribers on play event', () => {
    const listener = vi.fn()
    source.subscribe(listener)
    video._emit('play')
    expect(listener).toHaveBeenCalled()
  })

  it('notifies subscribers on pause event', () => {
    const listener = vi.fn()
    source.subscribe(listener)
    video._emit('pause')
    expect(listener).toHaveBeenCalled()
  })

  it('notifies subscribers on timeupdate event', () => {
    const listener = vi.fn()
    source.subscribe(listener)
    video._emit('timeupdate')
    expect(listener).toHaveBeenCalled()
  })

  it('unsubscribe stops notifications', () => {
    const listener = vi.fn()
    const unsub = source.subscribe(listener)
    unsub()
    video._emit('play')
    expect(listener).not.toHaveBeenCalled()
  })

  it('reflects playing state after play event', () => {
    source.play()
    expect(source.getState().isPlaying).toBe(true)
  })

  it('syncControlled drives video to match controlled props', () => {
    source.syncControlled({ volume: 0.3, muted: true })
    expect(video.volume).toBe(0.3)
    expect(video.muted).toBe(true)
  })

  it('syncControlled plays video when playing=true', () => {
    source.syncControlled({ playing: true })
    expect(video.play).toHaveBeenCalled()
  })

  it('syncControlled pauses video when playing=false', () => {
    source.play()
    source.syncControlled({ playing: false })
    expect(video.pause).toHaveBeenCalled()
  })

  it('syncControlled seeks with tolerance threshold', () => {
    video.currentTime = 10
    source.syncControlled({ currentTime: 10.05 })
    expect(video.currentTime).toBe(10) // within 0.1 threshold, no seek
    source.syncControlled({ currentTime: 11 })
    expect(video.currentTime).toBe(11) // outside threshold, seek
  })

  it('destroy removes all event listeners', () => {
    source.destroy()
    expect(video.removeEventListener).toHaveBeenCalled()
  })

  it('notifies on ended event', () => {
    const listener = vi.fn()
    source.subscribe(listener)
    video._emit('ended')
    expect(listener).toHaveBeenCalled()
  })

  it('notifies on waiting (buffering) event', () => {
    const listener = vi.fn()
    source.subscribe(listener)
    video._emit('waiting')
    expect(listener).toHaveBeenCalled()
  })

  it('notifies on seeking event', () => {
    const listener = vi.fn()
    source.subscribe(listener)
    video._emit('seeking')
    expect(listener).toHaveBeenCalled()
  })

  it('notifies on volumechange event', () => {
    const listener = vi.fn()
    source.subscribe(listener)
    video._emit('volumechange')
    expect(listener).toHaveBeenCalled()
  })
})
