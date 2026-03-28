import * as Slider from "@radix-ui/react-slider";
import { cva, type VariantProps } from "class-variance-authority";
import styles from "./timeline.module.css";

const timelineVariants = cva(styles.root, {
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

export interface TimelineProps extends VariantProps<typeof timelineVariants> {
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
  const bufferPct = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <div className={timelineVariants({ state, className })}>
      <div className={styles.trackWrap}>
        {bufferPct > 0 && (
          <div className={styles.buffer} style={{ width: `${bufferPct}%` }} />
        )}
        <Slider.Root
          className={styles.slider}
          value={[currentTime]}
          min={0}
          max={duration || 1}
          step={0.1}
          onValueChange={([v]) => onSeek?.(v)}
          disabled={state === "disabled"}
          aria-label="Seek timeline"
        >
          <Slider.Track className={styles.track}>
            <Slider.Range className={styles.range} />
          </Slider.Track>
          <Slider.Thumb className={styles.playhead} />
        </Slider.Root>
      </div>
      <div className={styles.markers}>
        <span className={styles.time}>{formatTimestamp(currentTime)}</span>
        <span className={styles.time}>{formatTimestamp(duration)}</span>
      </div>
    </div>
  );
}
