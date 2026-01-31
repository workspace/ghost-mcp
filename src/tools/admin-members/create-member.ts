/**
 * admin_create_member tool implementation.
 *
 * Creates a new member via the Ghost Admin API.
 */

import type { GhostClient } from '../../client/ghost-client.js';
import type { AdminMembersResponse } from '../../types/ghost-api.js';
import type { AdminCreateMemberInput } from './schemas.js';

export const TOOL_NAME = 'admin_create_member';

export const TOOL_DESCRIPTION =
  'Create a new member via the Ghost Admin API. Requires at minimum an email address. Returns the created member.';

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
