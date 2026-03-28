import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PlaybackToggleButton } from "./playback-toggle-button";

const meta = {
  title: "Molecules/PlaybackToggleButton",
  component: PlaybackToggleButton,
  argTypes: {
    playbackState: { control: "select", options: ["play", "pause", "replay"] },
    size: { control: "select", options: ["sm", "md", "lg"] },
    state: { control: "select", options: ["idle", "hover", "active", "disabled"] },
  },
} satisfies Meta<typeof PlaybackToggleButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Play: Story = { args: { playbackState: "play" } };
export const Pause: Story = { args: { playbackState: "pause" } };
export const Replay: Story = { args: { playbackState: "replay" } };
export const Disabled: Story = { args: { playbackState: "play", state: "disabled" } };

export const CompoundPlay: Story = {
  args: { playbackState: "play" },
  render: () => <PlaybackToggleButton.Play />,
};

export const CompoundPause: Story = {
  args: { playbackState: "pause" },
  render: () => <PlaybackToggleButton.Pause />,
};

export const CompoundReplay: Story = {
  args: { playbackState: "replay" },
  render: () => <PlaybackToggleButton.Replay />,
};
