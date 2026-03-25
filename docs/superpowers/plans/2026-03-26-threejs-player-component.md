# Three.js Video Player Component — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a headless, accessible, compound Three.js video player component with full controlled/uncontrolled support that can be dropped into any part of an application.

**Architecture:** Compound component (`Player.Canvas` > `Player.Canvas.Background` + `Player.Canvas.Video`) where Canvas is a dumb scene host, children register their own meshes via internal context, and consumers build UI with exposed hooks (`usePlayback`, `useAppearance`). External stores with `useSyncExternalStore` avoid unnecessary re-renders.

**Tech Stack:** Next.js 16, React 19, TypeScript (strict), Three.js (raw), Zod (runtime validation + type derivation), es-toolkit (utilities: clamp, debounce, noop, etc.), Vitest + Storybook 10 for testing, no CSS dependencies.

**Spec:** `docs/superpowers/specs/2026-03-26-threejs-player-component-design.md`

**Important project notes:**
- Package manager: `yarn` (yarn.lock present)
- React Compiler enabled — no manual memoization needed
- React 19 — use `use()` not `useContext()`, ref is a regular prop
- Storybook is pre-configured with `@storybook/nextjs-vite`, a11y addon, vitest addon
- Vitest is pre-configured with Playwright browser testing
- GLSL files: store as inline strings in TypeScript (no vite-plugin-glsl configured)
- All player components need `'use client'` directive (Three.js requires browser APIs) — except `types.ts` which is pure type declarations
- Next.js 16 — check `node_modules/next/dist/docs/` if unsure about APIs
- Use `yarn` for all commands (not `npx`) — the project uses yarn as its package manager
- React Compiler handles memoization — do NOT use `useCallback`, `useMemo`, or `memo` manually
- Use Zod for all runtime validation — define schemas, derive types with `z.infer<typeof Schema>`
- Use es-toolkit for utilities — `clamp` from `es-toolkit/math`, `debounce` from `es-toolkit/function`, `noop` from `es-toolkit/function`, etc. Do NOT write custom utility functions when es-toolkit provides them
- es-toolkit docs: https://es-toolkit.dev/llms-full.txt

---

## File Structure

```
src/components/player/
├── types.ts                # All TypeScript interfaces and type exports
├── context.ts              # PlayerContext (public) + PlayerInternalContext (private)
├── playback-source.ts      # PlaybackSource class — external store wrapping <video>
├── appearance-store.ts     # VideoAppearanceStore — external store for padding/rounding
├── use-playback.ts         # usePlayback hook (useSyncExternalStore)
├── use-appearance.ts       # useAppearance hook (useSyncExternalStore)
├── shaders.ts              # GLSL vertex + fragment shaders as string constants
├── canvas.tsx              # Player.Canvas — scene host, renderer, camera, render loop
├── canvas-background.tsx   # Player.Canvas.Background — background image layer
├── canvas-video.tsx        # Player.Canvas.Video — video layer
├── index.ts                # Public API: Player compound component + hooks + types
```

```
src/components/player/__tests__/
├── playback-source.test.ts     # Unit tests for PlaybackSource
├── appearance-store.test.ts    # Unit tests for VideoAppearanceStore
```

```
src/components/player/__stories__/
├── player.stories.tsx          # Storybook stories for visual/integration testing
```

---

## Task 0: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install three.js, zod, and es-toolkit**

```bash
yarn add three zod es-toolkit && yarn add -D @types/three
```

- [ ] **Step 2: Verify installation**

```bash
node -e "require('three'); require('zod'); require('es-toolkit'); console.log('All deps OK')"
```

Expected: `All deps OK`

- [ ] **Step 3: Add unit test project to vitest config**

The current `vitest.config.ts` only has a Storybook browser project. Add a unit test project for non-browser tests. Read the existing `vitest.config.ts` and add a `unit` project:

Add this project to the `projects` array in `vitest.config.ts`:

```ts
{
  test: {
    name: 'unit',
    include: ['src/**/__tests__/**/*.test.ts'],
    environment: 'node',
  },
},
```

- [ ] **Step 4: Add test script to package.json**

Add `"test": "vitest"` to the `scripts` section of `package.json`.

- [ ] **Step 5: Commit**

```bash
git add package.json yarn.lock vitest.config.ts
git commit -m "chore: install three.js and configure unit test project"
```

---

## Task 1: Types

**Files:**
- Create: `src/components/player/types.ts`

- [ ] **Step 1: Create the types file**

```ts
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
```

- [ ] **Step 2: Verify types compile**

```bash
yarn tsc --noEmit --pretty
```

Expected: no errors (or only pre-existing errors unrelated to player/)

- [ ] **Step 3: Commit**

```bash
git add src/components/player/types.ts
git commit -m "feat(player): add TypeScript interfaces"
```

---

## Task 2: Context

**Files:**
- Create: `src/components/player/context.ts`

