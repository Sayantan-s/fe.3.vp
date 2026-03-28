"use client";

import Player from "@/components/stories/organisms/player";
import { PlaybackBar } from "./playback-bar";
import styles from "./right-panel.module.css";

export interface RightPanelProps {
  padding: number;
  rounding: number;
}

export function RightPanel({ padding, rounding }: RightPanelProps) {
  return (
    <section className={styles.root}>
      <Player.Canvas
        aria-label="Video player"
        className={styles.videoArea}
        padding={padding}
        rounding={rounding}
        onError={(e) => console.error("Player error:", e)}
      >
        <Player.Canvas.Background
          backgroundSrc="/sample-bg.jpg"
          className={styles.videoAreaBackground}
        />
        <Player.Canvas.Video videoSrc="/Action_Hero_Video_Generated.mp4" />
        <PlaybackBar />
      </Player.Canvas>
    </section>
  );
}
