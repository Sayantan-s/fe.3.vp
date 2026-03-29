import styles from "./skeleton.module.css";

export function PlayerSkeleton() {
  return (
    <div className={`${styles.playerArea} ${styles.pulse}`} style={{ flex: 1, margin: 0 }}>
      <div className={styles.playButton} />
    </div>
  );
}
