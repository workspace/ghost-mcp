/**
 * admin_create_offer tool implementation.
 *
 * Creates a new offer via the Ghost Admin API.
 */

import type { GhostClient } from '../../client/ghost-client.js';
import type { AdminOffersResponse } from '../../types/ghost-api.js';
import type { AdminCreateOfferInput } from './schemas.js';

export const TOOL_NAME = 'admin_create_offer';

export const TOOL_DESCRIPTION = `Create a promotional offer (discount/trial) for paid memberships.

USE CASE:
- Create percentage discounts for new subscribers (e.g., 20% off)
- Offer free trial periods before billing starts
- Run promotional campaigns with unique discount codes

PREREQUISITE: Call admin_browse_tiers first to get the tier ID for paid tiers.

WORKFLOW:
1. admin_browse_tiers(filter: "type:paid") -> get tier ID
2. admin_create_offer(name: "Summer Sale", tier: "tier-uuid", ...)

OFFER TYPES:
- percent: 1-100 percentage discount (amount = percentage)
- fixed: Fixed amount discount in cents (requires currency)
- trial: Free trial in days (amount = number of days)

DURATION OPTIONS:
- once: Discount applies to first payment only
- forever: Discount applies to all future payments
- repeating: Discount for X months (set duration_in_months)
- trial: For trial type offers only

RETURNS: Created offer with shareable URL and redemption code.`;

export async function executeAdminCreateOffer(
  client: GhostClient,
  input: AdminCreateOfferInput
): Promise<AdminOffersResponse> {
  // Build offer object, removing undefined values
  const offer: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) {
      // Tier needs to be wrapped as an object with id property
      if (key === 'tier') {
        offer[key] = { id: value };
      } else {
        offer[key] = value;
      }
    }
  }

  return client.post<AdminOffersResponse>('/offers/', {
    body: { offers: [offer] },
  });
}
