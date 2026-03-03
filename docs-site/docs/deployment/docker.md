---
sidebar_position: 4
---

# Docker Deployment

Run Ghost MCP in a Docker container for easy deployment and isolation.

## Dockerfile

Create a `Dockerfile` in the project root:

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

## Build and Run

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

## Docker Compose

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

:::tip
Create a `.env` file alongside `docker-compose.yml` to set your environment variables without exposing them in the compose file.
:::
