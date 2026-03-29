"use client";

import { useMemo } from "react";
import {
  TranscriptActionsContext,
  TranscriptStateContext,
  type TranscriptState,
} from "./context";

interface TranscriptProviderProps {
  initialData: {
    transcript: {
      text: string;
      words: Array<{
        text: string;
        start: number;
        end: number;
        type: "word" | "spacing";
        logprob?: number;
      }>;
    };
  } | null;
  error: string | null;
  isLoading: boolean;
  children: React.ReactNode;
}

export function TranscriptProvider({
  initialData,
  error,
  isLoading,
  children,
}: TranscriptProviderProps) {
  const state: TranscriptState = useMemo(
    () => ({
      text: initialData?.transcript?.text ?? null,
      words: initialData?.transcript?.words ?? null,
      isLoading,
      error,
    }),
    [initialData, isLoading, error],
  );

  const actions = useMemo(() => ({}), []);

  return (
    <TranscriptActionsContext value={actions}>
      <TranscriptStateContext value={state}>
        {children}
      </TranscriptStateContext>
    </TranscriptActionsContext>
  );
}
