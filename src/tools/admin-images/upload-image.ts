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

export const TOOL_DESCRIPTION = `Upload an image to Ghost. Provide either a local file path OR a URL.

IMAGE SOURCE (provide exactly one):
- file_path: Local filesystem path. Use when MCP server has filesystem access.
  Note: Does NOT work in sandboxed environments like Claude Desktop.
- url: Remote image URL. The server fetches and uploads to Ghost.
  Recommended for Claude Desktop or when image is already hosted online.

SUPPORTED FORMATS (by purpose):
- 'image' (default): WEBP, JPEG, GIF, PNG, SVG
- 'profile_image': WEBP, JPEG, GIF, PNG, SVG (must be square)
- 'icon': WEBP, JPEG, GIF, PNG, SVG, ICO (must be square)

RETURNS: Uploaded image URL for use in posts, pages, or settings.`;

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
 * Reverse mapping from MIME type to extension.
 */
const MIME_TO_EXT: Record<string, string> = {
  'image/webp': '.webp',
  'image/jpeg': '.jpg',
  'image/gif': '.gif',
  'image/png': '.png',
  'image/svg+xml': '.svg',
  'image/x-icon': '.ico',
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
 * Validates that a MIME type is allowed for the given purpose.
 */
function isValidMimeType(mimeType: string, purpose: string): boolean {
  const allowedMimes = Object.values(MIME_TYPES[purpose] ?? MIME_TYPES.image);
  return allowedMimes.includes(mimeType);
}

/**
 * Gets valid extensions for a purpose (for error messages).
 */
function getValidExtensions(purpose: string): string {
  return Object.keys(MIME_TYPES[purpose] ?? MIME_TYPES.image).join(', ');
}

/**
 * Fetches an image from a URL and returns its data.
 */
async function fetchImageFromUrl(
  imageUrl: string,
  purpose: string
): Promise<{ buffer: ArrayBuffer; mimeType: string; fileName: string }> {
  const response = await fetch(imageUrl);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch image from URL: ${response.status} ${response.statusText}`
    );
  }

  const contentType = response.headers.get('content-type') ?? '';
  const mimeType = contentType.split(';')[0].trim();

  if (!isValidMimeType(mimeType, purpose)) {
    throw new Error(
      `Unsupported image type "${mimeType}" for purpose "${purpose}". Valid types: ${getValidExtensions(purpose)}`
    );
  }

  const buffer = await response.arrayBuffer();

  // Extract filename from URL or generate one
  const urlPath = new URL(imageUrl).pathname;
  let fileName = path.basename(urlPath);

  // If no extension in filename, add one based on MIME type
  if (!path.extname(fileName)) {
    const ext = MIME_TO_EXT[mimeType] ?? '.jpg';
    fileName = fileName || 'image';
    fileName += ext;
  }

  return { buffer, mimeType, fileName };
}

/**
 * Reads an image from a local file path.
 */
function readImageFromFile(
  filePath: string,
  purpose: string
): { buffer: Buffer; mimeType: string; fileName: string } {
  const resolvedPath = path.resolve(filePath);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`File not found: ${resolvedPath}`);
  }

  const stats = fs.statSync(resolvedPath);
  if (!stats.isFile()) {
    throw new Error(`Path is not a file: ${resolvedPath}`);
  }

  const mimeType = getMimeType(resolvedPath, purpose);
  if (!mimeType) {
    const ext = path.extname(resolvedPath).toLowerCase();
    throw new Error(
      `Unsupported file type "${ext}" for purpose "${purpose}". Valid types: ${getValidExtensions(purpose)}`
    );
  }

  const buffer = fs.readFileSync(resolvedPath);
  const fileName = path.basename(resolvedPath);

  return { buffer, mimeType, fileName };
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
  const { file_path, url, purpose = 'image', ref } = input;

  let mimeType: string;
  let fileName: string;
  let arrayBuffer: ArrayBuffer;

  if (url) {
    // Fetch image from URL
    const fetched = await fetchImageFromUrl(url, purpose);
    mimeType = fetched.mimeType;
    fileName = fetched.fileName;
    arrayBuffer = fetched.buffer;
  } else if (file_path) {
    // Read image from local file
    const fileData = readImageFromFile(file_path, purpose);
    mimeType = fileData.mimeType;
    fileName = fileData.fileName;
    // Convert Buffer to ArrayBuffer (use Uint8Array to ensure ArrayBuffer type)
    const uint8 = new Uint8Array(fileData.buffer);
    arrayBuffer = uint8.buffer as ArrayBuffer;
  } else {
    throw new Error('Either file_path or url must be provided');
  }

  // Create Blob from ArrayBuffer
  const blob = new Blob([arrayBuffer], { type: mimeType });

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
