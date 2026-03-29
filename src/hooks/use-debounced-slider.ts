"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { debounce } from "es-toolkit";

/**
 * Keeps a slider visually responsive while debouncing its outward callback.
 *
 * When `debounceMs` is falsy the hook is a no-op pass-through —
 * `displayValue` === `externalValue` and `handleChange` calls `onChange` directly.
 */
export function useDebouncedSlider(
  externalValue: number,
  onChange: ((value: number) => void) | undefined,
  debounceMs?: number,
): [displayValue: number, handleChange: (value: number) => void] {
  const [localValue, setLocalValue] = useState(externalValue);
  const draggingRef = useRef(false);

  // Sync from parent when not actively dragging
  useEffect(() => {
    if (!draggingRef.current) {
      setLocalValue(externalValue);
    }
  }, [externalValue]);

  // Stable debounced version of the callback
  const debouncedOnChange = useRef<ReturnType<typeof debounce<(v: number) => void>> | null>(null);

  useEffect(() => {
    if (!debounceMs || !onChange) {
      debouncedOnChange.current = null;
      return;
    }

    const fn = debounce((v: number) => {
      onChange(v);
      draggingRef.current = false;
    }, debounceMs);

    debouncedOnChange.current = fn;
    return () => fn.cancel();
  }, [debounceMs, onChange]);

  const handleChange = useCallback(
    (value: number) => {
      if (debouncedOnChange.current) {
        draggingRef.current = true;
        setLocalValue(value);
        debouncedOnChange.current(value);
      } else {
        onChange?.(value);
      }
    },
    [onChange],
  );

  const displayValue = debounceMs ? localValue : externalValue;

  return [displayValue, handleChange];
}
