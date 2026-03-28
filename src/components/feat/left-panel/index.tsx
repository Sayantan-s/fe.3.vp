import { ControlsPanel } from "./controls-panel";
import { TranscriptPanel } from "./transcript-panel";
import styles from "./left-panel.module.css";

export interface LeftPanelProps {
  padding: number;
  rounding: number;
  onPaddingChange: (value: number) => void;
  onRoundingChange: (value: number) => void;
}

export function LeftPanel({
  padding,
  rounding,
  onPaddingChange,
  onRoundingChange,
}: LeftPanelProps) {
  return (
    <aside className={styles.root}>
      <TranscriptPanel />
      <ControlsPanel
        padding={padding}
        rounding={rounding}
        onPaddingChange={onPaddingChange}
        onRoundingChange={onRoundingChange}
      />
    </aside>
  );
}
