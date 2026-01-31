/**
 * admin_update_tier tool implementation.
 *
 * Updates an existing tier via the Ghost Admin API.
 */

import type { GhostClient } from '../../client/ghost-client.js';
import type { AdminTiersResponse } from '../../types/ghost-api.js';
import type { AdminUpdateTierInput } from './schemas.js';

export const TOOL_NAME = 'admin_update_tier';

export const TOOL_DESCRIPTION = `Update an existing membership tier via Ghost Admin API.

USE CASE:
- Change tier name, description, or benefits
- Update pricing (monthly_price, yearly_price)
- Archive a tier (set active: false)

PREREQUISITE: Call admin_read_tier first to get the current updated_at timestamp.

WORKFLOW:
1. admin_read_tier(id: "tier-id") -> get updated_at value
2. admin_update_tier(id: "tier-id", updated_at: "...", name: "New Name")

LIMITATIONS:
- type (free/paid) CANNOT be changed after creation
- currency CANNOT be changed after creation

RETURNS: Updated tier with new updated_at timestamp.`;

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
