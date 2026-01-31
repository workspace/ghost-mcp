/**
 * admin_delete_page tool implementation.
 *
 * Deletes a page via the Ghost Admin API.
 */

import type { GhostClient } from '../../client/ghost-client.js';
import type { AdminDeletePageInput } from './schemas.js';

export const TOOL_NAME = 'admin_delete_page';

export const TOOL_DESCRIPTION =
  'Delete a page via the Ghost Admin API. Requires the page ID. This action is permanent and cannot be undone.';

export interface DeletePageResponse {
  success: boolean;
}

export async function executeAdminDeletePage(
  client: GhostClient,
  input: AdminDeletePageInput
): Promise<DeletePageResponse> {
  await client.delete<void>(`/pages/${input.id}/`);
  return { success: true };
}
