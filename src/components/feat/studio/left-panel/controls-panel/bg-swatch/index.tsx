import { BackgroundSwatch } from "@/components/stories/molecules/background-swatch";
import { useVideoDataState } from "@/components/feat/studio/context/video-data/use-video-data-state";
import { useVideoDataActions } from "@/components/feat/studio/context/video-data/use-video-data-actions";
import {
  BG_OPTION_KEYS,
  BG_OPTIONS,
} from "@/components/stories/molecules/background-swatch/bg-options";

export const BgSwatch = () => {
  const { bg } = useVideoDataState();
  const { setBg } = useVideoDataActions();
  return (
    <BackgroundSwatch value={bg ?? 1} onValueChange={setBg}>
      <BackgroundSwatch.Label>Choose a background</BackgroundSwatch.Label>
      <BackgroundSwatch.Items>
        {BG_OPTION_KEYS.map((key) => (
          <BackgroundSwatch.Item
            key={key}
            bgKey={key}
            src={BG_OPTIONS[key as keyof typeof BG_OPTIONS].src}
            label={BG_OPTIONS[key as keyof typeof BG_OPTIONS].label}
          />
        ))}
      </BackgroundSwatch.Items>
    </BackgroundSwatch>
  );
};
