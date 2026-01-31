/**
 * admin_create_offer tool implementation.
 *
 * Creates a new offer via the Ghost Admin API.
 */

import type { GhostClient } from '../../client/ghost-client.js';
import type { AdminOffersResponse } from '../../types/ghost-api.js';
import type { AdminCreateOfferInput } from './schemas.js';

export const TOOL_NAME = 'admin_create_offer';

export const TOOL_DESCRIPTION =
  'Create a new offer via the Ghost Admin API. Requires name, code, tier (ID), cadence, type, amount, and duration. For fixed-type offers, currency is also required. Returns the created offer.';

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
