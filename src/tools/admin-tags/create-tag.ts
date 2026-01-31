/**
 * admin_create_tag tool implementation.
 *
 * Creates a new tag via the Ghost Admin API.
 */

import type { GhostClient } from '../../client/ghost-client.js';
import type { AdminTagsResponse } from '../../types/ghost-api.js';
import type { AdminCreateTagInput } from './schemas.js';

export const TOOL_NAME = 'admin_create_tag';

export const TOOL_DESCRIPTION = `Create a new tag via Ghost Admin API.

USE CASE:
- Create a new category for organizing posts
- Set up internal tags (prefix with #) for private categorization
- Create tags with custom metadata and images

INTERNAL TAGS: Start name with '#' (e.g., "#internal-note") to create
tags that won't appear publicly but can be used for filtering.

RETURNS: Created tag with id, slug, and updated_at.
Use the tag's id, name, or slug when assigning to posts.`;

export async function executeAdminCreateTag(
  client: GhostClient,
  input: AdminCreateTagInput
): Promise<AdminTagsResponse> {
  // Build tag object, removing undefined values
  const tag: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) {
      tag[key] = value;
    }
  }

  return client.post<AdminTagsResponse>('/tags/', {
    body: { tags: [tag] },
  });
}
