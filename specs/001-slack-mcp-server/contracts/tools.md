# Tool Contracts: Slack MCP Server

**Date**: 2026-03-17
**Branch**: `001-slack-mcp-server`

These contracts define the exact interface exposed to LLM agents via the MCP protocol. Each tool has a name, description (shown to the agent), input schema, and output schema.

---

## channels_create

**Description**: Creates a new Slack channel. The channel name must be lowercase with no spaces.

### Input Schema

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "pattern": "^[a-z0-9_-]+$",
      "description": "Channel name: lowercase letters, numbers, hyphens, or underscores only."
    },
    "is_private": {
      "type": "boolean",
      "default": false,
      "description": "If true, creates a private channel. Defaults to public."
    }
  },
  "required": ["name"]
}
```

### Output (JSON string in MCP text content)

```json
{
  "id": "C12345678",
  "name": "incident-2024",
  "is_private": false,
  "created": 1709769600
}
```

### Error Cases

| Condition | Error Message |
|-----------|--------------|
| Name contains uppercase or spaces | Zod validation error: "Channel name must be lowercase with no spaces" |
| Channel name already exists | Slack error: name_taken |
| Bot lacks `channels:manage` scope | Slack error: missing_scope |

---

## channels_list

**Description**: Lists channels in the workspace. Archived channels are excluded by default.

### Input Schema

```json
{
  "type": "object",
  "properties": {
    "limit": {
      "type": "number",
      "default": 100,
      "minimum": 1,
      "description": "Maximum number of channels to return."
    },
    "exclude_archived": {
      "type": "boolean",
      "default": true,
      "description": "When true, archived channels are not included in results."
    }
  },
  "required": []
}
```

### Output (JSON string in MCP text content)

```json
{
  "channels": [
    {
      "id": "C12345678",
      "name": "general",
      "is_private": false,
      "num_members": 42
    }
  ]
}
```

### Error Cases

| Condition | Error Message |
|-----------|--------------|
| `limit` < 1 | Zod validation error: "limit must be at least 1" |
| Bot lacks `channels:read` scope | Slack error: missing_scope |

---

## channels_invite

**Description**: Invites one or more workspace members to a channel.

### Input Schema

```json
{
  "type": "object",
  "properties": {
    "channel_id": {
      "type": "string",
      "description": "The ID of the channel to invite users to."
    },
    "user_ids": {
      "type": "array",
      "items": { "type": "string" },
      "minItems": 1,
      "description": "List of user IDs to invite. Must contain at least one ID."
    }
  },
  "required": ["channel_id", "user_ids"]
}
```

### Output (JSON string in MCP text content)

```json
{
  "id": "C12345678",
  "name": "incident-2024",
  "num_members": 5
}
```

### Error Cases

| Condition | Error Message |
|-----------|--------------|
| `user_ids` is empty | Zod validation error: "user_ids must contain at least one user ID" |
| Invalid channel ID | Slack error: channel_not_found |
| Invalid user ID | Slack error: user_not_found |
| Bot lacks `channels:manage` scope | Slack error: missing_scope |

---

## users_list

**Description**: Lists members of the workspace.

### Input Schema

```json
{
  "type": "object",
  "properties": {
    "limit": {
      "type": "number",
      "default": 100,
      "minimum": 1,
      "description": "Maximum number of members to return."
    }
  },
  "required": []
}
```

### Output (JSON string in MCP text content)

```json
{
  "members": [
    {
      "id": "U12345678",
      "name": "jane.doe",
      "real_name": "Jane Doe",
      "email": "jane@example.com",
      "is_bot": false
    }
  ]
}
```

### Error Cases

| Condition | Error Message |
|-----------|--------------|
| `limit` < 1 | Zod validation error: "limit must be at least 1" |
| Bot lacks `users:read` scope | Slack error: missing_scope |

---

## messages_send

**Description**: Sends a message to a Slack channel. Optionally posts as a threaded reply.

### Input Schema

```json
{
  "type": "object",
  "properties": {
    "channel_id": {
      "type": "string",
      "description": "The ID of the channel to post to."
    },
    "text": {
      "type": "string",
      "minLength": 1,
      "description": "The message text to send."
    },
    "thread_ts": {
      "type": "string",
      "description": "Optional. Timestamp of a parent message. When provided, sends as a threaded reply."
    }
  },
  "required": ["channel_id", "text"]
}
```

### Output (JSON string in MCP text content)

```json
{
  "ts": "1709769600.000100",
  "channel": "C12345678",
  "text": "Hello, world!"
}
```

### Error Cases

| Condition | Error Message |
|-----------|--------------|
| `text` is empty | Zod validation error: "text must not be empty" |
| Invalid channel ID | Slack error: channel_not_found |
| Bot not a member of the channel | Slack error: not_in_channel |
| Bot lacks `chat:write` scope | Slack error: missing_scope |

---

## Required Bot Token Scopes (Summary)

The Slack App must have all of the following OAuth scopes configured before the server is deployed:

| Scope | Required By |
|-------|-------------|
| `channels:manage` | channels_create, channels_invite |
| `channels:read` | channels_list |
| `groups:write` | channels_create (private), channels_invite (private) |
| `groups:read` | channels_list (private) |
| `users:read` | users_list |
| `users:read.email` | users_list (email field) |
| `chat:write` | messages_send |
