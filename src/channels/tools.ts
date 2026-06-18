import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { WebClient } from "@slack/web-api";
import {
  ChannelsCreateInputSchema,
  ChannelsInviteInputSchema,
  ChannelsListInputSchema,
} from "./schemas.js";
import { createChannel, inviteUsers, listChannels } from "./service.js";

export function registerTools(server: McpServer, client: WebClient): void {
  server.registerTool(
    "channels_create",
    {
      description: "Creates a new Slack channel. Name must be lowercase with no spaces (a-z, 0-9, _ or -).",
      inputSchema: ChannelsCreateInputSchema.shape,
    },
    async ({ name, is_private }) => {
      try {
        const result = await createChannel(client, { name, is_private });
        return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          isError: true,
          content: [{ type: "text" as const, text: JSON.stringify({ error: message }) }],
        };
      }
    }
  );

  server.registerTool(
    "channels_list",
    {
      description: "Lists channels in the workspace. Archived channels are excluded by default.",
      inputSchema: ChannelsListInputSchema.shape,
    },
    async ({ limit, exclude_archived }) => {
      try {
        const result = await listChannels(client, { limit, exclude_archived });
        return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          isError: true,
          content: [{ type: "text" as const, text: JSON.stringify({ error: message }) }],
        };
      }
    }
  );

  server.registerTool(
    "channels_invite",
    {
      description: "Invites one or more workspace members to a channel. Provide at least one user ID.",
      inputSchema: ChannelsInviteInputSchema.shape,
    },
    async ({ channel_id, user_ids }) => {
      try {
        const result = await inviteUsers(client, { channel_id, user_ids });
        return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          isError: true,
          content: [{ type: "text" as const, text: JSON.stringify({ error: message }) }],
        };
      }
    }
  );
}
