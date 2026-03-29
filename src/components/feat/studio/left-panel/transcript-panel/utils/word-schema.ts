import { z } from "zod/v4";

export const WordSchema = z.object({
  text: z.string(),
  start: z.number(),
  end: z.number(),
  type: z.enum(["word", "spacing"]),
  logprob: z.number().optional(),
});

export type Word = z.infer<typeof WordSchema>;
