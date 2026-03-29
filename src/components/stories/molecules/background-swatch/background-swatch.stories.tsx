import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { BackgroundSwatch } from ".";

const meta = {
  title: "Molecules/BackgroundSwatch",
  component: BackgroundSwatch,
} satisfies Meta<typeof BackgroundSwatch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { value: 10, onValueChange: () => {} },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return <BackgroundSwatch value={value} onValueChange={setValue} />;
  },
};
