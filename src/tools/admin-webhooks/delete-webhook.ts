/**
 * admin_delete_webhook tool implementation.
 *
 * Deletes a webhook via the Ghost Admin API.
 */

import type { GhostClient } from '../../client/ghost-client.js';
import type { AdminDeleteWebhookInput } from './schemas.js';

export const TOOL_NAME = 'admin_delete_webhook';

export const TOOL_DESCRIPTION =
  'Delete a webhook via the Ghost Admin API. This action is permanent and cannot be undone.';

/**
 * Response from delete operation.
 */
export interface DeleteWebhookResponse {
  success: boolean;
}

export async function executeAdminDeleteWebhook(
  client: GhostClient,
  input: AdminDeleteWebhookInput
): Promise<DeleteWebhookResponse> {
  await client.delete<void>(`/webhooks/${input.id}/`);
  return { success: true };
}
