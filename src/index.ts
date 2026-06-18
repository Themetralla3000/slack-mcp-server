import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { WebClient } from "@slack/web-api";
import { registerTools as registerChannelTools } from "./channels/tools.js";
import { registerTools as registerUserTools } from "./users/tools.js";
import { registerTools as registerMessageTools } from "./messages/tools.js";
import { registerTools as registerFileTools } from "./files/tools.js";

const token = process.env.SLACK_BOT_TOKEN;
if (!token) {
  console.error("Error: SLACK_BOT_TOKEN environment variable is required.");
  console.error("Set SLACK_BOT_TOKEN=xoxb-... in your environment or .env file and try again.");
  process.exit(1);
}

const client = new WebClient(token);
const server = new McpServer({ name: "mcp-slack", version: "1.0.0" });

registerChannelTools(server, client);
registerUserTools(server, client);
registerMessageTools(server, client);
registerFileTools(server, client);

await server.connect(new StdioServerTransport());
