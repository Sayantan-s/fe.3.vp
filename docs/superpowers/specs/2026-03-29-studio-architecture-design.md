# Studio Architecture Redesign

Context-driven architecture with parallel routes, concurrent data fetching, lazy-loaded player, and performance-optimized state management.

## 1. Routing & File Structure

New dynamic route at `/studio/[id]` replaces the current `page.tsx` root.

```
src/app/
├── page.tsx                      → redirect to /studio/test-d-123
├── layout.tsx                    → root layout (unchanged)
└── studio/
    └── [id]/
        ├── layout.tsx            → server component, reads [id], wraps in StudioProvider
        ├── loading.tsx           → full-page skeleton fallback
        ├── error.tsx             → full-page error boundary
        ├── page.tsx              → null (children slot empty)
        ├── default.tsx           → fallback for children slot
        ├── @leftPanel/
        │   ├── page.tsx          → renders LeftPanel component
        │   ├── loading.tsx       → left panel skeleton
        │   ├── error.tsx         → left panel error boundary
        │   └── default.tsx
        └── @rightPanel/
            ├── page.tsx          → renders RightPanel with lazy Player
            ├── loading.tsx       → right panel skeleton
            ├── error.tsx         → right panel error boundary
            └── default.tsx
```

**Layout composition:**

```tsx
// studio/[id]/layout.tsx — Server Component
export default async function StudioLayout({
  leftPanel,
  rightPanel,
  params,
}: {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <StudioProvider videoId={id}>
      <main className={styles.root}>
        {leftPanel}
        {rightPanel}
      </main>
    </StudioProvider>
  );
}
```

- Layout is a server component that reads `[id]` from params and passes it to the client-side `StudioProvider`.
- `page.tsx` at `/studio/[id]` is empty — all content lives in the parallel slots.
- `default.tsx` files are required for each slot and for `children` to handle hard navigations.
- Root `page.tsx` redirects to `/studio/test-d-123`.

## 2. Context Architecture

Performance pattern: separate state (read) from actions (write) across two domains.

### 2.1 VideoData Domain

**VideoDataStateContext** (consumed by readers):
```ts
{
  videoUrl: string | null;
  bg: string | null;
  padding: number;
  rounding: number;
  isLoading: boolean;
  error: string | null;
}
```

**VideoDataActionsContext** (consumed by writers):
```ts
{
  setPadding: (value: number) => void;
  setRounding: (value: number) => void;
}
```

### 2.2 Transcript Domain

**TranscriptStateContext** (consumed by readers):
```ts
{
  text: string | null;
  words: Word[] | null;
  isLoading: boolean;
  error: string | null;
}
```

**TranscriptActionsContext** (consumed by writers):
```ts
{
  // empty for now — future: selectWord, skipToWord, etc.
}
```

### 2.3 Provider Nesting

```tsx
// StudioProvider.tsx — "use client"
function StudioProvider({ videoId, children }) {
  const { videoData, transcriptData, ... } = useStudioData(videoId);

  return (
    <VideoDataProvider initialData={videoData} ...>
      <TranscriptProvider initialData={transcriptData} ...>
        {children}
      </TranscriptProvider>
    </VideoDataProvider>
  );
}
```

Each domain provider internally nests Actions (stable refs) around State (changing values):
```tsx
<VideoDataActionsContext value={stableActions}>
  <VideoDataStateContext value={currentState}>
    {children}
  </VideoDataStateContext>
</VideoDataActionsContext>
```

### 2.4 Consumer Hooks

| Hook | Returns |
|------|---------|
| `useVideoDataState()` | `{ videoUrl, bg, padding, rounding, isLoading, error }` |
| `useVideoDataActions()` | `{ setPadding, setRounding }` |
| `useTranscriptState()` | `{ text, words, isLoading, error }` |
| `useTranscriptActions()` | `{ /* future */ }` |

### 2.5 Who Consumes What

| Component | Reads (State) | Writes (Actions) |
|-----------|---------------|-------------------|
| RightPanel (Player wrapper) | `useVideoDataState` | — |
| ControlsPanel | `useVideoDataState` (slider values) | `useVideoDataActions` |
| TranscriptPanel | `useTranscriptState` | — |

### 2.6 Optimistic Update Flow

1. ControlsPanel calls `setPadding(20)` via `useVideoDataActions`
2. VideoDataProvider updates state immediately (optimistic)
3. VideoDataStateContext value changes → `{ padding: 20, ... }`
4. RightPanel re-reads padding → passes to Player.Canvas as controlled prop
5. Player.Canvas receives new prop → `useControlledSync` → renders

No API round-trip for mutations. API fetch is only for initial data load. Actions are `useCallback`-stabilized — components consuming only actions never re-render from state changes.

