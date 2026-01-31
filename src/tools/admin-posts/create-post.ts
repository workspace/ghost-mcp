/**
 * admin_create_post tool implementation.
 *
 * Creates a new post via the Ghost Admin API.
 */

import type { GhostClient } from '../../client/ghost-client.js';
import type { AdminPostsResponse } from '../../types/ghost-api.js';
import type { AdminCreatePostInput } from './schemas.js';

export const TOOL_NAME = 'admin_create_post';

export const TOOL_DESCRIPTION = `Create a new post via Ghost Admin API. Defaults to 'draft' status.

USE CASE:
- Create a new blog post draft for editing
- Publish content immediately (set status: 'published')
- Schedule future publication (set status: 'scheduled' with published_at)

CONTENT FORMAT: Provide content in ONE of these formats:
- lexical: Modern JSON format (recommended)
- html: HTML string (auto-converted to lexical)
- mobiledoc: Legacy JSON format

TAGS: Array of objects, each needs {id}, {name}, or {slug}.
Example: [{"name": "News"}, {"slug": "featured"}]

AUTHORS: Array of objects, each needs {id}, {email}, or {slug}.
Example: [{"email": "author@example.com"}]

RETURNS: Created post with id and updated_at (needed for admin_update_post).`;

export async function executeAdminCreatePost(
  client: GhostClient,
  input: AdminCreatePostInput
): Promise<AdminPostsResponse> {
  // Build post object, removing undefined values
  const post: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) {
      post[key] = value;
    }
  }

  return client.post<AdminPostsResponse>('/posts/', {
    body: { posts: [post] },
    params: input.html !== undefined ? { source: 'html' } : undefined,
  });
}
