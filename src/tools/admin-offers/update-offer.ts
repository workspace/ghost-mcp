/**
 * admin_update_offer tool implementation.
 *
 * Updates an existing offer via the Ghost Admin API.
 */

import type { GhostClient } from '../../client/ghost-client.js';
import type { AdminOffersResponse } from '../../types/ghost-api.js';
import type { AdminUpdateOfferInput } from './schemas.js';

export const TOOL_NAME = 'admin_update_offer';

export const TOOL_DESCRIPTION =
  'Update an existing offer via the Ghost Admin API. Requires the offer ID and updated_at timestamp for conflict prevention. Note: type, cadence, amount, duration, duration_in_months, currency, and tier cannot be changed after creation. Returns the updated offer.';

export async function executeAdminUpdateOffer(
  client: GhostClient,
  input: AdminUpdateOfferInput
): Promise<AdminOffersResponse> {
  const { id, ...offerData } = input;

  // Build offer object with only defined values
  const offer: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(offerData)) {
    if (value !== undefined) {
      offer[key] = value;
    }
  }

  return client.put<AdminOffersResponse>(`/offers/${id}/`, {
    body: { offers: [offer] },
  });
}
