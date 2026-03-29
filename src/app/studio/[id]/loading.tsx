import { LeftPanelSkeleton } from "@/components/feat/skeletons/left-panel-skeleton";
import { RightPanelSkeleton } from "@/components/feat/skeletons/right-panel-skeleton";

export default function StudioLoading() {
  return (
    <main style={{ display: "flex" }}>
      <LeftPanelSkeleton />
      <RightPanelSkeleton />
    </main>
  );
}
