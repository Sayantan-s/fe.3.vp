"use client";
import { use } from "react";
import { VideoDataStateContext } from "./context";
export function useVideoDataState() {
  return use(VideoDataStateContext);
}
