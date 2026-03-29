"use client";
import { use } from "react";
import { TranscriptStateContext } from "./context";
export function useTranscriptState() {
  return use(TranscriptStateContext);
}
