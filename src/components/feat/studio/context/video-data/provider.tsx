"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { clamp } from "es-toolkit";
import {
  VideoDataActionsContext,
  VideoDataStateContext,
  type VideoDataState,
  INITIAL_VIDEO_DATA_STATE,
} from "./context";

interface VideoDataProviderProps {
  initialData: {
    videoUrl: string;
    bg: number;
    padding: number;
    rounding: number;
  } | null;
  error: string | null;
  isLoading: boolean;
  children: React.ReactNode;
}

export function VideoDataProvider({
  initialData,
  error,
  isLoading,
  children,
}: VideoDataProviderProps) {
  const [localState, setLocalState] = useState<{
    bg: number | null;
    padding: number;
    rounding: number;
  }>({
    bg: INITIAL_VIDEO_DATA_STATE.bg,
    padding: INITIAL_VIDEO_DATA_STATE.padding,
    rounding: INITIAL_VIDEO_DATA_STATE.rounding,
  });

  // Sync local state when initial data arrives from fetch
  const hasSynced = useRef(false);
  useEffect(() => {
    if (initialData && !hasSynced.current) {
      hasSynced.current = true;
      setLocalState({
        bg: initialData.bg,
        padding: initialData.padding,
        rounding: initialData.rounding,
      });
    }
  }, [initialData]);

  const setBg = useCallback((value: number) => {
    setLocalState((prev) => ({ ...prev, bg: value }));
  }, []);

  const setPadding = useCallback((value: number) => {
    setLocalState((prev) => ({ ...prev, padding: clamp(value, 0, 100) }));
  }, []);

  const setRounding = useCallback((value: number) => {
    setLocalState((prev) => ({ ...prev, rounding: clamp(value, 0, 100) }));
  }, []);

  const actions = useMemo(() => ({ setBg, setPadding, setRounding }), [setBg, setPadding, setRounding]);

  const state: VideoDataState = useMemo(
    () => ({
      videoUrl: initialData?.videoUrl ?? null,
      bg: localState.bg,
      padding: localState.padding,
      rounding: localState.rounding,
      isLoading,
      error,
    }),
    [initialData, isLoading, error, localState.bg, localState.padding, localState.rounding],
  );

  return (
    <VideoDataActionsContext value={actions}>
      <VideoDataStateContext value={state}>
        {children}
      </VideoDataStateContext>
    </VideoDataActionsContext>
  );
}
