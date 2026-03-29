"use client";

import { ControlsPanel } from "@/components/feat/studio/left-panel/controls-panel";
import { TranscriptPanel } from "@/components/feat/studio/left-panel/transcript-panel";
import styles from "./left-panel.module.css";

export default function LeftPanelPage() {
  return (
    <aside className={styles.root}>
      <TranscriptPanel />
      <ControlsPanel />
    </aside>
  );
}
