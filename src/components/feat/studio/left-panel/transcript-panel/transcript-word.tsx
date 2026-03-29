"use client";

import type { Word } from "./utils/word-schema";
import styles from "./transcript-panel.module.css";

interface TranscriptWordProps {
  word: Word;
  index: number;
  isSkipped: boolean;
  isCurrent: boolean;
  isSpoken: boolean;
  ref?: React.Ref<HTMLSpanElement>;
  onSeek: (time: number) => void;
}

export function TranscriptWord({
  word,
  index,
  isSkipped,
  isCurrent,
  isSpoken,
  ref,
  onSeek,
}: TranscriptWordProps) {
  const isClickable = word.type === "word" && !isSkipped;

  let className = styles.word;
  if (isSkipped) {
    className += ` ${styles.skipped}`;
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
    // biome-ignore lint/a11y/noStaticElementInteractions: <explanation>
    // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
    <span
      ref={ref}
      data-index={index}
      className={className}
      onClick={isClickable ? () => onSeek(word.start) : undefined}
    >
      {word.text}
    </span>
  );
}
