# Ghost MCP

An MCP (Model Context Protocol) server for interacting with Ghost CMS blogs through AI assistants.

[![Documentation](https://img.shields.io/badge/docs-GitHub%20Pages-blue)](https://workspace.github.io/ghost-mcp/)
[![npm](https://img.shields.io/npm/v/@ryukimin/ghost-mcp)](https://www.npmjs.com/package/@ryukimin/ghost-mcp)

> **Full documentation**: [https://workspace.github.io/ghost-mcp/](https://workspace.github.io/ghost-mcp/)

## Quick Start

Add to your Claude Desktop configuration file (`claude_desktop_config.json`):

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

Config file location:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

## Features

- **Content API** (read-only): Browse and read posts, pages, tags, and authors (8 tools)
- **Admin API** (full CRUD): Create, update, and delete posts, pages, tags, members, newsletters, tiers, offers, webhooks, and more (46 tools)
- **Multiple transports**: stdio for local development, HTTP/SSE for remote deployment

## Getting API Keys

1. In Ghost Admin, go to **Settings > Integrations**
2. Create a new Custom Integration
3. Copy the **Content API Key** for read-only access
4. Copy the **Admin API Key** for full access

## Development

```bash
npm install        # Install dependencies
npm run build      # Build TypeScript
npm start          # Run stdio server
npm run start:sse  # Run HTTP/SSE server
npm test           # Run tests
npm run lint       # Lint code
```

## Documentation

- [Getting Started](https://workspace.github.io/ghost-mcp/docs/getting-started)
- [Configuration](https://workspace.github.io/ghost-mcp/docs/configuration)
- [Tools Reference](https://workspace.github.io/ghost-mcp/docs/tools/content-api)
- [Usage Examples](https://workspace.github.io/ghost-mcp/docs/examples/content-api-examples)
- [NQL Filter Reference](https://workspace.github.io/ghost-mcp/docs/nql-reference)
- [Deployment Guide](https://workspace.github.io/ghost-mcp/docs/deployment/overview)
- [Troubleshooting](https://workspace.github.io/ghost-mcp/docs/troubleshooting)

## License

ISC
