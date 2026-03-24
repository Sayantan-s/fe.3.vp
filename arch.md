# Architecture Document — Custom Video Player

## Motivation

Build a custom video player that composites a background image and video together on a canvas with a synchronized transcript sidebar — mirroring how modern creative and media tools render video as part of a larger visual scene.

## Tech Stack

- Any modern frontend stack (Next.js with TypeScript is common, but all are fine)
- Three.js for canvas rendering (explicitly required)
- Any supporting libraries as needed

## Inputs

- A video file
- A background image
- Word-level timestamp JSON script (each word mapped to start/end time)

## Word-Level Timestamp JSON Schema

```ts
interface Word {
  text: string;
  start: number;
  end: number;
  type: string;
}

interface Transcript {
  text: string;
  words: Word[];
}
```

## App Structure

Single-page app: **Left Sidebar** + **Right Player Panel**

---

### FR

#### 1. Right Panel — Player Canvas (Three.js)

- Must explicitly use Three.js to build the player as a self-contained, reusable component
- Render background image as the scene
- Render video centered on top of background

#### 2. Left Sidebar — Transcript

- Display full transcript using word-level timestamps
- Highlight individual word corresponding to video's current playback position
- Support selecting portions of transcript text for further actions

#### 3. Left Sidebar — Video Controls

- Padding control slider: adjusts video element padding in real-time
- Rounding control slider: adjusts video element border radius in real-time

#### 4. Playback Controls

- Play / Pause button
- Seekable timeline slider reflecting current video progress and allowing scrubbing

#### 5. Transcript Skip/Unskip

- Allow selecting transcript text and skipping the selected portion
- Skipped text appears struck-through
- Skipped portions are not played during playback
- Skipped text can be unskipped

#### 6. Validations

- Word highlight in transcript must stay synced with video
- Padding and rounding sliders must produce real-time visible updates on video element
- Playback controls must correctly reflect and update `currentTime`

---

### NFR

#### 1. UI / UX

- Clean and modern interface
- Modular player design (self-contained, reusable)

#### 2. Performance

- Playback should not trigger unnecessary React re-renders
- Clear and thoughtful state management

#### 3. Deliverables

- Hosted working version (Vercel, Netlify, CodeSandbox, Replit, or similar)
- Clean and readable codebase
- Discuss approach for exporting final composed video as MP4 (no implementation required — prepare to discuss tooling choices, architecture, and performance considerations)
- Optional screenshots or short demo video

---

### Bonus Features

- Click a word in the sidebar to seek video to that timestamp
- Implement optimizations for long videos (page load + playback performance)
- Use mock API to fetch transcript or video metadata instead of hardcoding data
