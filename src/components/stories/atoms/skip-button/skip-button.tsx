import { cva, type VariantProps } from "class-variance-authority";
import { Sparkles } from "lucide-react";
import styles from "./skip-button.module.css";

const skipButtonVariants = cva(styles.base, {
  variants: {
    state: {
      default: styles.default,
      hover: styles.hover,
      active: styles.active,
      disabled: styles.disabled,
    },
  },
  defaultVariants: { state: "default" },
});

export interface SkipButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof skipButtonVariants> {
  label?: string;
}

export function SkipButton({
  state,
  label = "Skip",
  className,
  ...props
}: SkipButtonProps) {
  return (
    <button
      className={skipButtonVariants({ state, className })}
      disabled={state === "disabled"}
      {...props}
    >
      <Sparkles size={14} />
      <span>{label}</span>
    </button>
  );
}
