/**
 * admin_copy_post tool implementation.
 *
 * Creates a copy of an existing post via the Ghost Admin API.
 */

import type { GhostClient } from '../../client/ghost-client.js';
import type { AdminPostsResponse } from '../../types/ghost-api.js';
import type { AdminCopyPostInput } from './schemas.js';

export const TOOL_NAME = 'admin_copy_post';

export const TOOL_DESCRIPTION =
  'Create a copy of an existing post via the Ghost Admin API. Creates a draft copy with "(Copy)" appended to the title.';

export async function executeAdminCopyPost(
  client: GhostClient,
  input: AdminCopyPostInput
): Promise<AdminPostsResponse> {
  return client.post<AdminPostsResponse>(`/posts/${input.id}/copy/`);
}
