# Tasks: File Upload to Slack Channels

**Input**: Design documents from `/specs/002-file-upload/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/tools.md ✓

**Organization**: Tasks grouped by user story. The feature adds a single `files_upload` tool in a new `src/files/` module to an already-bootstrapped project.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete dependencies)
- **[Story]**: Which user story this task belongs to ([US1], [US2])

## Path Conventions

Single-project layout: `src/` and `tests/` at repository root (unchanged from 001).

---

## Phase 1: Setup

**Purpose**: Create the new module directories (they do not yet exist).

- [x] T001 Create src/files/ and tests/files/ directories

**Checkpoint**: `ls src/files tests/files` confirms both directories exist

---

## Phase 2: Foundational (Blocking Prerequisite)

**Purpose**: Wire the new module into the server entry point. Must be done before the tool is callable.

**⚠️ CRITICAL**: The files module cannot be tested end-to-end until this wiring is in place.

- [x] T002 Update src/index.ts — add `import { registerTools as registerFileTools } from "./files/tools.js"` after the existing module imports, and add `registerFileTools(server, client)` after the existing registerTools calls

**Checkpoint**: `npm run build` succeeds with the stub module in place

---

## Phase 3: User Story 1 — File Delivery to Channel (Priority: P1) 🎯 MVP

**Goal**: An agent can upload any file from the local filesystem to a Slack channel and receive back the file ID, name, and permalink.

**Independent Test**: Invoke `files_upload` with a valid file path and channel ID; verify the file appears in the channel and the response matches the output schema in `contracts/tools.md`.

### Implementation for User Story 1

- [x] T003 [P] [US1] Create src/files/schemas.ts — export `FilesUploadInputSchema` (file_path: z.string().min(1), channel_id: z.string().min(1), filename: z.string().min(1).optional(), initial_comment: z.string().optional()) and `FilesUploadOutputSchema` ({ id: z.string(), name: z.string(), permalink: z.string(), channel: z.string() }); export inferred types `FilesUploadInput` and `FilesUploadOutput`
- [x] T004 [US1] Implement src/files/service.ts — export `uploadFile(client: WebClient, input: FilesUploadInput): Promise<FilesUploadOutput>`: (1) check `existsSync(input.file_path)` and throw `Error("File not found: ${input.file_path}")` if missing; (2) read file with `readFileSync(input.file_path)`; (3) derive `displayName = input.filename ?? basename(input.file_path)`; (4) call `client.files.uploadV2({ channel_id: input.channel_id, filename: displayName, file: buffer, ...(input.initial_comment && { initial_comment: input.initial_comment }) })`; (5) map first element of `result.files` to `{ id, name, permalink, channel: input.channel_id }`
- [x] T005 [US1] Implement src/files/tools.ts — export `registerTools(server: McpServer, client: WebClient): void`; register `files_upload` tool with description "Uploads a file from the server filesystem to a Slack channel.", inputSchema `FilesUploadInputSchema.shape`, handler delegates to `uploadFile()` and wraps errors as `{ isError: true, content: [{ type: "text", text: JSON.stringify({ error: message }) }] }`

### Tests for User Story 1

- [x] T006 [P] [US1] Write tests/files/files.test.ts — create mock client `{ files: { uploadV2: vi.fn() } }`; write tests: (a) throws "File not found" before calling uploadV2 when file does not exist; (b) calls uploadV2 with correct channel_id, filename, and file buffer; (c) uses basename of file_path as filename when `filename` input is omitted; (d) uses custom `filename` when provided; (e) maps uploadV2 response to output schema correctly

**Checkpoint**: `npm test` passes including new files tests; US1 is fully functional end-to-end

---

## Phase 4: User Story 2 — File Delivery with Contextual Message (Priority: P2)

**Goal**: An agent can attach an explanatory comment to a file upload so it appears alongside the file in the channel.

**Independent Test**: Invoke `files_upload` with `initial_comment`; verify the comment appears alongside the file in the channel. Invoke without `initial_comment`; verify no comment appears.

### Tests for User Story 2

- [x] T007 [US2] Extend tests/files/files.test.ts — add tests: (a) `initial_comment` is forwarded to uploadV2 when provided; (b) `initial_comment` key is absent from the uploadV2 call when not provided (verify with `expect(call).not.toHaveProperty("initial_comment")`)

**Checkpoint**: All tests pass; both upload scenarios (with and without comment) verified

---

## Phase 5: Polish & Cross-Cutting Concerns

- [x] T008 [P] Run `npm run build && npm test` — confirm zero TypeScript errors and all tests pass; fix any issues found
- [x] T009 [P] Update README.md — add `files_upload` row to the tools table and add `files:write` to the required scopes table

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (directories must exist to write tools.ts stub)
- **US1 (Phase 3)**: Depends on Phase 2 — T003/T004/T005/T006 can proceed in parallel once T002 is done
- **US2 (Phase 4)**: Depends on T006 (extends the same test file) — run after Phase 3
- **Polish (Phase 5)**: Depends on all story phases complete

### Within User Story 1

- T003 (schemas) → T004 (service imports schemas) → T005 (tools imports both)
- T006 (tests) can be written in parallel with T004/T005 since it imports only the service

### Parallel Opportunities

```
T003: src/files/schemas.ts  ─┐
                              ├─ T004: src/files/service.ts (after T003)
                              └─ T006: tests/files/files.test.ts (after T003+T004)
                                  T005: src/files/tools.ts (after T003+T004)
```

---

## Implementation Strategy

### MVP (User Story 1 only — 6 tasks)

1. T001 — create directories
2. T002 — wire index.ts
3. T003 → T004 → T005 — schemas, service, tools
4. T006 — tests
5. **Validate**: `npm test` passes; live upload works

### Full delivery

1. MVP above
2. T007 — extend tests for initial_comment (US2)
3. T008 + T009 — polish

---

## Notes

- `client.files.uploadV2()` is available in `@slack/web-api ^7.9.2` — no new dependencies needed
- Node.js built-ins `fs`, `path` handle file reading and name derivation — no new packages
- `initial_comment` is an optional field in FilesUploadInputSchema — US1 and US2 share the same tool; US2 adds test coverage for that path
- Only `src/index.ts` and the new `src/files/` module are touched; all other existing modules are unchanged
