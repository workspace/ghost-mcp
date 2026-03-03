---
sidebar_position: 3
---

# Remote Setup

Deploy Ghost MCP as a remote server using Docker Compose. Supports OAuth 2.1 for per-user Ghost configuration or shared credentials via environment variables.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose installed
- Ghost API keys (see [Getting Started](./getting-started.md#step-1-get-your-ghost-api-keys))

## Docker Compose

### 1. Create `docker-compose.yml`

```yaml
services:
  ghost-mcp:
    image: ghcr.io/workspace/ghost-mcp:latest
    container_name: ghost-mcp
    ports:
      - "${PORT:-3000}:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - GHOST_URL=${GHOST_URL:-}
      - GHOST_CONTENT_API_KEY=${GHOST_CONTENT_API_KEY:-}
      - GHOST_ADMIN_API_KEY=${GHOST_ADMIN_API_KEY:-}
      - GHOST_API_VERSION=${GHOST_API_VERSION:-v5.0}
      - MCP_AUTH=${MCP_AUTH:-}
      - GHOST_MCP_ADMIN_PASSWORD=${GHOST_MCP_ADMIN_PASSWORD:-}
      - GHOST_MCP_SECRET_KEY=${GHOST_MCP_SECRET_KEY:-}
      - GHOST_MCP_ISSUER_URL=${GHOST_MCP_ISSUER_URL:-}
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/health"]
      interval: 30s
      timeout: 5s
      start_period: 10s
      retries: 3
    restart: unless-stopped
```

### 2. Create `.env` file

```bash
# Required for shared config mode
GHOST_URL=https://your-blog.ghost.io
GHOST_CONTENT_API_KEY=your-content-api-key
GHOST_ADMIN_API_KEY=your-admin-id:your-admin-secret

# Optional
# PORT=3000
# GHOST_API_VERSION=v5.0
# MCP_AUTH=true

# Required for per-user (OAuth) mode
# GHOST_MCP_ADMIN_PASSWORD=your-admin-password
# GHOST_MCP_SECRET_KEY=<64-char-hex-string>  # Generate with: openssl rand -hex 32
```

### 3. Start the server

```bash
docker compose up -d
```

### 4. Verify

```bash
curl http://localhost:3000/health
# {"status":"ok"}
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|:--------:|---------|-------------|
| `GHOST_URL` | Conditional | — | Ghost site URL. If omitted, OAuth per-user mode is enabled |
| `GHOST_CONTENT_API_KEY` | Conditional | — | Content API key. Required when `GHOST_URL` is set |
| `GHOST_ADMIN_API_KEY` | Conditional | — | Admin API key (`id:secret`). Required when `GHOST_URL` is set |
| `GHOST_API_VERSION` | No | `v5.0` | Ghost API version |
| `PORT` | No | `3000` | HTTP server port |
| `MCP_AUTH` | No | auto | `true` / `false` to force OAuth on/off. Auto-detected if omitted |
| `GHOST_MCP_ADMIN_PASSWORD` | Conditional | — | Admin login password. Required when OAuth is enabled |
| `GHOST_MCP_SECRET_KEY` | Conditional | — | 64-char hex string for encryption. Required when OAuth is enabled. Generate with `openssl rand -hex 32` |
| `GHOST_MCP_ISSUER_URL` | No | `http://localhost:{PORT}` | OAuth issuer URL (set to your public URL in production) |
| `NODE_ENV` | No | — | Set to `production` for production deployments |

:::info Shared vs Per-user mode
- **Shared mode**: Set `GHOST_URL` + API keys. All clients use the same Ghost site.
- **Per-user mode**: Omit `GHOST_URL` (or set `MCP_AUTH=true`). OAuth is enabled. Set `GHOST_MCP_ADMIN_PASSWORD` and `GHOST_MCP_SECRET_KEY` to protect the admin settings page. Users log in with the admin password, configure Ghost credentials at `/settings`, and OAuth uses those stored credentials.
:::

## MCP Client Configuration

### Claude Custom Connectors

1. Go to **Claude Settings > Custom Connectors**
2. Add your server URL (e.g. `https://mcp.example.com`)
3. Claude handles the OAuth flow automatically

### Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "ghost": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

## Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/mcp` | POST | Initialize session or send JSON-RPC requests |
| `/mcp` | GET | Establish SSE stream for server responses |
| `/mcp` | DELETE | Terminate session |
| `/health` | GET | Health check |

Sessions are tracked via the `mcp-session-id` header.

:::note Legacy transport
The deprecated HTTP+SSE transport (`GET /sse`, `POST /messages`) is also available for backwards compatibility.
:::

## Production Deployment

For production, place a reverse proxy (Nginx/Caddy) in front with TLS termination.

```nginx
server {
    listen 443 ssl http2;
    server_name mcp.example.com;

    ssl_certificate /etc/letsencrypt/live/mcp.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mcp.example.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # SSE settings
        proxy_set_header Connection '';
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 86400s;
    }
}
```

:::warning
`proxy_buffering off` and long `proxy_read_timeout` are essential for SSE connections.
:::

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `Connection refused` | Check that the container is running: `docker compose ps` |
| `401 Unauthorized` from Ghost | Verify API key format. Admin key must be `id:secret` |
| SSE connection drops | Ensure reverse proxy has buffering disabled and long timeouts |
| Health check failing | Check logs: `docker compose logs ghost-mcp` |
