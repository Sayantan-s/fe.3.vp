"use client";

import { useCallback, useMemo, useState } from "react";
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
  const [skippedIndices, setSkippedIndices] = useState<Set<number>>(new Set());

  const skipRange = useCallback((startIndex: number, endIndex: number) => {
    setSkippedIndices((prev) => {
      const next = new Set(prev);
      for (let i = startIndex; i <= endIndex; i++) next.add(i);
      return next;
    });
  }, []);

  const unskipRange = useCallback((startIndex: number, endIndex: number) => {
    setSkippedIndices((prev) => {
      const next = new Set(prev);
      for (let i = startIndex; i <= endIndex; i++) next.delete(i);
      return next;
    });
  }, []);

  const state: TranscriptState = useMemo(
    () => ({
      text: initialData?.transcript?.text ?? null,
      words: initialData?.transcript?.words ?? null,
      isLoading,
      error,
      skippedIndices,
    }),
    [initialData, isLoading, error, skippedIndices],
  );

  const actions = useMemo(() => ({ skipRange, unskipRange }), [skipRange, unskipRange]);

  return (
    <TranscriptActionsContext value={actions}>
      <TranscriptStateContext value={state}>
        {children}
      </TranscriptStateContext>
    </TranscriptActionsContext>
  );
}
