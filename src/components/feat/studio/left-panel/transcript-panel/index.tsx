"use client";

import * as Popover from "@radix-ui/react-popover";
import { Copy, SkipForward, Undo2 } from "lucide-react";
import { usePlaybackTimeStore } from "@/components/feat/studio/context/playback-time/use-playback-time";
import { useAutoScroll } from "@/hooks/use-auto-scroll";
import { useTranscriptState } from "./hooks/use-transcript-state";
import { useTranscriptActions } from "./hooks/use-transcript-actions";
import { useCurrentWordIndex } from "./hooks/use-current-word-index";
import { useSkipAutoSeek } from "./hooks/use-skip-auto-seek";
import { useTranscriptPopover } from "./hooks/use-transcript-popover";
import { TranscriptWord } from "./transcript-word";
import { TranscriptStatus } from "./transcript-status";
import styles from "./transcript-panel.module.css";

export function TranscriptPanel() {
  const { words, isLoading, error, skippedIndices } = useTranscriptState();
  const actions = useTranscriptActions();
  const currentWordIndex = useCurrentWordIndex();
  const store = usePlaybackTimeStore();

  const { targetRef: currentWordRef, onScroll } =
    useAutoScroll<HTMLSpanElement>({ deps: [currentWordIndex] });

  useSkipAutoSeek(words, skippedIndices, store);

  const popover = useTranscriptPopover({
    skippedIndices,
    skipRange: actions.skipRange,
    unskipRange: actions.unskipRange,
  });

  if (isLoading) return <TranscriptStatus message="Loading transcript..." />;
  if (error || !words) return <TranscriptStatus message={error ?? "No transcript available."} />;

  return (
    <div className={styles.scriptSection}>
      <div className={styles.scriptHeader}>
        <span className={styles.scriptLabel}>Transcript</span>
      </div>
      <Popover.Root open={popover.popoverOpen} onOpenChange={popover.onPopoverOpenChange}>
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
        <div ref={popover.containerRef} className={styles.wordContainer} onScroll={onScroll}>
          {words.map((word, i) => (
            <TranscriptWord
              key={i}
              ref={!skippedIndices.has(i) && i === currentWordIndex ? currentWordRef : undefined}
              word={word}
              index={i}
              isSkipped={skippedIndices.has(i)}
              isCurrent={!skippedIndices.has(i) && i === currentWordIndex}
              isSpoken={!skippedIndices.has(i) && currentWordIndex >= 0 && i <= currentWordIndex}
              onSeek={store.seek}
            />
          ))}
        </div>
        <Popover.Portal>
          <Popover.Content
            className={styles.popover}
            side="top"
            sideOffset={8}
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <button type="button" className={styles.popoverAction} onClick={popover.handleCopy}>
              <Copy size={14} />
              Copy
            </button>
            {popover.isSelectionAllSkipped ? (
              <button type="button" className={styles.popoverAction} onClick={popover.handleUnskip}>
                <Undo2 size={14} />
                Unskip
              </button>
            ) : (
              <button type="button" className={styles.popoverAction} onClick={popover.handleSkip}>
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
