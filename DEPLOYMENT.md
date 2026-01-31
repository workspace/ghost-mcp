# Deployment Guide

This guide covers deploying the Ghost MCP server in both local (stdio) and remote (SSE/HTTP) modes.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Building the Server](#building-the-server)
- [Configuration](#configuration)
- [Local Deployment (Stdio)](#local-deployment-stdio)
- [Remote Deployment (SSE/HTTP)](#remote-deployment-ssehttp)
- [Production Considerations](#production-considerations)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- Node.js 18 or higher
- npm 9 or higher
- A Ghost site with API access configured
- API keys from Ghost Admin (see [Getting API Keys](#getting-api-keys))

### Getting API Keys

1. Log in to your Ghost Admin panel
2. Go to **Settings > Integrations**
3. Click **Add custom integration**
4. Give it a name (e.g., "MCP Server")
5. Copy the keys:
   - **Content API Key**: A simple string token for read-only access
   - **Admin API Key**: In `id:secret` format for full CRUD access

## Building the Server

```bash
# Clone the repository
git clone <repository-url>
cd ghost-mcp

# Install dependencies
npm install

# Build the TypeScript source
npm run build
```

This compiles the TypeScript source to JavaScript in the `dist/` directory.

## Configuration

The server is configured via environment variables:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GHOST_URL` | Yes | — | Your Ghost site URL (e.g., `https://myblog.ghost.io`) |
| `GHOST_CONTENT_API_KEY` | For Content API | — | Content API key for read-only operations |
| `GHOST_ADMIN_API_KEY` | For Admin API | — | Admin API key in `id:secret` format |
| `GHOST_API_VERSION` | No | `v5.0` | Ghost API version |
| `PORT` | No (SSE only) | `3000` | HTTP server port for SSE mode |

### Environment Variable Setup

Create a `.env` file or export variables in your shell:

```bash
export GHOST_URL="https://myblog.ghost.io"
export GHOST_CONTENT_API_KEY="your-content-api-key"
export GHOST_ADMIN_API_KEY="your-admin-id:your-admin-secret"
```

**Security Note**: The Admin API key secret is hex-encoded. Keep it secure and never commit it to version control.

## Local Deployment (Stdio)

Stdio transport is designed for local development and direct integration with MCP clients like Claude Desktop.

### Running the Stdio Server

```bash
npm start
```

Or directly:

```bash
node dist/index.js
```

The server communicates via stdin/stdout using the MCP protocol.

### Claude Desktop Configuration

Add the server to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

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

### Using with npx (if published)

If the package is published to npm:

```json
{
  "mcpServers": {
    "ghost": {
      "command": "npx",
      "args": ["ghost-mcp"],
      "env": {
        "GHOST_URL": "https://myblog.ghost.io",
        "GHOST_CONTENT_API_KEY": "your-content-api-key",
        "GHOST_ADMIN_API_KEY": "your-admin-id:your-admin-secret"
      }
    }
  }
}
```

## Remote Deployment (SSE/HTTP)

SSE transport enables remote access over HTTP, suitable for shared or cloud deployments.

### Running the SSE Server

```bash
npm run start:sse
```

Or directly:

```bash
node dist/sse.js
```

The server starts on port 3000 by default (configurable via `PORT` environment variable).

### Available Endpoints

The SSE server exposes two transport protocols:

#### Streamable HTTP Transport (Recommended)

The modern MCP transport protocol (spec version 2025-03-26):

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/mcp` | POST | Initialize session or send requests |
| `/mcp` | GET | Establish SSE stream for responses |
| `/mcp` | DELETE | Terminate session |

**Session Management**: Sessions are tracked via the `mcp-session-id` header.

**Workflow**:
1. POST to `/mcp` with an initialize request (no session ID)
2. Server responds with `mcp-session-id` header
3. GET to `/mcp` with session ID to establish SSE stream
4. POST to `/mcp` with session ID to send requests
5. DELETE to `/mcp` with session ID to terminate

#### HTTP+SSE Transport (Deprecated)

Legacy transport for backwards compatibility (spec version 2024-11-05):

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/sse` | GET | Establish SSE connection (returns session ID) |
| `/messages?sessionId=<id>` | POST | Send messages to the server |

#### Utility Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check (returns `{"status": "ok"}`) |

### Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "dist/sse.js"]
```

Build and run:

```bash
# Build the image
docker build -t ghost-mcp .

# Run the container
docker run -d \
  -p 3000:3000 \
  -e GHOST_URL="https://myblog.ghost.io" \
  -e GHOST_CONTENT_API_KEY="your-content-api-key" \
  -e GHOST_ADMIN_API_KEY="your-admin-id:your-admin-secret" \
  --name ghost-mcp \
  ghost-mcp
```

### Docker Compose

Create a `docker-compose.yml`:

```yaml
version: '3.8'

services:
  ghost-mcp:
    build: .
    ports:
      - "3000:3000"
    environment:
      - GHOST_URL=${GHOST_URL}
      - GHOST_CONTENT_API_KEY=${GHOST_CONTENT_API_KEY}
      - GHOST_ADMIN_API_KEY=${GHOST_ADMIN_API_KEY}
      - PORT=3000
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

Run with:

```bash
docker-compose up -d
```

### Systemd Service (Linux)

Create `/etc/systemd/system/ghost-mcp.service`:

```ini
[Unit]
Description=Ghost MCP Server
After=network.target

[Service]
Type=simple
User=ghost-mcp
WorkingDirectory=/opt/ghost-mcp
ExecStart=/usr/bin/node /opt/ghost-mcp/dist/sse.js
Restart=on-failure
RestartSec=10

Environment=NODE_ENV=production
Environment=PORT=3000
Environment=GHOST_URL=https://myblog.ghost.io
Environment=GHOST_CONTENT_API_KEY=your-content-api-key
Environment=GHOST_ADMIN_API_KEY=your-admin-id:your-admin-secret

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable ghost-mcp
sudo systemctl start ghost-mcp
```

### Reverse Proxy with Nginx

For production, run behind a reverse proxy with HTTPS:

```nginx
upstream ghost_mcp {
    server 127.0.0.1:3000;
}

server {
    listen 443 ssl http2;
    server_name mcp.example.com;

    ssl_certificate /etc/letsencrypt/live/mcp.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mcp.example.com/privkey.pem;

    location / {
        proxy_pass http://ghost_mcp;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # SSE-specific settings
        proxy_set_header Connection '';
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 86400s;
    }
}
```

### Cloud Deployment

#### Railway / Render / Fly.io

These platforms auto-detect Node.js applications. Configure:

1. Set the start command: `npm run start:sse`
2. Add environment variables in the platform dashboard
3. Expose port 3000 (or set `PORT` to match the platform's expected port)

#### AWS Lambda / Google Cloud Functions

For serverless deployment, the SSE transport is not suitable due to long-lived connections. Consider using the stdio transport with a wrapper or a custom solution.

## Production Considerations

### Security

1. **HTTPS Required**: Always use HTTPS in production to protect API keys in transit
2. **Authentication**: The MCP server itself doesn't authenticate clients. Add authentication at the reverse proxy layer if needed
3. **Network Isolation**: Restrict access to the server using firewalls or VPC configuration
4. **API Key Security**: Store API keys securely using environment variables or secrets management

### Performance

1. **Connection Limits**: Each SSE connection maintains an open HTTP connection. Plan capacity accordingly
2. **Timeouts**: The default API client timeout is 30 seconds. Adjust if needed for large operations
3. **Memory**: The server is lightweight but monitor memory usage under load

### Monitoring

1. **Health Checks**: Use the `/health` endpoint for load balancer and monitoring health checks
2. **Logging**: The server logs errors to stderr. Capture and aggregate logs in production
3. **Metrics**: Consider adding application metrics for request rates, latencies, and errors

### Graceful Shutdown

The server handles SIGINT and SIGTERM signals for graceful shutdown:
- Closes the MCP server connection
- Closes all active transport sessions
- Closes the HTTP server (SSE mode)

Allow sufficient time for shutdown in deployment configurations.

## Troubleshooting

### Common Issues

#### "GHOST_URL is required"

Ensure the `GHOST_URL` environment variable is set:

```bash
export GHOST_URL="https://myblog.ghost.io"
```

#### "Admin API key is required" / "Content API key is required"

Set the appropriate API key for the tools you want to use:

```bash
export GHOST_ADMIN_API_KEY="id:secret"
export GHOST_CONTENT_API_KEY="your-key"
```

#### Connection Refused

1. Verify Ghost is running and accessible from the server
2. Check the `GHOST_URL` doesn't have a trailing slash
3. Ensure network connectivity between the MCP server and Ghost

#### 401 Unauthorized from Ghost API

1. Verify the API key is correct and hasn't been regenerated
2. For Admin API, ensure the key is in `id:secret` format
3. Check the integration still exists in Ghost Admin

#### SSE Connection Drops

1. Ensure your reverse proxy has adequate timeout settings
2. Check for proxy buffering (should be disabled for SSE)
3. Verify no intermediate proxies are interfering

### Debug Mode

For verbose logging during development:

```bash
DEBUG=* npm start
```

### Testing the Server

Test the health endpoint:

```bash
curl http://localhost:3000/health
# {"status":"ok"}
```

Test SSE connection (legacy protocol):

```bash
curl -N http://localhost:3000/sse
```

Test Streamable HTTP (initialize):

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}'
```
