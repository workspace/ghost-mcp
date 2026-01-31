/**
 * admin_browse_users tool implementation.
 *
 * Lists/browses staff users from the Ghost Admin API with filtering and pagination.
 */

import type { GhostClient } from '../../client/ghost-client.js';
import type { AdminUsersResponse } from '../../types/ghost-api.js';
import type { AdminBrowseUsersInput } from './schemas.js';

export const TOOL_NAME = 'admin_browse_users';

export const TOOL_DESCRIPTION = `Browse staff users from Ghost Admin API.

USE CASE:
- List all staff members (authors, editors, administrators)
- Get user IDs/slugs for assigning as post authors
- Review staff roles and post counts

INCLUDE OPTIONS:
- roles: Include user roles
- count.posts: Include post count per user

NOTE: Staff users are different from members. Staff can create/edit content.
For newsletter subscribers, use admin_browse_members instead.

RETURNS: Array of staff users with roles and metadata.`;

export async function executeAdminBrowseUsers(
  client: GhostClient,
  input: AdminBrowseUsersInput
): Promise<AdminUsersResponse> {
  const params: Record<string, string | number | undefined> = {
    include: input.include,
    fields: input.fields,
    filter: input.filter,
    limit: input.limit,
    page: input.page,
    order: input.order,
  };

  // Remove undefined values
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined)
  );

  return client.get<AdminUsersResponse>('/users/', { params: cleanParams });
}
