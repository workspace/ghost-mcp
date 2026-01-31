/**
 * admin_update_page tool implementation.
 *
 * Updates an existing page via the Ghost Admin API.
 */

import type { GhostClient } from '../../client/ghost-client.js';
import type { AdminPagesResponse } from '../../types/ghost-api.js';
import type { AdminUpdatePageInput } from './schemas.js';

export const TOOL_NAME = 'admin_update_page';

export const TOOL_DESCRIPTION = `Update an existing page via Ghost Admin API.

USE CASE:
- Edit page content, title, or metadata
- Publish a draft page (change status to 'published')
- Update SEO settings or feature image

PREREQUISITE: Call admin_read_page first to get the current updated_at timestamp.

WORKFLOW:
1. admin_read_page(id: "page-id") -> get updated_at value
2. admin_update_page(id: "page-id", updated_at: "...", title: "New Title")

NOTE: Providing tags array REPLACES all existing tag assignments.

RETURNS: Updated page with new updated_at timestamp.`;

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
    params: input.html !== undefined ? { source: 'html' } : undefined,
  });
}
