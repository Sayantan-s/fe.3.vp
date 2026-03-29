"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseAutoScrollOptions {
  deps: readonly unknown[];
  pauseTimeout?: number;
}

/**
 * Auto-scrolls to a target element, pausing when the user manually scrolls.
 * Returns { targetRef, containerRef, onScroll } to wire into the DOM.
 */
export function useAutoScroll<T extends HTMLElement>({
  deps,
  pauseTimeout = 3000,
}: UseAutoScrollOptions) {
  const targetRef = useRef<T | null>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isUserScrolling && targetRef.current) {
      targetRef.current.scrollIntoView({
        block: "center",
        behavior: "smooth",
      });
    }
  }, [...deps, isUserScrolling]);

  const onScroll = useCallback(() => {
    setIsUserScrolling(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsUserScrolling(false);
    }, pauseTimeout);
  }, [pauseTimeout]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return { targetRef, onScroll };
}
