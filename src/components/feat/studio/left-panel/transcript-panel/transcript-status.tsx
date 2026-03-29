import styles from "./transcript-panel.module.css";

interface TranscriptStatusProps {
  message: string;
}

export function TranscriptStatus({ message }: TranscriptStatusProps) {
  return (
    <div className={styles.scriptSection}>
      <div className={styles.scriptHeader}>
        <span className={styles.scriptLabel}>Transcript</span>
      </div>
      <p className={styles.scriptPlaceholder}>{message}</p>
    </div>
  );
}
