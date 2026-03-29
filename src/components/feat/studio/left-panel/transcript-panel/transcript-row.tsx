"use client";

import { memo } from "react";
import type { WordRow } from "./hooks/use-word-rows";
import { TranscriptWord } from "./transcript-word";
import type { Word } from "./utils/word-schema";

interface TranscriptRowProps {
  row: WordRow;
  words: Word[];
  currentWordIndex: number;
  skippedIndices: Set<number>;
  onSeek: (time: number) => void;
}

export const TranscriptRow = memo(function TranscriptRow({
  row,
  words,
  currentWordIndex,
  skippedIndices,
  onSeek,
}: TranscriptRowProps) {
  const spans: React.ReactNode[] = [];

  for (let i = row.startIndex; i <= row.endIndex; i++) {
    const word = words[i];
    const isSkipped = skippedIndices.has(i);

    spans.push(
      <TranscriptWord
        key={i}
        word={word}
        index={i}
        isSkipped={isSkipped}
        isCurrent={!isSkipped && i === currentWordIndex}
        isSpoken={!isSkipped && currentWordIndex >= 0 && i <= currentWordIndex}
        onSeek={onSeek}
      />,
    );
  }

  return <>{spans}</>;
});
