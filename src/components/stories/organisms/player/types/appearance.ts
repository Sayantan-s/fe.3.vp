import { z } from "zod";

// --- Zod Schemas ---

export const VideoAppearanceSchema = z.object({
  padding: z.number().min(0).max(100),
  rounding: z.number().min(0).max(100),
});

export const ControlledAppearancePropsSchema = z.object({
  padding: z.number().min(0).max(100).optional(),
  rounding: z.number().min(0).max(100).optional(),
});

// --- Derived Types ---

export type VideoAppearance = z.infer<typeof VideoAppearanceSchema>;
export type ControlledAppearanceProps = z.infer<
  typeof ControlledAppearancePropsSchema
>;

// --- Interface Types ---

export interface VideoAppearanceStore {
  setPadding: (value: number) => void;
  setRounding: (value: number) => void;
  getAppearance: () => VideoAppearance;
  subscribe: (listener: () => void) => () => void;
  syncControlled: (props: ControlledAppearanceProps) => void;
}

export type UseAppearanceReturn = VideoAppearance & {
  setPadding: (value: number) => void;
  setRounding: (value: number) => void;
};
