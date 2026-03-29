"use client";

import { createContext } from "react";

export interface SliderContextValue {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
}

export const SliderContext = createContext<SliderContextValue | null>(null);
