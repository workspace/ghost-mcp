/**
 * admin_read_settings tool implementation.
 *
 * Reads site settings from the Ghost Admin API.
 */

import type { GhostClient } from '../../client/ghost-client.js';
import type { AdminSettingsResponse } from '../../types/ghost-api.js';

export const TOOL_NAME = 'admin_read_settings';

export const TOOL_DESCRIPTION = `Read comprehensive site settings from Ghost Admin API.

USE CASE:
- Get full site configuration
- Review navigation structure (primary/secondary)
- Check social media links and SEO settings
- Review code injection (header/footer scripts)
- Check membership and subscription settings

INCLUDES:
- Branding: title, description, logo, cover_image, accent_color
- Navigation: primary and secondary navigation arrays
- Social: facebook, twitter URLs
- SEO: meta_title, meta_description, og_image, twitter_card
- Code injection: codeinjection_head, codeinjection_foot
- Members: members_signup_access, members_support_address

RETURNS: Settings object with all site configuration options.`;

export async function executeAdminReadSettings(
  client: GhostClient
): Promise<AdminSettingsResponse> {
  return client.get<AdminSettingsResponse>('/settings/');
}
