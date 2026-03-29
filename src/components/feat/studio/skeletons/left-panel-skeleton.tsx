import styles from "./skeleton.module.css";

export function LeftPanelSkeleton() {
  return (
    <aside className={`${styles.leftPanel} ${styles.pulse}`}>
      <div className={styles.textLines}>
        <div className={styles.textLine} style={{ width: "80%" }} />
        <div className={styles.textLine} style={{ width: "95%" }} />
        <div className={styles.textLine} style={{ width: "70%" }} />
        <div className={styles.textLine} style={{ width: "88%" }} />
        <div className={styles.textLine} style={{ width: "60%" }} />
      </div>
      <div className={styles.controlSkeleton}>
        <div className={styles.controlGroup}>
          <div className={styles.sliderLabel} />
          <div className={styles.sliderTrack} />
        </div>
        <div className={styles.controlGroup}>
          <div className={styles.sliderLabel} />
          <div className={styles.sliderTrack} />
        </div>
      </div>
    </aside>
  );
}
