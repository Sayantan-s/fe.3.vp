"use client";

import { useCallback, useEffect, useState } from "react";
import { findClosestWordSpan } from "../utils/find-closest-word-span";

interface TranscriptSelection {
  selectedText: string;
  startIndex: number;
  endIndex: number;
  anchorRect: DOMRect | null;
}

const EMPTY_SELECTION: TranscriptSelection = {
  selectedText: "",
  startIndex: -1,
  endIndex: -1,
  anchorRect: null,
};

/**
 * Tracks native text selection within a container element.
 * Maps the DOM selection back to word indices via data-index attributes.
 */
export function useTranscriptSelection(
  containerRef: React.RefObject<HTMLDivElement | null>,
): TranscriptSelection {
  const [selection, setSelection] = useState<TranscriptSelection>(EMPTY_SELECTION);

  const handleSelectionChange = useCallback(() => {
    const domSelection = document.getSelection();
    if (
      !domSelection ||
      domSelection.isCollapsed ||
      !containerRef.current
    ) {
      setSelection(EMPTY_SELECTION);
      return;
    }

    const range = domSelection.getRangeAt(0);
    if (!containerRef.current.contains(range.commonAncestorContainer)) {
      setSelection(EMPTY_SELECTION);
      return;
    }

    const selectedText = domSelection.toString().trim();
    if (!selectedText) {
      setSelection(EMPTY_SELECTION);
      return;
    }

    const startSpan = findClosestWordSpan(range.startContainer);
    const endSpan = findClosestWordSpan(range.endContainer);

    if (!startSpan || !endSpan) {
      setSelection(EMPTY_SELECTION);
      return;
    }

    const startIndex = Number(startSpan.dataset.index);
    const endIndex = Number(endSpan.dataset.index);
    const anchorRect = range.getBoundingClientRect();

    setSelection({ selectedText, startIndex, endIndex, anchorRect });
  }, [containerRef]);

  useEffect(() => {
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [handleSelectionChange]);

  return selection;
}
