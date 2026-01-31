/**
 * admin_read_settings tool implementation.
 *
 * Reads site settings from the Ghost Admin API.
 */

import type { GhostClient } from '../../client/ghost-client.js';
import type { AdminSettingsResponse } from '../../types/ghost-api.js';

export const TOOL_NAME = 'admin_read_settings';

export const TOOL_DESCRIPTION =
  'Read site settings from the Ghost Admin API. Returns comprehensive site configuration including branding, navigation, social links, SEO metadata, code injection, and member settings.';

export async function executeAdminReadSettings(
  client: GhostClient
): Promise<AdminSettingsResponse> {
  return client.get<AdminSettingsResponse>('/settings/');
}
