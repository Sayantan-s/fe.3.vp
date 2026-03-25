# Three.js Video Player Component — Design Spec

## Overview

A headless, unstyled, accessible compound component that renders a video composited over a background image on a Three.js canvas. Built as a self-contained, reusable component that can be dropped into any part of an application.

No built-in controls, no animations, no styles. Consumers build their own UI using exposed state/actions/meta via React context.

## Scope

Only the Three.js player component (right panel from arch.md). Does not include transcript sidebar, skip/unskip, or any application shell.

## Tech Stack

- Next.js 16 + TypeScript (strict)
- React 19 (use `use()` not `useContext()`, ref as regular prop)
- React Compiler enabled (no manual memoization needed)
- Three.js (raw, no R3F)
- CSS Modules (project convention, though this component is headless — minimal CSS for sr-only)

---

## Component API

### Usage

```tsx
import { Player } from '@/components/player'

<Player.Canvas
  onError={(error) => console.error(error)}
  aria-label="Product demo video player"
>
  <Player.Canvas.Background backgroundSrc="/bg.jpg" />
  <Player.Canvas.Video videoSrc="/demo.mp4" />
</Player.Canvas>
```

### `Player.Canvas`

The scene host. Creates Three.js renderer, scene, camera, render loop. Validates children. Provides context.

| Prop | Type | Required | Description |
|---|---|---|---|
| `onError` | `(error: Error) => void` | No | Callback when any child reports an error |
| `aria-label` | `string` | Yes | Accessible label for the player group |
| `children` | `ReactNode` | Yes | Canvas layer children |

### `Player.Canvas.Background`

Optional. Renders a background image as a full-scene plane at z: 0.

| Prop | Type | Required | Description |
|---|---|---|---|
| `backgroundSrc` | `string` | Yes (if used) | URL of the background image |
| `aria-label` | `string` | No | Accessible description of the background |

### `Player.Canvas.Video`

Mandatory. Renders a video as a textured plane at z: 1 with padding/rounding support.

| Prop | Type | Required | Description |
|---|---|---|---|
| `videoSrc` | `string` | Yes | URL of the video file |
| `aria-label` | `string` | No | Accessible description of the video |

### Validation Rules

- Canvas fires `onError` if `Player.Canvas.Video` child exists without `videoSrc`
- Canvas fires `onError` if `Player.Canvas.Background` child exists without `backgroundSrc`
- Canvas fires `onError` if no `Player.Canvas.Video` child is present

---

## Context — State / Actions / Meta

Follows Vercel composition pattern: three-part interface.

### PlayerState

```ts
interface PlayerState {
  isReady: boolean
  error: Error | null
}
```

Canvas-level only. Playback state lives on the PlaybackSource (see below).

### PlayerActions

```ts
interface PlayerActions {
  registerMesh: (id: string, mesh: THREE.Mesh, zIndex: number) => void
  unregisterMesh: (id: string) => void
  registerPlayback: (playback: PlaybackSource) => void
  unregisterPlayback: () => void
  reportError: (error: Error) => void
}
```

### PlayerMeta

```ts
interface PlayerMeta {
  canvasRef: React.RefObject<HTMLCanvasElement>
  rendererRef: React.RefObject<THREE.WebGLRenderer>
  sceneRef: React.RefObject<THREE.Scene>
}
```

---

## Playback — Owned by Video, Exposed via Context

Video registers a `PlaybackSource` into context. Consumers subscribe to it for playback state.

```ts
interface PlaybackSource {
  play: () => void
  pause: () => void
  seek: (time: number) => void
  getState: () => PlaybackState
  subscribe: (listener: () => void) => () => void
  element: HTMLVideoElement
}

interface PlaybackState {
  isPlaying: boolean
  currentTime: number
  duration: number
  isBuffering: boolean
  isEnded: boolean
}
```

### Why subscribe pattern?

`timeupdate` fires ~4 times/second. Using `setState` would re-render the entire tree. Instead:

