import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SkipButton } from "./skip-button";

const meta = {
  title: "Atoms/SkipButton",
  component: SkipButton,
  argTypes: {
    state: {
      control: "select",
      options: ["default", "hover", "active", "disabled"],
    },
    label: { control: "text" },
  },
} satisfies Meta<typeof SkipButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { state: "default" } };
export const Hover: Story = { args: { state: "hover" } };
export const Active: Story = { args: { state: "active" } };
export const Disabled: Story = { args: { state: "disabled" } };
