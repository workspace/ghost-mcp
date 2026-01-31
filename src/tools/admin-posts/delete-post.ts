/**
 * admin_delete_post tool implementation.
 *
 * Deletes a post via the Ghost Admin API.
 */

import type { GhostClient } from '../../client/ghost-client.js';
import type { AdminDeletePostInput } from './schemas.js';

export const TOOL_NAME = 'admin_delete_post';

export const TOOL_DESCRIPTION =
  'Delete a post via the Ghost Admin API. This action is permanent and cannot be undone.';

/**
 * Response from delete operation.
 */
export interface DeletePostResponse {
  success: boolean;
}

export async function executeAdminDeletePost(
  client: GhostClient,
  input: AdminDeletePostInput
): Promise<DeletePostResponse> {
  await client.delete<void>(`/posts/${input.id}/`);
  return { success: true };
}
