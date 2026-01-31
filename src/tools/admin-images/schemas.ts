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
 */
export const AdminUploadImageInputSchema = z.object({
  /**
   * Path to the image file on the local filesystem.
   */
  file_path: z.string().min(1, 'File path is required'),

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
});

/**
 * Inferred types from schemas.
 */
export type ImagePurpose = z.infer<typeof ImagePurposeSchema>;
export type AdminUploadImageInput = z.infer<typeof AdminUploadImageInputSchema>;