- [ ] **Step 1: Create context file**

```ts
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
```

- [ ] **Step 2: Verify types compile**

```bash
yarn tsc --noEmit --pretty
```

- [ ] **Step 3: Commit**

```bash
git add src/components/player/context.ts
git commit -m "feat(player): add React contexts"
```

---

## Task 3: PlaybackSource (external store)

**Files:**
- Create: `src/components/player/playback-source.ts`
- Create: `src/components/player/__tests__/playback-source.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/components/player/__tests__/playback-source.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPlaybackSource } from '../playback-source'
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

  it('setVolume() sets video.volume', () => {
    source.setVolume(0.5)
    expect(video.volume).toBe(0.5)
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
    // First play it
    source.play()
    source.syncControlled({ playing: false })
    expect(video.pause).toHaveBeenCalled()
  })

  it('destroy removes all event listeners', () => {
    source.destroy()
    expect(video.removeEventListener).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
yarn vitest run src/components/player/__tests__/playback-source.test.ts
```

Expected: FAIL — `createPlaybackSource` does not exist.

- [ ] **Step 3: Implement PlaybackSource**

Create `src/components/player/playback-source.ts`:

```ts
import { clamp } from 'es-toolkit/math'
import type { PlaybackSource, PlaybackState, ControlledPlaybackProps } from './types'

const VIDEO_EVENTS = [
  'play',
  'pause',
  'timeupdate',
  'durationchange',
  'volumechange',
  'ratechange',
  'seeking',
  'seeked',
  'waiting',
  'canplay',
  'ended',
  'error',
] as const

export function createPlaybackSource(video: HTMLVideoElement): PlaybackSource {
  const listeners = new Set<() => void>()

  function notify() {
    listeners.forEach((fn) => fn())
  }

  function onVideoEvent() {
    notify()
  }

  for (const event of VIDEO_EVENTS) {
    video.addEventListener(event, onVideoEvent)
  }

  function getState(): PlaybackState {
    return {
      isPlaying: !video.paused && !video.ended,
      currentTime: video.currentTime,
      duration: Number.isFinite(video.duration) ? video.duration : 0,
      volume: video.volume,
      isMuted: video.muted,
      playbackRate: video.playbackRate,
      isBuffering: video.readyState < 3 && !video.paused,
      isSeeking: video.seeking,
      isEnded: video.ended,
    }
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }

  function play() {
    video.play()
  }

  function pause() {
    video.pause()
  }

  function seek(time: number) {
    video.currentTime = time
  }

  function setVolume(value: number) {
    video.volume = clamp(value, 0, 1)
  }

  function setMuted(muted: boolean) {
    video.muted = muted
  }

  function setPlaybackRate(rate: number) {
    video.playbackRate = rate
  }

  function syncControlled(props: ControlledPlaybackProps) {
    if (props.playing !== undefined) {
      if (props.playing && video.paused) video.play()
      if (!props.playing && !video.paused) video.pause()
    }
    if (props.currentTime !== undefined && Math.abs(video.currentTime - props.currentTime) > 0.1) {
      video.currentTime = props.currentTime
    }
    if (props.volume !== undefined) {
      video.volume = clamp(props.volume, 0, 1)
    }
    if (props.muted !== undefined) {
      video.muted = props.muted
    }
    if (props.playbackRate !== undefined) {
      video.playbackRate = props.playbackRate
    }
  }

  function destroy() {
    for (const event of VIDEO_EVENTS) {
      video.removeEventListener(event, onVideoEvent)
    }
    listeners.clear()
  }

  return {
    play,
    pause,
    seek,
    setVolume,
    setMuted,
    setPlaybackRate,
    getState,
    subscribe,
    syncControlled,
    destroy,
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
yarn vitest run src/components/player/__tests__/playback-source.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/player/playback-source.ts src/components/player/__tests__/playback-source.test.ts
git commit -m "feat(player): implement PlaybackSource external store with tests"
```

---

## Task 4: VideoAppearanceStore (external store)

**Files:**
- Create: `src/components/player/appearance-store.ts`
- Create: `src/components/player/__tests__/appearance-store.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/components/player/__tests__/appearance-store.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest'
import { createAppearanceStore } from '../appearance-store'

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
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
yarn vitest run src/components/player/__tests__/appearance-store.test.ts
```

Expected: FAIL — `createAppearanceStore` does not exist.

- [ ] **Step 3: Implement VideoAppearanceStore**

Create `src/components/player/appearance-store.ts`:

```ts
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
    return { ...appearance }
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
yarn vitest run src/components/player/__tests__/appearance-store.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/player/appearance-store.ts src/components/player/__tests__/appearance-store.test.ts
git commit -m "feat(player): implement VideoAppearanceStore with tests"
```

---

## Task 5: Hooks — usePlayback and useAppearance

**Files:**
- Create: `src/components/player/use-playback.ts`
- Create: `src/components/player/use-appearance.ts`

