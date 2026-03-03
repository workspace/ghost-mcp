---
sidebar_position: 1
slug: /intro
---

# Ghost MCP

An [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) server for interacting with [Ghost CMS](https://ghost.org/) through AI assistants like Claude.

## Features

- **54 Tools** — 8 Content API (read-only) + 46 Admin API (full CRUD) tools
- **Dual Transport** — Local stdio or remote Streamable HTTP deployment
- **OAuth 2.1** — Secure per-user authentication for remote mode
- **NQL Filters** — Full support for Ghost's query language

## Quick Install

```bash
# Local mode (stdio)
npx @ryukimin/ghost-mcp

# Remote mode (Docker)
docker pull ghcr.io/workspace/ghost-mcp:latest
```

## Quick Links

- [Getting Started](./getting-started.md) — Local setup with Claude Desktop / Cursor
- [Remote Setup](./remote-setup.md) — Docker Compose deployment for remote access
- [Tools Reference](./tools/content-api.md) — Browse all available tools
- [Usage Examples](./examples/content-api-examples.md) — Real-world usage patterns
