# Tasks: Slack Workspace Management MCP Server

**Input**: Design documents from `/specs/001-slack-mcp-server/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/tools.md ✓

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to ([US1], [US2], [US3])
- Exact file paths are included in every description

## Path Conventions

Single-project layout: `src/` and `tests/` at repository root (per plan.md)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize the TypeScript/Node.js project with all required configuration and folder structure.

- [x] T001 Create package.json (type: module, scripts: build/test/dev), tsconfig.json (NodeNext ESM), .env.example (SLACK_BOT_TOKEN, LOG_LEVEL), and folder skeleton src/channels/ src/users/ src/messages/ tests/channels/ tests/users/ tests/messages/
- [x] T002 Install runtime and dev dependencies: @modelcontextprotocol/sdk, @slack/web-api, zod, zod-to-json-schema, dotenv, typescript, vitest, @types/node

**Checkpoint**: `npm install` succeeds; `npx tsc --noEmit` runs (no source yet, just validates config)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Entry-point skeleton that all three modules plug into. Must exist before any module can be wired.

**⚠️ CRITICAL**: No user story work can be fully wired until this phase is complete.

- [x] T003 Create src/index.ts — load dotenv, guard for missing SLACK_BOT_TOKEN (exit with clear error message), instantiate McpServer({ name: "mcp-slack", version: "1.0.0" }), import and call registerTools() from each module placeholder, connect StdioServerTransport

**Checkpoint**: `npm run build` succeeds; running `node dist/index.js` without SLACK_BOT_TOKEN prints an actionable error and exits non-zero

---

## Phase 3: User Story 1 — Workspace Discovery (Priority: P1) 🎯 MVP

**Goal**: LLM agents can list all workspace channels and all workspace members in a single session.

**Independent Test**: Invoke `channels_list` and `users_list` sequentially via an MCP client; verify both return structured arrays matching the contracts in `contracts/tools.md`.

### Implementation for User Story 1

- [x] T004 [P] [US1] Create src/channels/schemas.ts — export ChannelsListInputSchema (limit: number default 100, exclude_archived: boolean default true) and ChannelsListOutputSchema (array of {id, name, is_private, num_members})
- [x] T005 [P] [US1] Create src/users/schemas.ts — export UsersListInputSchema (limit: number default 100) and UsersListOutputSchema (array of {id, name, real_name, email, is_bot})
- [x] T006 [P] [US1] Implement src/channels/service.ts — export listChannels(client: WebClient, input: ChannelsListInput): Promise<ChannelsListOutput> calling conversations.list, mapping response fields, filtering archived per exclude_archived flag
- [x] T007 [P] [US1] Implement src/users/service.ts — export listUsers(client: WebClient, input: UsersListInput): Promise<UsersListOutput> calling users.list, mapping id/name/real_name/email/is_bot per member
- [x] T008 [P] [US1] Implement src/channels/tools.ts — export registerTools(server: McpServer): void registering channels_list tool using zodToJsonSchema(ChannelsListInputSchema) as inputSchema, delegating to listChannels, catching errors and returning isError: true responses
- [x] T009 [P] [US1] Implement src/users/tools.ts — export registerTools(server: McpServer): void registering users_list tool using zodToJsonSchema(UsersListInputSchema) as inputSchema, delegating to listUsers, catching errors and returning isError: true responses

### Tests for User Story 1

- [x] T010 [P] [US1] Write tests/channels/channels.test.ts — vi.mock("@slack/web-api"), test listChannels maps conversations.list response correctly, test exclude_archived: false includes archived channels, test empty workspace returns empty array
- [x] T011 [P] [US1] Write tests/users/users.test.ts — vi.mock("@slack/web-api"), test listUsers maps users.list response correctly including is_bot flag, test limit parameter is forwarded to WebClient

**Checkpoint**: `npm test` passes for channels and users; US1 is fully functional end-to-end

---

## Phase 4: User Story 2 — Message Delivery (Priority: P2)

**Goal**: LLM agents can post messages to a channel and reply to existing threads.

**Independent Test**: Invoke `messages_send` with a known channel ID and text; verify the response contains ts, channel, and text. Then invoke with a thread_ts and verify the reply is threaded.

### Implementation for User Story 2

- [x] T012 [P] [US2] Create src/messages/schemas.ts — export MessagesSendInputSchema (channel_id: string, text: string minLength 1, thread_ts: string optional) and MessagesSendOutputSchema ({ts, channel, text})
- [x] T013 [US2] Implement src/messages/service.ts — export sendMessage(client: WebClient, input: MessagesSendInput): Promise<MessagesSendOutput> calling chat.postMessage, forwarding thread_ts when present, mapping ts/channel/text from response
- [x] T014 [US2] Implement src/messages/tools.ts — export registerTools(server: McpServer): void registering messages_send tool using zodToJsonSchema(MessagesSendInputSchema) as inputSchema, delegating to sendMessage, catching errors and returning isError: true responses

### Tests for User Story 2

- [x] T015 [P] [US2] Write tests/messages/messages.test.ts — vi.mock("@slack/web-api"), test sendMessage maps chat.postMessage response to output schema, test thread_ts is forwarded when provided, test empty text is rejected by Zod before reaching WebClient

**Checkpoint**: `npm test` passes for all three modules; US2 is fully functional end-to-end

---

## Phase 5: User Story 3 — Channel Creation & Member Onboarding (Priority: P3)

**Goal**: LLM agents can create a new channel and invite workspace members to it.

**Independent Test**: Invoke `channels_create` with a valid name; verify the response contains id, name, is_private, created. Then invoke `channels_invite` with that channel ID and at least one user ID; verify num_members increases in the response.

### Implementation for User Story 3

- [x] T016 [P] [US3] Extend src/channels/schemas.ts — add ChannelsCreateInputSchema (name: string regex /^[a-z0-9_-]+$/, is_private: boolean default false), ChannelsCreateOutputSchema ({id, name, is_private, created}), ChannelsInviteInputSchema (channel_id: string, user_ids: string[] minItems 1), ChannelsInviteOutputSchema ({id, name, num_members})
- [x] T017 [P] [US3] Extend src/channels/service.ts — add createChannel(client, input): calls conversations.create, maps id/name/is_private/created; add inviteUsers(client, input): joins user_ids with comma, calls conversations.invite, maps id/name/num_members
- [x] T018 [US3] Extend src/channels/tools.ts — register channels_create tool (zodToJsonSchema(ChannelsCreateInputSchema), delegates to createChannel) and channels_invite tool (zodToJsonSchema(ChannelsInviteInputSchema), delegates to inviteUsers); both with error handling

### Tests for User Story 3

- [x] T019 [US3] Extend tests/channels/channels.test.ts — add test createChannel passes correct name and is_private to conversations.create and maps response; add test inviteUsers joins user_ids as comma string and maps num_members; add test empty user_ids array is rejected by Zod validation

**Checkpoint**: `npm test` passes for all tests; all 5 tools work end-to-end; full workflow (create → invite → send message) completes without errors

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Finalize the project for production use and validate against the quickstart.

- [x] T020 [P] Write README.md at repository root — project overview, prerequisites, setup steps referencing quickstart.md, available tools summary, required bot scopes
- [x] T021 [P] Run full test suite (`npm test`) and confirm all tests pass with zero failures; fix any remaining issues
- [x] T022 Validate end-to-end by following quickstart.md steps: install → configure .env → build → connect via MCP client → invoke each of the 5 tools manually

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — **BLOCKS full wiring** of any user story
- **User Stories (Phase 3–5)**: All depend on Phase 2 completion; can proceed in priority order or in parallel
- **Polish (Phase 6)**: Depends on all desired user stories complete

### User Story Dependencies

- **US1 (P1)**: Starts after Phase 2 — no dependency on US2 or US3
- **US2 (P2)**: Starts after Phase 2 — no dependency on US1 or US3; messages module is fully independent
- **US3 (P3)**: Starts after Phase 2 — **extends** the channels module (adds to schemas.ts, service.ts, tools.ts files started in US1); do not start US3 until T006/T008 are complete

### Within Each User Story

- Schemas → Services → Tools (services import schemas; tools import both)
- Tests can be written in parallel with implementation (they import the same service)
- All tasks within US1 marked [P] can be worked simultaneously (separate files)
- All tasks within US2 marked [P] can be worked simultaneously

---

## Parallel Opportunities

### User Story 1 (launch simultaneously after T003)

```
T004: src/channels/schemas.ts  ─┐
T005: src/users/schemas.ts     ─┤  (parallel — different files)
T006: src/channels/service.ts  ─┤  (parallel after T004)
T007: src/users/service.ts     ─┤  (parallel after T005)
T008: src/channels/tools.ts    ─┤  (parallel after T004+T006)
T009: src/users/tools.ts       ─┤  (parallel after T005+T007)
T010: tests/channels/          ─┤  (parallel after T006)
T011: tests/users/             ─┘  (parallel after T007)
```

### User Story 2 (independent of US1 — can run in parallel with US1)

```
T012: src/messages/schemas.ts  ─┐
T013: src/messages/service.ts  ─┤  (sequential after T012)
T014: src/messages/tools.ts    ─┤  (sequential after T012+T013)
T015: tests/messages/          ─┘  (parallel after T013)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only — Workspace Discovery)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (T004–T011)
4. **STOP and VALIDATE**: `channels_list` and `users_list` work end-to-end
5. Agents can explore the workspace — this is a useful standalone increment

### Incremental Delivery

1. Phase 1 + 2 → project skeleton ready
2. Phase 3 (US1) → Discovery MVP: agents can explore the workspace
3. Phase 4 (US2) → Messaging: agents can communicate
4. Phase 5 (US3) → Management: agents can create and populate channels
5. Phase 6 → Production-ready

---

## Notes

- [P] = different files, safe to run in parallel with no conflicts
- Each module is completely self-contained; no module imports from another
- index.ts calls registerTools() from each module — that single call is the only wiring point
- US3 extends files started in US1 (channels module) — sequence T016–T019 after T008 is complete
- Commit after each task or logical group per CLAUDE.md commit rule
- All 5 tools must return `{ content: [{ type: "text", text: JSON.stringify(result) }] }` on success and `{ content: [...], isError: true }` on error