- [ ] **Step 1: Implement usePlayback**

Create `src/components/player/use-playback.ts`:

```ts
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
```

- [ ] **Step 2: Implement useAppearance**

Create `src/components/player/use-appearance.ts`:

```ts
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
```

- [ ] **Step 3: Verify types compile**

```bash
yarn tsc --noEmit --pretty
```

- [ ] **Step 4: Commit**

```bash
git add src/components/player/use-playback.ts src/components/player/use-appearance.ts
git commit -m "feat(player): add usePlayback and useAppearance hooks"
```

---

## Task 6: Shaders

**Files:**
- Create: `src/components/player/shaders.ts`

- [ ] **Step 1: Create shader strings**

Create `src/components/player/shaders.ts`:

```ts
/**
 * Passthrough vertex shader.
 * Passes UV coordinates to fragment shader.
 */
export const roundedVideoVert = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

/**
 * Rounded rectangle fragment shader using SDF.
 * Discards fragments outside the rounded rect boundary.
 */
export const roundedVideoFrag = /* glsl */ `
uniform sampler2D videoTexture;
uniform vec2 resolution;
uniform float radius;
varying vec2 vUv;

float roundedRect(vec2 p, vec2 size, float r) {
  vec2 d = abs(p) - size + r;
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - r;
}

void main() {
  vec2 p = vUv * resolution - resolution * 0.5;
  float d = roundedRect(p, resolution * 0.5, radius);
  if (d > 0.0) discard;
  gl_FragColor = texture2D(videoTexture, vUv);
}
`
```

- [ ] **Step 2: Verify types compile**

```bash
yarn tsc --noEmit --pretty
```

- [ ] **Step 3: Commit**

```bash
git add src/components/player/shaders.ts
git commit -m "feat(player): add vertex and fragment shaders for rounded video"
```

---

## Task 7: Player.Canvas.Background

**Files:**
- Create: `src/components/player/canvas-background.tsx`

- [ ] **Step 1: Implement Background component**

Create `src/components/player/canvas-background.tsx`:

```tsx
'use client'

import { useEffect, useRef, use } from 'react'
import {
  TextureLoader,
  PlaneGeometry,
  MeshBasicMaterial,
  Mesh,
  type Texture,
} from 'three'
import { PlayerInternalContext } from './context'
import type { CanvasBackgroundProps } from './types'

const LAYER_ID = 'background'
const Z_INDEX = 0

export function CanvasBackground({ backgroundSrc, 'aria-label': ariaLabel }: CanvasBackgroundProps) {
  const internal = use(PlayerInternalContext)

  if (!internal) {
    throw new Error('Player.Canvas.Background must be used inside <Player.Canvas>')
  }

  const meshRef = useRef<Mesh | null>(null)
  const textureRef = useRef<Texture | null>(null)

  useEffect(() => {
    const loader = new TextureLoader()
    let disposed = false

    loader.load(
      backgroundSrc,
      (texture) => {
        if (disposed) {
          texture.dispose()
          return
        }

        textureRef.current = texture

        const geometry = new PlaneGeometry(1, 1)
        const material = new MeshBasicMaterial({ map: texture })
        const mesh = new Mesh(geometry, material)

        meshRef.current = mesh
        internal.registerMesh(LAYER_ID, mesh, Z_INDEX)
      },
      undefined,
      () => {
        if (!disposed) {
          internal.reportError(new Error(`Failed to load background image: ${backgroundSrc}`))
        }
      },
    )

    return () => {
      disposed = true
      internal.unregisterMesh(LAYER_ID)

      if (meshRef.current) {
        meshRef.current.geometry.dispose()
        ;(meshRef.current.material as MeshBasicMaterial).dispose()
        meshRef.current = null
      }

      if (textureRef.current) {
        textureRef.current.dispose()
        textureRef.current = null
      }
    }
  }, [backgroundSrc, internal])

  // Render in sr-only region (not display:none — that hides from AT)
  return ariaLabel ? (
    <div role="img" aria-label={ariaLabel} />
  ) : null
}

CanvasBackground.displayName = 'CanvasBackground'
```

- [ ] **Step 2: Verify types compile**

```bash
yarn tsc --noEmit --pretty
```

- [ ] **Step 3: Commit**

```bash
git add src/components/player/canvas-background.tsx
git commit -m "feat(player): implement Canvas.Background component"
```

---

## Task 8: Player.Canvas.Video

**Files:**
- Create: `src/components/player/canvas-video.tsx`

- [ ] **Step 1: Implement Video component**

Create `src/components/player/canvas-video.tsx`:

