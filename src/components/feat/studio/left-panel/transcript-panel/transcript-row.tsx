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

function rowNeedsRerender(
  prev: TranscriptRowProps,
  next: TranscriptRowProps,
): boolean {
  if (
    prev.row !== next.row ||
    prev.words !== next.words ||
    prev.skippedIndices !== next.skippedIndices ||
    prev.onSeek !== next.onSeek
  ) {
    return false;
  }

  const { startIndex, endIndex } = next.row;

  // Re-render if currentWordIndex entered or left this row
  const prevInRow =
    prev.currentWordIndex >= startIndex && prev.currentWordIndex <= endIndex;
  const nextInRow =
    next.currentWordIndex >= startIndex && next.currentWordIndex <= endIndex;
  if (prevInRow || nextInRow) return false;

  // Re-render if isSpoken boundary crossed this row
  // (isSpoken = i <= currentWordIndex, so the boundary is at currentWordIndex)
  const prevBoundary = prev.currentWordIndex;
  const nextBoundary = next.currentWordIndex;
  if (prevBoundary !== nextBoundary) {
    // Only re-render if the spoken boundary moved across this row's range
    const minBoundary = Math.min(prevBoundary, nextBoundary);
    const maxBoundary = Math.max(prevBoundary, nextBoundary);
    if (minBoundary <= endIndex && maxBoundary >= startIndex) return false;
  }

  return true;
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
}, rowNeedsRerender);
