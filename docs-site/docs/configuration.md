---
sidebar_position: 3
---

# Configuration

Ghost MCP is configured via environment variables. This page covers all available options and transport modes.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GHOST_URL` | Yes | — | Your Ghost site URL (e.g., `https://myblog.ghost.io`) |
| `GHOST_CONTENT_API_KEY` | For Content API | — | Content API key for read-only operations |
| `GHOST_ADMIN_API_KEY` | For Admin API | — | Admin API key in `id:secret` format |
| `GHOST_API_VERSION` | No | `v5.0` | Ghost API version |
| `PORT` | No (SSE only) | `3000` | HTTP server port for SSE mode |

### Setting Environment Variables

You can set environment variables in several ways:

**In Claude Desktop config** (recommended for local use):

```json
{
  "mcpServers": {
    "ghost": {
      "command": "npx",
      "args": ["-y", "@ryukimin/ghost-mcp"],
      "env": {
        "GHOST_URL": "https://myblog.ghost.io",
        "GHOST_CONTENT_API_KEY": "your-content-api-key",
        "GHOST_ADMIN_API_KEY": "your-admin-id:your-admin-secret"
      }
    }
  }
}
```

**Via shell export** (for development or remote deployment):

```bash
export GHOST_URL="https://myblog.ghost.io"
export GHOST_CONTENT_API_KEY="your-content-api-key"
export GHOST_ADMIN_API_KEY="your-admin-id:your-admin-secret"
```

:::caution Security Note
The Admin API key secret is hex-encoded. Keep it secure and never commit it to version control.
:::

## Transport Modes

Ghost MCP supports two transport modes:

### Stdio Transport (Local)

The default transport mode, designed for local development and direct integration with MCP clients.

```bash
npm start
# or
node dist/index.js
```

The server communicates via stdin/stdout using the MCP protocol.

### HTTP/SSE Transport (Remote)

Enables remote access over HTTP, suitable for shared or cloud deployments.

```bash
npm run start:sse
# or
node dist/sse.js
```

The server starts on port 3000 by default (configurable via `PORT`).

See the [Remote SSE Deployment](./deployment/remote-sse.md) guide for details on endpoints and session management.

## API Key Scopes

You only need the API keys for the features you want to use:

| Use Case | Required Keys |
|----------|--------------|
| Read-only (browse posts, pages, etc.) | `GHOST_CONTENT_API_KEY` |
| Full management (create, update, delete) | `GHOST_ADMIN_API_KEY` |
| Both read and write | Both keys |

:::tip
If you only provide the Content API key, only the 8 Content API tools will be available. Admin API tools require the Admin API key.
:::
