import styles from "./skeleton.module.css";

/**
 * Left panel skeleton — mirrors the exact layout of:
 *   <aside .root>  (left-panel.module.css)
 *     <TranscriptPanel />  (scriptSection → scriptHeader + wordContainer)
 *     <ControlsPanel />    (BgSwatch + PaddingSlider + RoundingSlider)
 *   </aside>
 */

const WORD_LINE_WIDTHS = [
  "80%", "95%", "70%", "88%", "60%", "92%", "75%", "85%",
] as const;

const SWATCH_COUNT = 12;

export function LeftPanelSkeleton() {
  return (
    <aside className={`${styles.leftPanel} ${styles.pulse}`}>
      {/* Transcript section */}
      <div className={styles.transcriptSection}>
        <div className={styles.transcriptHeader}>
          <div className={styles.transcriptLabel} />
        </div>
        <div className={styles.wordLines}>
          {WORD_LINE_WIDTHS.map((width, i) => (
            <div key={i} className={styles.wordLine} style={{ width }} />
          ))}
        </div>
      </div>

      {/* Controls section */}
      <div className={styles.controlsSection}>
        {/* BgSwatch */}
        <div className={styles.swatchGroup}>
          <div className={styles.swatchLabel} />
          <div className={styles.swatchGrid}>
            {Array.from({ length: SWATCH_COUNT }, (_, i) => (
              <div key={i} className={styles.swatchItem} />
            ))}
          </div>
        </div>

        {/* Padding slider */}
        <SliderSkeleton />

        {/* Rounding slider */}
        <SliderSkeleton />
      </div>
    </aside>
  );
}

function SliderSkeleton() {
  return (
    <div className={styles.sliderGroup}>
      <div className={styles.sliderLabel} />
      <div className={styles.sliderTrackRow}>
        <div className={styles.sliderBound} />
        <div className={styles.sliderTrack} />
        <div className={styles.sliderBound} />
      </div>
    </div>
  );
}
