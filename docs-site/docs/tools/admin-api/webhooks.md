---
sidebar_position: 10
---

# Webhooks

Manage webhooks for event notifications. Requires `GHOST_ADMIN_API_KEY`.

## Tools

| Tool | Description |
|------|-------------|
| `admin_create_webhook` | Create a new webhook |
| `admin_update_webhook` | Update an existing webhook |
| `admin_delete_webhook` | Delete a webhook |

## admin_create_webhook

Create a new webhook to receive event notifications.

```json
{
  "event": "post.published",
  "target_url": "https://example.com/webhook",
  "name": "Post Published Notification"
}
```

### Common events

| Event | Description |
|-------|-------------|
| `post.added` | New post created |
| `post.deleted` | Post deleted |
| `post.edited` | Post edited |
| `post.published` | Post published |
| `post.unpublished` | Post unpublished |
| `page.added` | New page created |
| `page.deleted` | Page deleted |
| `page.edited` | Page edited |
| `page.published` | Page published |
| `member.added` | New member added |
| `member.deleted` | Member deleted |
| `member.edited` | Member edited |

### Key parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `event` | string | Event name (required) |
| `target_url` | string | Webhook URL (required) |
| `name` | string | Webhook name |
| `secret` | string | Webhook secret for verification |

## admin_update_webhook

Update an existing webhook.

```json
{
  "id": "6abc1234def5678901234567",
  "target_url": "https://new-url.example.com/webhook"
}
```

## admin_delete_webhook

Delete a webhook by its ID.

```json
{
  "id": "6abc1234def5678901234567"
}
```
