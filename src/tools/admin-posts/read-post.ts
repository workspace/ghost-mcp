/**
 * admin_read_post tool implementation.
 *
 * Reads a single post from the Ghost Admin API by ID or slug.
 */

import type { GhostClient } from '../../client/ghost-client.js';
import type { AdminPostsResponse } from '../../types/ghost-api.js';
import type { AdminReadPostInput } from './schemas.js';

export const TOOL_NAME = 'admin_read_post';

export const TOOL_DESCRIPTION =
  'Read a single post from the Ghost Admin API by ID or slug. Returns the full post data including draft status and related data.';

export async function executeAdminReadPost(
  client: GhostClient,
  input: AdminReadPostInput
): Promise<AdminPostsResponse> {
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

  return client.get<AdminPostsResponse>(endpoint, { params: cleanParams });
}
