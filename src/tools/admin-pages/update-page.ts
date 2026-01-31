/**
 * admin_update_page tool implementation.
 *
 * Updates an existing page via the Ghost Admin API.
 */

import type { GhostClient } from '../../client/ghost-client.js';
import type { AdminPagesResponse } from '../../types/ghost-api.js';
import type { AdminUpdatePageInput } from './schemas.js';

export const TOOL_NAME = 'admin_update_page';

export const TOOL_DESCRIPTION =
  'Update an existing page via the Ghost Admin API. Requires the page ID and the current updated_at timestamp for conflict prevention. Returns the updated page.';

export async function executeAdminUpdatePage(
  client: GhostClient,
  input: AdminUpdatePageInput
): Promise<AdminPagesResponse> {
  const { id, ...pageData } = input;

  // Build page object, removing undefined values
  const page: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(pageData)) {
    if (value !== undefined) {
      page[key] = value;
    }
  }

  return client.put<AdminPagesResponse>(`/pages/${id}/`, {
    body: { pages: [page] },
  });
}
