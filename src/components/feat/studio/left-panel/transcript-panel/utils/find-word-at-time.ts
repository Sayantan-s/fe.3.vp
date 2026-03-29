import type { Word } from "./word-schema";

/**
 * Binary search for the word whose time range contains `time`.
 * Words are sorted by `start`. Returns the index, or -1 if no match.
 */
export function findWordAtTime(words: Word[], time: number): number {
  if (words.length === 0 || time < words[0].start) return -1;

  let lo = 0;
  let hi = words.length - 1;

  while (lo < hi) {
    const mid = (lo + hi + 1) >>> 1;
    if (words[mid].start <= time) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }

  if (words[lo].start <= time && time <= words[lo].end) {
    return lo;
  }

  return lo;
}
