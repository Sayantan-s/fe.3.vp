import { z } from "zod/v4";

const BgOptionSchema = z.object({
  src: z.string().min(1),
  label: z.string().min(1),
});

export type BgOption = z.infer<typeof BgOptionSchema>;

export const BG_OPTIONS: Record<number, BgOption> = {
  1: { src: "/backgrounds/bg-1.jpg", label: "Purple to blue gradient" },
  2: { src: "/backgrounds/bg-2.jpg", label: "Pink to purple gradient" },
  3: { src: "/backgrounds/bg-3.jpg", label: "Green to blue gradient" },
  4: { src: "/backgrounds/bg-4.jpg", label: "Yellow to orange gradient" },
  5: { src: "/backgrounds/bg-5.jpg", label: "Indigo to pink gradient" },
  6: { src: "/backgrounds/bg-6.jpg", label: "Teal to blue gradient" },
  7: { src: "/backgrounds/bg-7.jpg", label: "Pink to purple radial" },
  8: { src: "/backgrounds/bg-8.jpg", label: "Dark navy gradient" },
  9: { src: "/backgrounds/bg-9.jpg", label: "Violet to magenta gradient" },
  10: { src: "/backgrounds/bg-10.jpg", label: "Red to orange gradient" },
  11: { src: "/backgrounds/bg-11.jpg", label: "Dark navy solid" },
  12: { src: "/backgrounds/bg-12.jpg", label: "Indigo to fuchsia gradient" },
};

export const BG_OPTION_KEYS = Object.keys(BG_OPTIONS).map(Number);
