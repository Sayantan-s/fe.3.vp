import styles from "./skeleton.module.css";

/**
 * Right panel skeleton — mirrors the exact layout of:
 *   <section .root>  (right-panel.module.css)
 *     <div .videoWrapper>  (player canvas area)
 *     <PlaybackBar />      (controlRow + Timeline)
 *   </section>
 */

const LAP_COUNT = 5;

export function RightPanelSkeleton() {
  return (
    <section className={`${styles.rightPanel} ${styles.pulse}`}>
      {/* Player canvas area */}
      <div className={styles.playerArea}>
        <div className={styles.playButton} />
      </div>

      {/* Playback bar */}
      <div className={styles.playbackBar}>
        <div className={styles.controlRow}>
          <div className={styles.playbackBtn} />
          <div className={styles.timeDisplay} />
        </div>
        <div className={styles.timelineGroup}>
          <div className={styles.timelineTrack} />
          <div className={styles.timelineLaps}>
            {Array.from({ length: LAP_COUNT }, (_, i) => (
              <div key={i} className={styles.timelineLap} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
