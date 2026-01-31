/**
 * admin_update_user tool implementation.
 *
 * Updates an existing staff user via the Ghost Admin API.
 */

import type { GhostClient } from '../../client/ghost-client.js';
import type { AdminUsersResponse } from '../../types/ghost-api.js';
import type { AdminUpdateUserInput } from './schemas.js';

export const TOOL_NAME = 'admin_update_user';

export const TOOL_DESCRIPTION = `Update an existing staff user via Ghost Admin API.

USE CASE:
- Update staff profile (name, bio, profile image)
- Change staff social media links
- Modify staff meta information

PREREQUISITE: Call admin_read_user first to get the current updated_at timestamp.

WORKFLOW:
1. admin_read_user(id: "user-id") -> get updated_at value
2. admin_update_user(id: "user-id", updated_at: "...", name: "New Name")

NOTE: To change a user's role, you need to modify role assignments separately.

RETURNS: Updated user with new updated_at timestamp.`;

export async function executeAdminUpdateUser(
  client: GhostClient,
  input: AdminUpdateUserInput
): Promise<AdminUsersResponse> {
  const { id, ...userData } = input;

  // Build user object with only defined values
  const user: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(userData)) {
    if (value !== undefined) {
      user[key] = value;
    }
  }

  return client.put<AdminUsersResponse>(`/users/${id}/`, {
    body: { users: [user] },
  });
}
