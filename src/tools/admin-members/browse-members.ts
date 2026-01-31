/**
 * admin_browse_members tool implementation.
 *
 * Lists/browses members from the Ghost Admin API with filtering and pagination.
 */

import type { GhostClient } from '../../client/ghost-client.js';
import type { AdminMembersResponse } from '../../types/ghost-api.js';
import type { AdminBrowseMembersInput } from './schemas.js';

export const TOOL_NAME = 'admin_browse_members';

export const TOOL_DESCRIPTION =
  'Browse members from the Ghost Admin API. Returns members with optional filtering, pagination, and related data like labels and newsletters.';

export async function executeAdminBrowseMembers(
  client: GhostClient,
  input: AdminBrowseMembersInput
): Promise<AdminMembersResponse> {
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

  return client.get<AdminMembersResponse>('/members/', { params: cleanParams });
}
