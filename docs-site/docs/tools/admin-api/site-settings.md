---
sidebar_position: 11
---

# Site & Settings

Read site information and settings. Requires `GHOST_ADMIN_API_KEY`.

## Tools

| Tool | Description |
|------|-------------|
| `admin_read_site` | Get basic site information |
| `admin_read_settings` | Get detailed site settings |

## admin_read_site

Get basic site information including title, description, and version.

```json
{}
```

Returns:
- Site title and description
- Site URL
- Ghost version
- Available features

## admin_read_settings

Get detailed site settings.

```json
{}
```

Returns comprehensive settings including:
- General settings (title, description, logo, icon)
- Content settings (posts per page, default visibility)
- Email settings (newsletter configuration)
- Membership settings (tiers, pricing)
- Navigation menus
- Code injection settings
