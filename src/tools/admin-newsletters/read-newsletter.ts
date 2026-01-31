/**
 * admin_read_newsletter tool implementation.
 *
 * Reads a single newsletter from the Ghost Admin API by ID or slug.
 */

import type { GhostClient } from '../../client/ghost-client.js';
import type { AdminNewslettersResponse } from '../../types/ghost-api.js';
import type { AdminReadNewsletterInput } from './schemas.js';

export const TOOL_NAME = 'admin_read_newsletter';

export const TOOL_DESCRIPTION =
  'Read a single newsletter from the Ghost Admin API by ID or slug. Returns the full newsletter configuration including sender settings and design options.';

export async function executeAdminReadNewsletter(
  client: GhostClient,
  input: AdminReadNewsletterInput
): Promise<AdminNewslettersResponse> {
  const params: Record<string, string | undefined> = {
    include: input.include,
  };

  // Remove undefined values
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined)
  );

  // Determine endpoint based on id or slug
  const endpoint = input.id
    ? `/newsletters/${input.id}/`
    : `/newsletters/slug/${input.slug}/`;

  return client.get<AdminNewslettersResponse>(endpoint, { params: cleanParams });
}
