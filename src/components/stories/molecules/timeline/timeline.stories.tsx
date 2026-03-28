import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Timeline } from "./timeline";

const meta = {
  title: "Molecules/Timeline",
  component: Timeline,
  args: { currentTime: 18, duration: 165, lapInterval: 15 },
  argTypes: {
    state: {
      control: "select",
      options: ["default", "hover", "complete", "buffering", "disabled"],
    },
    currentTime: { control: { type: "range", min: 0, max: 165, step: 1 } },
    duration: { control: "number" },
    buffered: { control: { type: "range", min: 0, max: 165, step: 1 } },
    lapInterval: { control: { type: "number", min: 5, max: 60, step: 5 } },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 600, padding: 32 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Timeline>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Hover: Story = { args: { state: "hover" } };
export const Complete: Story = { args: { state: "complete", currentTime: 165 } };
export const Buffering: Story = { args: { state: "buffering", buffered: 60 } };
export const Disabled: Story = { args: { state: "disabled" } };
export const FiveSecondLaps: Story = { args: { lapInterval: 5, duration: 30 } };
export const ThirtySecondLaps: Story = { args: { lapInterval: 30 } };
