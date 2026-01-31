/**
 * admin_browse_newsletters tool implementation.
 *
 * Lists/browses newsletters from the Ghost Admin API with filtering and pagination.
 */

import type { GhostClient } from '../../client/ghost-client.js';
import type { AdminNewslettersResponse } from '../../types/ghost-api.js';
import type { AdminBrowseNewslettersInput } from './schemas.js';

export const TOOL_NAME = 'admin_browse_newsletters';

export const TOOL_DESCRIPTION = `Browse all newsletters from Ghost Admin API.

USE CASE:
- List all available newsletters
- Get newsletter IDs for subscribing members (admin_create_member, admin_update_member)
- Review newsletter configurations and subscriber counts

FILTER EXAMPLES:
- status:active (active newsletters only)
- status:archived (archived newsletters)

NOTE: Newsletter IDs are required when subscribing members to specific newsletters.

RETURNS: Array of newsletters with sender settings and status.`;

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
