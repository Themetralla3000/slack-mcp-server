# mcp-slack — agent instructions

## Workflow
This project uses Spec Driven Development via spec-kit.
Always read `.specify/memory/constitution.md` and the current SPEC before writing code.

Available spec-kit commands:
- `/speckit.specify`    — generate or update the SPEC
- `/speckit.plan`       — generate implementation plan from SPEC
- `/speckit.implement`  — implement a task from the plan
- `/speckit.checklist`  — verify implementation against SPEC
- `/speckit.analyze`    — analyse existing code against SPEC

## Commit and push rule
After every completed step: commit AND push. No exceptions.
This includes spec-kit artifacts: SPEC files, plans, checklists — everything goes to GitHub.
Format: `type(scope): description`
Examples:
- `docs: add SPEC for mcp-slack`
- `docs: add implementation plan`
- `chore: init typescript project and install dependencies`
- `feat(channels): channels_create, channels_list and channels_invite tools`
- `test(channels): unit tests with mocked WebClient`

Push command: `git push origin main`

## Architecture reference
See `.specify/memory/constitution.md` for the full technical spec,
module pattern, tool list and stack requirements.

## Active Technologies
- TypeScript 5.7, ESM modules, Node.js 22 LTS + @modelcontextprotocol/sdk (MCP server + stdio transport), @slack/web-api (Slack client), zod (schema validation), zod-to-json-schema (MCP inputSchema generation), vitest (tests), dotenv (env loading) (001-slack-mcp-server)
- N/A — stateless proxy; all state lives in Slack (001-slack-mcp-server)
- TypeScript 5.7, ESM modules, Node.js 22 LTS (unchanged) + @slack/web-api (files.getUploadURLExternal, files.completeUploadExternal), Node.js built-in `fs` (file reading), Node.js built-in `path` (filename derivation), Node.js 22 built-in `fetch` (PUT upload to pre-signed URL) (002-file-upload)
- N/A — stateless; files are read from filesystem and forwarded to Slack (002-file-upload)

## Recent Changes
- 001-slack-mcp-server: Added TypeScript 5.7, ESM modules, Node.js 22 LTS + @modelcontextprotocol/sdk (MCP server + stdio transport), @slack/web-api (Slack client), zod (schema validation), zod-to-json-schema (MCP inputSchema generation), vitest (tests), dotenv (env loading)
