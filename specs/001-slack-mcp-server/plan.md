# Implementation Plan: Slack Workspace Management MCP Server

**Branch**: `001-slack-mcp-server` | **Date**: 2026-03-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-slack-mcp-server/spec.md`

## Summary

Build a Model Context Protocol (MCP) server that exposes 5 Slack workspace management tools (channels_create, channels_list, channels_invite, users_list, messages_send) to LLM agents via stdio transport. The server authenticates with a Slack workspace using a bot token and follows a strict three-file module pattern (schemas / service / tools) per domain.

## Technical Context

**Language/Version**: TypeScript 5.7, ESM modules, Node.js 22 LTS
**Primary Dependencies**: @modelcontextprotocol/sdk (MCP server + stdio transport), @slack/web-api (Slack client), zod (schema validation), zod-to-json-schema (MCP inputSchema generation), vitest (tests), dotenv (env loading)
**Storage**: N/A — stateless proxy; all state lives in Slack
**Testing**: vitest with mocked WebClient per module
**Target Platform**: Node.js 22 LTS process, stdio transport
**Project Type**: stdio server (MCP)
**Performance Goals**: All tool responses within 5 seconds (SC-001); server ready within 3 seconds of launch (SC-005)
**Constraints**: stdio only — no HTTP, no ports, no Express; single SLACK_BOT_TOKEN env var; ESM throughout
**Scale/Scope**: 5 tools, 3 modules, 1 server entry point

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| stdio transport only — no HTTP/Express | PASS | StdioServerTransport is the only transport |
| Module pattern: schemas.ts / service.ts / tools.ts per domain | PASS | Three modules: channels, users, messages |
| Zod as single source of truth for input schemas | PASS | zodToJsonSchema feeds MCP inputSchema; parse() validates at runtime |
| Adding a new module must not require modifying index.ts | PASS | Each tools.ts registers its own tools; index.ts calls registerAllTools |
| Commit after every meaningful completed step | PASS | Enforced by CLAUDE.md |
| No duplicate type definitions, no manual JSON Schema | PASS | Zod schemas are the sole definition |

All gates pass. No violations requiring justification.

## Project Structure

### Documentation (this feature)

```text
specs/001-slack-mcp-server/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── tools.md
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── channels/
│   ├── schemas.ts       # Zod input/output definitions
│   ├── service.ts       # WebClient calls: conversations.create/list/invite
│   └── tools.ts         # MCP tool definitions for channels_create, channels_list, channels_invite
├── users/
│   ├── schemas.ts       # Zod input/output definitions
│   ├── service.ts       # WebClient call: users.list
│   └── tools.ts         # MCP tool definition for users_list
├── messages/
│   ├── schemas.ts       # Zod input/output definitions
│   ├── service.ts       # WebClient call: chat.postMessage
│   └── tools.ts         # MCP tool definition for messages_send
└── index.ts             # McpServer creation, registerAllTools(), StdioServerTransport connect

tests/
├── channels/
│   └── channels.test.ts # vitest with mocked WebClient
├── users/
│   └── users.test.ts
└── messages/
    └── messages.test.ts

package.json
tsconfig.json
.env.example
```

**Structure Decision**: Single-project layout with one `src/` directory. Modules mirror the three Slack capability domains. `index.ts` is intentionally thin — it wires together the server and calls each module's register function, but contains no business logic.
