import { ControlsPanel } from "./controls-panel";
import { TranscriptPanel } from "./transcript-panel";

export const LeftPanel = () => {
  return (
    <section>
      Left Panel
      <TranscriptPanel />
      <ControlsPanel />
    </section>
  );
};
