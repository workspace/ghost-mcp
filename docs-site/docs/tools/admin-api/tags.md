---
sidebar_position: 3
---

# Tags

Manage tags for organizing content. Requires `GHOST_ADMIN_API_KEY`.

## Tools

| Tool | Description |
|------|-------------|
| `admin_browse_tags` | List tags with filtering and pagination |
| `admin_read_tag` | Get a single tag by ID or slug |
| `admin_create_tag` | Create a new tag |
| `admin_update_tag` | Update an existing tag |
| `admin_delete_tag` | Delete a tag |

## admin_browse_tags

List tags with filtering and pagination.

```json
{
  "include": "count.posts",
  "limit": "all"
}
```

## admin_read_tag

Get a single tag by ID or slug.

```json
{
  "slug": "javascript"
}
```

## admin_create_tag

Create a new tag.

### Basic tag

```json
{
  "name": "Technology"
}
```

### Tag with metadata

```json
{
  "name": "JavaScript",
  "slug": "javascript",
  "description": "Posts about JavaScript programming",
  "accent_color": "#f7df1e",
  "meta_title": "JavaScript Articles | My Blog",
  "meta_description": "Learn JavaScript with our tutorials and guides"
}
```

### Internal tag

Internal tags (prefixed with `#`) are not visible on the frontend.

```json
{
  "name": "#internal-review",
  "visibility": "internal"
}
```

### Key parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | string | Tag name (prefix with `#` for internal tags) |
| `slug` | string | URL slug |
| `description` | string | Tag description |
| `visibility` | string | `public` or `internal` |
| `accent_color` | string | Hex color code |
| `feature_image` | string | Feature image URL |
| `meta_title` | string | SEO title |
| `meta_description` | string | SEO description |

## admin_update_tag

Update an existing tag. Requires `id`.

```json
{
  "id": "5ddc9141c35e7700383b2937",
  "name": "Updated Tag Name",
  "accent_color": "#ff0000"
}
```

## admin_delete_tag

Delete a tag by its ID.

```json
{
  "id": "5ddc9141c35e7700383b2937"
}
```
