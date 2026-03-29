import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import Player, { usePlayback, useAppearance } from "../player/index";

const meta = {
  title: "Organisms/Player",
  component: Player.Canvas,
  parameters: {
    layout: "fullscreen",
  },
  // Provide defaults for required props so Story type doesn't demand them in every story's args.
  // Individual stories use render() and supply their own JSX.
  args: {
    "aria-label": "Demo player",
    aspectRatio: "horizontal",
    children: null,
  },
} satisfies Meta<typeof Player.Canvas>;

export default meta;
type Story = StoryObj<typeof meta>;

// --- Helper: minimal controls for testing ---

function TestControls() {
  const playback = usePlayback();
  const appearance = useAppearance();

  return (
    <div
      style={{
        padding: 8,
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 10,
      }}
    >
      <div>
        <button
          aria-label={playback.isPlaying ? "Pause video" : "Play video"}
          onClick={() =>
            playback.isPlaying ? playback.pause() : playback.play()
          }
        >
          {playback.isPlaying ? "Pause" : "Play"}
        </button>
        <span>
          {" "}
          {Math.floor(playback.currentTime)}s / {Math.floor(playback.duration)}s
        </span>
      </div>
      <div>
        <label>
          Seek:{" "}
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
          Padding:{" "}
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
          Rounding:{" "}
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
  );
}

// --- Stories ---

export const Uncontrolled: Story = {
  render: () => (
    <Player.Canvas
      aria-label="Uncontrolled demo player"
      aspectRatio="horizontal"
      style={{ width: "100%", height: "80vh" }}
    >
      <Player.Canvas.Background backgroundSrc="/sample-bg.jpg" />
      <Player.Canvas.Video videoSrc="/video.mp4" />
      <TestControls />
    </Player.Canvas>
  ),
};

export const VideoOnly: Story = {
  render: () => (
    <Player.Canvas
      aria-label="Video only player"
      aspectRatio="horizontal"
      style={{ width: "100%", height: "80vh" }}
    >
      <Player.Canvas.Video videoSrc="/video.mp4" />
      <TestControls />
    </Player.Canvas>
  ),
};

export const FullyControlled: Story = {
  render: function ControlledStory() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [seekPos, setSeekPos] = useState(0);
    const [vol, setVol] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [pad, setPad] = useState(20);
    const [round, setRound] = useState(12);

    return (
      <div>
        <Player.Canvas
          aria-label="Controlled demo player"
          aspectRatio="horizontal"
          style={{ width: "100%", height: "60vh" }}
          playing={isPlaying}
          currentTime={seekPos}
          volume={vol}
          muted={isMuted}
          padding={pad}
          rounding={round}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={(t) => setSeekPos(t)}
          onVolumeChange={(v, m) => {
            setVol(v);
            setIsMuted(m);
          }}
          onPaddingChange={setPad}
          onRoundingChange={setRound}
        >
          <Player.Canvas.Background backgroundSrc="/sample-bg.jpg" />
          <Player.Canvas.Video videoSrc="/video.mp4" />
        </Player.Canvas>
        <div style={{ padding: 8 }}>
          <button onClick={() => setIsPlaying(!isPlaying)}>
            {isPlaying ? "Pause" : "Play"} (external)
          </button>
          <label>
            Volume:{" "}
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={vol}
              onChange={(e) => setVol(Number(e.target.value))}
            />
          </label>
          <label>
            Padding:{" "}
            <input
              type="range"
              min={0}
              max={100}
              value={pad}
              onChange={(e) => setPad(Number(e.target.value))}
            />
          </label>
          <label>
            Rounding:{" "}
            <input
              type="range"
              min={0}
              max={100}
              value={round}
              onChange={(e) => setRound(Number(e.target.value))}
            />
          </label>
        </div>
      </div>
    );
  },
};
