"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Copy } from "lucide-react";
import { useTranscriptState } from "@/components/feat/context/transcript/use-transcript-state";
import { usePlaybackTimeStore } from "@/components/feat/context/playback-time/use-playback-time";
import { useCurrentWordIndex } from "./use-current-word-index";
import { useTranscriptSelection } from "./use-transcript-selection";
import leftPanelStyles from "../left-panel.module.css";
import styles from "./transcript-panel.module.css";

export function TranscriptPanel() {
  const { words, isLoading, error } = useTranscriptState();
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

  const handleCopy = useCallback(async () => {
    if (selection.selectedText) {
      await navigator.clipboard.writeText(selection.selectedText);
      document.getSelection()?.removeAllRanges();
      setPopoverOpen(false);
    }
  }, [selection.selectedText]);

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
            const isCurrentWord = i === currentWordIndex;
            const isSpoken = currentWordIndex >= 0 && i <= currentWordIndex;
            const isWord = word.type === "word";

            let className = styles.word;
            if (isCurrentWord) {
              className += ` ${styles.current}`;
            } else if (isSpoken) {
              className += ` ${styles.spoken}`;
            } else {
              className += ` ${styles.unspoken}`;
            }
            if (isWord) {
              className += ` ${styles.wordClickable}`;
            }

            return (
              <span
                key={i}
                ref={isCurrentWord ? currentWordRef : undefined}
                data-index={i}
                className={className}
                onClick={isWord ? () => handleWordClick(word.start) : undefined}
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
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