```tsx
'use client'

import { useEffect, useRef, use } from 'react'
import {
  VideoTexture,
  PlaneGeometry,
  ShaderMaterial,
  Mesh,
  LinearFilter,
  SRGBColorSpace,
  Vector2,
} from 'three'
import { PlayerInternalContext, AppearanceContext } from './context'
import { createPlaybackSource } from './playback-source'
import { roundedVideoVert, roundedVideoFrag } from './shaders'
import type { CanvasVideoProps, PlaybackSource } from './types'

const LAYER_ID = 'video'
const Z_INDEX = 1

export function CanvasVideo({ videoSrc, 'aria-label': ariaLabel }: CanvasVideoProps) {
  const internal = use(PlayerInternalContext)

  if (!internal) {
    throw new Error('Player.Canvas.Video must be used inside <Player.Canvas>')
  }

  // Render video element in DOM (inside sr-only region for a11y)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const meshRef = useRef<Mesh | null>(null)
  const materialRef = useRef<ShaderMaterial | null>(null)
  const playbackRef = useRef<PlaybackSource | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    let disposed = false

    function onCanPlay() {
      if (disposed) return

      const texture = new VideoTexture(video!)
      texture.minFilter = LinearFilter
      texture.magFilter = LinearFilter
      texture.colorSpace = SRGBColorSpace

      const geometry = new PlaneGeometry(1, 1)
      const material = new ShaderMaterial({
        uniforms: {
          videoTexture: { value: texture },
          resolution: { value: new Vector2(1, 1) },
          radius: { value: 0 },
        },
        vertexShader: roundedVideoVert,
        fragmentShader: roundedVideoFrag,
        transparent: true,
      })

      const mesh = new Mesh(geometry, material)
      meshRef.current = mesh
      materialRef.current = material

      internal.registerMesh(LAYER_ID, mesh, Z_INDEX)

      // Create and register PlaybackSource
      const source = createPlaybackSource(video!)
      playbackRef.current = source
      internal.registerPlayback(source)
    }

    function onError() {
      if (!disposed) {
        internal.reportError(new Error(`Failed to load video: ${videoSrc}`))
      }
    }

    video.addEventListener('canplay', onCanPlay, { once: true })
    video.addEventListener('error', onError)
    video.load()

    return () => {
      disposed = true

      video.removeEventListener('canplay', onCanPlay)
      video.removeEventListener('error', onError)

      if (playbackRef.current) {
        internal.unregisterPlayback()
        playbackRef.current.destroy()
        playbackRef.current = null
      }

      internal.unregisterMesh(LAYER_ID)

      if (meshRef.current) {
        meshRef.current.geometry.dispose()
        meshRef.current = null
      }

      if (materialRef.current) {
        materialRef.current.uniforms.videoTexture.value?.dispose()
        materialRef.current.dispose()
        materialRef.current = null
      }

      video.pause()
      video.removeAttribute('src')
      video.load()
    }
  }, [videoSrc, internal])

  // Video element rendered in DOM for a11y (lives inside sr-only region via Canvas)
  return (
    <video
      ref={videoRef}
      crossOrigin="anonymous"
      playsInline
      preload="auto"
      src={videoSrc}
      aria-label={ariaLabel ?? 'Video'}
      tabIndex={-1}
    />
  )
}

CanvasVideo.displayName = 'CanvasVideo'
```

- [ ] **Step 2: Verify types compile**

```bash
yarn tsc --noEmit --pretty
```

- [ ] **Step 3: Commit**

```bash
git add src/components/player/canvas-video.tsx
git commit -m "feat(player): implement Canvas.Video component with shader material"
```

---

## Task 9: Player.Canvas (scene host)

**Files:**
- Create: `src/components/player/canvas.tsx`

This is the largest component. It creates the Three.js renderer/scene/camera, manages the render loop, provides all contexts, handles controlled props, and fires event callbacks.

- [ ] **Step 1: Implement Canvas component**

Create `src/components/player/canvas.tsx`:

