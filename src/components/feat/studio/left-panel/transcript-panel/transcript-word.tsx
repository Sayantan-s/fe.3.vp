"use client";

import { memo } from "react";
import styles from "./transcript-panel.module.css";
import type { Word } from "./utils/word-schema";

interface TranscriptWordProps {
  word: Word;
  index: number;
  isSkipped: boolean;
  isCurrent: boolean;
  isSpoken: boolean;
  onSeek: (time: number) => void;
}

export const TranscriptWord = memo(function TranscriptWord({
  word,
  index,
  isSkipped,
  isCurrent,
  isSpoken,
  onSeek,
}: TranscriptWordProps) {
  const isWord = word.type === "word";
  const isClickable = isWord && !isSkipped;

  let className = styles.word;
  if (isSkipped) {
    className += ` ${styles.skipped}`;
  } else if (!isWord) {
    // Spacing tokens get no highlight
  } else if (isCurrent) {
    className += ` ${styles.current}`;
  } else if (isSpoken) {
    className += ` ${styles.spoken}`;
  } else {
    className += ` ${styles.unspoken}`;
  }
  if (isClickable) {
    className += ` ${styles.wordClickable}`;
  }

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: word span with seek handler
    // biome-ignore lint/a11y/useKeyWithClickEvents: word span with seek handler
    <span
      data-index={index}
      className={className}
      onClick={isClickable ? () => onSeek(word.start) : undefined}
    >
      {word.text}
    </span>
  );
});
