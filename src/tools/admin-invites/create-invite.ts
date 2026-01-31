/**
 * admin_create_invite tool implementation.
 *
 * Creates a staff invitation via the Ghost Admin API.
 */

import type { GhostClient } from '../../client/ghost-client.js';
import type { AdminInvitesResponse } from '../../types/ghost-api.js';
import type { AdminCreateInviteInput } from './schemas.js';

export const TOOL_NAME = 'admin_create_invite';

export const TOOL_DESCRIPTION =
  'Create a staff invitation via the Ghost Admin API. Sends an email invitation to the specified address with the assigned role. Use admin_browse_roles to get available role IDs.';

export async function executeAdminCreateInvite(
  client: GhostClient,
  input: AdminCreateInviteInput
): Promise<AdminInvitesResponse> {
  const invite = {
    email: input.email,
    role_id: input.role_id,
  };

  return client.post<AdminInvitesResponse>('/invites/', {
    body: { invites: [invite] },
  });
}
