# Implementation Plan: File Upload to Slack Channels

**Branch**: `002-file-upload` | **Date**: 2026-03-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-file-upload/spec.md`

## Summary

Add a `files_upload` MCP tool that reads a file from the local filesystem, uploads it to Slack using the v2 Files API (three-step: get upload URL → PUT binary → complete upload), and shares it to a specified channel with an optional initial comment. Follows the existing three-file module pattern under `src/files/`.

## Technical Context

**Language/Version**: TypeScript 5.7, ESM modules, Node.js 22 LTS (unchanged)
**Primary Dependencies**: @slack/web-api (files.getUploadURLExternal, files.completeUploadExternal), Node.js built-in `fs` (file reading), Node.js built-in `path` (filename derivation), Node.js 22 built-in `fetch` (PUT upload to pre-signed URL)
**Storage**: N/A — stateless; files are read from filesystem and forwarded to Slack
**Testing**: vitest with mocked WebClient and mocked fetch (same pattern as existing modules)
**Target Platform**: Node.js 22 LTS process, stdio transport (unchanged)
**Project Type**: stdio server (MCP) — additive module, no structural change
**Performance Goals**: Upload confirmation within 15 seconds for files up to 10 MB (SC-001)
**Constraints**: stdio only; no new network servers; files must be accessible on the server's filesystem; single file per invocation
**Scale/Scope**: 1 new tool, 1 new module (3 files), 1 index.ts update

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| stdio transport only — no HTTP/Express | PASS | No new transport introduced |
| Module pattern: schemas.ts / service.ts / tools.ts per domain | PASS | New `src/files/` module follows the pattern exactly |
| Zod as single source of truth for input schemas | PASS | FilesUploadInputSchema drives both MCP registration and runtime validation |
| Adding a new module must not require modifying index.ts | PARTIAL — see Complexity Tracking | One import + one registerTools() call added to index.ts |
| Commit after every meaningful completed step | PASS | Enforced by CLAUDE.md |
| No duplicate type definitions, no manual JSON Schema | PASS | Zod schemas are the sole definition |

All gates pass or are justified. No blocking violations.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| index.ts must be modified to wire the new module | The constitution's intent is to minimize cross-module coupling, not to make index.ts immutable. Adding one import + one registerTools() call is the minimal, necessary wiring. | Auto-discovery (e.g. glob import) would add complexity, a new dependency, and non-obvious behaviour — more complexity than a one-line explicit call. |

## Project Structure

### Documentation (this feature)

```text
specs/002-file-upload/
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
├── channels/            # existing — unchanged
├── users/               # existing — unchanged
├── messages/            # existing — unchanged
├── files/               # NEW
│   ├── schemas.ts       # FilesUploadInputSchema, FilesUploadOutputSchema
│   ├── service.ts       # uploadFile(): get URL → PUT binary → complete upload
│   └── tools.ts         # registers files_upload MCP tool
└── index.ts             # +1 import, +1 registerTools(server, client) call

tests/
├── channels/            # existing — unchanged
├── users/               # existing — unchanged
├── messages/            # existing — unchanged
└── files/               # NEW
    └── files.test.ts    # vitest with mocked WebClient + mocked fetch
```

**Structure Decision**: Single-project layout, additive only. The `src/files/` module is self-contained. The only modification to existing files is two lines in `src/index.ts`.
