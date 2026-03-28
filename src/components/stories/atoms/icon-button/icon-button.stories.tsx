import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Play, Pause, RotateCcw, Sparkles } from "lucide-react";
import { IconButton } from "./icon-button";

const meta = {
  title: "Atoms/IconButton",
  component: IconButton,
  args: { icon: Play },
  argTypes: {
    variant: { control: "select", options: ["primary", "ghost"] },
    size: { control: "select", options: ["sm", "md", "lg"] },
    state: { control: "select", options: ["idle", "hover", "active", "disabled"] },
  },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = { args: { icon: Play, variant: "primary" } };
export const Ghost: Story = { args: { icon: Sparkles, variant: "ghost" } };
export const Hover: Story = { args: { icon: Play, state: "hover" } };
export const Disabled: Story = { args: { icon: Pause, state: "disabled" } };
export const Large: Story = { args: { icon: RotateCcw, size: "lg" } };
