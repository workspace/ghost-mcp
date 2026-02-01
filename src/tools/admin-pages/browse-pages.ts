/**
 * admin_browse_pages tool implementation.
 *
 * Lists/browses pages from the Ghost Admin API with filtering and pagination.
 */

import type { GhostClient } from '../../client/ghost-client.js';
import type { AdminPagesResponse } from '../../types/ghost-api.js';
import type { AdminBrowsePagesInput } from './schemas.js';

export const TOOL_NAME = 'admin_browse_pages';

export const TOOL_DESCRIPTION = `Browse all pages from Ghost Admin API, including drafts.

TIP: Use "fields" param (e.g., "id,title,slug,status,published_at,excerpt") to reduce response size. Omit html/lexical fields unless content is needed.

USE CASE:
- List all static pages (About, Contact, Terms, etc.)
- Find pages by status (draft, published, scheduled)
- Search for specific pages by title or slug

NOTE: Pages are static content NOT shown in RSS feeds or blog listings.
For blog posts, use admin_browse_posts instead.

FILTER EXAMPLES:
- status:draft (draft pages only)
- status:published (published pages)
- slug:about (page with specific slug)

RETURNS: Array of pages with pagination metadata (page, pages, total).`;

export async function executeAdminBrowsePages(
  client: GhostClient,
  input: AdminBrowsePagesInput
): Promise<AdminPagesResponse> {
  const params: Record<string, string | number | undefined> = {
    include: input.include,
    fields: input.fields,
    formats: input.formats,
    filter: input.filter,
    limit: input.limit,
    page: input.page,
    order: input.order,
  };

  // Remove undefined values
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined)
  );

  return client.get<AdminPagesResponse>('/pages/', { params: cleanParams });
}