```tsx
'use client'

import { useEffect, useRef, useState, Children, isValidElement, type CSSProperties } from 'react'
import { WebGLRenderer, Scene, OrthographicCamera, Mesh, PlaneGeometry } from 'three'
import {
  PlayerContext,
  PlayerInternalContext,
  PlaybackContext,
  AppearanceContext,
} from './context'
import { createAppearanceStore } from './appearance-store'
import type {
  PlayerCanvasProps,
  PlayerState,
  PlayerInternalContextValue,
  PlaybackSource,
  PlaybackState,
  VideoAppearanceStore,
  VideoAppearance,
} from './types'

const SR_ONLY: CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  borderWidth: 0,
}

export function PlayerCanvas(props: PlayerCanvasProps) {
  const {
    'aria-label': ariaLabel,
    children,
    className,
    style,
    // Controlled playback
    playing,
    currentTime,
    volume,
    muted,
    playbackRate,
    // Controlled appearance
    padding: controlledPadding,
    rounding: controlledRounding,
    defaultPadding,
    defaultRounding,
    // Event callbacks
    onPlay,
    onPause,
    onEnded,
    onTimeUpdate,
    onDurationChange,
    onSeeking,
    onSeeked,
    onReady,
    onBuffering,
    onVolumeChange,
    onPaddingChange,
    onRoundingChange,
    onError,
  } = props

  // Refs for Three.js
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<WebGLRenderer | null>(null)
  const sceneRef = useRef<Scene | null>(null)
  const cameraRef = useRef<OrthographicCamera | null>(null)
  const animFrameRef = useRef<number>(0)
  const meshesRef = useRef<Map<string, { mesh: Mesh; zIndex: number }>>(new Map())

  // Playback source registered by Video child
  const [playbackSource, setPlaybackSource] = useState<PlaybackSource | null>(null)

  // Appearance store
  const [appearanceStore] = useState(() =>
    createAppearanceStore({ defaultPadding, defaultRounding }),
  )

  // Player state
  const [playerState, setPlayerState] = useState<PlayerState>({
    isReady: false,
    error: null,
  })

  // Announcement for a11y
  const [announcement, setAnnouncement] = useState('')

  // --- Validate children ---
  // Ensure at least one Video child exists

  useEffect(() => {
    let hasVideo = false
    Children.forEach(children, (child) => {
      if (isValidElement(child) && (child.type as any)?.displayName === 'CanvasVideo') {
        hasVideo = true
      }
    })
    if (!hasVideo) {
      const err = new Error('Player.Canvas requires at least one <Player.Canvas.Video> child')
      setPlayerState((prev) => ({ ...prev, error: err }))
      onError?.(err)
    }
  }, [children, onError])

  // --- Internal context functions ---
  // React Compiler handles memoization — no useCallback needed

  function reportError(error: Error) {
    setPlayerState((prev) => ({ ...prev, error }))
    onError?.(error)
    setAnnouncement(`Error: ${error.message}`)
  }

  function clearError() {
    setPlayerState((prev) => ({ ...prev, error: null }))
  }

  function registerMesh(id: string, mesh: Mesh, zIndex: number) {
    mesh.position.z = zIndex
    meshesRef.current.set(id, { mesh, zIndex })
    sceneRef.current?.add(mesh)
  }

  function unregisterMesh(id: string) {
    const entry = meshesRef.current.get(id)
    if (entry) {
      sceneRef.current?.remove(entry.mesh)
      meshesRef.current.delete(id)
    }
  }

  function registerPlayback(source: PlaybackSource) {
    setPlaybackSource(source)
    setPlayerState((prev) => ({ ...prev, isReady: true }))
    onReady?.()
    setAnnouncement('Video ready')
  }

  function unregisterPlayback() {
    setPlaybackSource(null)
    setPlayerState((prev) => ({ ...prev, isReady: false }))
  }

  function registerAppearance(_store: VideoAppearanceStore) {
    // No-op — appearance store is created by Canvas.
    // Kept for future extensibility.
  }

  function unregisterAppearance() {}

  const internalValue: PlayerInternalContextValue = {
    registerMesh,
    unregisterMesh,
    registerPlayback,
    unregisterPlayback,
    registerAppearance,
    unregisterAppearance,
    reportError,
    clearError,
  }

  // --- Sync controlled playback props ---

  useEffect(() => {
    if (playbackSource) {
      playbackSource.syncControlled({ playing, currentTime, volume, muted, playbackRate })
    }
  }, [playbackSource, playing, currentTime, volume, muted, playbackRate])

  // --- Sync controlled appearance props ---

  useEffect(() => {
    appearanceStore.syncControlled({
      padding: controlledPadding,
      rounding: controlledRounding,
    })
  }, [appearanceStore, controlledPadding, controlledRounding])

  // --- Subscribe to playback events for callbacks ---

  useEffect(() => {
    if (!playbackSource) return

    let prevState: PlaybackState = playbackSource.getState()

    const unsub = playbackSource.subscribe(() => {
      const next = playbackSource.getState()

      if (!prevState.isPlaying && next.isPlaying) {
        onPlay?.()
        setAnnouncement('Playing')
      }
      if (prevState.isPlaying && !next.isPlaying && !next.isEnded) {
        onPause?.()
        setAnnouncement(`Paused at ${formatTime(next.currentTime)}`)
      }
      if (!prevState.isEnded && next.isEnded) {
        onEnded?.()
        setAnnouncement('Video ended')
      }
      if (prevState.currentTime !== next.currentTime) {
        onTimeUpdate?.(next.currentTime)
      }
      if (prevState.duration !== next.duration) {
        onDurationChange?.(next.duration)
      }
      if (!prevState.isSeeking && next.isSeeking) {
        onSeeking?.()
      }
      if (prevState.isSeeking && !next.isSeeking) {
        onSeeked?.()
      }
      if (!prevState.isBuffering && next.isBuffering) {
        onBuffering?.()
        setAnnouncement('Buffering')
      }
      if (prevState.volume !== next.volume || prevState.isMuted !== next.isMuted) {
        onVolumeChange?.(next.volume, next.isMuted)
      }

      prevState = next
    })

    return unsub
  }, [playbackSource])

  // --- Subscribe to appearance changes for callbacks ---

  useEffect(() => {
    let prev: VideoAppearance = appearanceStore.getAppearance()

    const unsub = appearanceStore.subscribe(() => {
      const next = appearanceStore.getAppearance()
      if (prev.padding !== next.padding) {
        onPaddingChange?.(next.padding)
      }
      if (prev.rounding !== next.rounding) {
        onRoundingChange?.(next.rounding)
      }
      prev = next
    })

    return unsub
  }, [appearanceStore])

  // --- Three.js setup ---

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    rendererRef.current = renderer

    const scene = new Scene()
    sceneRef.current = scene

    // OrthographicCamera(left, right, top, bottom, near, far)
    // top > bottom for standard screen-space (Y=0 at bottom)
    const camera = new OrthographicCamera(0, 1, 1, 0, 0.1, 1000)
    camera.position.z = 10
    cameraRef.current = camera

    // Resize handler
    function resize() {
      const { clientWidth: w, clientHeight: h } = container!
      if (w === 0 || h === 0) return

      renderer.setSize(w, h)
      camera.left = 0
      camera.right = w
      camera.top = h
      camera.bottom = 0
      camera.updateProjectionMatrix()

      updateMeshSizes(w, h)
      renderer.render(scene, camera)
    }

    function updateMeshSizes(w: number, h: number) {
      const appearance = appearanceStore.getAppearance()

      for (const [id, { mesh }] of meshesRef.current) {
        if (id === 'background') {
          mesh.geometry.dispose()
          mesh.geometry = new PlaneGeometry(w, h)
          mesh.position.set(w / 2, h / 2, 0)
        } else if (id === 'video') {
          const pad = (appearance.padding / 100) * Math.min(w, h)
          const vw = w - pad * 2
          const vh = h - pad * 2
          mesh.geometry.dispose()
          mesh.geometry = new PlaneGeometry(vw, vh)
          mesh.position.set(w / 2, h / 2, 1)

          const mat = mesh.material as import('three').ShaderMaterial
          if (mat.uniforms) {
            mat.uniforms.resolution.value.set(vw, vh)
            mat.uniforms.radius.value = (appearance.rounding / 100) * Math.min(vw, vh) * 0.5
          }
        }
      }
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container)
    resize()

    // Appearance change → update meshes
    const unsubAppearance = appearanceStore.subscribe(() => {
      const { clientWidth: w, clientHeight: h } = container!
      updateMeshSizes(w, h)
      renderer.render(scene, camera)
    })

    // Render loop with optimization: stop when video paused + no changes
    let running = true
    let needsRender = true

    function requestRender() {
      needsRender = true
    }

    function animate() {
      if (!running) return
      animFrameRef.current = requestAnimationFrame(animate)

      // Only render when needed
      if (needsRender) {
        renderer.render(scene, camera)
        needsRender = false
      }
    }

    // Subscribe to playback to know when video is playing (needs continuous render)
    // This subscription is set up once and stays for the lifetime of the Three.js setup
    let playbackUnsub: (() => void) | null = null
    function watchPlayback() {
      // Check if there's a registered playback source via the meshes (proxy)
      // The actual continuous render decision is: if video is playing, always render
      needsRender = true
    }

    animate()

    // WebGL context loss
    function onContextLost(e: Event) {
      e.preventDefault()
      running = false
      cancelAnimationFrame(animFrameRef.current)
      reportError(new Error('WebGL context lost'))
    }

    function onContextRestored() {
      // Recreate renderer after context restore
      renderer.dispose()
      const newRenderer = new WebGLRenderer({ canvas: canvas!, alpha: true, antialias: true })
      newRenderer.setPixelRatio(window.devicePixelRatio)
      rendererRef.current = newRenderer

      running = true
      needsRender = true
      resize()
      animate()
      clearError()
    }

    canvas.addEventListener('webglcontextlost', onContextLost)
    canvas.addEventListener('webglcontextrestored', onContextRestored)

    return () => {
      running = false
      cancelAnimationFrame(animFrameRef.current)
      resizeObserver.disconnect()
      unsubAppearance()
      canvas.removeEventListener('webglcontextlost', onContextLost)
      canvas.removeEventListener('webglcontextrestored', onContextRestored)
      renderer.dispose()
      rendererRef.current = null
      sceneRef.current = null
      cameraRef.current = null
    }
  }, [appearanceStore])

  // --- Public context ---

  const contextValue = {
    state: playerState,
    meta: {
      canvasRef,
      rendererRef,
      sceneRef,
    },
  }

  return (
    <PlayerContext value={contextValue}>
      <PlayerInternalContext value={internalValue}>
        <PlaybackContext value={playbackSource}>
          <AppearanceContext value={appearanceStore}>
            <div
              ref={containerRef}
              role="group"
              aria-label={ariaLabel}
              className={className}
              style={{ position: 'relative', ...style }}
            >
              <canvas ref={canvasRef} aria-hidden="true" />
              <div style={SR_ONLY}>
                {/* Children (Background, Video) render a11y content here:
                    - Video renders <video> element with aria-label + tabIndex={-1}
                    - Background renders <div role="img" aria-label="..."> */}
                {children}
                <div role="status" aria-live="polite" aria-atomic="true">
                  {announcement}
                </div>
              </div>
            </div>
          </AppearanceContext>
        </PlaybackContext>
      </PlayerInternalContext>
    </PlayerContext>
  )
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}
```

