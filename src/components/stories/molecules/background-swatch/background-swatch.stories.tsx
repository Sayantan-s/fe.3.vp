import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { BackgroundSwatch } from ".";
import { BG_OPTIONS, BG_OPTION_KEYS } from "./bg-options";

const meta = {
  title: "Molecules/BackgroundSwatch",
  component: BackgroundSwatch,
} satisfies Meta<typeof BackgroundSwatch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { value: 10, onValueChange: () => {}, children: null },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return (
      <BackgroundSwatch value={value} onValueChange={setValue}>
        <BackgroundSwatch.Label>Choose Backgrounds</BackgroundSwatch.Label>
        <BackgroundSwatch.Items>
          {BG_OPTION_KEYS.map((key) => (
            <BackgroundSwatch.Item
              key={key}
              bgKey={key}
              src={BG_OPTIONS[key].src}
              label={BG_OPTIONS[key].label}
            />
          ))}
        </BackgroundSwatch.Items>
      </BackgroundSwatch>
    );
  },
};
