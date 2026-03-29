export function addRange(
  set: Set<number>,
  start: number,
  end: number,
): Set<number> {
  const next = new Set(set);
  for (let i = start; i <= end; i++) next.add(i);
  return next;
}

export function removeRange(
  set: Set<number>,
  start: number,
  end: number,
): Set<number> {
  const next = new Set(set);
  for (let i = start; i <= end; i++) next.delete(i);
  return next;
}

export function isRangeInSet(
  set: Set<number>,
  start: number,
  end: number,
): boolean {
  for (let i = start; i <= end; i++) {
    if (!set.has(i)) return false;
  }
  return true;
}
