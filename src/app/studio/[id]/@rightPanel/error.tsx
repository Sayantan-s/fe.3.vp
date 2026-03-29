"use client";

export default function RightPanelError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section style={{ flex: 0.5, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <p>Failed to load player</p>
        <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>{error.message}</p>
        <button onClick={reset}>Retry</button>
      </div>
    </section>
  );
}
