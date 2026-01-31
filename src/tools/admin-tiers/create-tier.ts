/**
 * admin_create_tier tool implementation.
 *
 * Creates a new tier via the Ghost Admin API.
 */

import type { GhostClient } from '../../client/ghost-client.js';
import type { AdminTiersResponse } from '../../types/ghost-api.js';
import type { AdminCreateTierInput } from './schemas.js';

export const TOOL_NAME = 'admin_create_tier';

export const TOOL_DESCRIPTION = `Create a new membership tier via Ghost Admin API.

USE CASE:
- Set up free membership tier for newsletter access
- Create paid subscription tiers with monthly/yearly pricing
- Add premium content access levels

FOR FREE TIERS:
- Set type: 'free' (default)
- No pricing required

FOR PAID TIERS:
- Set type: 'paid'
- currency: Required (e.g., "usd", "eur", "gbp")
- monthly_price and/or yearly_price: At least one required
- Prices in smallest unit (cents): 500 = $5.00 USD

BENEFITS: Array of benefit strings shown to potential subscribers.
Example: ["Access to premium articles", "Weekly newsletter", "Discord access"]

NOTE: Tier type and currency CANNOT be changed after creation.

RETURNS: Created tier with id (needed for admin_create_offer).`;

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
