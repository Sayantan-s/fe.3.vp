import { cva, type VariantProps } from "class-variance-authority";
import styles from "./range-slider.module.css";

const sliderVariants = cva(styles.base, {
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

export interface RangeSliderProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">,
    VariantProps<typeof sliderVariants> {
  label: string;
}

export function RangeSlider({
  state,
  label,
  className,
  ...props
}: RangeSliderProps) {
  return (
    <input
      type="range"
      className={sliderVariants({ state, className })}
      aria-label={label}
      disabled={state === "disabled"}
      {...props}
    />
  );
}
