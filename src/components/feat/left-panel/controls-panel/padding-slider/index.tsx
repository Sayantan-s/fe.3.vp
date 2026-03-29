import { Slider } from "@/components/stories/molecules/slider/slider";
import { useVideoDataState } from "@/components/feat/context/video-data/use-video-data-state";
import { useVideoDataActions } from "@/components/feat/context/video-data/use-video-data-actions";

export const PaddingSlider = () => {
  const { padding } = useVideoDataState();
  const { setPadding } = useVideoDataActions();

  return (
    <Slider value={padding} onChange={setPadding} min={0} max={32}>
      <Slider.Label>Padding</Slider.Label>
      <Slider.TrackRow>
        <Slider.LowerBound />
        <Slider.Track />
        <Slider.UpperBound />
      </Slider.TrackRow>
    </Slider>
  );
};
