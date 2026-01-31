/**
 * admin_browse_pages tool implementation.
 *
 * Lists/browses pages from the Ghost Admin API with filtering and pagination.
 */

import type { GhostClient } from '../../client/ghost-client.js';
import type { AdminPagesResponse } from '../../types/ghost-api.js';
import type { AdminBrowsePagesInput } from './schemas.js';

export const TOOL_NAME = 'admin_browse_pages';

export const TOOL_DESCRIPTION =
  'Browse pages from the Ghost Admin API. Returns all pages including drafts with optional filtering, pagination, and related data. Pages are static content not included in feeds or collections.';

export async function executeAdminBrowsePages(
  client: GhostClient,
  input: AdminBrowsePagesInput
): Promise<AdminPagesResponse> {
  const params: Record<string, string | number | undefined> = {
    include: input.include,
    fields: input.fields,
    formats: input.formats,
    filter: input.filter,
    limit: input.limit,
    page: input.page,
    order: input.order,
  };

  // Remove undefined values
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined)
  );

  return client.get<AdminPagesResponse>('/pages/', { params: cleanParams });
}
