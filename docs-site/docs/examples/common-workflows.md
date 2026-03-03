---
sidebar_position: 3
---

# Common Workflows

Multi-step workflows that combine multiple tools.

## Publish a Post with Feature Image

1. **Upload the feature image:**

   ```json title="admin_upload_image"
   {
     "file_path": "/path/to/feature.jpg",
     "purpose": "image"
   }
   ```

   The response includes the image URL.

2. **Create the post with the uploaded image:**

   ```json title="admin_create_post"
   {
     "title": "My Post Title",
     "html": "<p>Content here...</p>",
     "feature_image": "https://myblog.ghost.io/content/images/2024/01/feature.jpg",
     "status": "published"
   }
   ```

## Find and Update a Post

1. **Find the post by slug:**

   ```json title="admin_read_post"
   {
     "slug": "my-post-slug"
   }
   ```

   Note the `id` and `updated_at` from the response.

2. **Update the post:**

   ```json title="admin_update_post"
   {
     "id": "5ddc9141c35e7700383b2937",
     "updated_at": "2024-01-15T10:30:00.000Z",
     "title": "New Title"
   }
   ```

## Add Tags to Multiple Posts

1. **Browse posts to find those needing tags:**

   ```json title="admin_browse_posts"
   {
     "filter": "status:draft",
     "limit": "all"
   }
   ```

2. **For each post, update with new tags:**

   ```json title="admin_update_post"
   {
     "id": "[post ID]",
     "updated_at": "[post updated_at]",
     "tags": [{ "name": "Review Needed" }]
   }
   ```

## Set Up a Newsletter Workflow

1. **Create a newsletter:**

   ```json title="admin_create_newsletter"
   {
     "name": "Weekly Digest",
     "description": "Weekly roundup of the best content",
     "status": "active"
   }
   ```

2. **Create a post and send to newsletter:**

   ```json title="admin_create_post"
   {
     "title": "This Week's Highlights",
     "html": "<p>Here are this week's top stories...</p>",
     "status": "published",
     "newsletter": { "id": "[newsletter-id]" }
   }
   ```

## Audit Content by Tag

1. **List all tags with post counts:**

   ```json title="content_browse_tags"
   {
     "include": "count.posts",
     "limit": "all"
   }
   ```

2. **Browse posts for a specific tag:**

   ```json title="content_browse_posts"
   {
     "filter": "tag:technology",
     "fields": "title,slug,status,published_at",
     "limit": "all"
   }
   ```

3. **Review and update outdated posts:**

   ```json title="admin_update_post"
   {
     "id": "[post ID]",
     "updated_at": "[post updated_at]",
     "tags": [{ "name": "Technology" }, { "name": "#needs-review" }]
   }
   ```
