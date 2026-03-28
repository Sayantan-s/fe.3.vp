import styles from "../left-panel.module.css";

export function TranscriptPanel() {
  return (
    <div className={styles.scriptSection}>
      <div className={styles.scriptHeader}>
        <span className={styles.scriptLabel}>Script</span>
      </div>
      <p className={styles.scriptPlaceholder}>
        Your script will appear here...
      </p>
    </div>
  );
}
