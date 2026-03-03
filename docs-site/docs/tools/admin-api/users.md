---
sidebar_position: 8
---

# Users

Manage Ghost admin users. Requires `GHOST_ADMIN_API_KEY`.

## Tools

| Tool | Description |
|------|-------------|
| `admin_browse_users` | List all users |
| `admin_read_user` | Get a single user by ID |
| `admin_update_user` | Update an existing user |
| `admin_delete_user` | Delete a user |

## admin_browse_users

List all admin users.

```json
{
  "include": "roles",
  "limit": "all"
}
```

## admin_read_user

Get a single user by ID or slug.

```json
{
  "id": "1",
  "include": "roles"
}
```

## admin_update_user

Update a user profile.

```json
{
  "id": "1",
  "name": "Updated Name",
  "bio": "Updated biography",
  "location": "New York"
}
```

### Key parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | User ID (required) |
| `name` | string | Display name |
| `slug` | string | URL slug |
| `email` | string | Email address |
| `bio` | string | User biography |
| `location` | string | Location |
| `website` | string | Website URL |
| `profile_image` | string | Profile image URL |

## admin_delete_user

Delete a user by ID.

```json
{
  "id": "6abc1234def5678901234567"
}
```

:::warning
Deleting a user is permanent and will reassign their posts to the remaining admin.
:::
