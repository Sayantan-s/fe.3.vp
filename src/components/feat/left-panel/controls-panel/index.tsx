import { RangeSlider } from "@/components/stories/atoms/range-slider/range-slider";
import styles from "./controls-panel.module.css";

export interface ControlsPanelProps {
  padding: number;
  rounding: number;
  onPaddingChange: (value: number) => void;
  onRoundingChange: (value: number) => void;
}

export function ControlsPanel({
  padding,
  rounding,
  onPaddingChange,
  onRoundingChange,
}: ControlsPanelProps) {
  return (
    <div className={styles.root}>
      <div className={styles.control}>
        <span className={styles.label}>Padding</span>
        <div className={styles.sliderRow}>
          <span className={styles.bound}>00</span>
          <RangeSlider
            label="Padding"
            value={padding}
            min={0}
            max={32}
            step={1}
            onValueChange={onPaddingChange}
          />
          <span className={styles.bound}>32</span>
        </div>
      </div>

      <div className={styles.control}>
        <span className={styles.label}>Rounding</span>
        <div className={styles.sliderRow}>
          <span className={styles.bound}>00</span>
          <RangeSlider
            label="Rounding"
            value={rounding}
            min={0}
            max={32}
            step={1}
            onValueChange={onRoundingChange}
          />
          <span className={styles.bound}>32</span>
        </div>
      </div>
    </div>
  );
}
