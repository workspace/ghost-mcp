/**
 * Zod validation schemas for Ghost Admin API Users tools.
 */

import { z } from 'zod';

/**
 * Schema for admin_browse_users tool input.
 */
export const AdminBrowseUsersInputSchema = z.object({
  include: z
    .string()
    .optional()
    .describe(
      'Related data to include: count.posts, permissions, roles, roles.permissions (comma-separated)'
    ),
  fields: z
    .string()
    .optional()
    .describe('Comma-separated list of fields to return'),
  filter: z
    .string()
    .optional()
    .describe('NQL filter expression (e.g., status:active, role:Editor)'),
  limit: z
    .union([z.number().int().positive(), z.literal('all')])
    .optional()
    .describe('Number of users to return (default: 15, or "all")'),
  page: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('Page number for pagination'),
  order: z
    .string()
    .optional()
    .describe('Sort order (e.g., created_at DESC, name ASC)'),
});

/**
 * Schema for admin_read_user tool input.
 * Either id or slug must be provided, but not both.
 */
export const AdminReadUserInputSchema = z
  .object({
    id: z.string().optional().describe('User ID'),
    slug: z.string().optional().describe('User slug'),
    include: z
      .string()
      .optional()
      .describe(
        'Related data to include: count.posts, permissions, roles, roles.permissions (comma-separated)'
      ),
    fields: z
      .string()
      .optional()
      .describe('Comma-separated list of fields to return'),
  })
  .refine((data) => data.id !== undefined || data.slug !== undefined, {
    message: 'Either id or slug must be provided',
  })
  .refine((data) => !(data.id !== undefined && data.slug !== undefined), {
    message: 'Only one of id or slug should be provided, not both',
  });

/**
 * Schema for admin_update_user tool input.
 */
export const AdminUpdateUserInputSchema = z.object({
  id: z.string().describe('User ID (required)'),
  updated_at: z
    .string()
    .describe(
      'Current updated_at timestamp for conflict prevention (required)'
    ),
  name: z.string().optional().describe('User display name'),
  slug: z.string().optional().describe('URL slug'),
  email: z.string().email().optional().describe('User email address'),
  profile_image: z
    .string()
    .nullable()
    .optional()
    .describe('Profile image URL'),
  cover_image: z.string().nullable().optional().describe('Cover image URL'),
  bio: z.string().nullable().optional().describe('User biography'),
  website: z.string().nullable().optional().describe('User website URL'),
  location: z.string().nullable().optional().describe('User location'),
  facebook: z.string().nullable().optional().describe('Facebook username'),
  twitter: z.string().nullable().optional().describe('Twitter/X username'),
  meta_title: z.string().nullable().optional().describe('SEO meta title'),
  meta_description: z
    .string()
    .nullable()
    .optional()
    .describe('SEO meta description'),
  comment_notifications: z
    .boolean()
    .optional()
    .describe('Receive comment notifications'),
  mention_notifications: z
    .boolean()
    .optional()
    .describe('Receive mention notifications'),
  milestone_notifications: z
    .boolean()
    .optional()
    .describe('Receive milestone notifications'),
});

/**
 * Schema for admin_delete_user tool input.
 */
export const AdminDeleteUserInputSchema = z.object({
  id: z
    .string()
    .describe('User ID to delete (required). Note: Owner cannot be deleted.'),
});

/**
 * Inferred types from schemas.
 */
export type AdminBrowseUsersInput = z.infer<typeof AdminBrowseUsersInputSchema>;
export type AdminReadUserInput = z.infer<typeof AdminReadUserInputSchema>;
export type AdminUpdateUserInput = z.infer<typeof AdminUpdateUserInputSchema>;
export type AdminDeleteUserInput = z.infer<typeof AdminDeleteUserInputSchema>;
