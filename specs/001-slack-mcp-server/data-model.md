# Data Model: Slack Workspace Management MCP Server

**Date**: 2026-03-17
**Branch**: `001-slack-mcp-server`

This server is **stateless** — it proxies operations to Slack and transforms responses. There is no local database or persistent storage. The entities below describe the data shapes that flow through the system.

---

## Entities

### Channel

Represents a Slack workspace communication space.

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| id | string | yes | Slack-assigned, e.g. `C12345678` |
| name | string | yes | Lowercase, no spaces, ≤80 chars, regex `^[a-z0-9_-]+$` |
| is_private | boolean | yes | `false` = public channel, `true` = private channel |
| num_members | number | list only | Count of current members; absent from create response |
| created | number | create only | Unix timestamp of channel creation |

**State transitions**: A channel can be archived (read-only) or active. `channels_list` excludes archived channels by default.

**Relationships**: A channel has many members (Users). `channels_invite` links Users to a Channel.

---

### Member (User)

Represents a Slack workspace participant.

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| id | string | yes | Slack-assigned, e.g. `U12345678` |
| name | string | yes | Slack handle / username |
| real_name | string | yes | Display name |
| email | string | yes | Workspace email address |
| is_bot | boolean | yes | `true` if the user is a bot account |

**Note**: The bot account used for authentication will appear in the users list with `is_bot: true`.

---

### Message

Represents a communication unit posted to a channel.

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| ts | string | yes | Slack message timestamp, doubles as unique ID, e.g. `1609459200.000100` |
| channel | string | yes | Channel ID where the message was posted |
| text | string | yes | Message body text; must be non-empty |
| thread_ts | string | no | Parent message timestamp; when set, the message is a threaded reply |

---

## Input Schemas (per tool)

### channels_create

```
Input:
  name        string   required   regex /^[a-z0-9_-]+$/
  is_private  boolean  optional   default: false

Output:
  id          string
  name        string
  is_private  boolean
  created     number   (unix timestamp)
```

### channels_list

```
Input:
  limit             number   optional   default: 100, min: 1
  exclude_archived  boolean  optional   default: true

Output:
  channels  array of:
    id          string
    name        string
    is_private  boolean
    num_members number
```

### channels_invite

```
Input:
  channel_id  string    required
  user_ids    string[]  required   min length: 1

Output:
  id          string
  name        string
  num_members number
```

### users_list

```
Input:
  limit  number  optional  default: 100, min: 1

Output:
  members  array of:
    id        string
    name      string
    real_name string
    email     string
    is_bot    boolean
```

### messages_send

```
Input:
  channel_id  string  required
  text        string  required   min length: 1
  thread_ts   string  optional   (parent message timestamp for threading)

Output:
  ts       string   (message timestamp / ID)
  channel  string
  text     string
```

---

## Validation Rules

| Rule | Tool | Constraint |
|------|------|-----------|
| Channel name format | channels_create | Must match `^[a-z0-9_-]+$` — lowercase, no spaces, only hyphens/underscores allowed |
| User ID list non-empty | channels_invite | `user_ids` array must contain at least 1 element |
| Message text non-empty | messages_send | `text` must be a non-empty string |
| Limit minimum | channels_list, users_list | `limit` must be ≥ 1 |

All validation is enforced by Zod at the tool boundary before any Slack API call is made (FR-008).
