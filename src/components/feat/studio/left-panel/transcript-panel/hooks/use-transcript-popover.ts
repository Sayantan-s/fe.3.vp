"use client";

import { useCallback, useRef } from "react";
import { isRangeInSet } from "@/utils/set-range";
import { useTranscriptSelection } from "./use-transcript-selection";

function clearSelection() {
  document.getSelection()?.removeAllRanges();
}

interface UseTranscriptPopoverOptions {
  skippedIndices: Set<number>;
  skipRange: (start: number, end: number) => void;
  unskipRange: (start: number, end: number) => void;
}

export function useTranscriptPopover({
  skippedIndices,
  skipRange,
  unskipRange,
}: UseTranscriptPopoverOptions) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const selection = useTranscriptSelection(containerRef);

  const popoverOpen = selection.selectedText.length > 0;

  const isSelectionAllSkipped =
    selection.startIndex >= 0 &&
    selection.endIndex >= 0 &&
    isRangeInSet(skippedIndices, selection.startIndex, selection.endIndex);

  const handleCopy = useCallback(async () => {
    if (selection.selectedText) {
      await navigator.clipboard.writeText(selection.selectedText);
      clearSelection();
    }
  }, [selection.selectedText]);

  const handleSkip = useCallback(() => {
    if (selection.startIndex >= 0 && selection.endIndex >= 0) {
      skipRange(selection.startIndex, selection.endIndex);
      clearSelection();
    }
  }, [selection.startIndex, selection.endIndex, skipRange]);

  const handleUnskip = useCallback(() => {
    if (selection.startIndex >= 0 && selection.endIndex >= 0) {
      unskipRange(selection.startIndex, selection.endIndex);
      clearSelection();
    }
  }, [selection.startIndex, selection.endIndex, unskipRange]);

  const onPopoverOpenChange = useCallback((open: boolean) => {
    if (!open) clearSelection();
  }, []);

  return {
    containerRef,
    anchorRect: selection.anchorRect,
    popoverOpen,
    onPopoverOpenChange,
    isSelectionAllSkipped,
    handleCopy,
    handleSkip,
    handleUnskip,
  };
}
