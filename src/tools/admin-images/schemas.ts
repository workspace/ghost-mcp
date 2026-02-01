/**
 * Zod validation schemas for Ghost Admin API Images tools.
 */

import { z } from 'zod';

/**
 * Valid image purposes for the Ghost API.
 */
export const ImagePurposeSchema = z.enum(['image', 'profile_image', 'icon']);

/**
 * Schema for admin_upload_image tool input.
 *
 * Supports two image sources (provide exactly one):
 * - file_path: Local filesystem path (for local MCP servers with filesystem access)
 * - url: Remote image URL (for sandboxed environments like Claude Desktop)
 */
export const AdminUploadImageInputSchema = z
  .object({
    /**
     * Path to the image file on the local filesystem.
     * Use this when the MCP server has direct access to the local filesystem.
     * Note: This will NOT work in sandboxed environments like Claude Desktop.
     */
    file_path: z.string().min(1).optional(),

    /**
     * URL of the image to download and upload to Ghost.
     * Use this when running in sandboxed environments (e.g., Claude Desktop)
     * or when the image is already hosted online.
     * The MCP server will fetch the image from this URL and upload it to Ghost.
     */
    url: z.string().url('Must be a valid URL').optional(),

    /**
     * Purpose of the image upload.
     * - 'image': General content images (WEBP, JPEG, GIF, PNG, SVG)
     * - 'profile_image': Profile/avatar images (must be square)
     * - 'icon': Site icons/favicons (must be square, supports ICO)
     */
    purpose: ImagePurposeSchema.optional().default('image'),

    /**
     * Optional reference identifier returned in response.
     * Useful for tracking which upload corresponds to which image.
     */
    ref: z.string().optional(),
  })
  .refine((data) => data.file_path || data.url, {
    message: 'Either file_path or url must be provided',
  })
  .refine((data) => !(data.file_path && data.url), {
    message: 'Provide either file_path or url, not both',
  });

/**
 * Inferred types from schemas.
 */
export type ImagePurpose = z.infer<typeof ImagePurposeSchema>;
export type AdminUploadImageInput = z.infer<typeof AdminUploadImageInputSchema>;
