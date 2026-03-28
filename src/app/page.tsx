"use client";

import { useState } from "react";
import { LeftPanel } from "@/components/feat/left-panel";
import { RightPanel } from "@/components/feat/right-panel";
import styles from "./page.module.css";

export default function Home() {
  const [padding, setPadding] = useState(10);
  const [rounding, setRounding] = useState(10);

  return (
    <main className={styles.root}>
      <LeftPanel
        padding={padding}
        rounding={rounding}
        onPaddingChange={setPadding}
        onRoundingChange={setRounding}
      />
      <RightPanel padding={padding} rounding={rounding} />
    </main>
  );
}
