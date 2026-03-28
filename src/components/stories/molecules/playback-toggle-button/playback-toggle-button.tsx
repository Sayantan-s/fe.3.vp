import { Play, Pause, RotateCcw } from "lucide-react";
import { IconButton, type IconButtonProps } from "../../atoms/icon-button/icon-button";

type PlaybackState = "play" | "pause" | "replay";

const ICON_MAP = {
  play: Play,
  pause: Pause,
  replay: RotateCcw,
} as const;

const LABEL_MAP = {
  play: "Play",
  pause: "Pause",
  replay: "Replay",
} as const;

export interface PlaybackToggleButtonProps
  extends Omit<IconButtonProps, "icon" | "aria-label"> {
  playbackState: PlaybackState;
  onToggle?: () => void;
}

function PlaybackToggleButtonRoot({
  playbackState,
  onToggle,
  ...props
}: PlaybackToggleButtonProps) {
  return (
    <IconButton
      icon={ICON_MAP[playbackState]}
      aria-label={LABEL_MAP[playbackState]}
      onClick={onToggle}
      variant="primary"
      {...props}
    />
  );
}

function PlayIcon(props: Omit<PlaybackToggleButtonProps, "playbackState">) {
  return <PlaybackToggleButtonRoot playbackState="play" {...props} />;
}

function PauseIcon(props: Omit<PlaybackToggleButtonProps, "playbackState">) {
  return <PlaybackToggleButtonRoot playbackState="pause" {...props} />;
}

function ReplayIcon(props: Omit<PlaybackToggleButtonProps, "playbackState">) {
  return <PlaybackToggleButtonRoot playbackState="replay" {...props} />;
}

export const PlaybackToggleButton = Object.assign(PlaybackToggleButtonRoot, {
  Play: PlayIcon,
  Pause: PauseIcon,
  Replay: ReplayIcon,
});
