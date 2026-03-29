# Studio Architecture Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the video studio into a context-driven architecture with parallel routes, concurrent client-side data fetching, lazy-loaded player, and performance-optimized state management.

**Architecture:** Two Next.js parallel route slots (`@leftPanel`, `@rightPanel`) under `/studio/[id]`. A shared `StudioProvider` fetches both APIs concurrently via `Promise.allSettled` in a `useStudioData` hook, then distributes data to domain-specific providers (`VideoDataProvider`, `TranscriptProvider`). Each domain splits state and actions into separate contexts for render isolation. Player is lazy-loaded and fully controlled.

**Tech Stack:** Next.js 16.2.1, React 19, Zod 4, es-toolkit, Three.js (existing Player), Radix UI Slider, CVA

**Spec:** `docs/superpowers/specs/2026-03-29-studio-architecture-design.md`

---

## File Structure

### New files

```
src/
├── app/
│   └── studio/
│       └── [id]/
│           ├── layout.tsx                    → server layout, reads [id], wraps in StudioProvider
│           ├── loading.tsx                   → full-page skeleton
│           ├── error.tsx                     → full-page error boundary
│           ├── page.tsx                      → null (children slot)
│           ├── default.tsx                   → children fallback
│           ├── @leftPanel/
│           │   ├── page.tsx                  → renders LeftPanel
│           │   ├── loading.tsx               → left panel skeleton
│           │   ├── error.tsx                 → left panel error
│           │   └── default.tsx
│           └── @rightPanel/
│               ├── page.tsx                  → renders RightPanel with lazy Player
│               ├── loading.tsx               → right panel skeleton
│               ├── error.tsx                 → right panel error
│               └── default.tsx
│
├── components/
│   ├── feat/
│   │   └── context/
│   │       ├── index.tsx                     → StudioProvider (rewritten)
│   │       ├── use-studio-data.ts            → useStudioData hook (Promise.allSettled)
│   │       ├── video-data/
│   │       │   ├── context.ts                → VideoDataStateContext + VideoDataActionsContext
│   │       │   ├── provider.tsx              → VideoDataProvider
│   │       │   ├── use-video-data-state.ts   → useVideoDataState hook
│   │       │   └── use-video-data-actions.ts → useVideoDataActions hook
│   │       └── transcript/
│   │           ├── context.ts                → TranscriptStateContext + TranscriptActionsContext
│   │           ├── provider.tsx              → TranscriptProvider
│   │           ├── use-transcript-state.ts   → useTranscriptState hook
│   │           └── use-transcript-actions.ts → useTranscriptActions hook
│   │
│   └── stories/
│       └── molecules/
│           └── slider/
│               ├── slider.tsx                → Slider compound component
│               ├── slider.module.css         → styles (absorbed from controls-panel)
│               └── slider-context.ts         → SliderContext for compound component
```

### Modified files

```
src/app/page.tsx                              → redirect to /studio/test-d-123
src/components/feat/left-panel/index.tsx      → remove props, read from context
src/components/feat/left-panel/controls-panel/index.tsx → use Slider molecule + context hooks
src/components/feat/right-panel/index.tsx     → read context, lazy Player, Suspense
```

### Deleted files

```
src/components/feat/context/use-studio.ts     → replaced by domain hooks
```

---

## Task 1: Zod Schemas & Types for Context Domains

**Files:**
- Create: `src/components/feat/context/video-data/context.ts`
- Create: `src/components/feat/context/transcript/context.ts`

- [ ] **Step 1: Create VideoData context with Zod schemas**

```ts
// src/components/feat/context/video-data/context.ts
"use client";

import { createContext } from "react";
import { z } from "zod/v4";

export const VideoDataStateSchema = z.object({
  videoUrl: z.string().nullable(),
  bg: z.string().nullable(),
  padding: z.number(),
  rounding: z.number(),
  isLoading: z.boolean(),
  error: z.string().nullable(),
});

export type VideoDataState = z.infer<typeof VideoDataStateSchema>;

export const INITIAL_VIDEO_DATA_STATE: VideoDataState = {
  videoUrl: null,
  bg: null,
  padding: 0,
  rounding: 0,
  isLoading: true,
  error: null,
};

export interface VideoDataActions {
  setPadding: (value: number) => void;
  setRounding: (value: number) => void;
}

const NOOP_ACTIONS: VideoDataActions = {
  setPadding: () => {},
  setRounding: () => {},
};

export const VideoDataStateContext =
  createContext<VideoDataState>(INITIAL_VIDEO_DATA_STATE);

export const VideoDataActionsContext =
  createContext<VideoDataActions>(NOOP_ACTIONS);
```

- [ ] **Step 2: Create Transcript context with Zod schemas**

