---
sidebar_position: 2
---

# Getting Started

Get Ghost MCP running with Claude Desktop in under 5 minutes.

## Prerequisites

- [Node.js](https://nodejs.org/) 18 or higher
- A Ghost site with API access
- An MCP-compatible client (e.g., Claude Desktop)

## Step 1: Get Your Ghost API Keys

1. Log in to your Ghost Admin panel
2. Go to **Settings > Integrations**
3. Click **Add custom integration**
4. Give it a name (e.g., "MCP Server")
5. Copy the keys:
   - **Content API Key**: A simple string token for read-only access
   - **Admin API Key**: In `id:secret` format for full CRUD access

## Step 2: Configure Claude Desktop

Add the server to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "ghost": {
      "command": "npx",
      "args": ["-y", "@ryukimin/ghost-mcp"],
      "env": {
        "GHOST_URL": "https://your-blog.ghost.io",
        "GHOST_CONTENT_API_KEY": "your-content-api-key",
        "GHOST_ADMIN_API_KEY": "your-admin-api-key"
      }
    }
  }
}
```

## Step 3: Restart Claude Desktop

After saving the configuration, restart Claude Desktop. The Ghost MCP tools will be available in your conversation.

## Verify It Works

Ask Claude something like:

> "List the latest 5 posts from my Ghost blog"

Claude will use the `content_browse_posts` tool to fetch your posts.

## Next Steps

- [Configuration](./configuration.md) — Learn about all environment variables and transport modes
- [Content API Tools](./tools/content-api.md) — Explore read-only tools
- [Admin API Tools](./tools/admin-api/posts.md) — Explore admin tools
- [Usage Examples](./examples/content-api-examples.md) — See real-world examples