- [ ] **Step 2: Verify types compile**

```bash
yarn tsc --noEmit --pretty
```

- [ ] **Step 3: Commit**

```bash
git add src/components/player/canvas.tsx
git commit -m "feat(player): implement Canvas scene host with Three.js, contexts, and a11y"
```

---

## Task 10: Public API (index.ts) — Compound Component Assembly

**Files:**
- Create: `src/components/player/index.ts`

- [ ] **Step 1: Create the barrel export**

Create `src/components/player/index.ts`:

```ts
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
```

- [ ] **Step 2: Verify types compile**

```bash
yarn tsc --noEmit --pretty
```

- [ ] **Step 3: Verify import path works**

Create a temporary test in the app page to check the import resolves:

```bash
yarn tsc --noEmit --pretty 2>&1 | head -20
```

If no errors, the barrel export is wired correctly.

- [ ] **Step 4: Commit**

```bash
git add src/components/player/index.ts
git commit -m "feat(player): assemble compound component public API"
```

---

## Task 11: Storybook Stories (Integration Testing)

**Files:**
- Create: `src/components/player/__stories__/player.stories.tsx`

The Storybook setup already has a11y addon and vitest addon configured. Stories serve as both visual tests and integration tests.

- [ ] **Step 1: Download sample assets**

