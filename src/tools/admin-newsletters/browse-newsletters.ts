/**
 * admin_browse_newsletters tool implementation.
 *
 * Lists/browses newsletters from the Ghost Admin API with filtering and pagination.
 */

import type { GhostClient } from '../../client/ghost-client.js';
import type { AdminNewslettersResponse } from '../../types/ghost-api.js';
import type { AdminBrowseNewslettersInput } from './schemas.js';

export const TOOL_NAME = 'admin_browse_newsletters';

export const TOOL_DESCRIPTION =
  'Browse newsletters from the Ghost Admin API. Returns all newsletters with optional filtering, pagination, and related data. Newsletters are email publications that members can subscribe to.';

export async function executeAdminBrowseNewsletters(
  client: GhostClient,
  input: AdminBrowseNewslettersInput
): Promise<AdminNewslettersResponse> {
  const params: Record<string, string | number | undefined> = {
    include: input.include,
    filter: input.filter,
    limit: input.limit,
    page: input.page,
    order: input.order,
  };

  // Remove undefined values
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined)
  );

  return client.get<AdminNewslettersResponse>('/newsletters/', {
    params: cleanParams,
  });
}
