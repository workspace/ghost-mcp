/**
 * admin_create_webhook tool implementation.
 *
 * Creates a new webhook via the Ghost Admin API.
 */

import type { GhostClient } from '../../client/ghost-client.js';
import type { AdminWebhooksResponse } from '../../types/ghost-api.js';
import type { AdminCreateWebhookInput } from './schemas.js';

export const TOOL_NAME = 'admin_create_webhook';

export const TOOL_DESCRIPTION =
  'Create a new webhook via the Ghost Admin API. Requires event (trigger type) and target_url. Optional: name, secret, api_version. Returns the created webhook.';

export async function executeAdminCreateWebhook(
  client: GhostClient,
  input: AdminCreateWebhookInput
): Promise<AdminWebhooksResponse> {
  // Build webhook object, removing undefined values
  const webhook: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) {
      webhook[key] = value;
    }
  }

  return client.post<AdminWebhooksResponse>('/webhooks/', {
    body: { webhooks: [webhook] },
  });
}
