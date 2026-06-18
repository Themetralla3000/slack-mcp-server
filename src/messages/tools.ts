import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { WebClient } from "@slack/web-api";
import { MessagesSendInputSchema } from "./schemas.js";
import { sendMessage } from "./service.js";

export function registerTools(server: McpServer, client: WebClient): void {
  server.registerTool(
    "messages_send",
    {
      description: "Sends a message to a Slack channel. Optionally posts as a threaded reply by providing thread_ts.",
      inputSchema: MessagesSendInputSchema.shape,
    },
    async ({ channel_id, text, thread_ts }) => {
      try {
        const result = await sendMessage(client, { channel_id, text, thread_ts });
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
