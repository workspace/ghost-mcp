/**
 * admin_activate_theme tool implementation.
 *
 * Activates an installed Ghost theme.
 */

import type { GhostClient } from '../../client/ghost-client.js';
import type { AdminThemesResponse } from '../../types/ghost-api.js';
import type { AdminActivateThemeInput } from './schemas.js';

export const TOOL_NAME = 'admin_activate_theme';

export const TOOL_DESCRIPTION = `Activate an installed Ghost theme by name.

The theme must already be installed on the Ghost site. Use admin_upload_theme to install a new theme first.
Returns the activated theme details including name and templates.`;

/**
 * Executes the admin_activate_theme tool.
 *
 * @param client - Ghost API client
 * @param input - Activation parameters
 * @returns Theme activation response
 */
export async function executeAdminActivateTheme(
  client: GhostClient,
  input: AdminActivateThemeInput
): Promise<AdminThemesResponse> {
  const { name } = input;

  // Activate theme via PUT request
  return client.put<AdminThemesResponse>(`/themes/${name}/activate/`);
}
