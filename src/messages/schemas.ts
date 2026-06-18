import { z } from "zod";

// ── messages_send ────────────────────────────────────────────────────────────

export const MessagesSendInputSchema = z.object({
  channel_id: z.string(),
  text: z.string().min(1),
  thread_ts: z.string().optional(),
});
export type MessagesSendInput = z.infer<typeof MessagesSendInputSchema>;

export const MessagesSendOutputSchema = z.object({
  ts: z.string(),
  channel: z.string(),
  text: z.string(),
});
export type MessagesSendOutput = z.infer<typeof MessagesSendOutputSchema>;
