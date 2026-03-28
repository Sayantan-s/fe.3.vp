"use client";

import { use } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import {
  IconButton,
  type IconButtonProps,
} from "../../atoms/icon-button/icon-button";
import {
  PlaybackToggleContext,
  type PlaybackMode,
} from "./playback-toggle-context";

// --- Derive mode from props ---

function deriveMode(
  playbackState: PlaybackMode,
  currentTime?: number,
  duration?: number,
): PlaybackMode {
  if (
    duration !== undefined &&
    currentTime !== undefined &&
    duration > 0 &&
    currentTime >= duration
  ) {
    return "replay";
  }
  return playbackState;
}

// --- Root (Provider) ---

interface PlaybackToggleRootProps {
  playbackState: PlaybackMode;
  onToggle: () => void;
  currentTime?: number;
  duration?: number;
  children: React.ReactNode;
}

function PlaybackToggleRoot({
  playbackState,
  onToggle,
  currentTime,
  duration,
  children,
}: PlaybackToggleRootProps) {
  const mode = deriveMode(playbackState, currentTime, duration);

  return (
    <PlaybackToggleContext value={{ mode, onToggle }}>
      {children}
    </PlaybackToggleContext>
  );
}

// --- Sub-components (consume context, render only when mode matches) ---

type SubProps = Omit<IconButtonProps, "icon" | "aria-label" | "onClick">;

function PlayIcon(props: SubProps) {
  const ctx = use(PlaybackToggleContext);
  if (!ctx || ctx.mode !== "play") return null;
  return (
    <IconButton
      icon={Play}
      aria-label="Play"
      onClick={ctx.onToggle}
      variant="primary"
      {...props}
    />
  );
}

function PauseIcon(props: SubProps) {
  const ctx = use(PlaybackToggleContext);
  if (!ctx || ctx.mode !== "pause") return null;
  return (
    <IconButton
      icon={Pause}
      aria-label="Pause"
      onClick={ctx.onToggle}
      variant="primary"
      {...props}
    />
  );
}

function ReplayIcon(props: SubProps) {
  const ctx = use(PlaybackToggleContext);
  if (!ctx || ctx.mode !== "replay") return null;
  return (
    <IconButton
      icon={RotateCcw}
      aria-label="Replay"
      onClick={ctx.onToggle}
      variant="primary"
      {...props}
    />
  );
}

export const PlaybackToggleButton = Object.assign(PlaybackToggleRoot, {
  Play: PlayIcon,
  Pause: PauseIcon,
  Replay: ReplayIcon,
});
