import { cva, type VariantProps } from "class-variance-authority";
import { Play, Pause } from "lucide-react";
import styles from "./play-button.module.css";

const playButtonVariants = cva(styles.base, {
  variants: {
    state: {
      default: styles.default,
      hover: styles.hover,
      active: styles.active,
      paused: styles.paused,
      disabled: styles.disabled,
    },
  },
  defaultVariants: { state: "default" },
});

export interface PlayButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof playButtonVariants> {
  isPlaying?: boolean;
}

export function PlayButton({
  state,
  isPlaying = false,
  className,
  ...props
}: PlayButtonProps) {
  const Icon = isPlaying ? Pause : Play;

  return (
    <button
      className={playButtonVariants({ state, className })}
      aria-label={isPlaying ? "Pause" : "Play"}
      disabled={state === "disabled"}
      {...props}
    >
      <Icon size={16} fill="currentColor" strokeWidth={0} />
    </button>
  );
}
