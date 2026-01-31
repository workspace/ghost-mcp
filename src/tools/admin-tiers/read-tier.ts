/**
 * admin_read_tier tool implementation.
 *
 * Reads a single tier from the Ghost Admin API by ID or slug.
 */

import type { GhostClient } from '../../client/ghost-client.js';
import type { AdminTiersResponse } from '../../types/ghost-api.js';
import type { AdminReadTierInput } from './schemas.js';

export const TOOL_NAME = 'admin_read_tier';

export const TOOL_DESCRIPTION =
  'Read a single tier from the Ghost Admin API by ID or slug. Returns the full tier data including pricing and benefits.';

export async function executeAdminReadTier(
  client: GhostClient,
  input: AdminReadTierInput
): Promise<AdminTiersResponse> {
  const params: Record<string, string | undefined> = {
    include: input.include,
  };

  // Remove undefined values
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined)
  );

  // Determine endpoint based on id or slug
  const endpoint = input.id
    ? `/tiers/${input.id}/`
    : `/tiers/slug/${input.slug}/`;

  return client.get<AdminTiersResponse>(endpoint, { params: cleanParams });
}
