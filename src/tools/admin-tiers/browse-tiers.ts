/**
 * admin_browse_tiers tool implementation.
 *
 * Lists/browses tiers from the Ghost Admin API with filtering and pagination.
 */

import type { GhostClient } from '../../client/ghost-client.js';
import type { AdminTiersResponse } from '../../types/ghost-api.js';
import type { AdminBrowseTiersInput } from './schemas.js';

export const TOOL_NAME = 'admin_browse_tiers';

export const TOOL_DESCRIPTION =
  'Browse tiers from the Ghost Admin API. Returns all tiers with optional filtering, pagination, and related data. Tiers are membership levels that define access to content.';

export async function executeAdminBrowseTiers(
  client: GhostClient,
  input: AdminBrowseTiersInput
): Promise<AdminTiersResponse> {
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

  return client.get<AdminTiersResponse>('/tiers/', { params: cleanParams });
}
