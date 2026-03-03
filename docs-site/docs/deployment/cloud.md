---
sidebar_position: 6
---

# Cloud Deployment

Deploy Ghost MCP to cloud platforms.

## Railway / Render / Fly.io

These platforms auto-detect Node.js applications. Configure:

1. Set the start command: `npm run start:sse`
2. Add environment variables in the platform dashboard:
   - `GHOST_URL`
   - `GHOST_CONTENT_API_KEY`
   - `GHOST_ADMIN_API_KEY`
3. Expose port 3000 (or set `PORT` to match the platform's expected port)

### Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Deploy
railway login
railway init
railway up
```

### Render

Create a `render.yaml`:

```yaml
services:
  - type: web
    name: ghost-mcp
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm run start:sse
    envVars:
      - key: GHOST_URL
        sync: false
      - key: GHOST_CONTENT_API_KEY
        sync: false
      - key: GHOST_ADMIN_API_KEY
        sync: false
```

### Fly.io

```bash
# Install Fly CLI and deploy
fly launch
fly secrets set GHOST_URL="https://myblog.ghost.io"
fly secrets set GHOST_CONTENT_API_KEY="your-key"
fly secrets set GHOST_ADMIN_API_KEY="your-id:your-secret"
fly deploy
```

## Serverless Platforms

### AWS Lambda / Google Cloud Functions

:::caution
The SSE transport is **not suitable** for serverless platforms due to long-lived connections. Consider:

- Using the stdio transport with a wrapper
- Running a persistent container (ECS, Cloud Run) instead
- Using AWS Fargate or Google Cloud Run for container-based deployment
:::

### AWS ECS / Google Cloud Run

These container-based platforms work well with Ghost MCP:

1. Build and push a Docker image (see [Docker deployment](./docker.md))
2. Configure the service with environment variables
3. Ensure the service allows long-lived HTTP connections for SSE
