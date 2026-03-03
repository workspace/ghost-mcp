---
sidebar_position: 2
---

# Local Deployment (Stdio)

Stdio transport is designed for local development and direct integration with MCP clients like Claude Desktop.

## Running the Server

```bash
npm start
# or
node dist/index.js
```

The server communicates via stdin/stdout using the MCP protocol.

## Claude Desktop Configuration

Add the server to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

### Using npx (recommended)

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

### Using local installation

```json
{
  "mcpServers": {
    "ghost": {
      "command": "node",
      "args": ["/absolute/path/to/ghost-mcp/dist/index.js"],
      "env": {
        "GHOST_URL": "https://myblog.ghost.io",
        "GHOST_CONTENT_API_KEY": "your-content-api-key",
        "GHOST_ADMIN_API_KEY": "your-admin-id:your-admin-secret"
      }
    }
  }
}
```

:::tip
When using a local installation, make sure to provide the **absolute path** to `dist/index.js`.
:::
