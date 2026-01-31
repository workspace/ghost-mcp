/**
 * admin_browse_posts tool implementation.
 *
 * Lists/browses posts from the Ghost Admin API with filtering and pagination.
 */

import type { GhostClient } from '../../client/ghost-client.js';
import type { AdminPostsResponse } from '../../types/ghost-api.js';
import type { AdminBrowsePostsInput } from './schemas.js';

export const TOOL_NAME = 'admin_browse_posts';

export const TOOL_DESCRIPTION =
  'Browse posts from the Ghost Admin API. Returns all posts including drafts with optional filtering, pagination, and related data.';

export async function executeAdminBrowsePosts(
  client: GhostClient,
  input: AdminBrowsePostsInput
): Promise<AdminPostsResponse> {
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

  return client.get<AdminPostsResponse>('/posts/', { params: cleanParams });
}
