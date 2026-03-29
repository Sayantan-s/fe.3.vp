import styles from "./skeleton.module.css";

export function RightPanelSkeleton() {
  return (
    <section className={`${styles.rightPanel} ${styles.pulse}`}>
      <div className={styles.playerArea}>
        <div className={styles.playButton} />
      </div>
      <div className={styles.playbackBar}>
        <div className={styles.playbackBtn} />
        <div className={styles.timeDisplay} />
        <div className={styles.timeline} />
      </div>
    </section>
  );
}
