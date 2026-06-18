# Data Model: File Upload to Slack Channels

**Date**: 2026-03-17
**Branch**: `002-file-upload`

This module is **stateless** — files are read from disk, forwarded to Slack, and the result is returned immediately. No local persistence.

---

## Entities

### FileUpload (input)

Represents the agent's request to upload a file.

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| file_path | string | yes | Non-empty; file must exist on server filesystem |
| channel_id | string | yes | Non-empty Slack channel ID |
| filename | string | no | If omitted, derived from `file_path` via basename; empty string not allowed |
| initial_comment | string | no | Accompanies the file in the channel when provided |

**Derived field**: `display_name` = `filename` if provided, else `path.basename(file_path)`

---

### UploadedFile (output)

Represents the result of a successful file upload.

| Field | Type | Always present | Notes |
|-------|------|---------------|-------|
| id | string | yes | Slack file identifier, e.g. `F12345678` |
| name | string | yes | Display filename as stored in Slack |
| permalink | string | yes | Shareable URL to the file in Slack |
| channel | string | yes | Channel ID where the file was shared |

---

## Input Schema

```
files_upload input:
  file_path        string   required   min length 1
  channel_id       string   required   min length 1
  filename         string   optional   min length 1 (if provided)
  initial_comment  string   optional
```

## Output Schema

```
files_upload output:
  id         string   (Slack file ID)
  name       string   (display filename in Slack)
  permalink  string   (shareable URL)
  channel    string   (target channel ID)
```

---

## Validation Rules

| Rule | Field | Constraint |
|------|-------|-----------|
| Required path | file_path | Must be a non-empty string |
| Required channel | channel_id | Must be a non-empty string |
| Optional filename not empty | filename | If provided, must be at least 1 character |
| Pre-flight existence check | file_path | File must exist on filesystem before any Slack call is made |

All schema validation is enforced by Zod. The existence check is enforced in the service function before the Slack API call.
