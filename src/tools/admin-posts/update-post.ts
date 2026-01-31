/**
 * admin_update_post tool implementation.
 *
 * Updates an existing post via the Ghost Admin API.
 */

import type { GhostClient } from '../../client/ghost-client.js';
import type { AdminPostsResponse } from '../../types/ghost-api.js';
import type { AdminUpdatePostInput } from './schemas.js';

export const TOOL_NAME = 'admin_update_post';

export const TOOL_DESCRIPTION = `Update an existing post via Ghost Admin API.

USE CASE:
- Edit post content, title, or metadata
- Publish a draft (change status to 'published')
- Change visibility or featured status

PREREQUISITE: Call admin_read_post first to get the current updated_at timestamp.

WORKFLOW:
1. admin_read_post(id: "post-id") -> get updated_at value
2. admin_update_post(id: "post-id", updated_at: "...", title: "New Title")

NOTE: Providing tags or authors arrays REPLACES all existing assignments.
To add a tag, include all existing tags plus the new one.

RETURNS: Updated post with new updated_at timestamp.`;

export async function executeAdminUpdatePost(
  client: GhostClient,
  input: AdminUpdatePostInput
): Promise<AdminPostsResponse> {
  const { id, ...postData } = input;

  // Build post object with only defined values
  const post: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(postData)) {
    if (value !== undefined) {
      post[key] = value;
    }
  }

  return client.put<AdminPostsResponse>(`/posts/${id}/`, {
    body: { posts: [post] },
    params: input.html !== undefined ? { source: 'html' } : undefined,
  });
}
