/**
 * admin_read_site tool implementation.
 *
 * Reads site information from the Ghost Admin API.
 */

import type { GhostClient } from '../../client/ghost-client.js';
import type { AdminSiteResponse } from '../../types/ghost-api.js';

export const TOOL_NAME = 'admin_read_site';

export const TOOL_DESCRIPTION =
  'Read site information from the Ghost Admin API. Returns basic site metadata including title, description, logo, icon, accent color, URL, and Ghost version.';

export async function executeAdminReadSite(
  client: GhostClient
): Promise<AdminSiteResponse> {
  return client.get<AdminSiteResponse>('/site/');
}
