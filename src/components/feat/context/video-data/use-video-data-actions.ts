"use client";
import { use } from "react";
import { VideoDataActionsContext } from "./context";
export function useVideoDataActions() {
  return use(VideoDataActionsContext);
}
