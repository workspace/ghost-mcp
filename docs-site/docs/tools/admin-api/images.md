---
sidebar_position: 12
---

# Images

Upload images to your Ghost site. Requires `GHOST_ADMIN_API_KEY`.

## Tools

| Tool | Description |
|------|-------------|
| `admin_upload_image` | Upload an image file or from URL |

## admin_upload_image

Upload an image for use in posts, pages, or profiles. Supports both local file paths and URLs.

### Upload from local file

```json
{
  "file_path": "/path/to/image.jpg",
  "purpose": "image"
}
```

### Upload from URL

```json
{
  "url": "https://example.com/photo.jpg",
  "purpose": "image"
}
```

### Upload a profile image

```json
{
  "file_path": "/path/to/avatar.png",
  "purpose": "profile_image",
  "ref": "user-123-avatar"
}
```

### Key parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `file_path` | string | Local path to the image file |
| `url` | string | URL of the image to upload |
| `purpose` | string | Image purpose (see below) |
| `ref` | string | Optional reference identifier |

### Purpose values

| Purpose | Description |
|---------|-------------|
| `image` | General content image (default) |
| `profile_image` | User profile/avatar image |
| `icon` | Site icon (favicon) |

:::tip
The response includes the uploaded image URL, which you can use in `feature_image` when creating or updating posts.
:::
