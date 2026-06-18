# Slack MCP Server

A Model Context Protocol (MCP) server for Slack workspace integration. This server allows AI assistants to interact directly with your Slack workspace, providing tools to manage channels, send messages, list users, and upload files.

Built with TypeScript and utilizing the official Slack Web API.

---

## Available Modules & Tools

### Channels
Manage workspace channels and memberships.
* `channels_create`: Creates a new Slack channel (supports public and private).
* `channels_list`: Lists channels in the workspace. Archived channels are excluded by default.
* `channels_invite`: Invites one or more workspace members to a channel.

### Messages
Send communications to channels or threads.
* `messages_send`: Sends a message to a Slack channel. Optionally posts as a threaded reply by providing `thread_ts`.

### Users
Retrieve workspace member information.
* `users_list`: Lists members of the workspace.

### Files
Share files from the local filesystem to Slack.
* `files_upload`: Uploads a file from the server filesystem to a Slack channel. Optionally overrides the display filename and adds an initial comment.

---

## Setup & Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/ArnauEncina/slack-mcp-server.git
   cd slack-mcp-server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create an environment file (`.env`):
   ```bash
   echo "SLACK_BOT_TOKEN=xoxb-your-bot-token" > .env
   ```
4. Build the project:
   ```bash
   npm run build
   ```

## Configuration

You must provide a valid Slack Bot Token (`xoxb-...`). To get one, you need to create a Slack App in your workspace and assign it the necessary OAuth scopes:

* `channels:manage`, `channels:read`, `channels:join` (for Channels)
* `chat:write` (for Messages)
* `users:read`, `users:read.email` (for Users)
* `files:write` (for Files)

## Usage with Claude Desktop / Cursor

To use this MCP with Claude Desktop or Cursor, add the following configuration to your MCP config file (e.g., `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "slack": {
      "command": "node",
      "args": ["/absolute/path/to/slack-mcp-server/dist/index.js"],
      "env": {
        "SLACK_BOT_TOKEN": "xoxb-your-bot-token"
      }
    }
  }
}
```

## License

MIT License