Place small sample assets in `public/` for stories. You can use any short video and image — for example:

```bash
# Create placeholder files for stories
# In practice, use real small assets (< 1MB each)
echo "placeholder" > public/sample-bg.jpg
echo "placeholder" > public/sample-video.mp4
```

Note: Replace these with real small video/image files for actual visual testing. The stories will work with any valid media files.

- [ ] **Step 2: Create stories**

Create `src/components/player/__stories__/player.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import { Player, usePlayback, useAppearance } from '../index'

const meta = {
  title: 'Components/Player',
  component: Player.Canvas,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof Player.Canvas>

export default meta
type Story = StoryObj<typeof meta>

// --- Helper: minimal controls for testing ---

function TestControls() {
  const playback = usePlayback()
  const appearance = useAppearance()

  return (
    <div style={{ padding: 8 }}>
      <div>
        <button
          aria-label={playback.isPlaying ? 'Pause video' : 'Play video'}
          onClick={() => (playback.isPlaying ? playback.pause() : playback.play())}
        >
          {playback.isPlaying ? 'Pause' : 'Play'}
        </button>
        <span>
          {' '}{Math.floor(playback.currentTime)}s / {Math.floor(playback.duration)}s
        </span>
      </div>
      <div>
        <label>
          Seek:{' '}
          <input
            type="range"
            aria-label="Seek video timeline"
            min={0}
            max={playback.duration || 100}
            step={0.1}
            value={playback.currentTime}
            onChange={(e) => playback.seek(Number(e.target.value))}
          />
        </label>
      </div>
      <div>
        <label>
          Padding:{' '}
          <input
            type="range"
            aria-label="Video padding"
            min={0}
            max={100}
            value={appearance.padding}
            onChange={(e) => appearance.setPadding(Number(e.target.value))}
          />
        </label>
        <label>
          Rounding:{' '}
          <input
            type="range"
            aria-label="Video rounding"
            min={0}
            max={100}
            value={appearance.rounding}
            onChange={(e) => appearance.setRounding(Number(e.target.value))}
          />
        </label>
      </div>
    </div>
  )
}

// --- Stories ---

export const Uncontrolled: Story = {
  render: () => (
    <Player.Canvas aria-label="Uncontrolled demo player" style={{ width: '100%', height: '80vh' }}>
      <Player.Canvas.Background backgroundSrc="/sample-bg.jpg" />
      <Player.Canvas.Video videoSrc="/sample-video.mp4" />
      <TestControls />
    </Player.Canvas>
  ),
}

export const VideoOnly: Story = {
  render: () => (
    <Player.Canvas aria-label="Video only player" style={{ width: '100%', height: '80vh' }}>
      <Player.Canvas.Video videoSrc="/sample-video.mp4" />
      <TestControls />
    </Player.Canvas>
  ),
}

export const FullyControlled: Story = {
  render: function ControlledStory() {
    const [isPlaying, setIsPlaying] = useState(false)
    const [seekPos, setSeekPos] = useState(0)
    const [vol, setVol] = useState(1)
    const [isMuted, setIsMuted] = useState(false)
    const [pad, setPad] = useState(20)
    const [round, setRound] = useState(12)

    return (
      <div>
        <Player.Canvas
          aria-label="Controlled demo player"
          style={{ width: '100%', height: '60vh' }}
          playing={isPlaying}
          currentTime={seekPos}
          volume={vol}
          muted={isMuted}
          padding={pad}
          rounding={round}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={(t) => setSeekPos(t)}
          onVolumeChange={(v, m) => { setVol(v); setIsMuted(m) }}
          onPaddingChange={setPad}
          onRoundingChange={setRound}
        >
          <Player.Canvas.Background backgroundSrc="/sample-bg.jpg" />
          <Player.Canvas.Video videoSrc="/sample-video.mp4" />
        </Player.Canvas>
        <div style={{ padding: 8 }}>
          <button onClick={() => setIsPlaying(!isPlaying)}>
            {isPlaying ? 'Pause' : 'Play'} (external)
          </button>
          <label>
            Volume: <input type="range" min={0} max={1} step={0.01} value={vol} onChange={(e) => setVol(Number(e.target.value))} />
          </label>
          <label>
            Padding: <input type="range" min={0} max={100} value={pad} onChange={(e) => setPad(Number(e.target.value))} />
          </label>
          <label>
            Rounding: <input type="range" min={0} max={100} value={round} onChange={(e) => setRound(Number(e.target.value))} />
          </label>
        </div>
      </div>
    )
  },
}
```

