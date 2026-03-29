"use client";

import { createContext } from "react";
import { z } from "zod/v4";

export const WordSchema = z.object({
  text: z.string(),
  start: z.number(),
  end: z.number(),
  type: z.enum(["word", "spacing"]),
  logprob: z.number().optional(),
});

export type Word = z.infer<typeof WordSchema>;

export const TranscriptStateSchema = z.object({
  text: z.string().nullable(),
  words: z.array(WordSchema).nullable(),
  isLoading: z.boolean(),
  error: z.string().nullable(),
});

export type TranscriptState = z.infer<typeof TranscriptStateSchema> & {
  skippedIndices: Set<number>;
};

export const INITIAL_TRANSCRIPT_STATE: TranscriptState = {
  text: null,
  words: null,
  isLoading: true,
  error: null,
  skippedIndices: new Set(),
};

export interface TranscriptActions {
  skipRange: (startIndex: number, endIndex: number) => void;
  unskipRange: (startIndex: number, endIndex: number) => void;
}

const NOOP_ACTIONS: TranscriptActions = {
  skipRange: () => {},
  unskipRange: () => {},
};

export const TranscriptStateContext =
  createContext<TranscriptState>(INITIAL_TRANSCRIPT_STATE);

export const TranscriptActionsContext =
  createContext<TranscriptActions>(NOOP_ACTIONS);
