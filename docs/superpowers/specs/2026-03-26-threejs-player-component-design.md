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
- Zero styling opinion — no CSS Modules, no stylesheets, no CSS-in-JS dependency. Compatible with Tailwind, styled-components, CSS Modules, or plain CSS classes. All DOM elements accept `className` and `style` props. sr-only styles are inline (functional, not aesthetic).

---

## Component API

### Usage — Minimal (uncontrolled)

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

### Usage — Fully controlled

```tsx
<Player.Canvas
  aria-label="Product demo video player"

  // Controlled playback
  playing={isPlaying}
  currentTime={seekPosition}
  volume={volume}
  muted={isMuted}
  playbackRate={speed}

  // Controlled appearance
  padding={padding}
  rounding={rounding}

  // Event callbacks
  onPlay={() => setIsPlaying(true)}
  onPause={() => setIsPlaying(false)}
  onEnded={() => goToNextVideo()}
  onTimeUpdate={(time) => setSeekPosition(time)}
  onDurationChange={(duration) => setTotalDuration(duration)}
  onSeeking={() => setIsSeeking(true)}
  onSeeked={() => setIsSeeking(false)}
  onReady={() => setLoaded(true)}
  onBuffering={() => setBuffering(true)}
  onVolumeChange={(vol, mute) => { setVolume(vol); setIsMuted(mute) }}
  onPaddingChange={(val) => setPadding(val)}
  onRoundingChange={(val) => setRounding(val)}
  onError={(error) => console.error(error)}
>
  <Player.Canvas.Background backgroundSrc="/bg.jpg" />
  <Player.Canvas.Video videoSrc="/demo.mp4" />
</Player.Canvas>
```

### Usage — Hybrid (partial control)

```tsx
// Control volume externally, let playback be internal, react to events
<Player.Canvas
  aria-label="Player"
  volume={volume}
  muted={isMuted}
  onEnded={() => goToNextVideo()}
  onTimeUpdate={(time) => syncTranscript(time)}
>
  <Player.Canvas.Background backgroundSrc="/bg.jpg" />
  <Player.Canvas.Video videoSrc="/demo.mp4" />
</Player.Canvas>
```

### `Player.Canvas`

The scene host. Creates Three.js renderer, scene, camera, render loop. Validates children. Provides context.

**Core props:**

| Prop | Type | Required | Description |
|---|---|---|---|
| `aria-label` | `string` | Yes | Accessible label for the player group |
| `children` | `ReactNode` | Yes | Canvas layer children |
| `className` | `string` | No | CSS class for the wrapper div |
| `style` | `React.CSSProperties` | No | Inline styles for the wrapper div |

**Controlled playback props** (all optional — uncontrolled by default):

| Prop | Type | Description |
|---|---|---|
| `playing` | `boolean` | Drive play/pause externally |
| `currentTime` | `number` | Drive seek position externally |
| `volume` | `number` | Drive volume (0–1) externally |
| `muted` | `boolean` | Drive mute state externally |
| `playbackRate` | `number` | Drive playback speed externally |

**Controlled appearance props** (all optional — uncontrolled by default):

| Prop | Type | Description |
|---|---|---|
| `padding` | `number` | Controlled padding (0–100) |
| `rounding` | `number` | Controlled rounding (0–100) |
| `defaultPadding` | `number` | Initial padding for uncontrolled mode |
| `defaultRounding` | `number` | Initial rounding for uncontrolled mode |

**Event callbacks** (all optional):

| Prop | Type | Description |
|---|---|---|
| `onPlay` | `() => void` | Fired when video starts playing |
| `onPause` | `() => void` | Fired when video pauses |
| `onEnded` | `() => void` | Fired when video reaches end |
| `onTimeUpdate` | `(time: number) => void` | Fired on currentTime change (~4/sec) |
| `onDurationChange` | `(duration: number) => void` | Fired when duration becomes known |
| `onSeeking` | `() => void` | Fired when seek begins |
| `onSeeked` | `() => void` | Fired when seek completes |
| `onReady` | `() => void` | Fired when video is ready to play |
| `onBuffering` | `() => void` | Fired when video is buffering |
| `onVolumeChange` | `(volume: number, muted: boolean) => void` | Fired on volume/mute change |
| `onPaddingChange` | `(value: number) => void` | Fired when padding changes |
| `onRoundingChange` | `(value: number) => void` | Fired when rounding changes |
| `onError` | `(error: Error) => void` | Fired on any error |

**Control modes:** Each controllable value (`playing`, `currentTime`, `volume`, `muted`, `playbackRate`, `padding`, `rounding`) works independently. Pass the prop = controlled. Omit it = uncontrolled. Mix and match freely. Event callbacks fire in both modes.

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

