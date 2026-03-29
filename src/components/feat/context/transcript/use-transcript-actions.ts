"use client";
import { use } from "react";
import { TranscriptActionsContext } from "./context";
export function useTranscriptActions() {
  return use(TranscriptActionsContext);
}
