/**
 * Zod validation schemas for Ghost Admin API Themes tools.
 */

import { z } from 'zod';

/**
 * Schema for admin_upload_theme tool input.
 */
export const AdminUploadThemeInputSchema = z.object({
  /**
   * Path to the theme .zip file on the local filesystem.
   */
  file_path: z.string().min(1, 'File path is required'),
});

/**
 * Schema for admin_activate_theme tool input.
 */
export const AdminActivateThemeInputSchema = z.object({
  /**
   * The name of the theme to activate (e.g., 'casper', 'Alto-master').
   */
  name: z.string().min(1, 'Theme name is required'),
});

/**
 * Inferred types from schemas.
 */
export type AdminUploadThemeInput = z.infer<typeof AdminUploadThemeInputSchema>;
export type AdminActivateThemeInput = z.infer<typeof AdminActivateThemeInputSchema>;
