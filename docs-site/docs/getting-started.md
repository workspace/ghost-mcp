---
sidebar_position: 2
---

# Getting Started

Set up Ghost MCP locally with Claude Desktop or Cursor.

## Prerequisites

- [Node.js](https://nodejs.org/) 18 or higher
- A Ghost site with API access
- An MCP-compatible client (Claude Desktop, Cursor, etc.)

## Step 1: Get Your Ghost API Keys

1. Log in to your Ghost Admin panel
2. Go to **Settings > Integrations**
3. Click **Add custom integration**
4. Copy the keys:
   - **Content API Key** — read-only access
   - **Admin API Key** — full CRUD access (`id:secret` format)

## Step 2: Configure Your MCP Client

### Claude Desktop

Add to your `claude_desktop_config.json`:

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
        "GHOST_ADMIN_API_KEY": "your-admin-id:your-admin-secret"
      }
    }
  }
}
```

### Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "ghost": {
      "command": "npx",
      "args": ["-y", "@ryukimin/ghost-mcp"],
      "env": {
        "GHOST_URL": "https://your-blog.ghost.io",
        "GHOST_CONTENT_API_KEY": "your-content-api-key",
        "GHOST_ADMIN_API_KEY": "your-admin-id:your-admin-secret"
      }
    }
  }
}
```

## Step 3: Verify

Restart your client, then ask:

> "List the latest 5 posts from my Ghost blog"

Claude will use the `content_browse_posts` tool to fetch your posts.

## Environment Variables

| Variable | Required | Default | Description |
|----------|:--------:|---------|-------------|
| `GHOST_URL` | **Yes** | — | Ghost site URL (e.g. `https://myblog.ghost.io`) |
| `GHOST_CONTENT_API_KEY` | Conditional | — | Content API key for read-only tools |
| `GHOST_ADMIN_API_KEY` | Conditional | — | Admin API key (`id:secret` format) for admin tools |
| `GHOST_API_VERSION` | No | `v5.0` | Ghost API version |

:::info
At least one of `GHOST_CONTENT_API_KEY` or `GHOST_ADMIN_API_KEY` is required. Provide both for full functionality (54 tools).
:::

## Next Steps

- [Remote Setup](./remote-setup.md) — Deploy as a remote server with Docker
- [Tools Reference](./tools/content-api.md) — Explore all available tools
- [Usage Examples](./examples/content-api-examples.md) — Real-world usage patterns
