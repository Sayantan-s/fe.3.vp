"use client";

import { use } from "react";
import { TranscriptActionsContext } from "@/components/feat/studio/context/transcript/context";

export function useTranscriptActions() {
  return use(TranscriptActionsContext);
}
