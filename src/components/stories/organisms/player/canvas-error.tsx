"use client";

import { use } from "react";
import { PlayerContext } from "./context/context";
import { usePlayerCtx } from "./context/use-player-ctx";

export interface CanvasErrorProps {
  children?: React.ReactNode | ((error: Error) => React.ReactNode);
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Headless error fallback component.
 * Place inside `<Player.Canvas>` — it renders only when `playerState.error` is set.
 *
 * @example
 * <Player.Canvas aria-label="demo">
 *   <Player.Canvas.Video videoSrc="/v.mp4" />
 *   <Player.Canvas.Error>
 *     {(error) => <p>{error.message}</p>}
 *   </Player.Canvas.Error>
 * </Player.Canvas>
 */
export function CanvasError({ children, className, style }: CanvasErrorProps) {
  const ctx = usePlayerCtx();
  const error = ctx?.state.error;

  if (!error) return null;

  // Render-prop pattern: consumer controls the UI
  if (typeof children === "function") {
    return (
      <div role="alert" className={className} style={style}>
        {children(error)}
      </div>
    );
  }

  // Static children fallback
  if (children) {
    return (
      <div role="alert" className={className} style={style}>
        {children}
      </div>
    );
  }

  // Default minimal fallback
  return (
    <div role="alert" className={className} style={style}>
      <p>{error.message}</p>
    </div>
  );
}

CanvasError.displayName = "CanvasError";
