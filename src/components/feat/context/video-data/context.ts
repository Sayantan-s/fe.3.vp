"use client";

import { createContext } from "react";
import { z } from "zod/v4";

export const VideoDataStateSchema = z.object({
  videoUrl: z.string().nullable(),
  bg: z.string().nullable(),
  padding: z.number(),
  rounding: z.number(),
  isLoading: z.boolean(),
  error: z.string().nullable(),
});

export type VideoDataState = z.infer<typeof VideoDataStateSchema>;

export const INITIAL_VIDEO_DATA_STATE: VideoDataState = {
  videoUrl: null,
  bg: null,
  padding: 0,
  rounding: 0,
  isLoading: true,
  error: null,
};

export interface VideoDataActions {
  setPadding: (value: number) => void;
  setRounding: (value: number) => void;
}

const NOOP_ACTIONS: VideoDataActions = {
  setPadding: () => {},
  setRounding: () => {},
};

export const VideoDataStateContext =
  createContext<VideoDataState>(INITIAL_VIDEO_DATA_STATE);

export const VideoDataActionsContext =
  createContext<VideoDataActions>(NOOP_ACTIONS);
