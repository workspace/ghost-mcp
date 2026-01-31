# Ghost MCP

An MCP (Model Context Protocol) server providing tools for interacting with Ghost CMS blogs.

## Features

- **Content API** (read-only): Browse and read posts, pages, tags, and authors
- **Admin API** (full CRUD): Create, update, and delete posts, pages, tags, members, newsletters, tiers, offers, webhooks, and more
- **Multiple transports**: stdio for local development, HTTP/SSE for remote deployment

## Installation

```bash
npm install
npm run build
```

## Configuration

Set these environment variables:

| Variable                | Required        | Description                                           |
| ----------------------- | --------------- | ----------------------------------------------------- |
| `GHOST_URL`             | Yes             | Your Ghost site URL (e.g., `https://myblog.ghost.io`) |
| `GHOST_CONTENT_API_KEY` | For Content API | Content API key from Ghost Admin                      |
| `GHOST_ADMIN_API_KEY`   | For Admin API   | Admin API key in `id:secret` format                   |
| `GHOST_API_VERSION`     | No              | API version (default: `v5.0`)                         |
| `PORT`                  | No              | Server port for SSE mode (default: `3000`)            |

### Getting API Keys

1. In Ghost Admin, go to **Settings > Integrations**
2. Create a new Custom Integration
3. Copy the **Content API Key** for read-only access
4. Copy the **Admin API Key** for full access

## Running the Server

### Stdio Transport (Local Development)

```bash
npm start
```

### HTTP/SSE Transport (Remote Deployment)

```bash
npm run start:sse
```

## Usage Examples

### Content API Examples

#### Browse Posts (Basic)

Get the 15 most recent published posts.

**Tool:** `content_browse_posts`

```json
{}
```

#### Browse Posts with Pagination

Get page 2 of posts, 10 per page.

**Tool:** `content_browse_posts`

```json
{
  "limit": 10,
  "page": 2
}
```

#### Browse Posts with Filtering

Get featured posts from a specific tag.

**Tool:** `content_browse_posts`

```json
{
  "filter": "tag:tutorials+featured:true",
  "include": "tags,authors",
  "order": "published_at DESC"
}
```

#### Browse Posts - Select Specific Fields

Get only title, slug, and published date for listings.

**Tool:** `content_browse_posts`

```json
{
  "fields": "title,slug,published_at",
  "limit": 20
}
```

#### Read Post by Slug

Fetch a specific post by its URL slug.

**Tool:** `content_read_post`

```json
{
  "slug": "welcome-to-ghost",
  "include": "tags,authors",
  "formats": "html"
}
```

#### Read Post by ID

Fetch a post using its unique identifier.

**Tool:** `content_read_post`

```json
{
  "id": "5ddc9141c35e7700383b2937"
}
```

#### Browse Tags with Post Counts

Get all tags with the number of posts in each.

**Tool:** `content_browse_tags`

```json
{
  "include": "count.posts",
  "limit": "all"
}
```

#### Browse Authors

Get all authors with their post counts.

**Tool:** `content_browse_authors`

```json
{
  "include": "count.posts",
  "fields": "name,slug,bio,profile_image"
}
```

### Admin API Examples

#### Create Draft Post

Create a new draft post with title and HTML content.

**Tool:** `admin_create_post`

```json
{
  "title": "My New Blog Post",
  "html": "<p>This is the content of my blog post.</p>",
  "status": "draft"
}
```

#### Create Published Post with Full Metadata

Create a published post with tags, featured image, and SEO metadata.

