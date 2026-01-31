/**
 * admin_read_user tool implementation.
 *
 * Reads a single user from the Ghost Admin API by ID or slug.
 */

import type { GhostClient } from '../../client/ghost-client.js';
import type { AdminUsersResponse } from '../../types/ghost-api.js';
import type { AdminReadUserInput } from './schemas.js';

export const TOOL_NAME = 'admin_read_user';

export const TOOL_DESCRIPTION =
  'Read a single staff user from the Ghost Admin API by ID or slug. Returns the full user data including roles and profile information.';

export async function executeAdminReadUser(
  client: GhostClient,
  input: AdminReadUserInput
): Promise<AdminUsersResponse> {
  const params: Record<string, string | undefined> = {
    include: input.include,
    fields: input.fields,
  };

  // Remove undefined values
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined)
  );

  // Determine endpoint based on id or slug
  const endpoint = input.id
    ? `/users/${input.id}/`
    : `/users/slug/${input.slug}/`;

  return client.get<AdminUsersResponse>(endpoint, { params: cleanParams });
}
