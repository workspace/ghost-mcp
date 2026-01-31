/**
 * admin_browse_offers tool implementation.
 *
 * Lists/browses offers from the Ghost Admin API with filtering and pagination.
 */

import type { GhostClient } from '../../client/ghost-client.js';
import type { AdminOffersResponse } from '../../types/ghost-api.js';
import type { AdminBrowseOffersInput } from './schemas.js';

export const TOOL_NAME = 'admin_browse_offers';

export const TOOL_DESCRIPTION =
  'Browse offers from the Ghost Admin API. Returns all offers with optional filtering and pagination. Offers are discount codes that can be applied to subscription tiers.';

export async function executeAdminBrowseOffers(
  client: GhostClient,
  input: AdminBrowseOffersInput
): Promise<AdminOffersResponse> {
  const params: Record<string, string | number | undefined> = {
    filter: input.filter,
    limit: input.limit,
    page: input.page,
    order: input.order,
  };

  // Remove undefined values
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined)
  );

  return client.get<AdminOffersResponse>('/offers/', { params: cleanParams });
}
