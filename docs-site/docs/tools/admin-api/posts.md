---
sidebar_position: 1
---

# Posts

Manage posts with full CRUD operations. Requires `GHOST_ADMIN_API_KEY`.

## Tools

| Tool | Description |
|------|-------------|
| `admin_browse_posts` | List posts with filtering and pagination |
| `admin_read_post` | Get a single post by ID or slug |
| `admin_create_post` | Create a new post |
| `admin_update_post` | Update an existing post |
| `admin_delete_post` | Delete a post |
| `admin_copy_post` | Duplicate a post |

## admin_browse_posts

List posts with filtering, pagination, and sorting.

```json
{
  "filter": "status:draft",
  "limit": 10,
  "order": "updated_at DESC"
}
```

Supports the same parameters as `content_browse_posts`, plus access to draft and scheduled posts.

## admin_read_post

Get a single post by ID or slug.

```json
{
  "slug": "my-post-slug"
}
```

## admin_create_post

Create a new post. Use `status` to control publication state.

### Create a draft

```json
{
  "title": "My New Blog Post",
  "html": "<p>This is the content of my blog post.</p>",
  "status": "draft"
}
```

### Create a published post with full metadata

```json
{
  "title": "Complete Guide to Ghost CMS",
  "html": "<p>Ghost is a powerful open source publishing platform...</p>",
  "status": "published",
  "featured": true,
  "tags": [{ "name": "Tutorials" }, { "slug": "ghost" }],
  "authors": [{ "email": "author@example.com" }],
  "custom_excerpt": "Learn everything about Ghost CMS",
  "meta_title": "Ghost CMS Guide | My Blog",
  "meta_description": "A comprehensive guide to using Ghost CMS.",
  "feature_image": "https://example.com/images/ghost-guide.jpg"
}
```

### Create a members-only post

```json
{
  "title": "Premium Content for Members",
  "html": "<p>Exclusive content for paying subscribers.</p>",
  "status": "published",
  "visibility": "paid"
}
```

### Key parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `title` | string | Post title |
| `html` | string | Post content in HTML |
| `status` | string | `draft`, `published`, or `scheduled` |
| `featured` | boolean | Whether the post is featured |
| `visibility` | string | `public`, `members`, `paid`, or `tiers` |
| `tags` | array | Tags by name or slug |
| `authors` | array | Authors by email or ID |
| `feature_image` | string | URL of the feature image |
| `custom_excerpt` | string | Custom excerpt |
| `meta_title` | string | SEO title |
| `meta_description` | string | SEO description |
| `published_at` | string | Publication date (for scheduling) |

## admin_update_post

Update an existing post. Requires `id` and `updated_at` for conflict prevention.

```json
{
  "id": "5ddc9141c35e7700383b2937",
  "updated_at": "2024-01-15T10:30:00.000Z",
  "title": "Updated Title",
  "html": "<p>Updated content goes here.</p>",
  "status": "published"
}
```

:::warning
The `updated_at` field must match the current value from the post. This prevents accidental overwrites if someone else modified the post.
:::

## admin_delete_post

Delete a post by its ID.

```json
{
  "id": "5ddc9141c35e7700383b2937"
}
```

## admin_copy_post

Duplicate a post. Creates a draft copy of the specified post.

```json
{
  "id": "5ddc9141c35e7700383b2937"
}
```
