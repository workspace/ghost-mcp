/**
 * admin_update_webhook tool implementation.
 *
 * Updates an existing webhook via the Ghost Admin API.
 */

import type { GhostClient } from '../../client/ghost-client.js';
import type { AdminWebhooksResponse } from '../../types/ghost-api.js';
import type { AdminUpdateWebhookInput } from './schemas.js';

export const TOOL_NAME = 'admin_update_webhook';

export const TOOL_DESCRIPTION =
  'Update an existing webhook via the Ghost Admin API. Requires the webhook ID. Optional: event, target_url, name, api_version. Returns the updated webhook.';

export async function executeAdminUpdateWebhook(
  client: GhostClient,
  input: AdminUpdateWebhookInput
): Promise<AdminWebhooksResponse> {
  const { id, ...webhookData } = input;

  // Build webhook object with only defined values
  const webhook: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(webhookData)) {
    if (value !== undefined) {
      webhook[key] = value;
    }
  }

  return client.put<AdminWebhooksResponse>(`/webhooks/${id}/`, {
    body: { webhooks: [webhook] },
  });
}