## 3. Data Fetching

### 3.1 Single Hook with Promise.allSettled

```ts
// hooks/use-studio-data.ts
function useStudioData(videoId: string) {
  const [state, setState] = useState({ ... });

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      const results = await Promise.allSettled([
        fetch(`/api/video/${videoId}`, { signal: controller.signal }),
        fetch(`/api/video/${videoId}/transcript`, { signal: controller.signal }),
      ]);

      const [videoResult, transcriptResult] = results;

      const videoData = videoResult.status === "fulfilled"
        ? await videoResult.value.json()
        : null;

      const transcriptData = transcriptResult.status === "fulfilled"
        ? await transcriptResult.value.json()
        : null;

      setState({ videoData, transcriptData, ... });
    })();

    return () => controller.abort();
  }, [videoId]);

  return { videoData, transcriptData, videoError, transcriptError, isLoading };
}
```

- Single `useEffect`, single tick — both requests depart simultaneously.
- `Promise.allSettled` — one failure doesn't reject the other. Video can load even if transcript fails.
- Single `AbortController` cleans up both in-flight requests on unmount or `videoId` change.
- `StudioProvider` consumes this hook and distributes results to domain providers.

### 3.2 Loading State Layers

| Layer | Mechanism | What it covers |
|-------|-----------|----------------|
| Route-level | `@leftPanel/loading.tsx`, `@rightPanel/loading.tsx` | Skeleton while JS chunk loads |
| Data-level | Context `isLoading` flag | Gap between "JS loaded" and "API data arrived" |
| Component-level | `Suspense` around lazy Player | Three.js bundle download |

### 3.3 Error States

- **Route-level** (`error.tsx` per slot): catches render errors, unhandled throws. One panel failing doesn't break the other.
- **Data-level** (context `error` field): fetch failures set error in state. Components read `useVideoDataState().error` and show inline error UI. Independent per domain.

## 4. Component Wiring & Player Integration

### 4.1 Lazy Player

```tsx
// @rightPanel/page.tsx
const LazyPlayer = lazy(() =>
  import("@/components/stories/organisms/player")
);

export default function RightPanelPage() {
  const { videoUrl, bg, padding, rounding, isLoading, error } = useVideoDataState();

  if (isLoading) return <RightPanelSkeleton />;
  if (error) return <RightPanelError error={error} />;

  return (
    <Suspense fallback={<PlayerSkeleton />}>
      <LazyPlayer.Canvas padding={padding} rounding={rounding}>
        <LazyPlayer.Canvas.Background backgroundSrc={bg} />
        <LazyPlayer.Canvas.Video videoSrc={videoUrl} />
        <PlaybackBar />
      </LazyPlayer.Canvas>
    </Suspense>
  );
}
```

Player stays fully controlled/dumb. Receives all values as props from the context consumer. Three.js bundle only downloads when the right panel renders.

### 4.2 ControlsPanel (No Props)

```tsx
function ControlsPanel() {
  const { padding, rounding } = useVideoDataState();
  const { setPadding, setRounding } = useVideoDataActions();

  return (
    <>
      <RangeSlider label="Padding" value={padding} onValueChange={setPadding} />
      <RangeSlider label="Rounding" value={rounding} onValueChange={setRounding} />
    </>
  );
}
```

Zero props. Everything from context. No prop drilling anywhere.

### 4.3 Changes to Existing Components

| Component | Change |
|-----------|--------|
| `src/app/page.tsx` | Replace with redirect to `/studio/test-d-123` |
| `LeftPanel` | Remove all props — reads from context internally |
| `ControlsPanel` | Remove all props — uses `useVideoDataState` + `useVideoDataActions` |
| `RightPanel` | Remove props — reads context, wraps Player in `Suspense` + `lazy` |
| `Player.Canvas` | **No changes** — stays dumb/controlled |
| `PlaybackBar` | **No changes** — uses internal Player contexts |
| `feat/context/` | Full rewrite — new contexts, hooks, providers |

### 4.4 Skeleton Components

- **LeftPanelSkeleton**: Animated text line placeholders (transcript area) + slider track placeholders (controls area)
- **RightPanelSkeleton**: Rounded rectangle placeholder (player area) + play button circle + timeline bar (playback area)
- **PlayerSkeleton**: Same as right panel skeleton but without the playback bar (used as Suspense fallback for lazy Player specifically)

## 5. API Routes

Existing API routes are unchanged:

- `GET /api/video/[id]` → `{ id, videoUrl, config: { bg, padding, rounding } }`
- `GET /api/video/[id]/transcript` → `{ id, transcript: { text, words[] } }`

Both fetched client-side via `useStudioData` hook.
