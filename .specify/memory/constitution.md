# mcp-slack Constitution

## Core Principles

### I. Spec First (NON-NEGOTIABLE)
The SPEC is written and approved before any implementation code is written.
The SPEC is the single source of truth for what the server does.
Implementation decisions not covered by the SPEC must be added to the SPEC before coding.

### II. stdio Transport Only
The server communicates exclusively via StdioServerTransport from @modelcontextprotocol/sdk.
No HTTP server, no Express, no session management, no network ports.
Entry point: create McpServer → registerAllTools → connect StdioServerTransport.

### III. Module Pattern (mandatory)
Every domain has exactly three files: schemas.ts / service.ts / tools.ts
- schemas.ts: Zod input/output definitions (source of truth for types)
- service.ts: business logic calling @slack/web-api WebClient
- tools.ts: MCP tool definitions + handlers delegating to service
Adding a new module must not require modifying index.ts or any other existing file.

### IV. Zod as Source of Truth
The same Zod schema is used for runtime argument validation AND for generating
the MCP inputSchema via zod-to-json-schema.
No duplicate type definitions. No manual JSON Schema.

### V. Commit Discipline (NON-NEGOTIABLE)
A commit is made after every meaningful completed step.
Conventional Commits format:
- chore: setup, dependencies, config files
- docs: SPEC, README, comments
- feat(<module>): new tool or module
- test(<module>): tests
- fix(<module>): bug fixes
Never advance to the next step without committing the previous one.

## Technical Stack

| Layer | Technology | Version |
|---|---|---|
| Runtime | Node.js | 22 LTS |
| Language | TypeScript | 5.7, ESM |
| MCP SDK | @modelcontextprotocol/sdk | latest stable |
| Transport | StdioServerTransport | — |
| Slack API | @slack/web-api | latest stable |
| Validation | zod + zod-to-json-schema | latest stable |
| Tests | vitest | latest stable |
| Config | dotenv | latest stable |

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| SLACK_BOT_TOKEN | yes | Bot token (xoxb-...) |
| LOG_LEVEL | no | debug\|info\|warn\|error (default: info) |

## Tools in Scope

| Module | Tool | Slack API method |
|---|---|---|
| channels | channels_create | conversations.create |
| channels | channels_list | conversations.list |
| channels | channels_invite | conversations.invite |
| users | users_list | users.list |
| messages | messages_send | chat.postMessage |

## Governance
This constitution supersedes all other instructions.
Any deviation requires explicit user approval and an amendment to this document.
CLAUDE.md provides runtime commit and workflow guidance.

**Version**: 1.0.0 | **Ratified**: 2026-03-17 | **Last Amended**: 2026-03-17