- `PlaybackSource` is an external store
- Consumers use `useSyncExternalStore(subscribe, getState)` to opt-in
- Only components that read specific playback fields re-render
- Three.js render loop reads `getState()` directly — zero React involvement

### Consumer example

```tsx
function CustomControls() {
  const { actions } = use(PlayerContext)
  const playback = usePlayback() // hook using useSyncExternalStore

  return (
    <div>
      <button
        aria-label={playback.isPlaying ? 'Pause video' : 'Play video'}
        onClick={() => playback.isPlaying ? actions.playback.pause() : actions.playback.play()}
      >
        {playback.isPlaying ? 'Pause' : 'Play'}
      </button>
      <input
        type="range"
        aria-label="Seek video timeline"
        value={playback.currentTime}
        max={playback.duration}
        onChange={(e) => actions.playback.seek(Number(e.target.value))}
      />
    </div>
  )
}
```

---

## Padding & Rounding — Controlled / Uncontrolled

Padding and rounding are properties of the Video layer. They affect the video mesh size and shader.

### On Canvas context (not Video props)

Since consumers need to read/write these values from external controls, they live on a separate context-level store — same subscribe pattern as playback:

```ts
interface VideoAppearance {
  padding: number   // 0–100
  rounding: number  // 0–100
}

interface VideoAppearanceActions {
  setPadding: (value: number) => void
  setRounding: (value: number) => void
  getAppearance: () => VideoAppearance
  subscribe: (listener: () => void) => () => void
}
```

Controlled/uncontrolled via Canvas props:

```tsx
// Uncontrolled (internal state, defaults)
<Player.Canvas onError={fn} aria-label="Player">
  ...
</Player.Canvas>

// Controlled
<Player.Canvas
  onError={fn}
  aria-label="Player"
  padding={padding}
  rounding={rounding}
  onPaddingChange={setPadding}
  onRoundingChange={setRounding}
>
  ...
</Player.Canvas>

// Uncontrolled with initial values
<Player.Canvas
  onError={fn}
  aria-label="Player"
  defaultPadding={20}
  defaultRounding={12}
>
  ...
</Player.Canvas>
```

---

## Three.js Rendering Internals

### Camera

OrthographicCamera. 2D compositing scene — no perspective.

```
left: 0, right: containerWidth
top: 0, bottom: containerHeight
near: 0.1, far: 1000
```

On resize: update camera bounds + renderer size.

### Scene Graph

```
Scene
├── Background mesh (z: 0)
│   ├── PlaneGeometry (full scene size)
│   └── MeshBasicMaterial + ImageTexture
│
└── Video mesh (z: 1)
    ├── PlaneGeometry (scene size minus padding)
    └── Custom ShaderMaterial + VideoTexture
```

### Background Mesh

- `THREE.TextureLoader` loads image from `backgroundSrc`
- `PlaneGeometry` sized to fill scene
- `MeshBasicMaterial` — no lighting
- Aspect ratio: cover fit (fills scene, crops overflow)
- On resize: geometry scales to maintain cover fit

### Video Mesh

- Hidden `<video>` element in DOM (browser media pipeline requirement)
- `THREE.VideoTexture` wraps the `<video>` element
- `PlaneGeometry` sized to `(sceneWidth - padding*2, sceneHeight - padding*2)`
- Centered in scene
- Custom `ShaderMaterial` for rounded corners

### Rounding via Fragment Shader

Rounding is implemented as a signed distance field (SDF) in the fragment shader. No geometry rebuild on rounding change — just update a uniform.

```glsl
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
```

Changing rounding = update `radius` uniform. Zero CPU cost.

### Padding

