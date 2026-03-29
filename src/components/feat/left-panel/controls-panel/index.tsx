// src/components/feat/left-panel/controls-panel/index.tsx
"use client";

import { Slider } from "@/components/stories/molecules/slider/slider";
import { BackgroundSwatch } from "@/components/stories/molecules/background-swatch";
import { useVideoDataState } from "@/components/feat/context/video-data/use-video-data-state";
import { useVideoDataActions } from "@/components/feat/context/video-data/use-video-data-actions";
import styles from "./controls-panel.module.css";
import { BgSwatch } from "./bg-swatch";
import { PaddingSlider } from "./padding-slider";
import { RoundingSlider } from "./rounding-slider";

export function ControlsPanel() {
  return (
    <div className={styles.root}>
      <BgSwatch />
      <PaddingSlider />
      <RoundingSlider />
    </div>
  );
}
