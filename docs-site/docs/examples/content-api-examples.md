---
sidebar_position: 1
---

# Content API Examples

Real-world examples for the read-only Content API tools.

## Browse Posts

### Basic — Latest posts

Get the 15 most recent published posts.

```json title="content_browse_posts"
{}
```

### With pagination

Get page 2 of posts, 10 per page.

```json title="content_browse_posts"
{
  "limit": 10,
  "page": 2
}
```

### With filtering

Get featured posts from a specific tag.

```json title="content_browse_posts"
{
  "filter": "tag:tutorials+featured:true",
  "include": "tags,authors",
  "order": "published_at DESC"
}
```

### Select specific fields

Get only title, slug, and published date for listings.

```json title="content_browse_posts"
{
  "fields": "title,slug,published_at",
  "limit": 20
}
```

## Read a Post

### By slug

Fetch a specific post by its URL slug.

```json title="content_read_post"
{
  "slug": "welcome-to-ghost",
  "include": "tags,authors",
  "formats": "html"
}
```

### By ID

Fetch a post using its unique identifier.

```json title="content_read_post"
{
  "id": "5ddc9141c35e7700383b2937"
}
```

## Browse Tags

### With post counts

Get all tags with the number of posts in each.

```json title="content_browse_tags"
{
  "include": "count.posts",
  "limit": "all"
}
```

## Browse Authors

### With post counts and selected fields

Get all authors with their post counts.

```json title="content_browse_authors"
{
  "include": "count.posts",
  "fields": "name,slug,bio,profile_image"
}
```

## Browse Pages

### All published pages

```json title="content_browse_pages"
{
  "limit": "all",
  "include": "tags"
}
```

### Read a specific page

```json title="content_read_page"
{
  "slug": "about",
  "formats": "html"
}
```
