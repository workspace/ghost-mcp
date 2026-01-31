/**
 * content_browse_tags tool implementation.
 *
 * Lists/browses tags from the Ghost Content API with filtering and pagination.
 */

import type { GhostContentClient } from '../../client/ghost-content-client.js';
import type { ContentTagsResponse } from '../../types/ghost-api.js';
import type { BrowseTagsInput } from './schemas.js';

/**
 * Tool name constant.
 */
export const TOOL_NAME = 'content_browse_tags';

/**
 * Tool description for MCP registration.
 */
export const TOOL_DESCRIPTION = `Browse public tags from Ghost Content API (read-only).

USE CASE:
- Display tag cloud or category list on website
- Build tag-based navigation
- Get post counts for each tag

INCLUDE OPTIONS:
- count.posts: Include number of posts per tag

NOTE: Only returns public tags (not internal tags starting with #).
For all tags including internal, use admin_browse_tags instead.

RETURNS: Array of tags with metadata and optional post counts.`;

/**
 * Executes the browse tags tool.
 *
 * @param client - Ghost Content API client
 * @param input - Validated input parameters
 * @returns Tool result with tags data
 */
export async function executeBrowseTags(
  client: GhostContentClient,
  input: BrowseTagsInput
): Promise<ContentTagsResponse> {
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

  return client.get<ContentTagsResponse>('/tags/', { params: cleanParams });
}
