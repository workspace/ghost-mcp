/**
 * admin_browse_tags tool implementation.
 *
 * Lists/browses tags from the Ghost Admin API with filtering and pagination.
 */

import type { GhostClient } from '../../client/ghost-client.js';
import type { AdminTagsResponse } from '../../types/ghost-api.js';
import type { AdminBrowseTagsInput } from './schemas.js';

export const TOOL_NAME = 'admin_browse_tags';

export const TOOL_DESCRIPTION = `Browse all tags from Ghost Admin API.

USE CASE:
- List all available tags for post categorization
- Find tag IDs/slugs to use with admin_create_post or admin_update_post
- Get tag statistics (post counts)

INCLUDE OPTIONS:
- count.posts: Include post count for each tag

FILTER EXAMPLES:
- visibility:public (public tags only)
- visibility:internal (internal tags starting with #)

RETURNS: Array of tags with pagination metadata.`;

export async function executeAdminBrowseTags(
  client: GhostClient,
  input: AdminBrowseTagsInput
): Promise<AdminTagsResponse> {
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

  return client.get<AdminTagsResponse>('/tags/', { params: cleanParams });
}
