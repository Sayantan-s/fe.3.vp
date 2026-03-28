"use client";

import { useBackgroundMesh } from "./hooks/use-background-mesh";
import type { CanvasBackgroundProps } from "./types";
import { usePlayerInternalCtx } from "./context/use-player-internal-ctx";
import { Activity } from "react";

export function CanvasBackground({
  backgroundSrc,
  "aria-label": ariaLabel,
}: CanvasBackgroundProps) {
  const internal = usePlayerInternalCtx();

  useBackgroundMesh(backgroundSrc, internal);

  return (
    <Activity mode={ariaLabel ? "visible" : "hidden"}>
      <div role="img" aria-label={ariaLabel} />
    </Activity>
  );
}

CanvasBackground.displayName = "CanvasBackground";
