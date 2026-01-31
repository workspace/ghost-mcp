/**
 * admin_read_member tool implementation.
 *
 * Reads a single member from the Ghost Admin API by ID or email.
 */

import type { GhostClient } from '../../client/ghost-client.js';
import type { AdminMembersResponse } from '../../types/ghost-api.js';
import type { AdminReadMemberInput } from './schemas.js';

export const TOOL_NAME = 'admin_read_member';

export const TOOL_DESCRIPTION =
  'Read a single member from the Ghost Admin API by ID or email. Returns the full member data including labels and newsletter subscriptions.';

export async function executeAdminReadMember(
  client: GhostClient,
  input: AdminReadMemberInput
): Promise<AdminMembersResponse> {
  const params: Record<string, string | undefined> = {
    include: input.include,
    fields: input.fields,
  };

  // Remove undefined values
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined)
  );

  // Determine endpoint based on id or email
  const endpoint = input.id
    ? `/members/${input.id}/`
    : `/members/email/${input.email}/`;

  return client.get<AdminMembersResponse>(endpoint, { params: cleanParams });
}
