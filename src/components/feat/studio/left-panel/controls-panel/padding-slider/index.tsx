import { Slider } from "@/components/stories/molecules/slider/slider";
import { useVideoDataState } from "@/components/feat/studio/context/video-data/use-video-data-state";
import { useVideoDataActions } from "@/components/feat/studio/context/video-data/use-video-data-actions";

const MAX_PADDING = 25;
const MIN_PADDING = 2;

export const PaddingSlider = () => {
  const { padding } = useVideoDataState();
  const { setPadding } = useVideoDataActions();

  return (
    <Slider
      value={padding}
      onChange={setPadding}
      min={MIN_PADDING}
      max={MAX_PADDING}
    >
      <Slider.Label>Padding</Slider.Label>
      <Slider.TrackRow>
        <Slider.LowerBound />
        <Slider.Track />
        <Slider.UpperBound />
      </Slider.TrackRow>
    </Slider>
  );
};