**Tool:** `admin_create_post`

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
  "meta_description": "A comprehensive guide to using Ghost CMS for your blog.",
  "feature_image": "https://example.com/images/ghost-guide.jpg"
}
```

#### Create Members-Only Post

Create a post visible only to paid members.

**Tool:** `admin_create_post`

```json
{
  "title": "Premium Content for Members",
  "html": "<p>Exclusive content for paying subscribers.</p>",
  "status": "published",
  "visibility": "paid"
}
```

#### Update Existing Post

Update an existing post. Requires `id` and `updated_at` for conflict prevention.

**Tool:** `admin_update_post`

```json
{
  "id": "5ddc9141c35e7700383b2937",
  "updated_at": "2024-01-15T10:30:00.000Z",
  "title": "Updated Title",
  "html": "<p>Updated content goes here.</p>",
  "status": "published"
}
```

> **Note:** The `updated_at` field must match the current value from the post. This prevents accidental overwrites if someone else modified the post.

#### Delete Post

Delete a post by its ID.

**Tool:** `admin_delete_post`

```json
{
  "id": "5ddc9141c35e7700383b2937"
}
```

#### Create Member (Basic)

Add a new member with just an email.

**Tool:** `admin_create_member`

```json
{
  "email": "newmember@example.com"
}
```

#### Create Member with Full Details

Create a member with name, labels, and complimentary access.

**Tool:** `admin_create_member`

```json
{
  "email": "vip@example.com",
  "name": "John Smith",
  "note": "VIP customer - premium support",
  "subscribed": true,
  "labels": [{ "name": "VIP" }, { "name": "Early Adopter" }],
  "comped": true
}
```

#### Browse Members with Filter

Get all paid members.

**Tool:** `admin_browse_members`

```json
{
  "filter": "status:paid",
  "include": "labels,newsletters",
  "order": "created_at DESC"
}
```

#### Create Tag (Basic)

Create a simple public tag.

**Tool:** `admin_create_tag`

```json
{
  "name": "Technology"
}
```

#### Create Tag with Metadata

Create a tag with description, accent color, and SEO metadata.

**Tool:** `admin_create_tag`

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

#### Create Internal Tag

Internal tags (prefixed with #) are not visible on the frontend.

**Tool:** `admin_create_tag`

```json
{
  "name": "#internal-review",
  "visibility": "internal"
}
```

#### Upload Image

Upload an image for use in post content.

**Tool:** `admin_upload_image`

```json
{
  "file_path": "/path/to/image.jpg",
  "purpose": "image"
}
```

#### Upload Profile Image

Upload a profile/avatar image.

**Tool:** `admin_upload_image`

```json
{
  "file_path": "/path/to/avatar.png",
  "purpose": "profile_image",
  "ref": "user-123-avatar"
}
```

### Common Workflows

#### Workflow 1: Publish a Post with Feature Image

1. **Upload the feature image:**

   **Tool:** `admin_upload_image`

   ```json
   {
     "file_path": "/path/to/feature.jpg",
     "purpose": "image"
   }
   ```

   The response includes the image URL.

2. **Create the post with the uploaded image:**

   **Tool:** `admin_create_post`

   ```json
   {
     "title": "My Post Title",
     "html": "<p>Content here...</p>",
     "feature_image": "https://myblog.ghost.io/content/images/2024/01/feature.jpg",
     "status": "published"
   }
   ```

#### Workflow 2: Find and Update a Post

1. **Find the post by slug:**

   **Tool:** `admin_read_post`

   ```json
   {
     "slug": "my-post-slug"
   }
   ```

   Note the `id` and `updated_at` from the response.

2. **Update the post:**

   **Tool:** `admin_update_post`

   ```json
   {
     "id": "5ddc9141c35e7700383b2937",
     "updated_at": "2024-01-15T10:30:00.000Z",
     "title": "New Title"
   }
   ```

#### Workflow 3: Add Tags to Multiple Posts

1. **Browse posts to find those needing tags:**

   **Tool:** `admin_browse_posts`

   ```json
   {
     "filter": "status:draft",
     "limit": "all"
   }
   ```

2. **For each post, update with new tags:**

   **Tool:** `admin_update_post`

   ```json
   {
     "id": "[post ID]",
     "updated_at": "[post updated_at]",
     "tags": [{ "name": "Review Needed" }]
   }
   ```

### NQL Filter Reference

Ghost uses NQL (Notion Query Language) for filtering. Here are common patterns:

#### Post Filters

| Filter                          | Description                      |
| ------------------------------- | -------------------------------- |
| `status:draft`                  | Draft posts only                 |
| `status:published`              | Published posts only             |
| `status:scheduled`              | Scheduled posts only             |
| `featured:true`                 | Featured posts                   |
| `tag:news`                      | Posts with "news" tag (by slug)  |
| `author:john`                   | Posts by author "john" (by slug) |
| `published_at:>'2024-01-01'`    | Posts published after date       |
| `tag:news+featured:true`        | Combine filters (AND)            |
| `status:draft,status:scheduled` | Multiple values (OR)             |

#### Member Filters

| Filter                     | Description               |
| -------------------------- | ------------------------- |
| `status:free`              | Free members              |
| `status:paid`              | Paid members              |
| `status:comped`            | Complimentary members     |
| `subscribed:true`          | Subscribed to newsletters |
| `label:vip`                | Members with "vip" label  |
| `created_at:>'2024-01-01'` | Members joined after date |

#### Tag Filters

| Filter                | Description              |
| --------------------- | ------------------------ |
| `visibility:public`   | Public tags              |
| `visibility:internal` | Internal tags (# prefix) |

## Available Tools

### Content API (8 tools)

- `content_browse_posts` - List posts with filtering and pagination
- `content_read_post` - Get a single post by ID or slug
- `content_browse_pages` - List pages
- `content_read_page` - Get a single page
- `content_browse_tags` - List tags
- `content_read_tag` - Get a single tag
- `content_browse_authors` - List authors
- `content_read_author` - Get a single author

### Admin API (46 tools)

**Posts:** `admin_browse_posts`, `admin_read_post`, `admin_create_post`, `admin_update_post`, `admin_delete_post`, `admin_copy_post`

**Pages:** `admin_browse_pages`, `admin_read_page`, `admin_create_page`, `admin_update_page`, `admin_delete_page`, `admin_copy_page`

**Tags:** `admin_browse_tags`, `admin_read_tag`, `admin_create_tag`, `admin_update_tag`, `admin_delete_tag`

**Members:** `admin_browse_members`, `admin_read_member`, `admin_create_member`, `admin_update_member`

**Tiers:** `admin_browse_tiers`, `admin_read_tier`, `admin_create_tier`, `admin_update_tier`

**Newsletters:** `admin_browse_newsletters`, `admin_read_newsletter`, `admin_create_newsletter`, `admin_update_newsletter`

**Offers:** `admin_browse_offers`, `admin_create_offer`, `admin_update_offer`

**Users:** `admin_browse_users`, `admin_read_user`, `admin_update_user`, `admin_delete_user`

**Roles:** `admin_browse_roles`

**Invites:** `admin_create_invite`

**Webhooks:** `admin_create_webhook`, `admin_update_webhook`, `admin_delete_webhook`

**Site:** `admin_read_site`, `admin_read_settings`

**Images:** `admin_upload_image`

**Themes:** `admin_upload_theme`, `admin_activate_theme`

## License

ISC
