/**
 * admin_update_tag tool implementation.
 *
 * Updates an existing tag via the Ghost Admin API.
 */

import type { GhostClient } from '../../client/ghost-client.js';
import type { AdminTagsResponse } from '../../types/ghost-api.js';
import type { AdminUpdateTagInput } from './schemas.js';

export const TOOL_NAME = 'admin_update_tag';

export const TOOL_DESCRIPTION =
  'Update an existing tag via the Ghost Admin API. Requires the tag ID and updated_at timestamp for conflict prevention. Returns the updated tag.';

export async function executeAdminUpdateTag(
  client: GhostClient,
  input: AdminUpdateTagInput
): Promise<AdminTagsResponse> {
  const { id, ...tagData } = input;

  // Build tag object with only defined values
  const tag: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(tagData)) {
    if (value !== undefined) {
      tag[key] = value;
    }
  }

  return client.put<AdminTagsResponse>(`/tags/${id}/`, {
    body: { tags: [tag] },
  });
}
