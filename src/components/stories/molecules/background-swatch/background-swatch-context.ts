"use client";

import { createContext } from "react";

export interface BackgroundSwatchContextValue {
  value: number;
  onValueChange: (key: number) => void;
}

export const BackgroundSwatchContext =
  createContext<BackgroundSwatchContextValue | null>(null);
