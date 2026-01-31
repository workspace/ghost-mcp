/**
 * admin_create_page tool implementation.
 *
 * Creates a new page via the Ghost Admin API.
 */

import type { GhostClient } from '../../client/ghost-client.js';
import type { AdminPagesResponse } from '../../types/ghost-api.js';
import type { AdminCreatePageInput } from './schemas.js';

export const TOOL_NAME = 'admin_create_page';

export const TOOL_DESCRIPTION = `Create a new page via Ghost Admin API. Defaults to 'draft' status.

USE CASE:
- Create static pages like About, Contact, or Terms of Service
- Build landing pages not included in blog feeds
- Create documentation or help pages

NOTE: Pages differ from posts - they are static content NOT shown in RSS feeds,
blog listings, or collections. Use admin_create_post for blog content.

CONTENT FORMAT: Provide content in ONE of these formats:
- lexical: Modern JSON format (recommended)
- html: HTML string (auto-converted)
- mobiledoc: Legacy JSON format

RETURNS: Created page with id and updated_at (needed for admin_update_page).`;

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
    params: input.html !== undefined ? { source: 'html' } : undefined,
  });
}