- [ ] **Step 3: Verify Storybook starts**

```bash
yarn storybook &
# Wait a few seconds, then check it opens
# Or: yarn build-storybook to verify compilation
```

- [ ] **Step 4: Commit**

```bash
git add src/components/player/__stories__/player.stories.tsx public/sample-bg.jpg public/sample-video.mp4
git commit -m "feat(player): add Storybook stories for visual/integration testing"
```

---

## Task 12: Next.js Integration Smoke Test

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Add player to the home page as a smoke test**

Read the current `src/app/page.tsx` first, then replace its content with a minimal page that uses the player:

```tsx
'use client'

import { Player, usePlayback, useAppearance } from '@/components/player'

function Controls() {
  const playback = usePlayback()
  const appearance = useAppearance()

  return (
    <div>
      <button
        aria-label={playback.isPlaying ? 'Pause' : 'Play'}
        onClick={() => (playback.isPlaying ? playback.pause() : playback.play())}
      >
        {playback.isPlaying ? 'Pause' : 'Play'}
      </button>
      <input
        type="range"
        aria-label="Seek"
        min={0}
        max={playback.duration || 100}
        step={0.1}
        value={playback.currentTime}
        onChange={(e) => playback.seek(Number(e.target.value))}
      />
      <input
        type="range"
        aria-label="Padding"
        min={0}
        max={100}
        value={appearance.padding}
        onChange={(e) => appearance.setPadding(Number(e.target.value))}
      />
      <input
        type="range"
        aria-label="Rounding"
        min={0}
        max={100}
        value={appearance.rounding}
        onChange={(e) => appearance.setRounding(Number(e.target.value))}
      />
    </div>
  )
}

export default function Home() {
  return (
    <main>
      <Player.Canvas
        aria-label="Demo video player"
        style={{ width: '100%', height: '80vh' }}
        onError={(e) => console.error('Player error:', e)}
      >
        <Player.Canvas.Background backgroundSrc="/sample-bg.jpg" />
        <Player.Canvas.Video videoSrc="/sample-video.mp4" />
        <Controls />
      </Player.Canvas>
    </main>
  )
}
```

- [ ] **Step 2: Verify Next.js builds**

```bash
yarn build
```

Expected: build succeeds with no errors.

- [ ] **Step 3: Verify dev server starts**

```bash
yarn dev &
# Open http://localhost:3000 — canvas should render, controls should work
```

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add player smoke test to home page"
```

---

## Task Order & Dependencies

```
Task 0: Install Dependencies
  ↓
Task 1: Types
  ↓
Task 2: Context
  ↓
Task 3: PlaybackSource (external store) ←── TDD
  ↓
Task 4: AppearanceStore (external store) ←── TDD
  ↓
Task 5: Hooks (usePlayback, useAppearance)
  ↓
Task 6: Shaders
  ↓
Task 7: Canvas.Background
  ↓
Task 8: Canvas.Video
  ↓
Task 9: Canvas (scene host)
  ↓
Task 10: Public API (index.ts)
  ↓
Task 11: Storybook Stories
  ↓
Task 12: Next.js Smoke Test
```

Tasks 3 and 4 are independent and can run in parallel. Tasks 7 and 8 are independent and can run in parallel. All other tasks are sequential.
