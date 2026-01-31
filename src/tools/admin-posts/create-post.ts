/**
 * admin_create_post tool implementation.
 *
 * Creates a new post via the Ghost Admin API.
 */

import type { GhostClient } from '../../client/ghost-client.js';
import type { AdminPostsResponse } from '../../types/ghost-api.js';
import type { AdminCreatePostInput } from './schemas.js';

export const TOOL_NAME = 'admin_create_post';

export const TOOL_DESCRIPTION =
  'Create a new post via the Ghost Admin API. Requires at minimum a title. Returns the created post.';

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
  });
}
