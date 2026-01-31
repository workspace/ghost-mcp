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
export const TOOL_DESCRIPTION =
  'Browse authors from the Ghost Content API. Returns authors with optional filtering, pagination, and post counts. Note: Only authors with published posts are returned.';

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
