import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TimeDisplay } from "./time-display";

const meta = {
  title: "Molecules/TimeDisplay",
  component: TimeDisplay,
  args: { currentTime: 3, duration: 165 },
  argTypes: {
    currentTime: { control: { type: "range", min: 0, max: 300, step: 1 } },
    duration: { control: "number" },
  },
} satisfies Meta<typeof TimeDisplay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const AtStart: Story = { args: { currentTime: 0 } };
export const Midway: Story = { args: { currentTime: 82 } };
export const AtEnd: Story = { args: { currentTime: 165 } };
