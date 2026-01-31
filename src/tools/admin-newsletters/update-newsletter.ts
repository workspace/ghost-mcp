/**
 * admin_update_newsletter tool implementation.
 *
 * Updates an existing newsletter via the Ghost Admin API.
 */

import type { GhostClient } from '../../client/ghost-client.js';
import type { AdminNewslettersResponse } from '../../types/ghost-api.js';
import type { AdminUpdateNewsletterInput } from './schemas.js';

export const TOOL_NAME = 'admin_update_newsletter';

export const TOOL_DESCRIPTION =
  'Update an existing newsletter via the Ghost Admin API. Requires the newsletter ID and updated_at timestamp for conflict prevention. Returns the updated newsletter.';

export async function executeAdminUpdateNewsletter(
  client: GhostClient,
  input: AdminUpdateNewsletterInput
): Promise<AdminNewslettersResponse> {
  const { id, ...newsletterData } = input;

  // Build newsletter object with only defined values
  const newsletter: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(newsletterData)) {
    if (value !== undefined) {
      newsletter[key] = value;
    }
  }

  return client.put<AdminNewslettersResponse>(`/newsletters/${id}/`, {
    body: { newsletters: [newsletter] },
  });
}
