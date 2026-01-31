/**
 * admin_update_user tool implementation.
 *
 * Updates an existing staff user via the Ghost Admin API.
 */

import type { GhostClient } from '../../client/ghost-client.js';
import type { AdminUsersResponse } from '../../types/ghost-api.js';
import type { AdminUpdateUserInput } from './schemas.js';

export const TOOL_NAME = 'admin_update_user';

export const TOOL_DESCRIPTION =
  'Update an existing staff user via the Ghost Admin API. Requires the user ID and updated_at timestamp for conflict prevention. Returns the updated user.';

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
