import { cva, type VariantProps } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";
import styles from "./icon-button.module.css";

const iconButtonVariants = cva(styles.base, {
  variants: {
    variant: {
      primary: styles.primary,
      ghost: styles.ghost,
    },
    size: {
      sm: styles.sm,
      md: styles.md,
      lg: styles.lg,
    },
    state: {
      idle: "",
      hover: styles.hover,
      active: styles.active,
      disabled: styles.disabled,
    },
  },
  defaultVariants: { variant: "primary", size: "md", state: "idle" },
});

export interface IconButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {
  icon: LucideIcon;
  iconSize?: number;
}

export function IconButton({
  icon: Icon,
  iconSize = 16,
  variant,
  size,
  state,
  className,
  ...props
}: IconButtonProps) {
  return (
    <button
      className={iconButtonVariants({ variant, size, state, className })}
      disabled={state === "disabled"}
      {...props}
    >
      <Icon size={iconSize} />
    </button>
  );
}
