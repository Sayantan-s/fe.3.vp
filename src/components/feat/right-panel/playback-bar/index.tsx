"use client";

import { usePlayback } from "@/components/stories/organisms/player";
import { PlaybackToggleButton } from "./playback-toggle-button";
import { TimeDisplay } from "./time-display";
import { Timeline } from "@/components/stories/molecules/timeline/timeline";
import styles from "./playback-bar.module.css";

export function PlaybackBar() {
  const playback = usePlayback();

  const playbackState = playback.isPlaying ? "pause" : "play";

  function handleToggle() {
    if (playback.isEnded) {
      playback.seek(0);
      playback.play();
      return;
    }
    playback.isPlaying ? playback.pause() : playback.play();
  }

  return (
    <div className={styles.root}>
      <div className={styles.controlRow}>
        <PlaybackToggleButton
          playbackState={playbackState}
          onToggle={handleToggle}
          currentTime={playback.currentTime}
          duration={playback.duration}
        >
          <PlaybackToggleButton.Play />
          <PlaybackToggleButton.Pause />
          <PlaybackToggleButton.Replay />
        </PlaybackToggleButton>

        <TimeDisplay
          currentTime={playback.currentTime}
          duration={playback.duration}
        />
      </div>

      <Timeline
        currentTime={playback.currentTime}
        duration={playback.duration}
        lapInterval={15}
        onSeek={(t) => playback.seek(t)}
      />
    </div>
  );
}
