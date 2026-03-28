import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PlayButton } from "./play-button";

const meta = {
  title: "Atoms/PlayButton",
  component: PlayButton,
  argTypes: {
    state: {
      control: "select",
      options: ["default", "hover", "active", "paused", "disabled"],
    },
    isPlaying: { control: "boolean" },
  },
} satisfies Meta<typeof PlayButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { state: "default" } };
export const Hover: Story = { args: { state: "hover" } };
export const Active: Story = { args: { state: "active" } };
export const Paused: Story = { args: { state: "paused", isPlaying: true } };
export const Disabled: Story = { args: { state: "disabled" } };
