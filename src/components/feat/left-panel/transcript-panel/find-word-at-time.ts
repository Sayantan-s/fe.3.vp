import type { Word } from "@/components/feat/context/transcript/context";

/**
 * Binary search for the word whose time range contains `time`.
 * Words are sorted by `start`. Returns the index, or -1 if no match.
 */
export function findWordAtTime(words: Word[], time: number): number {
  if (words.length === 0 || time < words[0].start) return -1;

  let lo = 0;
  let hi = words.length - 1;

  // Find the last word whose start <= time
  while (lo < hi) {
    const mid = (lo + hi + 1) >>> 1;
    if (words[mid].start <= time) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }

  // Check if time is within the word's range
  if (words[lo].start <= time && time <= words[lo].end) {
    return lo;
  }

  // Time is in a gap between words — return the previous word
  // so that spoken words stay highlighted
  return lo;
}
