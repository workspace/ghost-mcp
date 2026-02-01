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
export const TOOL_DESCRIPTION = `Browse published posts from Ghost Content API (read-only, public content).

TIP: Use "fields" param (e.g., "id,title,slug,published_at,excerpt") to reduce response size. Omit html field unless content is needed.

USE CASE:
- Display a list of blog posts on a website frontend
- Search for posts by tag, author, or custom NQL filters
- Build RSS feeds or sitemaps from published content

NOTE: Only returns published posts visible to the public.
For drafts, scheduled, or all posts, use admin_browse_posts instead.

FILTER EXAMPLES:
- tag:getting-started (posts with specific tag)
- featured:true (featured posts only)
- author:john (posts by specific author)

RETURNS: Array of posts with pagination metadata (page, pages, total).`;

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
