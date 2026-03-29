import { Pause, Play, RotateCcw } from "lucide-react";
import { createContext } from "react";

export type PlaybackMode = "play" | "pause" | "replay";

export enum EPlaybackState {
  Play = "play",
  Pause = "pause",
  Replay = "replay",
}

export interface PlaybackToggleContextValue {
  mode: EPlaybackState;
  onToggle: () => void;
}

export const PlaybackToggleContext =
  createContext<PlaybackToggleContextValue | null>(null);