Follows Vercel composition pattern: three-part interface. Split into **public** (consumer-facing) and **internal** (child component plumbing).

### Public Context — `PlayerContextValue`

```ts
interface PlayerContextValue {
  state: PlayerState
  meta: PlayerMeta
}
```

### PlayerState

```ts
interface PlayerState {
  isReady: boolean
  error: Error | null
}
```

Canvas-level only. Playback state lives on PlaybackSource (accessed via `usePlayback()` hook). Appearance state lives on VideoAppearanceStore (accessed via `useAppearance()` hook).

### PlayerMeta

```ts
interface PlayerMeta {
  canvasRef: React.RefObject<HTMLCanvasElement>
  rendererRef: React.RefObject<THREE.WebGLRenderer>
  sceneRef: React.RefObject<THREE.Scene>
}
```

### Internal Context — `PlayerInternalContextValue`

Not exported. Used only by child components (`Background`, `Video`) to register into the scene.

```ts
interface PlayerInternalContextValue {
  registerMesh: (id: string, mesh: THREE.Mesh, zIndex: number) => void
  unregisterMesh: (id: string) => void
  registerPlayback: (playback: PlaybackSource) => void
  unregisterPlayback: () => void
  registerAppearance: (store: VideoAppearanceStore) => void
  unregisterAppearance: () => void
  reportError: (error: Error) => void
  clearError: () => void
}
```

### Error Recovery

`clearError()` resets `state.error` to `null`. It is internal — consumers cannot call it directly. Error recovery happens by changing the `videoSrc` / `backgroundSrc` prop, which triggers the child to remount and internally calls `clearError()` before retrying.

---

## Playback — Owned by Video, Exposed via Context

Video registers a `PlaybackSource` into context. Consumers subscribe to it for playback state.

### How controlled props flow

Canvas receives controlled props (`playing`, `currentTime`, `volume`, `muted`, `playbackRate`) and passes them to `PlaybackSource` via the internal context. `PlaybackSource` reconciles controlled vs uncontrolled values:

- **Controlled value present:** `PlaybackSource` drives the `<video>` element to match the prop. Consumer owns the value, `PlaybackSource` is a passthrough.
- **Controlled value absent:** `PlaybackSource` reads from the `<video>` element naturally. Internal state.
- **Event callbacks:** Always fire regardless of control mode. Canvas listens to `PlaybackSource.subscribe()` and forwards state changes to the corresponding `onPlay`, `onPause`, `onTimeUpdate`, etc. callbacks.

Same pattern for appearance: Canvas passes controlled `padding`/`rounding` to `VideoAppearanceStore`, which reconciles.

```ts
interface PlaybackSource {
  play: () => void
  pause: () => void
  seek: (time: number) => void
  setVolume: (value: number) => void
  setMuted: (muted: boolean) => void
  setPlaybackRate: (rate: number) => void
  getState: () => PlaybackState
  subscribe: (listener: () => void) => () => void
}

interface PlaybackState {
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  playbackRate: number
  isBuffering: boolean
  isSeeking: boolean
  isEnded: boolean
}
```

Note: the raw `HTMLVideoElement` is not exposed on `PlaybackSource`. This prevents state desync from direct element manipulation. All video interaction goes through `PlaybackSource` methods.

### Why subscribe pattern?

`timeupdate` fires ~4 times/second. Using `setState` would re-render the entire tree. Instead:

- `PlaybackSource` is an external store
- Consumers use `useSyncExternalStore(subscribe, getState)` to opt-in
- Only components that read specific playback fields re-render
- Three.js render loop reads `getState()` directly — zero React involvement

### Consumer access — `usePlayback()` hook

`usePlayback()` internally calls `useSyncExternalStore(source.subscribe, source.getState)` and merges the result with the action methods. It returns a flattened object:

```ts
type UsePlaybackReturn = PlaybackState & {
  play: () => void
  pause: () => void
  seek: (time: number) => void
  setVolume: (value: number) => void
  setMuted: (muted: boolean) => void
  setPlaybackRate: (rate: number) => void
}
```

Consumers get both state and actions on one object. There is no playback accessor on the public context.

### Consumer example

```tsx
function CustomControls() {
  const playback = usePlayback() // flattened PlaybackState + actions

  return (
    <div>
      <button
        aria-label={playback.isPlaying ? 'Pause video' : 'Play video'}
        onClick={() => playback.isPlaying ? playback.pause() : playback.play()}
      >
        {playback.isPlaying ? 'Pause' : 'Play'}
      </button>
      <input
        type="range"
        aria-label="Seek video timeline"
        value={playback.currentTime}
        max={playback.duration}
        onChange={(e) => playback.seek(Number(e.target.value))}
      />
    </div>
  )
}
```

