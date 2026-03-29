// src/components/feat/left-panel/controls-panel/index.tsx
"use client";

import { Slider } from "@/components/stories/molecules/slider/slider";
import { useVideoDataState } from "@/components/feat/context/video-data/use-video-data-state";
import { useVideoDataActions } from "@/components/feat/context/video-data/use-video-data-actions";
import styles from "./controls-panel.module.css";

export function ControlsPanel() {
  const { padding, rounding } = useVideoDataState();
  const { setPadding, setRounding } = useVideoDataActions();

  return (
    <div className={styles.root}>
      <Slider value={padding} onChange={setPadding} min={0} max={32}>
        <Slider.Label>Padding</Slider.Label>
        <Slider.TrackRow>
          <Slider.LowerBound />
          <Slider.Track />
          <Slider.UpperBound />
        </Slider.TrackRow>
      </Slider>

      <Slider value={rounding} onChange={setRounding} min={0} max={32}>
        <Slider.Label>Rounding</Slider.Label>
        <Slider.TrackRow>
          <Slider.LowerBound />
          <Slider.Track />
          <Slider.UpperBound />
        </Slider.TrackRow>
      </Slider>
    </div>
  );
}
