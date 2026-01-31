/**
 * admin_read_tag tool implementation.
 *
 * Reads a single tag from the Ghost Admin API by ID or slug.
 */

import type { GhostClient } from '../../client/ghost-client.js';
import type { AdminTagsResponse } from '../../types/ghost-api.js';
import type { AdminReadTagInput } from './schemas.js';

export const TOOL_NAME = 'admin_read_tag';

export const TOOL_DESCRIPTION =
  'Read a single tag from the Ghost Admin API by ID or slug. Returns the full tag data including related data.';

export async function executeAdminReadTag(
  client: GhostClient,
  input: AdminReadTagInput
): Promise<AdminTagsResponse> {
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

  return client.get<AdminTagsResponse>(endpoint, { params: cleanParams });
}
