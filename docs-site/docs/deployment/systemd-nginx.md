---
sidebar_position: 5
---

# Systemd & Nginx

Run Ghost MCP as a systemd service with Nginx reverse proxy on Linux.

## Systemd Service

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

### Useful Commands

```bash
# Check status
sudo systemctl status ghost-mcp

# View logs
sudo journalctl -u ghost-mcp -f

# Restart
sudo systemctl restart ghost-mcp
```

## Reverse Proxy with Nginx

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

:::warning Important SSE Settings
The `proxy_buffering off`, `proxy_cache off`, and long `proxy_read_timeout` are essential for SSE connections to work properly.
:::
