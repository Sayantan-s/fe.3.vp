"use client";

import { useEffect } from "react";
import type { VideoAppearance, VideoAppearanceStore } from "../types";

interface UseAppearanceEventsArgs {
  appearanceStore: VideoAppearanceStore;
  onPaddingChange?: (value: number) => void;
  onRoundingChange?: (value: number) => void;
}

export function useAppearanceEvents(args: UseAppearanceEventsArgs) {
  const { appearanceStore } = args;

  useEffect(() => {
    let prev: VideoAppearance = appearanceStore.getAppearance();

    const unsub = appearanceStore.subscribe(() => {
      const next = appearanceStore.getAppearance();
      if (prev.padding !== next.padding) args.onPaddingChange?.(next.padding);
      if (prev.rounding !== next.rounding) args.onRoundingChange?.(next.rounding);
      prev = next;
    });

    return unsub;
  }, [appearanceStore]);
}
