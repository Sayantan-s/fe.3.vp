import { Slider } from "@/components/stories/molecules/slider/slider";
import { useVideoDataState } from "@/components/feat/studio/context/video-data/use-video-data-state";
import { useVideoDataActions } from "@/components/feat/studio/context/video-data/use-video-data-actions";

const MAX_ROUNDING = 20;

export const RoundingSlider = () => {
  const { rounding } = useVideoDataState();
  const { setRounding } = useVideoDataActions();

  return (
    <Slider value={rounding} onChange={setRounding} max={MAX_ROUNDING}>
      <Slider.Label>Rounding</Slider.Label>
      <Slider.TrackRow>
        <Slider.LowerBound />
        <Slider.Track />
        <Slider.UpperBound />
      </Slider.TrackRow>
    </Slider>
  );
};
