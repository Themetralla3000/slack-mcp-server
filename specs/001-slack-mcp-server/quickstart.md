# Quickstart: Slack MCP Server

**Branch**: `001-slack-mcp-server`

## Prerequisites

- Node.js 22 LTS
- A Slack workspace where you have admin rights to install a bot app
- A Slack Bot Token (`xoxb-...`) with the required scopes

## 1. Create a Slack App and configure scopes

1. Go to [api.slack.com/apps](https://api.slack.com/apps) and create a new app ("From scratch").
2. Under **OAuth & Permissions → Scopes → Bot Token Scopes**, add:
   - `channels:manage`
   - `channels:read`
   - `groups:write`
   - `groups:read`
   - `users:read`
   - `users:read.email`
   - `chat:write`
3. Click **Install to Workspace** and copy the **Bot User OAuth Token** (`xoxb-...`).

## 2. Clone and install

```bash
git clone <repo-url>
cd mcp-slack
npm install
```

## 3. Configure environment

```bash
cp .env.example .env
# Edit .env and set SLACK_BOT_TOKEN=xoxb-your-token-here
```

`.env.example`:
```
SLACK_BOT_TOKEN=xoxb-your-token-here
# LOG_LEVEL=info   # Optional: debug | info | warn | error
```

## 4. Build

```bash
npm run build
```

## 5. Run

```bash
node dist/index.js
```

The server starts on stdio. It prints nothing to stdout on success (stdout is reserved for MCP protocol messages). Any startup errors are written to stderr.

## 6. Connect from an MCP client

Add to your MCP client configuration (example for Claude Desktop):

```json
{
  "mcpServers": {
    "slack": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-slack/dist/index.js"],
      "env": {
        "SLACK_BOT_TOKEN": "xoxb-your-token-here"
      }
    }
  }
}
```

## 7. Run tests

```bash
npm test
```

Tests use mocked Slack API responses — no real workspace connection required.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Server exits immediately with "SLACK_BOT_TOKEN is required" | Token env var not set | Set `SLACK_BOT_TOKEN` in `.env` or shell |
| Tool returns `missing_scope` | Bot app missing OAuth scope | Add the scope in Slack App settings and reinstall |
| Tool returns `channel_not_found` | Wrong channel ID | Use `channels_list` to retrieve valid IDs |
| Tool returns `not_in_channel` | Bot not added to channel | Invite the bot to the channel first |
