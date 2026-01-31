/**
 * admin_upload_theme tool implementation.
 *
 * Uploads a theme .zip file to the Ghost Admin API.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { GhostClient } from '../../client/ghost-client.js';
import type { AdminThemesResponse } from '../../types/ghost-api.js';
import type { AdminUploadThemeInput } from './schemas.js';

export const TOOL_NAME = 'admin_upload_theme';

export const TOOL_DESCRIPTION = `Upload a Ghost theme. Provide a local file path to a .zip file containing a valid Ghost theme.

The theme must be a valid Ghost theme structure (with package.json, templates, etc.).
Returns the uploaded theme details including name, activation status, and available templates.`;

/**
 * Executes the admin_upload_theme tool.
 *
 * @param client - Ghost API client
 * @param input - Upload parameters
 * @returns Theme upload response
 */
export async function executeAdminUploadTheme(
  client: GhostClient,
  input: AdminUploadThemeInput
): Promise<AdminThemesResponse> {
  const { file_path } = input;

  // Resolve the file path (handle relative paths)
  const resolvedPath = path.resolve(file_path);

  // Check if file exists
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`File not found: ${resolvedPath}`);
  }

  // Check file stats
  const stats = fs.statSync(resolvedPath);
  if (!stats.isFile()) {
    throw new Error(`Path is not a file: ${resolvedPath}`);
  }

  // Validate file extension
  const ext = path.extname(resolvedPath).toLowerCase();
  if (ext !== '.zip') {
    throw new Error(`Invalid file type "${ext}". Theme must be a .zip file.`);
  }

  // Read file into buffer
  const fileBuffer = fs.readFileSync(resolvedPath);
  const fileName = path.basename(resolvedPath);

  // Create Blob from buffer
  const blob = new Blob([fileBuffer], { type: 'application/zip' });

  // Build FormData
  const formData = new FormData();
  formData.append('file', blob, fileName);

  // Upload to Ghost API
  return client.uploadFormData<AdminThemesResponse>(
    '/themes/upload/',
    formData
  );
}
