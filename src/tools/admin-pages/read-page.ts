/**
 * admin_read_page tool implementation.
 *
 * Reads a single page from the Ghost Admin API by ID or slug.
 */

import type { GhostClient } from '../../client/ghost-client.js';
import type { AdminPagesResponse } from '../../types/ghost-api.js';
import type { AdminReadPageInput } from './schemas.js';

export const TOOL_NAME = 'admin_read_page';

export const TOOL_DESCRIPTION =
  'Read a single page from the Ghost Admin API by ID or slug. Returns the page with optional related data.';

export async function executeAdminReadPage(
  client: GhostClient,
  input: AdminReadPageInput
): Promise<AdminPagesResponse> {
  const endpoint = input.id
    ? `/pages/${input.id}/`
    : `/pages/slug/${input.slug}/`;

  const params: Record<string, string | undefined> = {
    include: input.include,
    fields: input.fields,
    formats: input.formats,
  };

  // Remove undefined values
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined)
  );

  return client.get<AdminPagesResponse>(endpoint, { params: cleanParams });
}
