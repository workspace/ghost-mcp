/**
 * admin_delete_tag tool implementation.
 *
 * Deletes a tag via the Ghost Admin API.
 */

import type { GhostClient } from '../../client/ghost-client.js';
import type { AdminDeleteTagInput } from './schemas.js';

export const TOOL_NAME = 'admin_delete_tag';

export const TOOL_DESCRIPTION =
  'Delete a tag via the Ghost Admin API. This action is permanent and cannot be undone.';

/**
 * Response from delete operation.
 */
export interface DeleteTagResponse {
  success: boolean;
}

export async function executeAdminDeleteTag(
  client: GhostClient,
  input: AdminDeleteTagInput
): Promise<DeleteTagResponse> {
  await client.delete<void>(`/tags/${input.id}/`);
  return { success: true };
}
