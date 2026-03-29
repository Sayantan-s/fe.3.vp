"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Copy, SkipForward, Undo2 } from "lucide-react";
import { useTranscriptState } from "@/components/feat/context/transcript/use-transcript-state";
import { useTranscriptActions } from "@/components/feat/context/transcript/use-transcript-actions";
import { usePlaybackTimeStore } from "@/components/feat/context/playback-time/use-playback-time";
import { useCurrentWordIndex } from "./use-current-word-index";
import { useTranscriptSelection } from "./use-transcript-selection";
import { findWordAtTime } from "./find-word-at-time";
import leftPanelStyles from "../left-panel.module.css";
import styles from "./transcript-panel.module.css";

export function TranscriptPanel() {
  const { words, isLoading, error, skippedIndices } = useTranscriptState();
  const { skipRange, unskipRange } = useTranscriptActions();
  const currentWordIndex = useCurrentWordIndex();
  const store = usePlaybackTimeStore();

  const currentWordRef = useRef<HTMLSpanElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const userScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-scroll to current word, pausing when user scrolls manually
  useEffect(() => {
    if (!isUserScrolling && currentWordRef.current) {
      currentWordRef.current.scrollIntoView({
        block: "center",
        behavior: "smooth",
      });
    }
  }, [currentWordIndex, isUserScrolling]);

  // Auto-seek past skipped regions.
  // Uses lookahead to seek BEFORE the skipped word starts playing,
  // compensating for ~250ms timeupdate interval + React render delay.
  useEffect(() => {
    if (!words || skippedIndices.size === 0) return;

    const LOOKAHEAD_BUFFER = 0.25; // seconds

    function seekPastSkipped(fromIdx: number) {
      let target = fromIdx;
      while (target < words!.length && skippedIndices.has(target)) {
        target++;
      }
      if (target < words!.length) {
        store.seek(words![target].start);
      } else {
        store.seek(words![words!.length - 1].end);
      }
    }

    return store.subscribe(() => {
      const time = store.getTime();
      const idx = findWordAtTime(words, time);
      if (idx < 0) return;

      // Case 1: already on a skipped word — seek past immediately
      if (skippedIndices.has(idx)) {
        seekPastSkipped(idx);
        return;
      }

      // Case 2: in the gap after current word, next word is skipped
      if (time > words[idx].end) {
        const next = idx + 1;
        if (next < words.length && skippedIndices.has(next)) {
          seekPastSkipped(next);
          return;
        }
      }

      // Case 3: lookahead — approaching a skipped word within buffer
      const next = idx + 1;
      if (
        next < words.length &&
        skippedIndices.has(next) &&
        words[next].start - time <= LOOKAHEAD_BUFFER
      ) {
        seekPastSkipped(next);
      }
    });
  }, [words, skippedIndices, store]);

  const handleUserScroll = useCallback(() => {
    setIsUserScrolling(true);
    if (userScrollTimeoutRef.current) {
      clearTimeout(userScrollTimeoutRef.current);
    }
    userScrollTimeoutRef.current = setTimeout(() => {
      setIsUserScrolling(false);
    }, 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (userScrollTimeoutRef.current) {
        clearTimeout(userScrollTimeoutRef.current);
      }
    };
  }, []);

  const selection = useTranscriptSelection(containerRef);
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Open popover when text is selected, close when cleared
  useEffect(() => {
    setPopoverOpen(selection.selectedText.length > 0);
  }, [selection.selectedText]);

  // Check if the entire selection is already skipped
  const isSelectionAllSkipped = (() => {
    if (selection.startIndex < 0 || selection.endIndex < 0) return false;
    for (let i = selection.startIndex; i <= selection.endIndex; i++) {
      if (!skippedIndices.has(i)) return false;
    }
    return true;
  })();

  const handleCopy = useCallback(async () => {
    if (selection.selectedText) {
      await navigator.clipboard.writeText(selection.selectedText);
      document.getSelection()?.removeAllRanges();
      setPopoverOpen(false);
    }
  }, [selection.selectedText]);

  const handleSkip = useCallback(() => {
    if (selection.startIndex >= 0 && selection.endIndex >= 0) {
      skipRange(selection.startIndex, selection.endIndex);
      document.getSelection()?.removeAllRanges();
      setPopoverOpen(false);
    }
  }, [selection.startIndex, selection.endIndex, skipRange]);

  const handleUnskip = useCallback(() => {
    if (selection.startIndex >= 0 && selection.endIndex >= 0) {
      unskipRange(selection.startIndex, selection.endIndex);
      document.getSelection()?.removeAllRanges();
      setPopoverOpen(false);
    }
  }, [selection.startIndex, selection.endIndex, unskipRange]);

  const handleWordClick = useCallback(
    (start: number) => {
      store.seek(start);
    },
    [store],
  );

  if (isLoading) {
    return (
      <div className={leftPanelStyles.scriptSection}>
        <div className={leftPanelStyles.scriptHeader}>
          <span className={leftPanelStyles.scriptLabel}>Script</span>
        </div>
        <p className={leftPanelStyles.scriptPlaceholder}>
          Loading transcript...
        </p>
      </div>
    );
  }

  if (error || !words) {
    return (
      <div className={leftPanelStyles.scriptSection}>
        <div className={leftPanelStyles.scriptHeader}>
          <span className={leftPanelStyles.scriptLabel}>Script</span>
        </div>
        <p className={leftPanelStyles.scriptPlaceholder}>
          {error ?? "No transcript available."}
        </p>
      </div>
    );
  }

  return (
    <div className={leftPanelStyles.scriptSection}>
      <div className={leftPanelStyles.scriptHeader}>
        <span className={leftPanelStyles.scriptLabel}>Script</span>
      </div>
      <Popover.Root open={popoverOpen} onOpenChange={setPopoverOpen}>
        <Popover.Anchor
          style={
            selection.anchorRect
              ? {
                  position: "fixed",
                  top: selection.anchorRect.top,
                  left: selection.anchorRect.left + selection.anchorRect.width / 2,
                  pointerEvents: "none",
                }
              : { position: "fixed", top: -9999, left: -9999 }
          }
        />
        <div
          ref={containerRef}
          className={styles.wordContainer}
          onScroll={handleUserScroll}
        >
          {words.map((word, i) => {
            const isSkipped = skippedIndices.has(i);
            const isCurrentWord = !isSkipped && i === currentWordIndex;
            const isSpoken = !isSkipped && currentWordIndex >= 0 && i <= currentWordIndex;
            const isWord = word.type === "word";
            const isClickable = isWord && !isSkipped;

            let className = styles.word;
            if (isSkipped) {
              className += ` ${styles.skipped}`;
            } else if (isCurrentWord) {
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
              <span
                key={i}
                ref={isCurrentWord ? currentWordRef : undefined}
                data-index={i}
                className={className}
                onClick={isClickable ? () => handleWordClick(word.start) : undefined}
              >
                {word.text}
              </span>
            );
          })}
        </div>
        <Popover.Portal>
          <Popover.Content
            className={styles.popover}
            side="top"
            sideOffset={8}
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <button className={styles.popoverAction} onClick={handleCopy}>
              <Copy size={14} />
              Copy
            </button>
            {isSelectionAllSkipped ? (
              <button className={styles.popoverAction} onClick={handleUnskip}>
                <Undo2 size={14} />
                Unskip
              </button>
            ) : (
              <button className={styles.popoverAction} onClick={handleSkip}>
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
