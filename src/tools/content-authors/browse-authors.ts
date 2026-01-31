/**
 * content_browse_authors tool implementation.
 *
 * Lists/browses authors from the Ghost Content API with filtering and pagination.
 */

import type { GhostContentClient } from '../../client/ghost-content-client.js';
import type { ContentAuthorsResponse } from '../../types/ghost-api.js';
import type { BrowseAuthorsInput } from './schemas.js';

/**
 * Tool name constant.
 */
export const TOOL_NAME = 'content_browse_authors';

/**
 * Tool description for MCP registration.
 */
export const TOOL_DESCRIPTION = `Browse public authors from Ghost Content API (read-only).

USE CASE:
- Display team/contributor page on website
- Build author archive pages
- Get post counts per author

INCLUDE OPTIONS:
- count.posts: Include number of published posts per author

NOTE: Only authors with at least one published post are returned.
For all staff users (including those without posts), use admin_browse_users instead.

RETURNS: Array of authors with bio, social links, and optional post counts.`;

/**
 * Executes the browse authors tool.
 *
 * @param client - Ghost Content API client
 * @param input - Validated input parameters
 * @returns Tool result with authors data
 */
export async function executeBrowseAuthors(
  client: GhostContentClient,
  input: BrowseAuthorsInput
): Promise<ContentAuthorsResponse> {
  const params: Record<string, string | number | undefined> = {
    include: input.include,
    fields: input.fields,
    filter: input.filter,
    limit: input.limit,
    page: input.page,
    order: input.order,
  };

  // Remove undefined values
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined)
  );

  return client.get<ContentAuthorsResponse>('/authors/', { params: cleanParams });
}
