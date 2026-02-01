/**
 * content_browse_pages tool implementation.
 *
 * Lists/browses pages from the Ghost Content API with filtering and pagination.
 */

import type { GhostContentClient } from '../../client/ghost-content-client.js';
import type { ContentPagesResponse } from '../../types/ghost-api.js';
import type { BrowsePagesInput } from './schemas.js';

/**
 * Tool name constant.
 */
export const TOOL_NAME = 'content_browse_pages';

/**
 * Tool description for MCP registration.
 */
export const TOOL_DESCRIPTION = `Browse published pages from Ghost Content API (read-only, public content).

TIP: Use "fields" param (e.g., "id,title,slug,published_at,excerpt") to reduce response size. Omit html field unless content is needed.

USE CASE:
- Display static pages (About, Contact, Terms) on a website frontend
- Build site navigation from published pages
- List all available pages for sitemap generation

NOTE: Only returns published pages visible to the public.
Pages are static content NOT shown in RSS feeds or blog listings.
For drafts or all pages, use admin_browse_pages instead.

RETURNS: Array of pages with pagination metadata (page, pages, total).`;

/**
 * Executes the browse pages tool.
 *
 * @param client - Ghost Content API client
 * @param input - Validated input parameters
 * @returns Tool result with pages data
 */
export async function executeBrowsePages(
  client: GhostContentClient,
  input: BrowsePagesInput
): Promise<ContentPagesResponse> {
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

  return client.get<ContentPagesResponse>('/pages/', { params: cleanParams });
}
