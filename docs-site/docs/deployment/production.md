---
sidebar_position: 7
---

# Production Considerations

Best practices for running Ghost MCP in production.

## Security

1. **HTTPS Required**: Always use HTTPS in production to protect API keys in transit
2. **Authentication**: The MCP server itself doesn't authenticate clients. Add authentication at the reverse proxy layer if needed
3. **Network Isolation**: Restrict access to the server using firewalls or VPC configuration
4. **API Key Security**: Store API keys securely using environment variables or secrets management (e.g., AWS Secrets Manager, Vault)

## Performance

1. **Connection Limits**: Each SSE connection maintains an open HTTP connection. Plan capacity accordingly
2. **Timeouts**: The default API client timeout is 30 seconds. Adjust if needed for large operations
3. **Memory**: The server is lightweight but monitor memory usage under load

## Monitoring

1. **Health Checks**: Use the `/health` endpoint for load balancer and monitoring health checks
2. **Logging**: The server logs errors to stderr. Capture and aggregate logs in production
3. **Metrics**: Consider adding application metrics for request rates, latencies, and errors

## Graceful Shutdown

The server handles SIGINT and SIGTERM signals for graceful shutdown:

- Closes the MCP server connection
- Closes all active transport sessions
- Closes the HTTP server (SSE mode)

Allow sufficient time for shutdown in deployment configurations (e.g., `terminationGracePeriodSeconds` in Kubernetes, `TimeoutStopSec` in systemd).

## Environment Variable Management

### Recommended approaches

| Method | Best for |
|--------|----------|
| Platform secrets (Railway, Render) | Cloud PaaS |
| Docker secrets | Docker Swarm |
| Kubernetes secrets | Kubernetes |
| AWS Secrets Manager / SSM | AWS |
| HashiCorp Vault | Multi-cloud |
| `.env` file (local only) | Development |

:::danger
Never commit API keys to version control. Use `.gitignore` to exclude `.env` files.
:::
