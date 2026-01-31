/**
 * admin_create_invite tool implementation.
 *
 * Creates a staff invitation via the Ghost Admin API.
 */

import type { GhostClient } from '../../client/ghost-client.js';
import type { AdminInvitesResponse } from '../../types/ghost-api.js';
import type { AdminCreateInviteInput } from './schemas.js';

export const TOOL_NAME = 'admin_create_invite';

export const TOOL_DESCRIPTION = `Invite a new staff member via Ghost Admin API. Sends an email invitation.

USE CASE:
- Invite writers, editors, or administrators to your Ghost site
- Onboard new team members with appropriate permissions
- Grant access to specific roles (Author, Editor, Administrator, etc.)

PREREQUISITE: Call admin_browse_roles first to get available role IDs.

WORKFLOW:
1. admin_browse_roles() -> find role_id for desired role (e.g., "Editor")
2. admin_create_invite(email: "newstaff@example.com", role_id: "role-uuid")

NOTE: The invited user will receive an email to set up their account.

RETURNS: Created invite object with status and expiry information.`;

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
