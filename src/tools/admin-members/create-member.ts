/**
 * admin_create_member tool implementation.
 *
 * Creates a new member via the Ghost Admin API.
 */

import type { GhostClient } from '../../client/ghost-client.js';
import type { AdminMembersResponse } from '../../types/ghost-api.js';
import type { AdminCreateMemberInput } from './schemas.js';

export const TOOL_NAME = 'admin_create_member';

export const TOOL_DESCRIPTION = `Create a new member (subscriber) via Ghost Admin API.

USE CASE:
- Import subscribers from another platform
- Create member accounts programmatically
- Add complimentary premium access (set comped: true)
- Subscribe members to specific newsletters

OPTIONAL PREREQUISITE:
- admin_browse_newsletters to get newsletter IDs for subscription

LABELS: Array of objects, each with {id}, {name}, or {slug}.
Example: [{"name": "VIP"}, {"slug": "early-access"}]

NEWSLETTERS: Array of objects with required 'id' field.
Example: [{"id": "newsletter-uuid-here"}]

NOTE: Set comped: true to grant free premium access without payment.

RETURNS: Created member object with id and subscription status.`;

export async function executeAdminCreateMember(
  client: GhostClient,
  input: AdminCreateMemberInput
): Promise<AdminMembersResponse> {
  // Build member object, removing undefined values
  const member: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) {
      member[key] = value;
    }
  }

  return client.post<AdminMembersResponse>('/members/', {
    body: { members: [member] },
  });
}
