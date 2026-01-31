/**
 * admin_create_page tool implementation.
 *
 * Creates a new page via the Ghost Admin API.
 */

import type { GhostClient } from '../../client/ghost-client.js';
import type { AdminPagesResponse } from '../../types/ghost-api.js';
import type { AdminCreatePageInput } from './schemas.js';

export const TOOL_NAME = 'admin_create_page';

export const TOOL_DESCRIPTION =
  'Create a new page via the Ghost Admin API. Requires at minimum a title. Returns the created page. Pages are static content not included in feeds or collections.';

export async function executeAdminCreatePage(
  client: GhostClient,
  input: AdminCreatePageInput
): Promise<AdminPagesResponse> {
  // Build page object, removing undefined values
  const page: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) {
      page[key] = value;
    }
  }

  return client.post<AdminPagesResponse>('/pages/', {
    body: { pages: [page] },
  });
}
