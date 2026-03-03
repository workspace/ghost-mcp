---
sidebar_position: 3
---

# Remote Deployment (SSE/HTTP)

SSE transport enables remote access over HTTP, suitable for shared or cloud deployments.

## Running the SSE Server

```bash
npm run start:sse
# or
node dist/sse.js
```

The server starts on port 3000 by default (configurable via `PORT` environment variable).

## Available Endpoints

The SSE server exposes two transport protocols:

### Streamable HTTP Transport (Recommended)

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

### HTTP+SSE Transport (Legacy)

Legacy transport for backwards compatibility (spec version 2024-11-05):

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/sse` | GET | Establish SSE connection (returns session ID) |
| `/messages?sessionId=<id>` | POST | Send messages to the server |

### Utility Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check (returns `{"status": "ok"}`) |
