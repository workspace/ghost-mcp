/**
 * content_read_post tool implementation.
 *
 * Reads a single post from the Ghost Content API by ID or slug.
 */

import type { GhostContentClient } from '../../client/ghost-content-client.js';
import type { ContentPostsResponse } from '../../types/ghost-api.js';
import type { ReadPostInput } from './schemas.js';

/**
 * Tool name constant.
 */
export const TOOL_NAME = 'content_read_post';

/**
 * Tool description for MCP registration.
 */
export const TOOL_DESCRIPTION = `Read a single published post by ID or slug (read-only, public content).

USE CASE:
- Display a single blog post page on your website
- Fetch post content for embedding or social sharing
- Get full post details including HTML content

IDENTIFIER: Provide either 'id' OR 'slug', not both.

NOTE: Only returns published posts visible to the public.
For drafts or scheduled posts, use admin_read_post instead.

RETURNS: Single post object with requested fields and related data (tags, authors).`;

/**
 * Executes the read post tool.
 *
 * @param client - Ghost Content API client
 * @param input - Validated input parameters
 * @returns Tool result with post data
 */
export async function executeReadPost(
  client: GhostContentClient,
  input: ReadPostInput
): Promise<ContentPostsResponse> {
  const params: Record<string, string | undefined> = {
    include: input.include,
    fields: input.fields,
    formats: input.formats,
  };

  // Remove undefined values
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined)
  );

  // Determine endpoint based on id or slug
  const endpoint = input.id
    ? `/posts/${input.id}/`
    : `/posts/slug/${input.slug}/`;

  return client.get<ContentPostsResponse>(endpoint, { params: cleanParams });
}
