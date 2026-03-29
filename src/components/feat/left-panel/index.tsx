// src/components/feat/left-panel/index.tsx
import { ControlsPanel } from "./controls-panel";
import { TranscriptPanel } from "./transcript-panel";
import styles from "./left-panel.module.css";

export function LeftPanel() {
  return (
    <aside className={styles.root}>
      <TranscriptPanel />
      <ControlsPanel />
    </aside>
  );
}
