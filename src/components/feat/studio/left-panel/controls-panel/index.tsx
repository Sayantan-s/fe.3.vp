// src/components/feat/left-panel/controls-panel/index.tsx
"use client";

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