```ts
// src/components/feat/context/transcript/context.ts
"use client";

import { createContext } from "react";
import { z } from "zod/v4";

export const WordSchema = z.object({
  text: z.string(),
  start: z.number(),
  end: z.number(),
  type: z.enum(["word", "spacing"]),
  logprob: z.number().optional(),
});

export type Word = z.infer<typeof WordSchema>;

export const TranscriptStateSchema = z.object({
  text: z.string().nullable(),
  words: z.array(WordSchema).nullable(),
  isLoading: z.boolean(),
  error: z.string().nullable(),
});

export type TranscriptState = z.infer<typeof TranscriptStateSchema>;

export const INITIAL_TRANSCRIPT_STATE: TranscriptState = {
  text: null,
  words: null,
  isLoading: true,
  error: null,
};

export interface TranscriptActions {
  // future: selectWord, skipToWord, etc.
}

const NOOP_ACTIONS: TranscriptActions = {};

export const TranscriptStateContext =
  createContext<TranscriptState>(INITIAL_TRANSCRIPT_STATE);

export const TranscriptActionsContext =
  createContext<TranscriptActions>(NOOP_ACTIONS);
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors from these two files.

- [ ] **Step 4: Commit**

```bash
git add src/components/feat/context/video-data/context.ts src/components/feat/context/transcript/context.ts
git commit -m "feat: add Zod schemas and contexts for VideoData and Transcript domains"
```

---

## Task 2: Domain Providers

**Files:**
- Create: `src/components/feat/context/video-data/provider.tsx`
- Create: `src/components/feat/context/transcript/provider.tsx`

- [ ] **Step 1: Create VideoDataProvider**

```tsx
// src/components/feat/context/video-data/provider.tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { clamp } from "es-toolkit";
import {
  VideoDataActionsContext,
  VideoDataStateContext,
  type VideoDataState,
  INITIAL_VIDEO_DATA_STATE,
} from "./context";

interface VideoDataProviderProps {
  initialData: {
    videoUrl: string;
    bg: string;
    padding: number;
    rounding: number;
  } | null;
  error: string | null;
  isLoading: boolean;
  children: React.ReactNode;
}

export function VideoDataProvider({
  initialData,
  error,
  isLoading,
  children,
}: VideoDataProviderProps) {
  const [localState, setLocalState] = useState<{
    padding: number;
    rounding: number;
  }>({
    padding: INITIAL_VIDEO_DATA_STATE.padding,
    rounding: INITIAL_VIDEO_DATA_STATE.rounding,
  });

  // Sync local state when initial data arrives from fetch
  const hasSynced = useRef(false);
  useEffect(() => {
    if (initialData && !hasSynced.current) {
      hasSynced.current = true;
      setLocalState({
        padding: initialData.padding,
        rounding: initialData.rounding,
      });
    }
  }, [initialData]);

  const setPadding = useCallback((value: number) => {
    setLocalState((prev) => ({ ...prev, padding: clamp(value, 0, 100) }));
  }, []);

  const setRounding = useCallback((value: number) => {
    setLocalState((prev) => ({ ...prev, rounding: clamp(value, 0, 100) }));
  }, []);

  const actions = useMemo(() => ({ setPadding, setRounding }), [setPadding, setRounding]);

  const state: VideoDataState = useMemo(
    () => ({
      videoUrl: initialData?.videoUrl ?? null,
      bg: initialData?.bg ?? null,
      padding: localState.padding,
      rounding: localState.rounding,
      isLoading,
      error,
    }),
    [initialData, isLoading, error, localState.padding, localState.rounding],
  );

  return (
    <VideoDataActionsContext value={actions}>
      <VideoDataStateContext value={state}>
        {children}
      </VideoDataStateContext>
    </VideoDataActionsContext>
  );
}
```

Note: React 19 uses `<Context value={}>` instead of `<Context.Provider value={}>`.

- [ ] **Step 2: Create TranscriptProvider**

```tsx
// src/components/feat/context/transcript/provider.tsx
"use client";

import { useMemo } from "react";
import {
  TranscriptActionsContext,
  TranscriptStateContext,
  type TranscriptState,
} from "./context";

interface TranscriptProviderProps {
  initialData: {
    transcript: {
      text: string;
      words: Array<{
        text: string;
        start: number;
        end: number;
        type: "word" | "spacing";
        logprob?: number;
      }>;
    };
  } | null;
  error: string | null;
  isLoading: boolean;
  children: React.ReactNode;
}

