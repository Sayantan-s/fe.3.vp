"use client";

import { use } from "react";
import { RangeSlider } from "@/components/stories/atoms/range-slider/range-slider";
import { SliderContext, type SliderContextValue } from "./slider-context";
import styles from "./slider.module.css";

// --- Helpers ---

function useSliderContext(): SliderContextValue {
  const ctx = use(SliderContext);
  if (!ctx) throw new Error("Slider compound components must be used within <Slider>");
  return ctx;
}

function padBound(value: number): string {
  return String(value).padStart(2, "0");
}

// --- Sub-components ---

function SliderLabel({ children }: { children: React.ReactNode }) {
  return <span className={styles.label}>{children}</span>;
}

function SliderLowerBound() {
  const { min } = useSliderContext();
  return <span className={styles.bound}>{padBound(min)}</span>;
}

function SliderUpperBound() {
  const { max } = useSliderContext();
  return <span className={styles.bound}>{padBound(max)}</span>;
}

function SliderTrackRow({ children }: { children: React.ReactNode }) {
  return <div className={styles.trackRow}>{children}</div>;
}

function SliderTrack() {
  const { value, onChange, min, max, step } = useSliderContext();
  return (
    <div className={styles.track}>
      <RangeSlider
        label=""
        value={value}
        min={min}
        max={max}
        step={step}
        onValueChange={onChange}
      />
    </div>
  );
}

// --- Root ---

interface SliderRootProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  children: React.ReactNode;
}

function SliderRoot({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  children,
}: SliderRootProps) {
  return (
    <SliderContext value={{ value, onChange, min, max, step }}>
      <div className={styles.root}>{children}</div>
    </SliderContext>
  );
}

// --- Compound export ---

export const Slider = Object.assign(SliderRoot, {
  Label: SliderLabel,
  LowerBound: SliderLowerBound,
  UpperBound: SliderUpperBound,
  TrackRow: SliderTrackRow,
  Track: SliderTrack,
});
