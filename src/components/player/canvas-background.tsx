"use client";

import { use } from "react";
import { PlayerInternalContext } from "./context";
import { useBackgroundMesh } from "./hooks/use-background-mesh";
import type { CanvasBackgroundProps } from "./types";

export function CanvasBackground({
  backgroundSrc,
  "aria-label": ariaLabel,
}: CanvasBackgroundProps) {
  const internal = use(PlayerInternalContext);

  useBackgroundMesh(backgroundSrc, internal);

  if (!internal) return null;

  return ariaLabel ? <div role="img" aria-label={ariaLabel} /> : null;
}

CanvasBackground.displayName = "CanvasBackground";
