/**
 * content_read_tag tool implementation.
 *
 * Reads a single tag from the Ghost Content API by ID or slug.
 */

import type { GhostContentClient } from '../../client/ghost-content-client.js';
import type { ContentTagsResponse } from '../../types/ghost-api.js';
import type { ReadTagInput } from './schemas.js';

/**
 * Tool name constant.
 */
export const TOOL_NAME = 'content_read_tag';

/**
 * Tool description for MCP registration.
 */
export const TOOL_DESCRIPTION = `Read a single public tag by ID or slug (read-only).

USE CASE:
- Display tag details on a tag archive page
- Get tag metadata for SEO purposes

IDENTIFIER: Provide either 'id' OR 'slug', not both.

NOTE: Only returns public tags visible on the website.
For internal tags, use admin_read_tag instead.

RETURNS: Single tag object with metadata and optional post count.`;

/**
 * Executes the read tag tool.
 *
 * @param client - Ghost Content API client
 * @param input - Validated input parameters
 * @returns Tool result with tag data
 */
export async function executeReadTag(
  client: GhostContentClient,
  input: ReadTagInput
): Promise<ContentTagsResponse> {
  const params: Record<string, string | undefined> = {
    include: input.include,
    fields: input.fields,
  };

  // Remove undefined values
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined)
  );

  // Determine endpoint based on id or slug
  const endpoint = input.id
    ? `/tags/${input.id}/`
    : `/tags/slug/${input.slug}/`;

  return client.get<ContentTagsResponse>(endpoint, { params: cleanParams });
}
