import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Timeline } from "./timeline";

const meta = {
  title: "Atoms/Timeline",
  component: Timeline,
  args: { currentTime: 18, duration: 150 },
  argTypes: {
    state: {
      control: "select",
      options: ["default", "hover", "complete", "buffering", "disabled"],
    },
    currentTime: { control: { type: "range", min: 0, max: 150, step: 1 } },
    duration: { control: "number" },
    buffered: { control: { type: "range", min: 0, max: 150, step: 1 } },
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

export const Default: Story = { args: { state: "default" } };
export const Hover: Story = { args: { state: "hover" } };
export const Complete: Story = { args: { state: "complete", currentTime: 150 } };
export const Buffering: Story = { args: { state: "buffering", buffered: 60 } };
export const Disabled: Story = { args: { state: "disabled" } };
