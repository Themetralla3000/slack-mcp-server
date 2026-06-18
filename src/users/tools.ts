import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { WebClient } from "@slack/web-api";
import { UsersListInputSchema } from "./schemas.js";
import { listUsers } from "./service.js";

export function registerTools(server: McpServer, client: WebClient): void {
  server.registerTool(
    "users_list",
    {
      description: "Lists members of the workspace.",
      inputSchema: UsersListInputSchema.shape,
    },
    async ({ limit }) => {
      try {
        const result = await listUsers(client, { limit });
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
