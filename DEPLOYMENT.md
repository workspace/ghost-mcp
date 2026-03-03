# Deployment Guide

> **Full documentation**: [https://workspace.github.io/ghost-mcp/docs/remote-setup](https://workspace.github.io/ghost-mcp/docs/remote-setup)

## Quick Start

### Local (stdio)

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

### Remote (Docker Compose)

```bash
# 1. Create .env file with your Ghost credentials
cat > .env << 'EOF'
GHOST_URL=https://your-blog.ghost.io
GHOST_CONTENT_API_KEY=your-content-api-key
GHOST_ADMIN_API_KEY=your-admin-id:your-admin-secret
EOF

# 2. Start the server
docker compose up -d

# 3. Verify
curl http://localhost:3000/health
```

## Environment Variables

### Local Mode (stdio)

| Variable | Required | Default | Description |
|----------|:--------:|---------|-------------|
| `GHOST_URL` | **Yes** | — | Ghost site URL |
| `GHOST_CONTENT_API_KEY` | Conditional | — | Content API key for read-only tools |
| `GHOST_ADMIN_API_KEY` | Conditional | — | Admin API key (`id:secret`) for admin tools |
| `GHOST_API_VERSION` | No | `v5.0` | Ghost API version |

### Remote Mode (Docker Compose)

| Variable | Required | Default | Description |
|----------|:--------:|---------|-------------|
| `GHOST_URL` | No | — | If omitted, OAuth per-user mode is enabled |
| `GHOST_CONTENT_API_KEY` | No | — | Required when `GHOST_URL` is set |
| `GHOST_ADMIN_API_KEY` | No | — | Required when `GHOST_URL` is set |
| `GHOST_API_VERSION` | No | `v5.0` | Ghost API version |
| `PORT` | No | `3000` | HTTP server port |
| `MCP_AUTH` | No | auto | `true`/`false` to force OAuth on/off |
| `GHOST_MCP_ADMIN_PASSWORD` | Conditional | — | Admin login password. Required when OAuth is enabled |
| `GHOST_MCP_SECRET_KEY` | Conditional | — | 64-char hex string for encryption. Required when OAuth is enabled |
| `GHOST_MCP_ISSUER_URL` | No | `http://localhost:{PORT}` | OAuth issuer URL |
| `NODE_ENV` | No | — | Set to `production` for production |
