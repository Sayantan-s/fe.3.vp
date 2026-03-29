"use client";

import { use } from "react";
import { TranscriptStateContext } from "@/components/feat/studio/context/transcript/context";

export function useTranscriptState() {
  return use(TranscriptStateContext);
}
