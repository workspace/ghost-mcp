/**
 * admin_create_tier tool implementation.
 *
 * Creates a new tier via the Ghost Admin API.
 */

import type { GhostClient } from '../../client/ghost-client.js';
import type { AdminTiersResponse } from '../../types/ghost-api.js';
import type { AdminCreateTierInput } from './schemas.js';

export const TOOL_NAME = 'admin_create_tier';

export const TOOL_DESCRIPTION =
  'Create a new tier via the Ghost Admin API. Requires at minimum a name. For paid tiers, also requires currency and at least one price (monthly_price or yearly_price). Returns the created tier.';

export async function executeAdminCreateTier(
  client: GhostClient,
  input: AdminCreateTierInput
): Promise<AdminTiersResponse> {
  // Build tier object, removing undefined values
  const tier: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) {
      tier[key] = value;
    }
  }

  return client.post<AdminTiersResponse>('/tiers/', {
    body: { tiers: [tier] },
  });
}
