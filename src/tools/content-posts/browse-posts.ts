/**
 * content_browse_posts tool implementation.
 *
 * Lists/browses posts from the Ghost Content API with filtering and pagination.
 */

import type { GhostContentClient } from '../../client/ghost-content-client.js';
import type { ContentPostsResponse } from '../../types/ghost-api.js';
import type { BrowsePostsInput } from './schemas.js';

/**
 * Tool name constant.
 */
export const TOOL_NAME = 'content_browse_posts';

/**
 * Tool description for MCP registration.
 */
export const TOOL_DESCRIPTION =
  'Browse posts from the Ghost Content API. Returns published posts with optional filtering, pagination, and related data.';

/**
 * Executes the browse posts tool.
 *
 * @param client - Ghost Content API client
 * @param input - Validated input parameters
 * @returns Tool result with posts data
 */
export async function executeBrowsePosts(
  client: GhostContentClient,
  input: BrowsePostsInput
): Promise<ContentPostsResponse> {
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

  return client.get<ContentPostsResponse>('/posts/', { params: cleanParams });
}
