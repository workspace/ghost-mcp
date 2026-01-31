/**
 * admin_read_page tool implementation.
 *
 * Reads a single page from the Ghost Admin API by ID or slug.
 */

import type { GhostClient } from '../../client/ghost-client.js';
import type { AdminPagesResponse } from '../../types/ghost-api.js';
import type { AdminReadPageInput } from './schemas.js';

export const TOOL_NAME = 'admin_read_page';

export const TOOL_DESCRIPTION = `Read a single page by ID or slug from Ghost Admin API.

USE CASE:
- Get full page details including content
- Retrieve updated_at before calling admin_update_page
- Fetch page data for editing or display

IDENTIFIER: Provide either 'id' OR 'slug', not both.

NOTE: Returns pages of any status (draft, published, scheduled).
For public Content API access, use content_read_page instead.

RETURNS: Single page object with requested fields and related data (tags, authors).`;

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
