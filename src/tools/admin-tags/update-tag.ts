/**
 * admin_update_tag tool implementation.
 *
 * Updates an existing tag via the Ghost Admin API.
 */

import type { GhostClient } from '../../client/ghost-client.js';
import type { AdminTagsResponse } from '../../types/ghost-api.js';
import type { AdminUpdateTagInput } from './schemas.js';

export const TOOL_NAME = 'admin_update_tag';

export const TOOL_DESCRIPTION = `Update an existing tag via Ghost Admin API.

USE CASE:
- Rename a tag or change its slug
- Update tag description or feature image
- Modify SEO metadata for tag pages

PREREQUISITE: Call admin_read_tag first to get the current updated_at timestamp.

WORKFLOW:
1. admin_read_tag(id: "tag-id") -> get updated_at value
2. admin_update_tag(id: "tag-id", updated_at: "...", name: "New Name")

RETURNS: Updated tag with new updated_at timestamp.`;

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
