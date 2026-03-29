"use client";

import { useState } from "react";
import { LeftPanel } from "@/components/feat/left-panel";
import { RightPanel } from "@/components/feat/right-panel";
import { PlayerStudioProvider } from "@/components/feat/context";

export default function Home() {
  const [padding, setPadding] = useState(10);
  const [rounding, setRounding] = useState(10);

  return (
    <PlayerStudioProvider>
      <LeftPanel
        padding={padding}
        rounding={rounding}
        onPaddingChange={setPadding}
        onRoundingChange={setRounding}
      />
      <RightPanel padding={padding} rounding={rounding} />
    </PlayerStudioProvider>
  );
}
