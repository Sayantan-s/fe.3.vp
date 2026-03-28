import { cva, type VariantProps } from "class-variance-authority";
import styles from "./timeline.module.css";

const timelineVariants = cva(styles.base, {
  variants: {
    state: {
      default: styles.default,
      hover: styles.hover,
      complete: styles.complete,
      buffering: styles.buffering,
      disabled: styles.disabled,
    },
  },
  defaultVariants: { state: "default" },
});

export interface TimelineProps
  extends VariantProps<typeof timelineVariants> {
  currentTime: number;
  duration: number;
  buffered?: number;
  onSeek?: (time: number) => void;
  className?: string;
}

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function Timeline({
  state,
  currentTime,
  duration,
  buffered = 0,
  onSeek,
  className,
}: TimelineProps) {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferProgress = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <div className={timelineVariants({ state, className })}>
      <div className={styles.trackWrap}>
        <div className={styles.track} />
        {bufferProgress > 0 && (
          <div className={styles.buffer} style={{ width: `${bufferProgress}%` }} />
        )}
        <div className={styles.active} style={{ width: `${progress}%` }} />
        <div className={styles.playhead} style={{ left: `${progress}%` }} />
        <input
          type="range"
          className={styles.seekInput}
          min={0}
          max={duration || 1}
          step={0.1}
          value={currentTime}
          onChange={(e) => onSeek?.(Number(e.target.value))}
          aria-label="Seek timeline"
          disabled={state === "disabled"}
        />
      </div>
      <div className={styles.markers}>
        <span className={styles.time}>{formatTimestamp(currentTime)}</span>
        <span className={styles.time}>{formatTimestamp(duration)}</span>
      </div>
    </div>
  );
}
