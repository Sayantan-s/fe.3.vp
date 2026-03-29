"use client";

import { useVideoDataState } from "@/components/feat/studio/context/video-data/use-video-data-state";
import { ControlsPanel } from "@/components/feat/studio/left-panel/controls-panel";
import { TranscriptPanel } from "@/components/feat/studio/left-panel/transcript-panel";
import { LeftPanelSkeleton } from "@/components/feat/studio/skeletons/left-panel-skeleton";
import styles from "./left-panel.module.css";

export default function LeftPanelPage() {
  const { isLoading } = useVideoDataState();

  if (isLoading) return <LeftPanelSkeleton />;

  return (
    <aside className={styles.root}>
      <TranscriptPanel />
      <ControlsPanel />
    </aside>
  );
}
