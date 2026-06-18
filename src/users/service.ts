import type { WebClient } from "@slack/web-api";
import type { UsersListInput, UsersListOutput } from "./schemas.js";

export async function listUsers(
  client: WebClient,
  input: UsersListInput
): Promise<UsersListOutput> {
  const response = await client.users.list({
    limit: input.limit,
  });

  const members = (response.members ?? []).map((m) => ({
    id: m.id ?? "",
    name: m.name ?? "",
    real_name: m.real_name ?? "",
    email: m.profile?.email ?? "",
    is_bot: m.is_bot ?? false,
  }));

  return { members };
}
