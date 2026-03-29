export function findClosestWordSpan(node: Node): HTMLElement | null {
  let current: Node | null = node;
  while (current && current !== document.body) {
    if (
      current instanceof HTMLElement &&
      current.tagName === "SPAN" &&
      current.dataset.index !== undefined
    ) {
      return current;
    }
    current = current.parentNode;
  }
  return null;
}
