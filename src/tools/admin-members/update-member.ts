/**
 * admin_update_member tool implementation.
 *
 * Updates an existing member via the Ghost Admin API.
 */

import type { GhostClient } from '../../client/ghost-client.js';
import type { AdminMembersResponse } from '../../types/ghost-api.js';
import type { AdminUpdateMemberInput } from './schemas.js';

export const TOOL_NAME = 'admin_update_member';

export const TOOL_DESCRIPTION =
  'Update an existing member via the Ghost Admin API. Requires the member ID and updated_at timestamp for conflict prevention. Returns the updated member.';

export async function executeAdminUpdateMember(
  client: GhostClient,
  input: AdminUpdateMemberInput
): Promise<AdminMembersResponse> {
  const { id, ...memberData } = input;

  // Build member object with only defined values
  const member: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(memberData)) {
    if (value !== undefined) {
      member[key] = value;
    }
  }

  return client.put<AdminMembersResponse>(`/members/${id}/`, {
    body: { members: [member] },
  });
}
