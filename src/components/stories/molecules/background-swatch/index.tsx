"use client";

import { use } from "react";
import * as RadioGroup from "@radix-ui/react-radio-group";
import { Check } from "lucide-react";
import { BackgroundSwatchContext, type BackgroundSwatchContextValue } from "./background-swatch-context";
import styles from "./background-swatch.module.css";

// --- Helpers ---

function useSwatchContext(): BackgroundSwatchContextValue {
  const ctx = use(BackgroundSwatchContext);
  if (!ctx) throw new Error("BackgroundSwatch compound components must be used within <BackgroundSwatch>");
  return ctx;
}

// --- Sub-components ---

function SwatchLabel({ children }: { children: React.ReactNode }) {
  return <span className={styles.label}>{children}</span>;
}

function SwatchItems({ children }: { children: React.ReactNode }) {
  const { value, onValueChange } = useSwatchContext();
  return (
    <RadioGroup.Root
      className={styles.grid}
      value={String(value)}
      onValueChange={(v) => onValueChange(Number(v))}
    >
      {children}
    </RadioGroup.Root>
  );
}

interface SwatchItemProps {
  bgKey: number;
  src: string;
  label: string;
}

function SwatchItem({ bgKey, src, label }: SwatchItemProps) {
  return (
    <RadioGroup.Item
      value={String(bgKey)}
      className={styles.item}
      aria-label={label}
    >
      <img src={src} alt={label} className={styles.thumbnail} />
      <span className={styles.checkOverlay}>
        <span className={styles.checkCircle}>
          <Check size={14} color="#1A1A1A" />
        </span>
      </span>
    </RadioGroup.Item>
  );
}

// --- Root ---

interface BackgroundSwatchRootProps {
  value: number;
  onValueChange: (key: number) => void;
  children: React.ReactNode;
}

function BackgroundSwatchRoot({ value, onValueChange, children }: BackgroundSwatchRootProps) {
  return (
    <BackgroundSwatchContext value={{ value, onValueChange }}>
      <div className={styles.root}>{children}</div>
    </BackgroundSwatchContext>
  );
}

// --- Compound export ---

export const BackgroundSwatch = Object.assign(BackgroundSwatchRoot, {
  Label: SwatchLabel,
  Items: SwatchItems,
  Item: SwatchItem,
});
