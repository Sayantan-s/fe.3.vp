import { BackgroundSwatch } from "@/components/stories/molecules/background-swatch";
import { useVideoDataState } from "@/components/feat/context/video-data/use-video-data-state";
import { useVideoDataActions } from "@/components/feat/context/video-data/use-video-data-actions";

export const BgSwatch = () => {
  const { bg } = useVideoDataState();
  const { setBg } = useVideoDataActions();
  return <BackgroundSwatch value={bg ?? 1} onValueChange={setBg} />;
};
