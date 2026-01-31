/**
 * admin_create_newsletter tool implementation.
 *
 * Creates a new newsletter via the Ghost Admin API.
 */

import type { GhostClient } from '../../client/ghost-client.js';
import type { AdminNewslettersResponse } from '../../types/ghost-api.js';
import type { AdminCreateNewsletterInput } from './schemas.js';

export const TOOL_NAME = 'admin_create_newsletter';

export const TOOL_DESCRIPTION = `Create a new newsletter via Ghost Admin API.

USE CASE:
- Set up a new email newsletter for subscribers
- Create segmented newsletters for different audiences
- Configure newsletter branding and sender details

SENDER OPTIONS:
- sender_email: Custom sender email address
- sender_reply_to: Reply-to address (newsletter, support, or custom)
- sender_name: Display name for the sender

SUBSCRIPTION:
- subscribe_on_signup: Auto-subscribe new members (default: true)
- Members can be subscribed via admin_create_member or admin_update_member

NOTE: Newsletter IDs are used when creating/updating members to manage subscriptions.

RETURNS: Created newsletter with id (needed for member subscriptions).`;

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
