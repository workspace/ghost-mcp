/**
 * admin_upload_image tool implementation.
 *
 * Uploads an image to the Ghost Admin API.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { GhostClient } from '../../client/ghost-client.js';
import type { AdminImagesResponse } from '../../types/ghost-api.js';
import type { AdminUploadImageInput } from './schemas.js';

export const TOOL_NAME = 'admin_upload_image';

export const TOOL_DESCRIPTION = `Upload an image to Ghost. Provide a local file path to upload. Supported formats depend on purpose:
- 'image' (default): WEBP, JPEG, GIF, PNG, SVG
- 'profile_image': WEBP, JPEG, GIF, PNG, SVG (must be square)
- 'icon': WEBP, JPEG, GIF, PNG, SVG, ICO (must be square)

Returns the uploaded image URL which can be used in posts, pages, or settings.`;

/**
 * Valid MIME types by purpose.
 */
const MIME_TYPES: Record<string, Record<string, string>> = {
  image: {
    '.webp': 'image/webp',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
  },
  profile_image: {
    '.webp': 'image/webp',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
  },
  icon: {
    '.webp': 'image/webp',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
  },
};

/**
 * Gets the MIME type for a file based on its extension and purpose.
 */
function getMimeType(filePath: string, purpose: string): string | null {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = MIME_TYPES[purpose] ?? MIME_TYPES.image;
  return mimeTypes[ext] ?? null;
}

/**
 * Executes the admin_upload_image tool.
 *
 * @param client - Ghost API client
 * @param input - Upload parameters
 * @returns Image upload response with URL
 */
export async function executeAdminUploadImage(
  client: GhostClient,
  input: AdminUploadImageInput
): Promise<AdminImagesResponse> {
  const { file_path, purpose = 'image', ref } = input;

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

  // Validate MIME type
  const mimeType = getMimeType(resolvedPath, purpose);
  if (!mimeType) {
    const ext = path.extname(resolvedPath).toLowerCase();
    const validExtensions = Object.keys(
      MIME_TYPES[purpose] ?? MIME_TYPES.image
    ).join(', ');
    throw new Error(
      `Unsupported file type "${ext}" for purpose "${purpose}". Valid types: ${validExtensions}`
    );
  }

  // Read file into buffer
  const fileBuffer = fs.readFileSync(resolvedPath);
  const fileName = path.basename(resolvedPath);

  // Create Blob from buffer (Node.js 18+ has native Blob support)
  const blob = new Blob([fileBuffer], { type: mimeType });

  // Build FormData
  const formData = new FormData();
  formData.append('file', blob, fileName);
  formData.append('purpose', purpose);
  if (ref) {
    formData.append('ref', ref);
  }

  // Upload to Ghost API
  return client.uploadFormData<AdminImagesResponse>(
    '/images/upload/',
    formData
  );
}
