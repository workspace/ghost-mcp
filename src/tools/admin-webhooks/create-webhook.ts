/**
 * admin_create_webhook tool implementation.
 *
 * Creates a new webhook via the Ghost Admin API.
 */

import type { GhostClient } from '../../client/ghost-client.js';
import type { AdminWebhooksResponse } from '../../types/ghost-api.js';
import type { AdminCreateWebhookInput } from './schemas.js';

export const TOOL_NAME = 'admin_create_webhook';

export const TOOL_DESCRIPTION = `Create a webhook to receive notifications about Ghost events.

USE CASE:
- Notify external service when a post is published
- Trigger builds when content changes (site.changed)
- Sync member data when members are added/edited

COMMON EVENTS:
- site.changed: Any content change (good for static site rebuilds)
- post.published: When a post is published
- post.added: When a new post is created
- member.added: When a new member signs up
- page.published: When a page is published

ALL EVENTS: site.changed, post.added, post.deleted, post.edited,
post.published, post.unpublished, post.scheduled, post.unscheduled,
post.rescheduled, page.added, page.deleted, page.edited, page.published,
page.unpublished, tag.added, tag.edited, tag.deleted, member.added,
member.edited, member.deleted

SECRET: Optional shared secret for webhook signature verification (HMAC).

RETURNS: Created webhook with id for future updates/deletion.`;

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
