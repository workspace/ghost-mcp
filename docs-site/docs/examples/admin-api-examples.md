---
sidebar_position: 2
---

# Admin API Examples

Real-world examples for the Admin API tools.

## Posts

### Create a draft post

```json title="admin_create_post"
{
  "title": "My New Blog Post",
  "html": "<p>This is the content of my blog post.</p>",
  "status": "draft"
}
```

### Create a published post with full metadata

```json title="admin_create_post"
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

```json title="admin_create_post"
{
  "title": "Premium Content for Members",
  "html": "<p>Exclusive content for paying subscribers.</p>",
  "status": "published",
  "visibility": "paid"
}
```

### Update an existing post

Requires `id` and `updated_at` for conflict prevention.

```json title="admin_update_post"
{
  "id": "5ddc9141c35e7700383b2937",
  "updated_at": "2024-01-15T10:30:00.000Z",
  "title": "Updated Title",
  "html": "<p>Updated content goes here.</p>",
  "status": "published"
}
```

:::warning
The `updated_at` field must match the current value from the post to prevent accidental overwrites.
:::

### Delete a post

```json title="admin_delete_post"
{
  "id": "5ddc9141c35e7700383b2937"
}
```

## Members

### Create a basic member

```json title="admin_create_member"
{
  "email": "newmember@example.com"
}
```

### Create a member with full details

```json title="admin_create_member"
{
  "email": "vip@example.com",
  "name": "John Smith",
  "note": "VIP customer - premium support",
  "subscribed": true,
  "labels": [{ "name": "VIP" }, { "name": "Early Adopter" }],
  "comped": true
}
```

### Browse paid members

```json title="admin_browse_members"
{
  "filter": "status:paid",
  "include": "labels,newsletters",
  "order": "created_at DESC"
}
```

## Tags

### Create a basic tag

```json title="admin_create_tag"
{
  "name": "Technology"
}
```

### Create a tag with metadata

```json title="admin_create_tag"
{
  "name": "JavaScript",
  "slug": "javascript",
  "description": "Posts about JavaScript programming",
  "accent_color": "#f7df1e",
  "meta_title": "JavaScript Articles | My Blog",
  "meta_description": "Learn JavaScript with our tutorials and guides"
}
```

### Create an internal tag

Internal tags (prefixed with `#`) are not visible on the frontend.

```json title="admin_create_tag"
{
  "name": "#internal-review",
  "visibility": "internal"
}
```

## Images

### Upload an image

```json title="admin_upload_image"
{
  "file_path": "/path/to/image.jpg",
  "purpose": "image"
}
```

### Upload a profile image

```json title="admin_upload_image"
{
  "file_path": "/path/to/avatar.png",
  "purpose": "profile_image",
  "ref": "user-123-avatar"
}
```
