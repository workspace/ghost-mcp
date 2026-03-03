---
sidebar_position: 1
---

# Content API Tools

The Content API provides 8 read-only tools for browsing and reading public content from your Ghost site. These tools require the `GHOST_CONTENT_API_KEY`.

## Overview

| Tool | Description |
|------|-------------|
| `content_browse_posts` | List posts with filtering and pagination |
| `content_read_post` | Get a single post by ID or slug |
| `content_browse_pages` | List pages with filtering and pagination |
| `content_read_page` | Get a single page by ID or slug |
| `content_browse_tags` | List tags with optional post counts |
| `content_read_tag` | Get a single tag by ID or slug |
| `content_browse_authors` | List authors with optional post counts |
| `content_read_author` | Get a single author by ID or slug |

## Common Parameters

All browse tools support these parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | number \| `"all"` | Number of results per page (default: 15) |
| `page` | number | Page number for pagination |
| `filter` | string | [NQL filter](../nql-reference.md) expression |
| `order` | string | Sort order (e.g., `published_at DESC`) |
| `fields` | string | Comma-separated list of fields to return |
| `include` | string | Comma-separated list of relations to include |
| `formats` | string | Content formats: `html`, `plaintext`, or both |

All read tools support:

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Resource ID (use either `id` or `slug`) |
| `slug` | string | Resource slug (use either `id` or `slug`) |
| `include` | string | Relations to include |
| `fields` | string | Fields to return |
| `formats` | string | Content formats |

## content_browse_posts

List posts with optional filtering, pagination, and sorting.

```json
{
  "filter": "tag:tutorials+featured:true",
  "include": "tags,authors",
  "order": "published_at DESC",
  "limit": 10
}
```

### Include options
- `tags` — Include post tags
- `authors` — Include post authors

## content_read_post

Get a single post by ID or slug.

```json
{
  "slug": "welcome-to-ghost",
  "include": "tags,authors",
  "formats": "html"
}
```

## content_browse_pages

List pages. Works the same as `content_browse_posts` but for static pages.

```json
{
  "limit": "all",
  "include": "tags"
}
```

## content_read_page

Get a single page by ID or slug.

```json
{
  "slug": "about",
  "formats": "html"
}
```

## content_browse_tags

List tags with optional post counts.

```json
{
  "include": "count.posts",
  "limit": "all"
}
```

### Include options
- `count.posts` — Include the number of posts for each tag

## content_read_tag

Get a single tag by ID or slug.

```json
{
  "slug": "news",
  "include": "count.posts"
}
```

## content_browse_authors

List authors with optional post counts.

```json
{
  "include": "count.posts",
  "fields": "name,slug,bio,profile_image"
}
```

### Include options
- `count.posts` — Include the number of posts for each author

## content_read_author

Get a single author by ID or slug.

```json
{
  "slug": "john",
  "include": "count.posts"
}
```
