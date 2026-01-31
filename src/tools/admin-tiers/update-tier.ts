/**
 * admin_update_tier tool implementation.
 *
 * Updates an existing tier via the Ghost Admin API.
 */

import type { GhostClient } from '../../client/ghost-client.js';
import type { AdminTiersResponse } from '../../types/ghost-api.js';
import type { AdminUpdateTierInput } from './schemas.js';

export const TOOL_NAME = 'admin_update_tier';

export const TOOL_DESCRIPTION =
  'Update an existing tier via the Ghost Admin API. Requires the tier ID and updated_at timestamp for conflict prevention. Note: type and currency cannot be changed after creation. Returns the updated tier.';

export async function executeAdminUpdateTier(
  client: GhostClient,
  input: AdminUpdateTierInput
): Promise<AdminTiersResponse> {
  const { id, ...tierData } = input;

  // Build tier object with only defined values
  const tier: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(tierData)) {
    if (value !== undefined) {
      tier[key] = value;
    }
  }

  return client.put<AdminTiersResponse>(`/tiers/${id}/`, {
    body: { tiers: [tier] },
  });
}
