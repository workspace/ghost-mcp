/**
 * admin_delete_user tool implementation.
 *
 * Deletes a staff user via the Ghost Admin API.
 */

import type { GhostClient } from '../../client/ghost-client.js';
import type { AdminDeleteUserInput } from './schemas.js';

export const TOOL_NAME = 'admin_delete_user';

export const TOOL_DESCRIPTION =
  'Delete a staff user via the Ghost Admin API. This action is permanent and cannot be undone. Note: The site Owner cannot be deleted.';

/**
 * Response from delete operation.
 */
export interface DeleteUserResponse {
  success: boolean;
}

export async function executeAdminDeleteUser(
  client: GhostClient,
  input: AdminDeleteUserInput
): Promise<DeleteUserResponse> {
  await client.delete<void>(`/users/${input.id}/`);
  return { success: true };
}
