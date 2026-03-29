"use client";

import * as Slider from "@radix-ui/react-slider";
import { cva, type VariantProps } from "class-variance-authority";
import { useDebouncedSlider } from "@/hooks/use-debounced-slider";
import styles from "./range-slider.module.css";

const sliderVariants = cva(styles.root, {
  variants: {
    state: {
      default: styles.default,
      hover: styles.hover,
      dragging: styles.dragging,
      disabled: styles.disabled,
    },
  },
  defaultVariants: { state: "default" },
});

export interface RangeSliderProps extends VariantProps<typeof sliderVariants> {
  label: string;
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  debounceMs?: number;
  onValueChange?: (value: number) => void;
  className?: string;
}

export function RangeSlider({
  label,
  state,
  value,
  defaultValue = 0,
  min = 0,
  max = 100,
  step = 1,
  debounceMs,
  onValueChange,
  className,
}: RangeSliderProps) {
  const [displayValue, handleChange] = useDebouncedSlider(
    value ?? defaultValue,
    onValueChange,
    debounceMs,
  );

  return (
    <Slider.Root
      className={sliderVariants({ state, className })}
      value={value !== undefined ? [displayValue] : undefined}
      defaultValue={[defaultValue]}
      min={min}
      max={max}
      step={step}
      onValueChange={([v]) => handleChange(v)}
      disabled={state === "disabled"}
      aria-label={label}
    >
      <Slider.Track className={styles.track}>
        <Slider.Range className={styles.range} />
      </Slider.Track>
      <Slider.Thumb className={styles.thumb} />
    </Slider.Root>
  );
}
