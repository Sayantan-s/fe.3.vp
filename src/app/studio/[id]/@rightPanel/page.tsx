"use client";

import { useVideoDataState } from "@/components/feat/context/video-data/use-video-data-state";
import { PlaybackBar } from "@/components/feat/right-panel/playback-bar";
import { PlaybackTimeBridge } from "@/components/feat/right-panel/playback-time-bridge";
import { RightPanelSkeleton } from "@/components/feat/skeletons/right-panel-skeleton";
import styles from "@/components/feat/right-panel/right-panel.module.css";
import Player from "@/components/stories/organisms/player";
import { BG_OPTIONS } from "@/components/stories/molecules/background-swatch/bg-options";

export default function RightPanelPage() {
  const { videoUrl, bg, padding, rounding, isLoading, error } =
    useVideoDataState();

  if (isLoading) return <RightPanelSkeleton />;

  if (error) {
    return (
      <section className={styles.root}>
        <div style={{ padding: 32, textAlign: "center" }}>
          <p>Failed to load video</p>
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>{error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.root}>
      <div className={styles.videoWrapper}>
        <Player.Canvas
          aria-label="Video player"
          className={styles.canvasFrame}
          padding={padding}
          rounding={rounding}
          onError={(e: unknown) => console.error("Player error:", e)}
        >
          <Player.Canvas.Background backgroundSrc={bg != null && BG_OPTIONS[bg] ? BG_OPTIONS[bg].src : "/sample-bg.jpg"} />
          <Player.Canvas.Video videoSrc={videoUrl ?? ""} />
          <PlaybackTimeBridge />
          <PlaybackBar />
        </Player.Canvas>
      </div>
    </section>
  );
}
