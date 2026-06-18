import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { WebClient } from "@slack/web-api";
import { FilesUploadInputSchema } from "./schemas.js";
import { uploadFile } from "./service.js";

export function registerTools(server: McpServer, client: WebClient): void {
  server.registerTool(
    "files_upload",
    {
      description: "Uploads a file from the server filesystem to a Slack channel. Optionally overrides the display filename and adds an initial comment.",
      inputSchema: FilesUploadInputSchema.shape,
    },
    async ({ file_path, channel_id, filename, initial_comment }) => {
      try {
        const result = await uploadFile(client, { file_path, channel_id, filename, initial_comment });
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