---

## Padding & Rounding — Controlled / Uncontrolled

Padding and rounding visually affect the Video mesh (plane size and shader radius) but are managed at the Canvas/context level so external consumer controls can read and write them.

### VideoAppearanceStore

Canvas creates this store internally and registers it into an `AppearanceContext` (separate from `PlayerContext`). Consumers access it via the `useAppearance()` hook — same subscribe/external-store pattern as playback.

```ts
interface VideoAppearance {
  padding: number   // 0–100
  rounding: number  // 0–100
}

interface VideoAppearanceStore {
  setPadding: (value: number) => void
  setRounding: (value: number) => void
  getAppearance: () => VideoAppearance
  subscribe: (listener: () => void) => () => void
}
```

`useAppearance()` returns a flattened merge of state + actions, same pattern as `usePlayback()`:

```ts
type UseAppearanceReturn = VideoAppearance & {
  setPadding: (value: number) => void
  setRounding: (value: number) => void
}
```

```tsx
function AppearanceControls() {
  const appearance = useAppearance() // flattened VideoAppearance + actions

  return (
    <input
      type="range"
      aria-label="Video padding"
      value={appearance.padding}
      min={0}
      max={100}
      onChange={(e) => appearance.setPadding(Number(e.target.value))}
    />
  )
}
```

Controlled/uncontrolled via Canvas props — see `padding`, `rounding`, `defaultPadding`, `defaultRounding`, `onPaddingChange`, `onRoundingChange` in the Canvas props table above. Same per-prop control mode as playback props.

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
  - When video paused AND no pending appearance/resize changes → stop loop
  - Resume on: play, padding change, rounding change, resize, error state change
  - "No pending changes" means: no appearance store update within the last frame
```

### WebGL Context Loss

Handle `webglcontextlost` / `webglcontextrestored` events on the canvas:
- On `contextlost`: fire `reportError`, pause render loop
- On `contextrestored`: recreate renderer, re-register all meshes, resume render loop

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
<div role="group" aria-label={ariaLabel} className={className} style={style}>
  <canvas aria-hidden="true" />
  <div style={srOnlyStyles}>  {/* inline — no stylesheet dependency */}
    <video aria-label="..." tabIndex={-1} />
    <div role="img" aria-label="..." />  {/* background description */}
    <div role="status" aria-live="polite" aria-atomic="true">
      {/* "Playing", "Paused at 1:23", "Buffering", "Error: ..." */}
    </div>
  </div>
  {children}  {/* consumer controls rendered here — siblings to canvas, inside the group */}
</div>
```

Where `srOnlyStyles` is a constant:

```ts
const srOnlyStyles: React.CSSProperties = {
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
```

Consumer controls (play/pause buttons, sliders, etc.) are rendered as `{children}` inside the `role="group"` wrapper. This means they are DOM siblings of the canvas and part of the accessible group. This is the intended consumer pattern — controls live inside `Player.Canvas`.

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
├── canvas.tsx              # Player.Canvas — scene host, renderer, camera, render loop
├── canvas-background.tsx   # Player.Canvas.Background — background image layer
├── canvas-video.tsx        # Player.Canvas.Video — video layer
├── playback-source.ts      # PlaybackSource class — external store wrapping <video>
├── appearance-store.ts     # VideoAppearanceStore — external store for padding/rounding
├── context.ts              # PlayerContext (public) + PlayerInternalContext (private)
├── use-playback.ts         # usePlayback hook (useSyncExternalStore over PlaybackSource)
├── use-appearance.ts       # useAppearance hook (useSyncExternalStore over AppearanceStore)
├── types.ts                # All TypeScript interfaces
├── shaders/
│   ├── rounded-video.vert  # Passthrough vertex shader
│   └── rounded-video.frag  # Rounded rect SDF fragment shader
└── index.ts                # Public API: Player compound component + hooks + types
```

## Public Exports

```ts
// index.ts
export { Player }           // Compound component
export { usePlayback }      // Subscribe to playback state + actions
export { useAppearance }    // Subscribe to appearance state + actions
export { PlayerContext }     // Raw public context (escape hatch)

// Types
export type {
  PlayerContextValue,
  PlayerState,
  PlayerMeta,
  PlaybackSource,
  PlaybackState,
  VideoAppearance,
  VideoAppearanceStore,
}
```

`PlayerInternalContextValue` is NOT exported — it is implementation detail for child components only.

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

WebCodecs API + `mp4-muxer` or FFmpeg.wasm. For offline/self-hosted scenarios only. Defer detailed architecture to a separate spec when export is in scope.
