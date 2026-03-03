---
sidebar_position: 7
---

# Troubleshooting

Common issues and solutions when using Ghost MCP.

## "GHOST_URL is required"

Ensure the `GHOST_URL` environment variable is set:

```bash
export GHOST_URL="https://myblog.ghost.io"
```

Or in your Claude Desktop config:

```json
{
  "env": {
    "GHOST_URL": "https://myblog.ghost.io"
  }
}
```

## "Admin API key is required" / "Content API key is required"

Set the appropriate API key for the tools you want to use:

```bash
export GHOST_ADMIN_API_KEY="id:secret"
export GHOST_CONTENT_API_KEY="your-key"
```

## Connection Refused

1. Verify Ghost is running and accessible from the server
2. Check the `GHOST_URL` doesn't have a trailing slash
3. Ensure network connectivity between the MCP server and Ghost

## 401 Unauthorized from Ghost API

1. Verify the API key is correct and hasn't been regenerated
2. For Admin API, ensure the key is in `id:secret` format
3. Check the integration still exists in Ghost Admin

## SSE Connection Drops

1. Ensure your reverse proxy has adequate timeout settings
2. Check for proxy buffering (should be disabled for SSE)
3. Verify no intermediate proxies are interfering
4. See the [Nginx configuration](./deployment/systemd-nginx.md#reverse-proxy-with-nginx) for proper SSE settings

## Debug Mode

For verbose logging during development:

```bash
DEBUG=* npm start
```

## Testing the Server

### Health check (SSE mode)

```bash
curl http://localhost:3000/health
# {"status":"ok"}
```

### Test SSE connection (legacy protocol)

```bash
curl -N http://localhost:3000/sse
```

### Test Streamable HTTP (initialize)

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}'
```

## Still Need Help?

- [GitHub Issues](https://github.com/workspace/ghost-mcp/issues) — Report bugs or request features
- Check the [Deployment Guide](./deployment/overview.md) for deployment-specific issues
