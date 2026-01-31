/**
 * admin_update_post tool implementation.
 *
 * Updates an existing post via the Ghost Admin API.
 */

import type { GhostClient } from '../../client/ghost-client.js';
import type { AdminPostsResponse } from '../../types/ghost-api.js';
import type { AdminUpdatePostInput } from './schemas.js';

export const TOOL_NAME = 'admin_update_post';

export const TOOL_DESCRIPTION =
  'Update an existing post via the Ghost Admin API. Requires the post ID and updated_at timestamp for conflict prevention. Returns the updated post.';

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
  });
}
