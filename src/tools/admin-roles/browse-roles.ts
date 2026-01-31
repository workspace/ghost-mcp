/**
 * admin_browse_roles tool implementation.
 *
 * Lists/browses available roles from the Ghost Admin API.
 */

import type { GhostClient } from '../../client/ghost-client.js';
import type { AdminRolesResponse } from '../../types/ghost-api.js';
import type { AdminBrowseRolesInput } from './schemas.js';

export const TOOL_NAME = 'admin_browse_roles';

export const TOOL_DESCRIPTION = `Browse available staff roles from Ghost Admin API.

USE CASE:
- Get role IDs before creating staff invites (admin_create_invite)
- Review available permission levels

COMMON ROLES:
- Administrator: Full access to all settings and content
- Editor: Can manage all posts and pages, but not settings
- Author: Can create and edit their own posts
- Contributor: Can create posts but not publish

NOTE: Role IDs are REQUIRED when using admin_create_invite.

RETURNS: Array of roles with id, name, and description.`;

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
