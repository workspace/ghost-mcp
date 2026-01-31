/**
 * admin_read_site tool implementation.
 *
 * Reads site information from the Ghost Admin API.
 */

import type { GhostClient } from '../../client/ghost-client.js';
import type { AdminSiteResponse } from '../../types/ghost-api.js';

export const TOOL_NAME = 'admin_read_site';

export const TOOL_DESCRIPTION = `Read basic site information from Ghost Admin API.

USE CASE:
- Get site title and description
- Retrieve logo and icon URLs
- Check Ghost version and site URL

NOTE: For comprehensive settings (navigation, social, SEO, code injection),
use admin_read_settings instead. This endpoint returns only basic metadata.

RETURNS: Site object with title, description, logo, icon, accent_color, url, version.`;

export async function executeAdminReadSite(
  client: GhostClient
): Promise<AdminSiteResponse> {
  return client.get<AdminSiteResponse>('/site/');
}
