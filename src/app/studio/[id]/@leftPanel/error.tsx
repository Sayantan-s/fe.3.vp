"use client";

export default function LeftPanelError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <aside style={{ width: 420, minWidth: 420, padding: 32, borderRight: "1px solid var(--border-light)" }}>
      <p>Failed to load panel</p>
      <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>{error.message}</p>
      <button onClick={reset}>Retry</button>
    </aside>
  );
}
