/**
 * admin_copy_page tool implementation.
 *
 * Creates a copy of an existing page via the Ghost Admin API.
 */

import type { GhostClient } from '../../client/ghost-client.js';
import type { AdminPagesResponse } from '../../types/ghost-api.js';
import type { AdminCopyPageInput } from './schemas.js';

export const TOOL_NAME = 'admin_copy_page';

export const TOOL_DESCRIPTION =
  'Create a copy of an existing page via the Ghost Admin API. Creates a draft copy with "(Copy)" appended to the title.';

export async function executeAdminCopyPage(
  client: GhostClient,
  input: AdminCopyPageInput
): Promise<AdminPagesResponse> {
  return client.post<AdminPagesResponse>(`/pages/${input.id}/copy/`);
}
