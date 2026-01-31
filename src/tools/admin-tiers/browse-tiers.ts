/**
 * admin_browse_tiers tool implementation.
 *
 * Lists/browses tiers from the Ghost Admin API with filtering and pagination.
 */

import type { GhostClient } from '../../client/ghost-client.js';
import type { AdminTiersResponse } from '../../types/ghost-api.js';
import type { AdminBrowseTiersInput } from './schemas.js';

export const TOOL_NAME = 'admin_browse_tiers';

export const TOOL_DESCRIPTION = `Browse all membership tiers from Ghost Admin API.

USE CASE:
- List all membership tiers (free and paid)
- Get tier IDs for admin_create_offer (required for offers)
- Review pricing and benefits of existing tiers

FILTER EXAMPLES:
- type:paid (paid tiers only, for creating offers)
- type:free (free tiers only)
- active:true (active tiers only)

NOTE: Tier IDs are required for creating offers (admin_create_offer).

RETURNS: Array of tiers with pricing, benefits, and metadata.`;

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
