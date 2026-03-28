export interface Subscribable {
  notify: () => void;
  subscribe: (listener: () => void) => () => void;
  clear: () => void;
}

export function createSubscribable(): Subscribable {
  const listeners = new Set<() => void>();

  return {
    notify: () => listeners.forEach((fn) => fn()),
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    clear: () => listeners.clear(),
  };
}
