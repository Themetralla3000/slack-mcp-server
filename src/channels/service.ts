import type { WebClient } from "@slack/web-api";
import type {
  ChannelsCreateInput,
  ChannelsCreateOutput,
  ChannelsInviteInput,
  ChannelsInviteOutput,
  ChannelsListInput,
  ChannelsListOutput,
} from "./schemas.js";

export async function createChannel(
  client: WebClient,
  input: ChannelsCreateInput
): Promise<ChannelsCreateOutput> {
  const response = await client.conversations.create({
    name: input.name,
    is_private: input.is_private,
  });

  const ch = response.channel;
  return {
    id: ch?.id ?? "",
    name: ch?.name ?? "",
    is_private: ch?.is_private ?? false,
    created: typeof ch?.created === "number" ? ch.created : 0,
  };
}

export async function inviteUsers(
  client: WebClient,
  input: ChannelsInviteInput
): Promise<ChannelsInviteOutput> {
  const response = await client.conversations.invite({
    channel: input.channel_id,
    users: input.user_ids.join(","),
  });

  // The Slack SDK typings omit num_members on the invite response channel; cast to access it.
  const ch = response.channel as { id?: string; name?: string; num_members?: number } | undefined;
  return {
    id: ch?.id ?? "",
    name: ch?.name ?? "",
    num_members: ch?.num_members ?? 0,
  };
}

export async function listChannels(
  client: WebClient,
  input: ChannelsListInput
): Promise<ChannelsListOutput> {
  const response = await client.conversations.list({
    limit: input.limit,
    exclude_archived: input.exclude_archived,
  });

  const channels = (response.channels ?? []).map((ch) => ({
    id: ch.id ?? "",
    name: ch.name ?? "",
    is_private: ch.is_private ?? false,
    num_members: ch.num_members ?? 0,
  }));

  return { channels };
}
