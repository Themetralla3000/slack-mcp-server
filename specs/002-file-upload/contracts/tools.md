# Tool Contracts: File Upload

**Date**: 2026-03-17
**Branch**: `002-file-upload`

---

## files_upload

**Description**: Uploads a file from the server's local filesystem to a Slack channel. Optionally overrides the display filename and adds an initial comment.

### Input Schema

```json
{
  "type": "object",
  "properties": {
    "file_path": {
      "type": "string",
      "minLength": 1,
      "description": "Absolute or relative path to the file on the server's filesystem."
    },
    "channel_id": {
      "type": "string",
      "minLength": 1,
      "description": "The ID of the Slack channel to upload the file to."
    },
    "filename": {
      "type": "string",
      "minLength": 1,
      "description": "Optional display name for the file in Slack. Defaults to the original filename if omitted."
    },
    "initial_comment": {
      "type": "string",
      "description": "Optional message to accompany the file in the channel."
    }
  },
  "required": ["file_path", "channel_id"]
}
```

### Output (JSON string in MCP text content)

```json
{
  "id": "F12345678",
  "name": "quarterly-report.pdf",
  "permalink": "https://myworkspace.slack.com/files/U001/F12345678/quarterly-report.pdf",
  "channel": "C001"
}
```

### Error Cases

| Condition | Error Message |
|-----------|--------------|
| `file_path` is missing or empty | Zod validation error: "file_path is required" |
| `channel_id` is missing or empty | Zod validation error: "channel_id is required" |
| File does not exist at `file_path` | Service error: "File not found: /path/to/file.pdf" |
| `filename` is an empty string | Zod validation error: "filename must not be empty if provided" |
| Bot lacks `files:write` scope | Slack error: missing_scope |
| Channel not found or bot not a member | Slack error: channel_not_found / not_in_channel |
| File exceeds Slack size limit | Slack error: file_too_large |

---

## Required Additional Bot Token Scope

| Scope | Required By |
|-------|-------------|
| `files:write` | files_upload |
