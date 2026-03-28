import styles from "./time-display.module.css";

export interface TimeDisplayProps {
  currentTime: number;
  duration: number;
  className?: string;
}

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function TimeDisplay({ currentTime, duration, className }: TimeDisplayProps) {
  return (
    <span className={`${styles.root} ${className ?? ""}`} aria-label="Playback time">
      <span className={styles.current}>{formatTimestamp(currentTime)}</span>
      <span className={styles.separator}> / </span>
      <span className={styles.total}>{formatTimestamp(duration)}</span>
    </span>
  );
}
