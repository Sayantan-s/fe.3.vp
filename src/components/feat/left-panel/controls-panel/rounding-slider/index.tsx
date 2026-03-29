import { Slider } from "@/components/stories/molecules/slider/slider";
import { useVideoDataState } from "@/components/feat/context/video-data/use-video-data-state";
import { useVideoDataActions } from "@/components/feat/context/video-data/use-video-data-actions";

export const RoundingSlider = () => {
  const { rounding } = useVideoDataState();
  const { setRounding } = useVideoDataActions();

  return (
    <Slider value={rounding} onChange={setRounding} min={0} max={32}>
      <Slider.Label>Rounding</Slider.Label>
      <Slider.TrackRow>
        <Slider.LowerBound />
        <Slider.Track />
        <Slider.UpperBound />
      </Slider.TrackRow>
    </Slider>
  );
};
