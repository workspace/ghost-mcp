---
sidebar_position: 9
---

# Roles & Invites

Manage user roles and send invitations. Requires `GHOST_ADMIN_API_KEY`.

## Tools

| Tool | Description |
|------|-------------|
| `admin_browse_roles` | List all available roles |
| `admin_create_invite` | Send an invitation to a new user |

## admin_browse_roles

List all available roles in the system.

```json
{}
```

Returns roles such as:
- **Owner** — Full control over the site
- **Administrator** — Full access to settings and content
- **Editor** — Can manage and publish content
- **Author** — Can create and edit their own content
- **Contributor** — Can create drafts but not publish

## admin_create_invite

Send an invitation email to a new user.

```json
{
  "email": "newauthor@example.com",
  "role_id": "role-id-here"
}
```

### Key parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `email` | string | Email address to invite (required) |
| `role_id` | string | Role ID to assign (required) |

:::tip
Use `admin_browse_roles` first to get the available role IDs, then pass the desired role ID when creating an invite.
:::
