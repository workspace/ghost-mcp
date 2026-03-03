---
sidebar_position: 6
---

# Newsletters

Manage email newsletters. Requires `GHOST_ADMIN_API_KEY`.

## Tools

| Tool | Description |
|------|-------------|
| `admin_browse_newsletters` | List all newsletters |
| `admin_read_newsletter` | Get a single newsletter by ID |
| `admin_create_newsletter` | Create a new newsletter |
| `admin_update_newsletter` | Update an existing newsletter |

## admin_browse_newsletters

List all newsletters.

```json
{
  "limit": "all"
}
```

## admin_read_newsletter

Get a single newsletter by ID.

```json
{
  "id": "6abc1234def5678901234567"
}
```

## admin_create_newsletter

Create a new newsletter.

```json
{
  "name": "Weekly Digest",
  "description": "A weekly roundup of our best content",
  "sender_name": "My Blog",
  "sender_email": "newsletter@example.com",
  "status": "active"
}
```

### Key parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | string | Newsletter name |
| `description` | string | Newsletter description |
| `sender_name` | string | From name in emails |
| `sender_email` | string | From email address |
| `status` | string | `active` or `archived` |
| `subscribe_on_signup` | boolean | Auto-subscribe new members |
| `sort_order` | number | Display order |

## admin_update_newsletter

Update an existing newsletter.

```json
{
  "id": "6abc1234def5678901234567",
  "name": "Updated Newsletter Name",
  "status": "active"
}
```
