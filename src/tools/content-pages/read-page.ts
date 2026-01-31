/**
 * content_read_page tool implementation.
 *
 * Reads a single page from the Ghost Content API by ID or slug.
 */

import type { GhostContentClient } from '../../client/ghost-content-client.js';
import type { ContentPagesResponse } from '../../types/ghost-api.js';
import type { ReadPageInput } from './schemas.js';

/**
 * Tool name constant.
 */
export const TOOL_NAME = 'content_read_page';

/**
 * Tool description for MCP registration.
 */
export const TOOL_DESCRIPTION =
  'Read a single page from the Ghost Content API by ID or slug. Returns the full page data with optional related data.';

/**
 * Executes the read page tool.
 *
 * @param client - Ghost Content API client
 * @param input - Validated input parameters
 * @returns Tool result with page data
 */
export async function executeReadPage(
  client: GhostContentClient,
  input: ReadPageInput
): Promise<ContentPagesResponse> {
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
    ? `/pages/${input.id}/`
    : `/pages/slug/${input.slug}/`;

  return client.get<ContentPagesResponse>(endpoint, { params: cleanParams });
}
