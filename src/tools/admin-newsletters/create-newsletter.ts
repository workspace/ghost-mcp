/**
 * admin_create_newsletter tool implementation.
 *
 * Creates a new newsletter via the Ghost Admin API.
 */

import type { GhostClient } from '../../client/ghost-client.js';
import type { AdminNewslettersResponse } from '../../types/ghost-api.js';
import type { AdminCreateNewsletterInput } from './schemas.js';

export const TOOL_NAME = 'admin_create_newsletter';

export const TOOL_DESCRIPTION =
  'Create a new newsletter via the Ghost Admin API. Requires at minimum a name. Returns the created newsletter with all settings.';

export async function executeAdminCreateNewsletter(
  client: GhostClient,
  input: AdminCreateNewsletterInput
): Promise<AdminNewslettersResponse> {
  // Build newsletter object, removing undefined values
  const newsletter: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) {
      newsletter[key] = value;
    }
  }

  return client.post<AdminNewslettersResponse>('/newsletters/', {
    body: { newsletters: [newsletter] },
  });
}
