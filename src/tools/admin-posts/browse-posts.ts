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
  'Browse posts from the Ghost Admin API. Returns all posts including drafts. ' +
  'TIP: Use "fields" param (e.g., "id,title,slug,status,published_at,excerpt") to reduce response size. ' +
  'Omit html/lexical fields unless content is needed.';

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
