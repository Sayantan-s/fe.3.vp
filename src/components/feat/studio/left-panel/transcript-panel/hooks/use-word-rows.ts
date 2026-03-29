"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Word } from "../utils/word-schema";

export interface WordRow {
  startIndex: number;
  endIndex: number;
}

/** Average character width as a fraction of font-size (proportional font heuristic). */
const CHAR_WIDTH_RATIO = 0.55;

/** Minimum gap between words in em units. */
const WORD_GAP_EM = 0.25;

function computeRows(words: Word[], charsPerRow: number): WordRow[] {
  if (words.length === 0 || charsPerRow <= 0) return [];

  const rows: WordRow[] = [];
  let rowStart = 0;
  let usedChars = 0;

  for (let i = 0; i < words.length; i++) {
    const wordChars = words[i].text.length + WORD_GAP_EM;

    if (usedChars > 0 && usedChars + wordChars > charsPerRow) {
      rows.push({ startIndex: rowStart, endIndex: i - 1 });
      rowStart = i;
      usedChars = 0;
    }

    usedChars += wordChars;
  }

  // Final row
  if (rowStart < words.length) {
    rows.push({ startIndex: rowStart, endIndex: words.length - 1 });
  }

  return rows;
}

/**
 * Groups words into rows based on container width.
 * Recomputes on container resize via ResizeObserver.
 */
export function useWordRows(
  words: Word[] | null,
  containerRef: React.RefObject<HTMLElement | null>,
): WordRow[] {
  const [containerWidth, setContainerWidth] = useState(0);
  const observerRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    setContainerWidth(el.clientWidth);

    observerRef.current = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observerRef.current.observe(el);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [containerRef]);

  return useMemo(() => {
    if (!words || containerWidth <= 0) return [];

    // Derive chars-per-row from container width and font size
    const el = containerRef.current;
    const fontSize = el ? Number.parseFloat(getComputedStyle(el).fontSize) : 14;
    const charWidth = fontSize * CHAR_WIDTH_RATIO;
    const charsPerRow = Math.floor(containerWidth / charWidth);

    return computeRows(words, charsPerRow);
  }, [words, containerWidth, containerRef]);
}
