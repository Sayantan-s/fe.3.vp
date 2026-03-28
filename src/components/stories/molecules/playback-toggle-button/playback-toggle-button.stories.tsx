import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PlaybackToggleButton } from "./playback-toggle-button";

const meta = {
  title: "Molecules/PlaybackToggleButton",
  component: PlaybackToggleButton,
} satisfies Meta<typeof PlaybackToggleButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playing: Story = {
  args: { playbackState: "pause", onToggle: () => {}, children: null },
  render: () => (
    <PlaybackToggleButton playbackState="pause" onToggle={() => {}}>
      <PlaybackToggleButton.Play />
      <PlaybackToggleButton.Pause />
      <PlaybackToggleButton.Replay />
    </PlaybackToggleButton>
  ),
};

export const Paused: Story = {
  args: { playbackState: "play", onToggle: () => {}, children: null },
  render: () => (
    <PlaybackToggleButton playbackState="play" onToggle={() => {}}>
      <PlaybackToggleButton.Play />
      <PlaybackToggleButton.Pause />
      <PlaybackToggleButton.Replay />
    </PlaybackToggleButton>
  ),
};

export const Replay: Story = {
  args: { playbackState: "play", onToggle: () => {}, children: null },
  render: () => (
    <PlaybackToggleButton
      playbackState="play"
      onToggle={() => {}}
      currentTime={165}
      duration={165}
    >
      <PlaybackToggleButton.Play />
      <PlaybackToggleButton.Pause />
      <PlaybackToggleButton.Replay />
    </PlaybackToggleButton>
  ),
};
