import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { RangeSlider } from "./range-slider";

const meta = {
  title: "Atoms/RangeSlider",
  component: RangeSlider,
  args: { label: "Slider", min: 0, max: 100, defaultValue: 40 },
  argTypes: {
    state: {
      control: "select",
      options: ["default", "hover", "dragging", "disabled"],
    },
  },
} satisfies Meta<typeof RangeSlider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { state: "default" } };
export const Hover: Story = { args: { state: "hover" } };
export const Dragging: Story = { args: { state: "dragging" } };
export const Disabled: Story = { args: { state: "disabled" } };
