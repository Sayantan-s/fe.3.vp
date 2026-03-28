"use client";

import Player from "@/components/stories/organisms/player";
import { PlaybackBar } from "./playback-bar";
import styles from "./right-panel.module.css";

export const RightPanel = () => {
  return (
    <section className={styles.root}>
      <Player.Canvas
        aria-label="Video player"
        className={styles.videoArea}
        defaultPadding={10}
        defaultRounding={10}
        onError={(e) => console.error("Player error:", e)}
      >
        <Player.Canvas.Background backgroundSrc="/sample-bg.jpg" />
        <Player.Canvas.Video videoSrc="/Action_Hero_Video_Generated.mp4" />
        <PlaybackBar />
      </Player.Canvas>
    </section>
  );
};
