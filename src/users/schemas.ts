import { z } from "zod";

// ── users_list ───────────────────────────────────────────────────────────────

export const UsersListInputSchema = z.object({
  limit: z.number().min(1).default(100),
});
export type UsersListInput = z.infer<typeof UsersListInputSchema>;

export const MemberItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  real_name: z.string(),
  email: z.string(),
  is_bot: z.boolean(),
});

export const UsersListOutputSchema = z.object({
  members: z.array(MemberItemSchema),
});
export type UsersListOutput = z.infer<typeof UsersListOutputSchema>;
