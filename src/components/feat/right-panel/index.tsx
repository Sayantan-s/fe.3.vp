import { PlaybackBar } from "./playback-bar";
import { VideoPreview } from "./video-preview";

export const RightPanel = () => {
  return (
    <section>
      Right Panel
      <VideoPreview />
      <PlaybackBar />
    </section>
  );
};
