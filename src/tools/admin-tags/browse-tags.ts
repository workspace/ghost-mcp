/**
 * admin_browse_tags tool implementation.
 *
 * Lists/browses tags from the Ghost Admin API with filtering and pagination.
 */

import type { GhostClient } from '../../client/ghost-client.js';
import type { AdminTagsResponse } from '../../types/ghost-api.js';
import type { AdminBrowseTagsInput } from './schemas.js';

export const TOOL_NAME = 'admin_browse_tags';

export const TOOL_DESCRIPTION =
  'Browse tags from the Ghost Admin API. Returns all tags with optional filtering, pagination, and related data.';

export async function executeAdminBrowseTags(
  client: GhostClient,
  input: AdminBrowseTagsInput
): Promise<AdminTagsResponse> {
  const params: Record<string, string | number | undefined> = {
    include: input.include,
    fields: input.fields,
    filter: input.filter,
    limit: input.limit,
    page: input.page,
    order: input.order,
  };

  // Remove undefined values
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined)
  );

  return client.get<AdminTagsResponse>('/tags/', { params: cleanParams });
}
