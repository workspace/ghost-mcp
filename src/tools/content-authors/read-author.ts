/**
 * content_read_author tool implementation.
 *
 * Reads a single author from the Ghost Content API by ID or slug.
 */

import type { GhostContentClient } from '../../client/ghost-content-client.js';
import type { ContentAuthorsResponse } from '../../types/ghost-api.js';
import type { ReadAuthorInput } from './schemas.js';

/**
 * Tool name constant.
 */
export const TOOL_NAME = 'content_read_author';

/**
 * Tool description for MCP registration.
 */
export const TOOL_DESCRIPTION =
  'Read a single author from the Ghost Content API by ID or slug. Returns the author data with optional post count.';

/**
 * Executes the read author tool.
 *
 * @param client - Ghost Content API client
 * @param input - Validated input parameters
 * @returns Tool result with author data
 */
export async function executeReadAuthor(
  client: GhostContentClient,
  input: ReadAuthorInput
): Promise<ContentAuthorsResponse> {
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
    ? `/authors/${input.id}/`
    : `/authors/slug/${input.slug}/`;

  return client.get<ContentAuthorsResponse>(endpoint, { params: cleanParams });
}
