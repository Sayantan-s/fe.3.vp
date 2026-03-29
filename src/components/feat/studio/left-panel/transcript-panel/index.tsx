"use client";

import * as Popover from "@radix-ui/react-popover";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Copy, SkipForward, Undo2 } from "lucide-react";
import { useRef } from "react";
import { usePlaybackTimeStore } from "@/components/feat/studio/context/playback-time/use-playback-time";
import { useAutoScroll } from "@/hooks/use-auto-scroll";
import { useCurrentWordIndex } from "./hooks/use-current-word-index";
import { useSkipAutoSeek } from "./hooks/use-skip-auto-seek";
import { useTranscriptActions } from "./hooks/use-transcript-actions";
import { useTranscriptPopover } from "./hooks/use-transcript-popover";
import { useTranscriptState } from "./hooks/use-transcript-state";
import { useWordIndexStore } from "./hooks/use-word-index-store";
import { useWordRows } from "./hooks/use-word-rows";
import styles from "./transcript-panel.module.css";
import { TranscriptRow } from "./transcript-row";
import { TranscriptStatus } from "./transcript-status";

function findRowForWord(
  rows: { startIndex: number; endIndex: number }[],
  wordIndex: number,
): number {
  if (wordIndex < 0 || rows.length === 0) return -1;
  let lo = 0;
  let hi = rows.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >>> 1;
    if (rows[mid].endIndex < wordIndex) lo = mid + 1;
    else if (rows[mid].startIndex > wordIndex) hi = mid - 1;
    else return mid;
  }
  return -1;
}

export function TranscriptPanel() {
  const { words, isLoading, error, skippedIndices } = useTranscriptState();
  const actions = useTranscriptActions();
  const store = usePlaybackTimeStore();
  const currentWordIndex = useCurrentWordIndex();
  const wordIndexStore = useWordIndexStore(store, words);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const rows = useWordRows(words, scrollRef);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 24,
    overscan: 15,
  });

  const currentRowIndex = findRowForWord(rows, currentWordIndex);

  const { onScroll } = useAutoScroll<HTMLSpanElement>({
    deps: [currentRowIndex],
    scrollTo: () => {
      if (currentRowIndex >= 0) {
        virtualizer.scrollToIndex(currentRowIndex, { align: "center" });
      }
    },
  });

  useSkipAutoSeek(words, skippedIndices, store, wordIndexStore);

  const popover = useTranscriptPopover({
    skippedIndices,
    skipRange: actions.skipRange,
    unskipRange: actions.unskipRange,
  });

  if (isLoading)
    return <TranscriptStatus message="Loading transcript..." type="loading" />;
  if (error || !words)
    return <TranscriptStatus message={error ?? "No transcript available."} />;

  return (
    <div className={styles.scriptSection}>
      <div className={styles.scriptHeader}>
        <span className={styles.scriptLabel}>Transcript</span>
        {skippedIndices.size > 0 && (
          <span className={styles.skipBadge}>
            {skippedIndices.size} word{skippedIndices.size !== 1 ? "s" : ""}{" "}
            skipped
          </span>
        )}
      </div>
      <Popover.Root
        open={popover.popoverOpen}
        onOpenChange={popover.onPopoverOpenChange}
      >
        <Popover.Anchor
          style={
            popover.anchorRect
              ? {
                  position: "fixed",
                  top: popover.anchorRect.top,
                  left: popover.anchorRect.left + popover.anchorRect.width / 2,
                  pointerEvents: "none",
                }
              : { position: "fixed", top: -9999, left: -9999 }
          }
        />
        <div
          ref={(el) => {
            scrollRef.current = el;
            if (popover.containerRef) popover.containerRef.current = el;
          }}
          className={styles.wordContainer}
          onScroll={onScroll}
        >
          <div
            className={styles.virtualWrapper}
            style={{ height: `${virtualizer.getTotalSize()}px` }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index];
              return (
                <div
                  key={virtualRow.index}
                  className={styles.virtualRow}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <TranscriptRow
                    row={row}
                    words={words}
                    currentWordIndex={currentWordIndex}
                    skippedIndices={skippedIndices}
                    onSeek={store.seek}
                  />
                </div>
              );
            })}
          </div>
        </div>
        <Popover.Portal>
          <Popover.Content
            className={styles.popover}
            side="top"
            sideOffset={8}
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <button
              type="button"
              className={styles.popoverAction}
              onClick={popover.handleCopy}
            >
              <Copy size={14} />
              Copy
            </button>
            {popover.isSelectionAllSkipped ? (
              <button
                type="button"
                className={styles.popoverAction}
                onClick={popover.handleUnskip}
              >
                <Undo2 size={14} />
                Unskip
              </button>
            ) : (
              <button
                type="button"
                className={styles.popoverAction}
                onClick={popover.handleSkip}
              >
                <SkipForward size={14} />
                Skip
              </button>
            )}
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
