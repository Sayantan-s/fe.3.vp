"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseAutoScrollBaseOptions {
  deps: readonly unknown[];
  pauseTimeout?: number;
}

interface UseAutoScrollRefOptions<T extends HTMLElement>
  extends UseAutoScrollBaseOptions {
  scrollTo?: never;
}

interface UseAutoScrollCallbackOptions extends UseAutoScrollBaseOptions {
  scrollTo: () => void;
}

type UseAutoScrollOptions<T extends HTMLElement> =
  | UseAutoScrollRefOptions<T>
  | UseAutoScrollCallbackOptions;

interface UseAutoScrollRefResult<T extends HTMLElement> {
  targetRef: React.RefObject<T | null>;
  onScroll: () => void;
}

interface UseAutoScrollCallbackResult {
  onScroll: () => void;
}

/**
 * Auto-scrolls to a target, pausing when the user manually scrolls.
 *
 * Two modes:
 * - Ref mode (default): returns `targetRef` + `onScroll`. Calls `scrollIntoView` on the ref.
 * - Callback mode: pass `scrollTo` function. Calls it instead of `scrollIntoView`.
 */
export function useAutoScroll<T extends HTMLElement>(
  options: UseAutoScrollCallbackOptions,
): UseAutoScrollCallbackResult;
export function useAutoScroll<T extends HTMLElement>(
  options: UseAutoScrollRefOptions<T>,
): UseAutoScrollRefResult<T>;
export function useAutoScroll<T extends HTMLElement>(
  options: UseAutoScrollOptions<T>,
): UseAutoScrollRefResult<T> | UseAutoScrollCallbackResult {
  const {
    deps,
    pauseTimeout = 3000,
    scrollTo,
  } = options as UseAutoScrollBaseOptions & {
    scrollTo?: () => void;
  };

  const targetRef = useRef<T | null>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isUserScrolling) return;

    if (scrollTo) {
      scrollTo();
    } else if (targetRef.current) {
      targetRef.current.scrollIntoView({
        block: "center",
        behavior: "smooth",
      });
    }
  }, [...deps, isUserScrolling, scrollTo]);

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

  if (scrollTo) {
    return { onScroll };
  }

  return { targetRef, onScroll };
}
