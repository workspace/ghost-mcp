/**
 * admin_browse_roles tool implementation.
 *
 * Lists/browses available roles from the Ghost Admin API.
 */

import type { GhostClient } from '../../client/ghost-client.js';
import type { AdminRolesResponse } from '../../types/ghost-api.js';
import type { AdminBrowseRolesInput } from './schemas.js';

export const TOOL_NAME = 'admin_browse_roles';

export const TOOL_DESCRIPTION =
  'Browse available staff roles from the Ghost Admin API. Returns all roles that can be assigned to staff users. Useful for getting role IDs when creating invites.';

export async function executeAdminBrowseRoles(
  client: GhostClient,
  input: AdminBrowseRolesInput
): Promise<AdminRolesResponse> {
  const params: Record<string, string | number | undefined> = {
    limit: input.limit,
    fields: input.fields,
  };

  // Remove undefined values
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined)
  );

  return client.get<AdminRolesResponse>('/roles/', { params: cleanParams });
}