export function TranscriptProvider({
  initialData,
  error,
  isLoading,
  children,
}: TranscriptProviderProps) {
  const state: TranscriptState = useMemo(
    () => ({
      text: initialData?.transcript?.text ?? null,
      words: initialData?.transcript?.words ?? null,
      isLoading,
      error,
    }),
    [initialData, isLoading, error],
  );

  const actions = useMemo(() => ({}), []);

  return (
    <TranscriptActionsContext value={actions}>
      <TranscriptStateContext value={state}>
        {children}
      </TranscriptStateContext>
    </TranscriptActionsContext>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors from provider files.

- [ ] **Step 4: Commit**

```bash
git add src/components/feat/context/video-data/provider.tsx src/components/feat/context/transcript/provider.tsx
git commit -m "feat: add VideoDataProvider and TranscriptProvider with state/actions split"
```

---

## Task 3: Consumer Hooks

**Files:**
- Create: `src/components/feat/context/video-data/use-video-data-state.ts`
- Create: `src/components/feat/context/video-data/use-video-data-actions.ts`
- Create: `src/components/feat/context/transcript/use-transcript-state.ts`
- Create: `src/components/feat/context/transcript/use-transcript-actions.ts`

- [ ] **Step 1: Create useVideoDataState hook**

```ts
// src/components/feat/context/video-data/use-video-data-state.ts
"use client";

import { use } from "react";
import { VideoDataStateContext } from "./context";

export function useVideoDataState() {
  return use(VideoDataStateContext);
}
```

- [ ] **Step 2: Create useVideoDataActions hook**

```ts
// src/components/feat/context/video-data/use-video-data-actions.ts
"use client";

import { use } from "react";
import { VideoDataActionsContext } from "./context";

export function useVideoDataActions() {
  return use(VideoDataActionsContext);
}
```

- [ ] **Step 3: Create useTranscriptState hook**

```ts
// src/components/feat/context/transcript/use-transcript-state.ts
"use client";

import { use } from "react";
import { TranscriptStateContext } from "./context";

export function useTranscriptState() {
  return use(TranscriptStateContext);
}
```

- [ ] **Step 4: Create useTranscriptActions hook**

```ts
// src/components/feat/context/transcript/use-transcript-actions.ts
"use client";

import { use } from "react";
import { TranscriptActionsContext } from "./context";

export function useTranscriptActions() {
  return use(TranscriptActionsContext);
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/feat/context/video-data/use-video-data-state.ts \
        src/components/feat/context/video-data/use-video-data-actions.ts \
        src/components/feat/context/transcript/use-transcript-state.ts \
        src/components/feat/context/transcript/use-transcript-actions.ts
git commit -m "feat: add consumer hooks for VideoData and Transcript contexts"
```

---

## Task 4: useStudioData Fetching Hook

**Files:**
- Create: `src/components/feat/context/use-studio-data.ts`

- [ ] **Step 1: Create the hook**

```ts
// src/components/feat/context/use-studio-data.ts
"use client";

import { useEffect, useState } from "react";

interface VideoApiResponse {
  id: string;
  videoUrl: string;
  config: {
    bg: number;
    padding: number;
    rounding: number;
  };
}

interface TranscriptApiResponse {
  id: string;
  transcript: {
    text: string;
    words: Array<{
      text: string;
      start: number;
      end: number;
      type: "word" | "spacing";
      logprob?: number;
    }>;
  };
}

export interface StudioData {
  videoData: VideoApiResponse | null;
  transcriptData: TranscriptApiResponse | null;
  videoError: string | null;
  transcriptError: string | null;
  isLoading: boolean;
}

const INITIAL_STATE: StudioData = {
  videoData: null,
  transcriptData: null,
  videoError: null,
  transcriptError: null,
  isLoading: true,
};

export function useStudioData(videoId: string): StudioData {
  const [state, setState] = useState<StudioData>(INITIAL_STATE);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    setState(INITIAL_STATE);

    (async () => {
      const results = await Promise.allSettled([
        fetch(`/api/video/${videoId}`, { signal }),
        fetch(`/api/video/${videoId}/transcript`, { signal }),
      ]);

      if (signal.aborted) return;

      const [videoResult, transcriptResult] = results;

      let videoData: VideoApiResponse | null = null;
      let videoError: string | null = null;
      if (videoResult.status === "fulfilled") {
        if (videoResult.value.ok) {
          videoData = await videoResult.value.json();
        } else {
          videoError = `Video fetch failed: ${videoResult.value.status}`;
        }
      } else {
        videoError = videoResult.reason?.message ?? "Video fetch failed";
      }

      let transcriptData: TranscriptApiResponse | null = null;
      let transcriptError: string | null = null;
      if (transcriptResult.status === "fulfilled") {
        if (transcriptResult.value.ok) {
          transcriptData = await transcriptResult.value.json();
        } else {
          transcriptError = `Transcript fetch failed: ${transcriptResult.value.status}`;
        }
      } else {
        transcriptError =
          transcriptResult.reason?.message ?? "Transcript fetch failed";
      }

      if (signal.aborted) return;

      setState({
        videoData,
        transcriptData,
        videoError,
        transcriptError,
        isLoading: false,
      });
    })();

    return () => controller.abort();
  }, [videoId]);

  return state;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/feat/context/use-studio-data.ts
git commit -m "feat: add useStudioData hook with concurrent Promise.allSettled fetching"
```

---

## Task 5: StudioProvider (Rewrite)

**Files:**
- Modify: `src/components/feat/context/index.tsx`
- Delete: `src/components/feat/context/use-studio.ts`

- [ ] **Step 1: Rewrite StudioProvider**

Replace the entire contents of `src/components/feat/context/index.tsx` with:

```tsx
// src/components/feat/context/index.tsx
"use client";

import styles from "../feat.module.css";
import { useStudioData } from "./use-studio-data";
import { VideoDataProvider } from "./video-data/provider";
import { TranscriptProvider } from "./transcript/provider";

interface StudioProviderProps {
  videoId: string;
  children: React.ReactNode;
}

export function StudioProvider({ videoId, children }: StudioProviderProps) {
  const { videoData, transcriptData, videoError, transcriptError, isLoading } =
    useStudioData(videoId);

  return (
    <VideoDataProvider
      initialData={
        videoData
          ? {
              videoUrl: videoData.videoUrl,
              bg: "/sample-bg.jpg",
              padding: videoData.config.padding,
              rounding: videoData.config.rounding,
            }
          : null
      }
      error={videoError}
      isLoading={isLoading}
    >
      <TranscriptProvider
        initialData={transcriptData}
        error={transcriptError}
        isLoading={isLoading}
      >
        <main className={styles.root}>{children}</main>
      </TranscriptProvider>
    </VideoDataProvider>
  );
}
```

Note: The `bg` field in the API response is a number (config value), but the Player needs an image URL. For now we map it to the static `/sample-bg.jpg`. This matches the current hardcoded behavior in `RightPanel`.

- [ ] **Step 2: Delete the old use-studio.ts stub**

Run: `rm src/components/feat/context/use-studio.ts`

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: May show errors from `page.tsx` still importing old `PlayerStudioProvider` — that's expected and fixed in later tasks.

- [ ] **Step 4: Commit**

```bash
git add src/components/feat/context/index.tsx
git rm src/components/feat/context/use-studio.ts
git commit -m "feat: rewrite StudioProvider with domain providers and useStudioData"
```

---

## Task 6: Re-export Barrel for Context

**Files:**
- Create (barrel exports so consumers have clean imports)

This task adds barrel re-exports so components can import hooks cleanly.

- [ ] **Step 1: No new files needed — hooks are imported directly**

Components will import from the specific hook files:
```ts
import { useVideoDataState } from "@/components/feat/context/video-data/use-video-data-state";
import { useVideoDataActions } from "@/components/feat/context/video-data/use-video-data-actions";
import { useTranscriptState } from "@/components/feat/context/transcript/use-transcript-state";
```

This is the recommended pattern — explicit imports avoid barrel-file re-export chains that hurt tree-shaking.

- [ ] **Step 2: Commit (no-op — skip if no changes)**

No files changed. Move to next task.

---

## Task 7: Slider Molecule (Compound Component)

**Files:**
- Create: `src/components/stories/molecules/slider/slider-context.ts`
- Create: `src/components/stories/molecules/slider/slider.tsx`
- Create: `src/components/stories/molecules/slider/slider.module.css`

- [ ] **Step 1: Create SliderContext**

```ts
// src/components/stories/molecules/slider/slider-context.ts
"use client";

import { createContext } from "react";

export interface SliderContextValue {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
}

export const SliderContext = createContext<SliderContextValue | null>(null);
```

- [ ] **Step 2: Create slider styles**

Absorb the label, bound, and slider-row styles from `controls-panel.module.css`:

```css
/* src/components/stories/molecules/slider/slider.module.css */
/* Slider molecule — compound component layout */

.root {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.label {
  font-family: var(--font-primary);
  font-size: var(--text-body);
  font-weight: var(--weight-medium);
  color: var(--text-primary);
}

.trackRow {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bound {
  font-family: var(--font-primary);
  font-size: var(--text-button);
  font-weight: var(--weight-regular);
  color: var(--text-secondary);
  min-width: 20px;
  text-align: center;
}

.track {
  flex: 1;
}
```

- [ ] **Step 3: Create Slider compound component**

```tsx
// src/components/stories/molecules/slider/slider.tsx
"use client";

import { use } from "react";
import { RangeSlider } from "@/components/stories/atoms/range-slider/range-slider";
import { SliderContext, type SliderContextValue } from "./slider-context";
import styles from "./slider.module.css";

// --- Helpers ---

function useSliderContext(): SliderContextValue {
  const ctx = use(SliderContext);
  if (!ctx) throw new Error("Slider compound components must be used within <Slider>");
  return ctx;
}

function padBound(value: number): string {
  return String(value).padStart(2, "0");
}

// --- Sub-components ---

function SliderLabel({ children }: { children: React.ReactNode }) {
  return <span className={styles.label}>{children}</span>;
}

function SliderLowerBound() {
  const { min } = useSliderContext();
  return <span className={styles.bound}>{padBound(min)}</span>;
}

function SliderUpperBound() {
  const { max } = useSliderContext();
  return <span className={styles.bound}>{padBound(max)}</span>;
}

function SliderTrackRow({ children }: { children: React.ReactNode }) {
  return <div className={styles.trackRow}>{children}</div>;
}

function SliderTrack() {
  const { value, onChange, min, max, step } = useSliderContext();
  return (
    <div className={styles.track}>
      <RangeSlider
        label=""
        value={value}
        min={min}
        max={max}
        step={step}
        onValueChange={onChange}
      />
    </div>
  );
}

// --- Root ---

interface SliderRootProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  children: React.ReactNode;
}

function SliderRoot({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  children,
}: SliderRootProps) {
  return (
    <SliderContext value={{ value, onChange, min, max, step }}>
      <div className={styles.root}>{children}</div>
    </SliderContext>
  );
}

// --- Compound export ---

export const Slider = Object.assign(SliderRoot, {
  Label: SliderLabel,
  LowerBound: SliderLowerBound,
  UpperBound: SliderUpperBound,
  TrackRow: SliderTrackRow,
  Track: SliderTrack,
});
```

Note: The spec shows `Slider.Track` used for both the row container and the inner track. To avoid a naming collision on `Object.assign`, the row container is named `Slider.TrackRow` and the actual slider track is `Slider.Track`. Usage:

```tsx
<Slider value={padding} onChange={setPadding} min={0} max={32}>
  <Slider.Label>Padding</Slider.Label>
  <Slider.TrackRow>
    <Slider.LowerBound />
    <Slider.Track />
    <Slider.UpperBound />
  </Slider.TrackRow>
</Slider>
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors from slider files.

- [ ] **Step 5: Commit**

```bash
git add src/components/stories/molecules/slider/
git commit -m "feat: add Slider compound molecule with Label, TrackRow, LowerBound, UpperBound, Track"
```

---

## Task 8: Skeleton Components

**Files:**
- Create: `src/components/feat/skeletons/left-panel-skeleton.tsx`
- Create: `src/components/feat/skeletons/right-panel-skeleton.tsx`
- Create: `src/components/feat/skeletons/player-skeleton.tsx`
- Create: `src/components/feat/skeletons/skeleton.module.css`

- [ ] **Step 1: Create skeleton styles**

```css
/* src/components/feat/skeletons/skeleton.module.css */

@keyframes shimmer {
  0% { opacity: 0.5; }
  50% { opacity: 1; }
  100% { opacity: 0.5; }
}

.pulse {
  animation: shimmer 1.5s ease-in-out infinite;
}

/* Left panel skeleton */
.leftPanel {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 420px;
  min-width: 420px;
  height: 100%;
  padding: 32px;
  border-right: 1px solid var(--border-light);
}

.textLine {
  height: 16px;
  border-radius: 8px;
  background: var(--border-light);
}

.textLines {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.controlSkeleton {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.sliderLabel {
  height: 12px;
  width: 60px;
  border-radius: 4px;
  background: var(--border-light);
}

.sliderTrack {
  height: 6px;
  border-radius: 999px;
  background: var(--border-light);
}

.controlGroup {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Right panel skeleton */
.rightPanel {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  flex: 0.5;
  overflow: hidden;
  flex-shrink: 0;
}

.playerArea {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: var(--border-light);
  margin: 1rem;
}

.playButton {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
}

.playbackBar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 1rem;
}

.playbackBtn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--border-light);
}

.timeDisplay {
  height: 12px;
  width: 80px;
  border-radius: 4px;
  background: var(--border-light);
}

.timeline {
  flex: 1;
  height: 6px;
  border-radius: 999px;
  background: var(--border-light);
}
```

- [ ] **Step 2: Create LeftPanelSkeleton**

```tsx
// src/components/feat/skeletons/left-panel-skeleton.tsx
import styles from "./skeleton.module.css";

export function LeftPanelSkeleton() {
  return (
    <aside className={`${styles.leftPanel} ${styles.pulse}`}>
      <div className={styles.textLines}>
        <div className={styles.textLine} style={{ width: "80%" }} />
        <div className={styles.textLine} style={{ width: "95%" }} />
        <div className={styles.textLine} style={{ width: "70%" }} />
        <div className={styles.textLine} style={{ width: "88%" }} />
        <div className={styles.textLine} style={{ width: "60%" }} />
      </div>
      <div className={styles.controlSkeleton}>
        <div className={styles.controlGroup}>
          <div className={styles.sliderLabel} />
          <div className={styles.sliderTrack} />
        </div>
        <div className={styles.controlGroup}>
          <div className={styles.sliderLabel} />
          <div className={styles.sliderTrack} />
        </div>
      </div>
    </aside>
  );
}
```

- [ ] **Step 3: Create RightPanelSkeleton**

```tsx
// src/components/feat/skeletons/right-panel-skeleton.tsx
import styles from "./skeleton.module.css";

export function RightPanelSkeleton() {
  return (
    <section className={`${styles.rightPanel} ${styles.pulse}`}>
      <div className={styles.playerArea}>
        <div className={styles.playButton} />
      </div>
      <div className={styles.playbackBar}>
        <div className={styles.playbackBtn} />
        <div className={styles.timeDisplay} />
        <div className={styles.timeline} />
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Create PlayerSkeleton (Suspense fallback for lazy Player)**

```tsx
// src/components/feat/skeletons/player-skeleton.tsx
import styles from "./skeleton.module.css";

export function PlayerSkeleton() {
  return (
    <div className={`${styles.playerArea} ${styles.pulse}`} style={{ flex: 1, margin: 0 }}>
      <div className={styles.playButton} />
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/feat/skeletons/
git commit -m "feat: add skeleton loading components for left panel, right panel, and player"
```

---

## Task 9: Parallel Route Files — Studio Layout & Slots

**Files:**
- Create: `src/app/studio/[id]/layout.tsx`
- Create: `src/app/studio/[id]/page.tsx`
- Create: `src/app/studio/[id]/default.tsx`
- Create: `src/app/studio/[id]/loading.tsx`
- Create: `src/app/studio/[id]/error.tsx`
- Create: `src/app/studio/[id]/@leftPanel/page.tsx`
- Create: `src/app/studio/[id]/@leftPanel/default.tsx`
- Create: `src/app/studio/[id]/@leftPanel/loading.tsx`
- Create: `src/app/studio/[id]/@leftPanel/error.tsx`
- Create: `src/app/studio/[id]/@rightPanel/page.tsx`
- Create: `src/app/studio/[id]/@rightPanel/default.tsx`
- Create: `src/app/studio/[id]/@rightPanel/loading.tsx`
- Create: `src/app/studio/[id]/@rightPanel/error.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Create the studio layout (Server Component)**

```tsx
// src/app/studio/[id]/layout.tsx
import { StudioProvider } from "@/components/feat/context";

export default async function StudioLayout({
  leftPanel,
  rightPanel,
  params,
}: {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <StudioProvider videoId={id}>
      {leftPanel}
      {rightPanel}
    </StudioProvider>
  );
}
```

Note: `StudioProvider` renders `<main className={styles.root}>` internally, so the layout doesn't need its own wrapper.

- [ ] **Step 2: Create children slot files**

```tsx
// src/app/studio/[id]/page.tsx
export default function StudioPage() {
  return null;
}
```

```tsx
// src/app/studio/[id]/default.tsx
export default function StudioDefault() {
  return null;
}
```

- [ ] **Step 3: Create studio-level loading and error**

```tsx
// src/app/studio/[id]/loading.tsx
import { LeftPanelSkeleton } from "@/components/feat/skeletons/left-panel-skeleton";
import { RightPanelSkeleton } from "@/components/feat/skeletons/right-panel-skeleton";

export default function StudioLoading() {
  return (
    <main style={{ display: "flex" }}>
      <LeftPanelSkeleton />
      <RightPanelSkeleton />
    </main>
  );
}
```

```tsx
// src/app/studio/[id]/error.tsx
"use client";

export default function StudioError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ padding: 32, textAlign: "center" }}>
      <h2>Something went wrong</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

- [ ] **Step 4: Create @leftPanel slot files**

```tsx
// src/app/studio/[id]/@leftPanel/page.tsx
"use client";

import { LeftPanel } from "@/components/feat/left-panel";

export default function LeftPanelPage() {
  return <LeftPanel />;
}
```

```tsx
// src/app/studio/[id]/@leftPanel/default.tsx
export default function LeftPanelDefault() {
  return null;
}
```

```tsx
// src/app/studio/[id]/@leftPanel/loading.tsx
import { LeftPanelSkeleton } from "@/components/feat/skeletons/left-panel-skeleton";

export default function LeftPanelLoading() {
  return <LeftPanelSkeleton />;
}
```

```tsx
// src/app/studio/[id]/@leftPanel/error.tsx
"use client";

export default function LeftPanelError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <aside style={{ width: 420, minWidth: 420, padding: 32, borderRight: "1px solid var(--border-light)" }}>
      <p>Failed to load panel</p>
      <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>{error.message}</p>
      <button onClick={reset}>Retry</button>
    </aside>
  );
}
```

- [ ] **Step 5: Create @rightPanel slot files**

```tsx
// src/app/studio/[id]/@rightPanel/page.tsx
"use client";

import { lazy, Suspense } from "react";
import { useVideoDataState } from "@/components/feat/context/video-data/use-video-data-state";
import { PlaybackBar } from "@/components/feat/right-panel/playback-bar";
import { RightPanelSkeleton } from "@/components/feat/skeletons/right-panel-skeleton";
import { PlayerSkeleton } from "@/components/feat/skeletons/player-skeleton";
import styles from "@/components/feat/right-panel/right-panel.module.css";

const LazyPlayer = lazy(
  () => import("@/components/stories/organisms/player"),
);

export default function RightPanelPage() {
  const { videoUrl, bg, padding, rounding, isLoading, error } =
    useVideoDataState();

  if (isLoading) return <RightPanelSkeleton />;

  if (error) {
    return (
      <section className={styles.root}>
        <div style={{ padding: 32, textAlign: "center" }}>
          <p>Failed to load video</p>
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>{error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.root}>
      <Suspense fallback={<PlayerSkeleton />}>
        <LazyPlayer.Canvas
          aria-label="Video player"
          className={styles.videoArea}
          padding={padding}
          rounding={rounding}
          onError={(e: unknown) => console.error("Player error:", e)}
        >
          <LazyPlayer.Canvas.Background backgroundSrc={bg ?? "/sample-bg.jpg"} />
          <LazyPlayer.Canvas.Video videoSrc={videoUrl ?? ""} />
          <PlaybackBar />
        </LazyPlayer.Canvas>
      </Suspense>
    </section>
  );
}
```

```tsx
// src/app/studio/[id]/@rightPanel/default.tsx
export default function RightPanelDefault() {
  return null;
}
```

```tsx
// src/app/studio/[id]/@rightPanel/loading.tsx
import { RightPanelSkeleton } from "@/components/feat/skeletons/right-panel-skeleton";

export default function RightPanelLoading() {
  return <RightPanelSkeleton />;
}
```

```tsx
// src/app/studio/[id]/@rightPanel/error.tsx
"use client";

export default function RightPanelError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section style={{ flex: 0.5, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <p>Failed to load player</p>
        <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>{error.message}</p>
        <button onClick={reset}>Retry</button>
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Update root page.tsx to redirect**

Replace `src/app/page.tsx` with:

```tsx
// src/app/page.tsx
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/studio/test-d-123");
}
```

- [ ] **Step 7: Commit**

```bash
git add src/app/studio/ src/app/page.tsx
git commit -m "feat: add parallel route structure with @leftPanel and @rightPanel slots"
```

---

## Task 10: Update LeftPanel & ControlsPanel (Remove Props, Use Context)

**Files:**
- Modify: `src/components/feat/left-panel/index.tsx`
- Modify: `src/components/feat/left-panel/controls-panel/index.tsx`
- Modify: `src/components/feat/left-panel/controls-panel/controls-panel.module.css`

- [ ] **Step 1: Update LeftPanel to remove all props**

Replace `src/components/feat/left-panel/index.tsx` with:

```tsx
// src/components/feat/left-panel/index.tsx
import { ControlsPanel } from "./controls-panel";
import { TranscriptPanel } from "./transcript-panel";
import styles from "./left-panel.module.css";

export function LeftPanel() {
  return (
    <aside className={styles.root}>
      <TranscriptPanel />
      <ControlsPanel />
    </aside>
  );
}
```

- [ ] **Step 2: Update ControlsPanel to use context + Slider molecule**

Replace `src/components/feat/left-panel/controls-panel/index.tsx` with:

```tsx
// src/components/feat/left-panel/controls-panel/index.tsx
"use client";

import { Slider } from "@/components/stories/molecules/slider/slider";
import { useVideoDataState } from "@/components/feat/context/video-data/use-video-data-state";
import { useVideoDataActions } from "@/components/feat/context/video-data/use-video-data-actions";
import styles from "./controls-panel.module.css";

export function ControlsPanel() {
  const { padding, rounding } = useVideoDataState();
  const { setPadding, setRounding } = useVideoDataActions();

  return (
    <div className={styles.root}>
      <Slider value={padding} onChange={setPadding} min={0} max={32}>
        <Slider.Label>Padding</Slider.Label>
        <Slider.TrackRow>
          <Slider.LowerBound />
          <Slider.Track />
          <Slider.UpperBound />
        </Slider.TrackRow>
      </Slider>

      <Slider value={rounding} onChange={setRounding} min={0} max={32}>
        <Slider.Label>Rounding</Slider.Label>
        <Slider.TrackRow>
          <Slider.LowerBound />
          <Slider.Track />
          <Slider.UpperBound />
        </Slider.TrackRow>
      </Slider>
    </div>
  );
}
```

- [ ] **Step 3: Clean up controls-panel.module.css**

The `.label`, `.bound`, and `.sliderRow` styles have been absorbed into the Slider molecule. Replace `src/components/feat/left-panel/controls-panel/controls-panel.module.css` with:

```css
/* Controls Panel — layout only, slider styles live in Slider molecule */

.root {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors from left-panel files.

- [ ] **Step 5: Commit**

```bash
git add src/components/feat/left-panel/
git commit -m "refactor: remove props from LeftPanel and ControlsPanel, use context + Slider molecule"
```

---

## Task 11: Update RightPanel (Remove Old Version)

The `@rightPanel/page.tsx` slot (Task 9, Step 5) now renders the player directly using context. The old `src/components/feat/right-panel/index.tsx` component is no longer used as a standalone component — it's replaced by the slot page. However, we keep the file structure because:
- `right-panel.module.css` is still imported by `@rightPanel/page.tsx`
- `playback-bar/` is still imported by `@rightPanel/page.tsx`

**Files:**
- Modify: `src/components/feat/right-panel/index.tsx`

- [ ] **Step 1: Remove the old RightPanel export**

The old `RightPanel` component with props is no longer needed since `@rightPanel/page.tsx` handles rendering directly. We can either delete the file or keep it as a thin wrapper. Since the slot page already does everything, delete the component but keep the directory for CSS and PlaybackBar.

Replace `src/components/feat/right-panel/index.tsx` with:

```tsx
// src/components/feat/right-panel/index.tsx
// This file is intentionally empty.
// The right panel is rendered by the @rightPanel parallel route slot.
// PlaybackBar and styles in this directory are still used by the slot page.
```

Actually, we should keep a working export in case it's imported elsewhere. Let's just simplify it:

```tsx
// src/components/feat/right-panel/index.tsx
// Right panel rendering is handled by @rightPanel/page.tsx parallel route.
// This directory contains PlaybackBar and styles used by the slot page.
export {};
```

- [ ] **Step 2: Commit**

```bash
git add src/components/feat/right-panel/index.tsx
git commit -m "refactor: remove old RightPanel component, rendering moved to parallel route slot"
```

---

## Task 12: Verify the Full Application

**Files:** None (verification only)

- [ ] **Step 1: Run TypeScript check**

Run: `npx tsc --noEmit --pretty`
Expected: Clean compilation. Fix any errors.

- [ ] **Step 2: Start the dev server and verify**

Run: `npx next dev`
Then navigate to `http://localhost:3000`. It should redirect to `/studio/test-d-123`.

Expected behavior:
1. Root `/` redirects to `/studio/test-d-123`
2. Skeletons flash briefly while JS chunks load (parallel route loading.tsx files)
3. Data-level skeletons show while API fetches complete
4. Left panel shows transcript placeholder + working padding/rounding sliders
5. Right panel shows the video player with background
6. Moving the padding slider updates the player in real time (optimistic, no lag)
7. Moving the rounding slider updates the player in real time
8. Video plays/pauses correctly via PlaybackBar

- [ ] **Step 3: Verify code splitting**

Open browser DevTools → Network tab. Reload the page and check:
- Left panel and right panel load as separate JS chunks
- The Three.js/Player chunk loads lazily (not in the initial bundle)

- [ ] **Step 4: Verify error independence**

Temporarily modify the transcript API route to return a 500:
```ts
// In src/app/api/video/[id]/transcript/route.ts, temporarily add at the top of GET:
return Response.json({ error: "Test error" }, { status: 500 });
```

Reload the page. Expected: Player and controls work normally. Only transcript-related UI shows an error state.

Revert the temporary change after verifying.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: verify studio architecture — parallel routes, context, lazy player"
```

Only commit if there are fixup changes from verification. If everything compiled clean, skip this step.

---

## Task 13: Clean Up Stale Code

**Files:**
- Check and remove any remaining imports of old `PlayerStudioContext` or `PlayerStudioProvider`

- [ ] **Step 1: Search for stale references**

Run: `grep -r "PlayerStudioContext\|PlayerStudioProvider\|useStudio" src/ --include="*.ts" --include="*.tsx" -l`

Expected: No results (all references should be gone). If any remain, update those files to use the new imports.

- [ ] **Step 2: Remove the dead JSX in controls-panel**

The current `src/components/feat/left-panel/controls-panel/index.tsx` has trailing JSX outside the function (lines 54-61 — the `<Slider>` anatomy example). This was replaced in Task 10 — verify it's gone.

- [ ] **Step 3: Commit if any cleanup was needed**

```bash
git add -A
git commit -m "chore: remove stale imports and dead code from old architecture"
```