Changing padding = resize `PlaneGeometry` + reposition to center. Geometry is rebuilt (cheap — it's one quad).

### Render Loop

```
requestAnimationFrame:
  1. VideoTexture auto-updates from <video> element
  2. renderer.render(scene, camera)

Optimization:
  - When video paused AND no interaction → stop loop
  - Resume on: play, padding change, rounding change, resize
```

### Responsive Sizing

- `ResizeObserver` on container element
- On resize:
  1. `renderer.setSize(width, height)`
  2. Update camera bounds
  3. Recalculate background mesh (cover fit)
  4. Recalculate video mesh (apply padding)
  5. Trigger render

### Video Readiness

Before rendering Video mesh:
1. `loadedmetadata` — dimensions known, duration available
2. `canplay` — enough data buffered
3. Only then: create VideoTexture, build mesh, `registerMesh`
4. If `error` event on `<video>` → `reportError` via context

---

## Accessibility

### Problem

`<canvas>` is opaque to assistive technology.

### Solution

Hidden live region alongside canvas provides parallel accessible description.

### DOM Structure

```tsx
<div role="group" aria-label={ariaLabel}>
  <canvas aria-hidden="true" />
  <div class="sr-only">
    <video aria-label="..." tabIndex={-1} />
    <div role="img" aria-label="..." />  {/* background description */}
    <div role="status" aria-live="polite" aria-atomic="true">
      {/* "Playing", "Paused at 1:23", "Buffering", "Error: ..." */}
    </div>
  </div>
  {children}
</div>
```

### Guarantees

| Concern | How |
|---|---|
| Screen reader awareness | `role="group"` + `aria-label` on wrapper |
| Canvas opacity | `aria-hidden="true"` on canvas, parallel hidden region |
| State announcements | `aria-live="polite"` for play/pause/error, debounced |
| Keyboard | No traps. Consumer builds focusable controls |
| Error communication | Announced via live region + `onError` callback |
| Media description | `aria-label` on Video and Background |

### Consumer Responsibility

Component exposes accessible state. Consumer builds accessible controls using context. Headless = no rendered controls, but state makes it trivial to build accessible ones.

---

## File Structure

```
src/components/player/
├── canvas.tsx              # Player.Canvas
├── canvas-background.tsx   # Player.Canvas.Background
├── canvas-video.tsx        # Player.Canvas.Video
├── context.ts              # PlayerContext (state/actions/meta)
├── use-playback.ts         # usePlayback hook (useSyncExternalStore)
├── use-appearance.ts       # useAppearance hook (padding/rounding)
├── types.ts                # All TypeScript interfaces
├── shaders/
│   └── rounded-video.glsl  # Rounded rect fragment shader
└── index.ts                # Public API: Player compound component
```

## Public Exports

```ts
// index.ts
export { Player }           // Compound component
export { usePlayback }      // Subscribe to playback state
export { useAppearance }    // Subscribe to padding/rounding state
export { PlayerContext }     // Raw context (escape hatch)

// Types
export type {
  PlayerState,
  PlayerActions,
  PlayerMeta,
  PlaybackSource,
  PlaybackState,
  VideoAppearance,
  VideoAppearanceActions,
}
```

---

## MP4 Export — Architecture (Discussion Only)

### Recommended: Server-side encoding

Server receives export request (videoSrc, backgroundSrc, padding, rounding, skip segments, fps) → Headless Chrome with Puppeteer runs the same component → seek-based frame capture → native FFmpeg encodes H.264 + AAC → output stored in S3/R2 → client downloads.

### Why server-side

- Native FFmpeg with hardware acceleration (NVENC/VAAPI)
- No browser memory/CPU constraints
- Handles long videos without crashing tabs
- Audio muxing is trivial with FFmpeg
- User experience: fire and forget

### Key design decisions

- Frame capture must be seek-based (not real-time) for frame accuracy
- Audio needs time-remapping if transcript sections are skipped
- Puppeteer reuses the exact same React component — zero rendering code duplication
- Job queue (BullMQ) for async processing
- WebSocket or polling for progress updates

### Client-side fallback

WebCodecs API (`VideoEncoder` + `VideoFrame` from canvas) with `mp4-muxer` for container. Falls back to FFmpeg.wasm (~25MB) if WebCodecs unavailable. For offline/self-hosted scenarios only.
