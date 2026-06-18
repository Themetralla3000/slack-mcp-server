import { z } from "zod";

// ── channels_create ──────────────────────────────────────────────────────────

export const ChannelsCreateInputSchema = z.object({
  name: z
    .string()
    .regex(/^[a-z0-9_-]+$/, "Channel name must be lowercase with no spaces (a-z, 0-9, _ or -)"),
  is_private: z.boolean().default(false),
});
export type ChannelsCreateInput = z.infer<typeof ChannelsCreateInputSchema>;

export const ChannelsCreateOutputSchema = z.object({
  id: z.string(),
  name: z.string(),
  is_private: z.boolean(),
  created: z.number(),
});
export type ChannelsCreateOutput = z.infer<typeof ChannelsCreateOutputSchema>;

// ── channels_invite ──────────────────────────────────────────────────────────

export const ChannelsInviteInputSchema = z.object({
  channel_id: z.string(),
  user_ids: z.array(z.string()).min(1, "user_ids must contain at least one user ID"),
});
export type ChannelsInviteInput = z.infer<typeof ChannelsInviteInputSchema>;

export const ChannelsInviteOutputSchema = z.object({
  id: z.string(),
  name: z.string(),
  num_members: z.number(),
});
export type ChannelsInviteOutput = z.infer<typeof ChannelsInviteOutputSchema>;

// ── channels_list ────────────────────────────────────────────────────────────

export const ChannelsListInputSchema = z.object({
  limit: z.number().min(1).default(100),
  exclude_archived: z.boolean().default(true),
});
export type ChannelsListInput = z.infer<typeof ChannelsListInputSchema>;

export const ChannelItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  is_private: z.boolean(),
  num_members: z.number(),
});

export const ChannelsListOutputSchema = z.object({
  channels: z.array(ChannelItemSchema),
});
export type ChannelsListOutput = z.infer<typeof ChannelsListOutputSchema>;
