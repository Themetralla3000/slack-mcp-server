# Research: File Upload to Slack Channels

**Date**: 2026-03-17
**Branch**: `002-file-upload`

## 1. Slack Files API — v2 Upload Flow

**Decision**: Use the Slack Files v2 upload API (three-step process). The legacy `files.upload` method is deprecated as of March 2025 and will be removed.

**Three-step flow**:

### Step 1 — Get a pre-signed upload URL
```
client.files.getUploadURLExternal({
  filename: "report.pdf",   // display name in Slack
  length: 204800,           // file size in bytes (required)
})
// Returns: { upload_url: "https://...", file_id: "F12345678" }
```

### Step 2 — PUT file binary to the upload URL
```typescript
await fetch(uploadUrl, {
  method: "PUT",
  body: fileBuffer,          // Buffer from fs.readFileSync(filePath)
  headers: { "Content-Type": "application/octet-stream" },
});
```
Node.js 22 has native `fetch` — no extra HTTP library needed.

### Step 3 — Complete the upload and share to channel
```
client.files.completeUploadExternal({
  files: [{ id: fileId, title: filename }],
  channel_id: "C001",            // shares file to channel
  initial_comment: "Here is the report",  // optional
})
// Returns: { files: [{ id, name, permalink, ... }] }
```

**Rationale**: v2 API is the only supported path going forward. It separates concerns cleanly: auth (step 1), transfer (step 2), metadata (step 3).

**Alternatives considered**:
- `files.upload` (legacy): deprecated, will return errors in future — rejected.
- `files.uploadV2` helper (in newer @slack/web-api): a convenience wrapper around the three-step flow. Available in `@slack/web-api` v7.x as `client.files.uploadV2()`. See section 2.

---

## 2. @slack/web-api Convenience Method

**Decision**: Use `client.files.uploadV2()` if available in the installed version (`@slack/web-api ^7.9.2`), as it wraps the three steps automatically.

```typescript
const result = await client.files.uploadV2({
  channel_id: "C001",
  filename: "report.pdf",
  file: fileBuffer,               // Buffer or Readable stream
  initial_comment: "Here is the report",  // optional
});
// result.files[0] → { id, name, permalink }
```

**Rationale**: `uploadV2` reduces the service implementation to a single call, handles the three-step orchestration internally, and is officially supported by Slack. If the installed version does not expose `uploadV2`, fall back to the manual three-step flow.

**Checking availability**: The `uploadV2` method was introduced in `@slack/web-api` v7.3.0. Since the project pins `^7.9.2`, it is guaranteed to be available.

**Alternatives considered**:
- Manual three-step flow (section 1): correct but more code; retained as fallback reference.

---

## 3. File Reading and Filename Derivation

**Decision**: Use Node.js built-in `fs` and `path` modules. No new dependencies needed.

```typescript
import { readFileSync, existsSync } from "node:fs";
import { basename } from "node:path";

// Pre-flight check (satisfies FR-005 / SC-002)
if (!existsSync(filePath)) {
  throw new Error(`File not found: ${filePath}`);
}

const fileBuffer = readFileSync(filePath);
const derivedFilename = basename(filePath);           // "report.pdf"
const displayName = customFilename || derivedFilename; // FR-002
```

**Rationale**: `existsSync` + `readFileSync` is synchronous and simple. For files up to 10 MB (SC-001 scope), synchronous reading is appropriate and avoids stream complexity. Streams can be added later if large-file support is needed.

**Alternatives considered**:
- `fs.createReadStream`: supports large files but adds stream handling complexity — out of scope.
- `fs.promises.readFile`: async, but the service is already async — acceptable alternative.

---

## 4. MIME Type

**Decision**: Do not pass a `Content-Type` header or MIME type. Slack's `uploadV2` infers MIME from the filename. When using the manual PUT approach, use `application/octet-stream` as a safe fallback.

**Rationale**: Slack's API documentation confirms it determines file type from the filename extension. The spec assumption ("MIME type is inferred automatically") is correct. Adding a MIME library (`mime`, `mime-types`) would be an unnecessary dependency.

---

## 5. Error Handling Strategy

**Decision**: Same pattern as existing modules — catch all errors in the tool handler, return `{ isError: true, content: [{ type: "text", text: JSON.stringify({ error: message }) }] }`.

**Pre-flight errors** (FR-005, SC-002): Check file existence with `existsSync` inside the service function *before* any Slack API call. Throw a descriptive `Error` so the tool handler catches and returns it as a structured error response.

**Slack API errors**: `@slack/web-api` throws `WebAPICallError` on non-ok responses — caught by the same try/catch in the tool handler.

---

## 6. index.ts Modification

**Decision**: Add two lines to `src/index.ts`:
```typescript
import { registerTools as registerFileTools } from "./files/tools.js";
// ...
registerFileTools(server, client);
```

**Rationale**: Minimal change. All logic stays in `src/files/`. The constitution's intent (no cross-module coupling) is preserved — index.ts remains a thin wiring file.

---

## 7. Testing Strategy

**Decision**: Mock both `@slack/web-api` (WebClient) and the global `fetch` function using Vitest's `vi.stubGlobal("fetch", vi.fn())`.

```typescript
// Mock WebClient methods
const mockClient = {
  files: {
    uploadV2: vi.fn(),
  },
} as unknown as WebClient;

// Mock fetch (only needed if testing manual three-step flow)
vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
```

Unit tests focus on:
1. `uploadFile` calls `uploadV2` with correct arguments
2. `uploadFile` throws before calling Slack when file does not exist
3. Zod schema rejects missing `file_path` and missing `channel_id`
4. `uploadFile` maps the Slack response to the output schema correctly
