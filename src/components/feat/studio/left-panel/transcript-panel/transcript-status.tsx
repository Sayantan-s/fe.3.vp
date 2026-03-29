import transcriptStyles from "./transcript-panel.module.css";
import skeletonStyles from "@/components/feat/studio/skeletons/skeleton.module.css";

interface TranscriptStatusProps {
  message: string;
  type?: "loading" | "error";
}

/**
 * Fills the same space as a loaded TranscriptPanel (scriptSection layout)
 * to prevent cumulative layout shift.
 */
export function TranscriptStatus({ message, type = "error" }: TranscriptStatusProps) {
  return (
    <div className={transcriptStyles.scriptSection}>
      <div className={transcriptStyles.scriptHeader}>
        <span className={transcriptStyles.scriptLabel}>Transcript</span>
      </div>
      <div className={skeletonStyles.errorContainer}>
        <p className={type === "error" ? skeletonStyles.errorTitle : skeletonStyles.errorDetail}>
          {message}
        </p>
      </div>
    </div>
  );
}
