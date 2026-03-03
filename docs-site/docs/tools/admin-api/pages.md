---
sidebar_position: 2
---

# Pages

Manage static pages with full CRUD operations. Requires `GHOST_ADMIN_API_KEY`.

## Tools

| Tool | Description |
|------|-------------|
| `admin_browse_pages` | List pages with filtering and pagination |
| `admin_read_page` | Get a single page by ID or slug |
| `admin_create_page` | Create a new page |
| `admin_update_page` | Update an existing page |
| `admin_delete_page` | Delete a page |
| `admin_copy_page` | Duplicate a page |

## admin_browse_pages

List pages with filtering and pagination.

```json
{
  "filter": "status:published",
  "limit": "all"
}
```

## admin_read_page

Get a single page by ID or slug.

```json
{
  "slug": "about"
}
```

## admin_create_page

Create a new page.

```json
{
  "title": "About Us",
  "html": "<p>Welcome to our blog...</p>",
  "status": "published"
}
```

Supports the same parameters as `admin_create_post` (title, html, status, tags, feature_image, etc.).

## admin_update_page

Update an existing page. Requires `id` and `updated_at`.

```json
{
  "id": "6abc1234def5678901234567",
  "updated_at": "2024-01-15T10:30:00.000Z",
  "title": "Updated About Us",
  "html": "<p>New content...</p>"
}
```

## admin_delete_page

Delete a page by its ID.

```json
{
  "id": "6abc1234def5678901234567"
}
```

## admin_copy_page

Duplicate a page. Creates a draft copy of the specified page.

```json
{
  "id": "6abc1234def5678901234567"
}
```
