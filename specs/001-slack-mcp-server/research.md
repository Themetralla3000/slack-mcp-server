# Research: Slack Workspace Management MCP Server

**Date**: 2026-03-17
**Branch**: `001-slack-mcp-server`

## 1. MCP SDK — Tool Registration Pattern

**Decision**: Use `McpServer` from `@modelcontextprotocol/sdk/server/mcp.js` with `server.tool()` for each tool. Pass `zodToJsonSchema(InputSchema)` as `inputSchema`. Validate incoming args at runtime with `InputSchema.parse(args)`.

**Rationale**: The constitution requires Zod as the single source of truth. `zodToJsonSchema` converts the same Zod schema to the JSON Schema format the MCP protocol requires, eliminating duplication. The `McpServer` abstraction handles the MCP protocol framing so tools.ts only deals with business logic.

**Pattern** (applied identically in every tools.ts):
```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { zodToJsonSchema } from "zod-to-json-schema";
import { InputSchema } from "./schemas.js";
import { doOperation } from "./service.js";

export function registerTools(server: McpServer): void {
  server.tool(
    "tool_name",
    "Human-readable description for the LLM agent.",
    { inputSchema: zodToJsonSchema(InputSchema) },
    async (args) => {
      const input = InputSchema.parse(args);
      const result = await doOperation(input);
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );
}
```

**Alternatives considered**:
- `setRequestHandler(ListToolsRequestSchema, ...)` — lower-level, requires manual tool routing; rejected because `McpServer.tool()` is idiomatic for the current SDK.

---

## 2. StdioServerTransport — Entry Point Pattern

**Decision**: `index.ts` creates `McpServer`, calls each module's `registerTools(server)`, then connects `StdioServerTransport`.

**Rationale**: The constitution mandates stdio-only transport. Connecting last ensures all tools are registered before the server starts accepting messages.

**Pattern**:
```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerTools as registerChannelTools } from "./channels/tools.js";
import { registerTools as registerUserTools } from "./users/tools.js";
import { registerTools as registerMessageTools } from "./messages/tools.js";

const server = new McpServer({ name: "mcp-slack", version: "1.0.0" });

registerChannelTools(server);
registerUserTools(server);
registerMessageTools(server);

await server.connect(new StdioServerTransport());
```

**Adding a new module**: Create `src/newmodule/{schemas,service,tools}.ts` and add one import + one `registerTools(server)` call in `index.ts`. No other files change.

---

## 3. Slack API Methods and Required Bot Token Scopes

| Tool | Slack API Method | Required OAuth Scopes |
|------|------------------|-----------------------|
| channels_create | `conversations.create` | `channels:manage` (public), `groups:write` (private) |
| channels_list | `conversations.list` | `channels:read`, `groups:read` |
| channels_invite | `conversations.invite` | `channels:manage`, `groups:write` |
| users_list | `users.list` | `users:read`, `users:read.email` |
| messages_send | `chat.postMessage` | `chat:write` |

**Decision**: Document the required scopes in `quickstart.md` and `.env.example`. The bot must have all scopes pre-configured in the Slack App settings before the server is deployed (per spec Assumption 2).

**Key Slack API behaviours**:
- `conversations.create`: `name` must be lowercase, no spaces, ≤80 chars. Returns full channel object.
- `conversations.list`: Supports `limit` (max 1000 per call) and `exclude_archived`. Pagination via `cursor` (out of scope per spec Assumption 3 — single page only).
- `conversations.invite`: `users` is a comma-separated string of user IDs. Returns full channel object with updated `num_members`.
- `users.list`: Supports `limit`. Returns `members` array. Pagination via `cursor` (out of scope per spec Assumption 3).
- `chat.postMessage`: `thread_ts` is optional — when provided, the message is posted as a reply in the thread.

---

## 4. Zod Schema Design

**Decision**: Each `schemas.ts` exports a named Input schema and a named Output schema. Output schemas are used to type service return values; Input schemas drive both MCP registration and runtime parsing.

**Rationale**: Having both Input and Output schemas in one file makes the contract for each tool immediately visible without hunting across files.

**Channel name validation**: Zod `.regex(/^[a-z0-9_-]+$/)` enforces lowercase + no spaces at the boundary.

**Pattern**:
```typescript
import { z } from "zod";

export const ChannelsCreateInputSchema = z.object({
  name: z.string().regex(/^[a-z0-9_-]+$/, "Channel name must be lowercase with no spaces"),
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
```

---

## 5. Error Handling Strategy

**Decision**: Services throw typed errors with descriptive messages. Tool handlers catch errors and return MCP error responses (not throw), so the agent receives a structured error rather than a crashed server.

**Pattern**:
```typescript
async (args) => {
  try {
    const input = InputSchema.parse(args);
    const result = await service.doOp(input);
    return { content: [{ type: "text", text: JSON.stringify(result) }] };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { content: [{ type: "text", text: JSON.stringify({ error: message }) }], isError: true };
  }
}
```

**Validation errors**: Zod `.parse()` throws `ZodError` with field-level detail — this satisfies FR-008 (identify the specific invalid field).

---

## 6. TypeScript + ESM Configuration

**Decision**: `tsconfig.json` targets `ES2022`, `module: NodeNext`, `moduleResolution: NodeNext`. All imports use `.js` extensions.

**Rationale**: Node.js 22 native ESM requires explicit `.js` extensions even for `.ts` source files. `NodeNext` resolution is the correct mode.

**Key tsconfig settings**:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "outDir": "dist",
    "rootDir": "src"
  }
}
```

**package.json**: `"type": "module"`, `"main": "dist/index.js"`.

---

## 7. Testing with Vitest and Mocked WebClient

**Decision**: Each test file imports the service under test and mocks `@slack/web-api` at the module level using `vi.mock`. Tests verify that the service passes correct arguments to the Slack client and maps the response correctly to the output schema.

**Rationale**: Mocking WebClient keeps tests fast and deterministic — no real Slack workspace needed. The mock targets the service layer, not the tool layer, keeping tests focused.

**Pattern**:
```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
vi.mock("@slack/web-api");
import { WebClient } from "@slack/web-api";
import { listChannels } from "../src/channels/service.js";

describe("channels service", () => {
  let client: WebClient;
  beforeEach(() => { client = new WebClient("test-token"); });

  it("maps conversations.list response to output schema", async () => {
    vi.mocked(client.conversations.list).mockResolvedValue({ channels: [...], ok: true });
    const result = await listChannels(client, { limit: 10, exclude_archived: true });
    expect(result).toHaveLength(1);
  });
});
```
