"use client";

import * as Slider from "@radix-ui/react-slider";
import { cva, type VariantProps } from "class-variance-authority";
import { useDebouncedSlider } from "@/hooks/use-debounced-slider";
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
  /** Interval between lap markers in seconds. Default: 15 */
  lapInterval?: number;
  debounceMs?: number;
  onSeek?: (time: number) => void;
  className?: string;
}

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function generateLaps(duration: number, interval: number): number[] {
  if (duration <= 0 || interval <= 0) return [0];
  const laps: number[] = [];
  for (let t = 0; t <= duration; t += interval) {
    laps.push(t);
  }
  // Ensure last lap is at the end if not already
  if (laps[laps.length - 1] !== duration) {
    laps.push(duration);
  }
  return laps;
}

export function Timeline({
  state,
  currentTime,
  duration,
  buffered = 0,
  lapInterval = 15,
  debounceMs,
  onSeek,
  className,
}: TimelineProps) {
  const [displayTime, handleSeek] = useDebouncedSlider(
    currentTime,
    onSeek,
    debounceMs,
  );

  const bufferPct = duration > 0 ? (buffered / duration) * 100 : 0;
  const laps = generateLaps(duration, lapInterval);

  return (
    <div className={timelineVariants({ state, className })}>
      <div className={styles.trackWrap}>
        {bufferPct > 0 && (
          <div
            className={styles.buffer}
            style={{ width: `${bufferPct}%` }}
          />
        )}
        <Slider.Root
          className={styles.slider}
          value={[displayTime]}
          min={0}
          max={duration || 1}
          step={0.1}
          onValueChange={([v]) => handleSeek(v)}
          disabled={state === "disabled"}
          aria-label="Seek timeline"
        >
          <Slider.Track className={styles.track}>
            <Slider.Range className={styles.range} />
          </Slider.Track>
          <Slider.Thumb className={styles.playhead} />
        </Slider.Root>
      </div>
      <div className={styles.laps}>
        {laps.map((t) => (
          <span key={t} className={styles.lap}>
            {formatTimestamp(t)}
          </span>
        ))}
      </div>
    </div>
  );
}
