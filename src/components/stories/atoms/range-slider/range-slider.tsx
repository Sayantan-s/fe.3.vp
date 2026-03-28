import * as Slider from "@radix-ui/react-slider";
import { cva, type VariantProps } from "class-variance-authority";
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
  onValueChange,
  className,
}: RangeSliderProps) {
  return (
    <Slider.Root
      className={sliderVariants({ state, className })}
      value={value !== undefined ? [value] : undefined}
      defaultValue={[defaultValue]}
      min={min}
      max={max}
      step={step}
      onValueChange={([v]) => onValueChange?.(v)}
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
