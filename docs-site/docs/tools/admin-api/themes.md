---
sidebar_position: 13
---

# Themes

Manage site themes. Requires `GHOST_ADMIN_API_KEY`.

## Tools

| Tool | Description |
|------|-------------|
| `admin_upload_theme` | Upload a new theme |
| `admin_activate_theme` | Activate an installed theme |

## admin_upload_theme

Upload a theme zip file.

```json
{
  "file_path": "/path/to/theme.zip"
}
```

### Key parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `file_path` | string | Local path to the theme zip file (required) |

The theme will be installed but not activated. Use `admin_activate_theme` to activate it.

## admin_activate_theme

Activate an installed theme by name.

```json
{
  "name": "casper"
}
```

### Key parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | string | Theme name to activate (required) |

:::warning
Activating a theme changes the site's appearance immediately. Test themes in a staging environment first.
:::
