/**
 * Zod validation schemas for Ghost Admin API Tags tools.
 */

import { z } from 'zod';

/**
 * Schema for admin_browse_tags tool input.
 */
export const AdminBrowseTagsInputSchema = z.object({
  include: z
    .string()
    .optional()
    .describe('Related data to include: count.posts'),
  fields: z
    .string()
    .optional()
    .describe('Comma-separated list of fields to return'),
  filter: z
    .string()
    .optional()
    .describe('NQL filter expression (e.g., visibility:public)'),
  limit: z
    .union([z.number().int().positive(), z.literal('all')])
    .optional()
    .describe('Number of tags to return (default: 15, or "all")'),
  page: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('Page number for pagination'),
  order: z
    .string()
    .optional()
    .describe('Sort order (e.g., name ASC)'),
});

/**
 * Schema for admin_read_tag tool input.
 * Either id or slug must be provided, but not both.
 */
export const AdminReadTagInputSchema = z
  .object({
    id: z.string().optional().describe('Tag ID'),
    slug: z.string().optional().describe('Tag slug'),
    include: z
      .string()
      .optional()
      .describe('Related data to include: count.posts'),
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
 * Schema for admin_create_tag tool input.
 */
export const AdminCreateTagInputSchema = z.object({
  name: z.string().describe('Tag name (required)'),
  slug: z
    .string()
    .optional()
    .describe('URL slug (auto-generated from name if not provided)'),
  description: z
    .string()
    .nullable()
    .optional()
    .describe('Tag description'),
  feature_image: z
    .string()
    .nullable()
    .optional()
    .describe('URL of the feature image'),
  visibility: z
    .enum(['public', 'internal'])
    .optional()
    .describe('Tag visibility (default: public)'),
  og_image: z.string().nullable().optional().describe('Open Graph image URL'),
  og_title: z.string().nullable().optional().describe('Open Graph title'),
  og_description: z
    .string()
    .nullable()
    .optional()
    .describe('Open Graph description'),
  twitter_image: z
    .string()
    .nullable()
    .optional()
    .describe('Twitter card image URL'),
  twitter_title: z
    .string()
    .nullable()
    .optional()
    .describe('Twitter card title'),
  twitter_description: z
    .string()
    .nullable()
    .optional()
    .describe('Twitter card description'),
  meta_title: z.string().nullable().optional().describe('SEO meta title'),
  meta_description: z
    .string()
    .nullable()
    .optional()
    .describe('SEO meta description'),
  codeinjection_head: z
    .string()
    .nullable()
    .optional()
    .describe('Code to inject in <head>'),
  codeinjection_foot: z
    .string()
    .nullable()
    .optional()
    .describe('Code to inject before </body>'),
  canonical_url: z
    .string()
    .nullable()
    .optional()
    .describe('Canonical URL for SEO'),
  accent_color: z
    .string()
    .nullable()
    .optional()
    .describe('Accent color (hex code, e.g., #ff0000)'),
});

/**
 * Schema for admin_update_tag tool input.
 */
export const AdminUpdateTagInputSchema = z.object({
  id: z.string().describe('Tag ID (required)'),
  updated_at: z
    .string()
    .describe(
      'Current updated_at timestamp for conflict prevention (required)'
    ),
  name: z.string().optional().describe('Tag name'),
  slug: z.string().optional().describe('URL slug'),
  description: z
    .string()
    .nullable()
    .optional()
    .describe('Tag description'),
  feature_image: z
    .string()
    .nullable()
    .optional()
    .describe('URL of the feature image'),
  visibility: z
    .enum(['public', 'internal'])
    .optional()
    .describe('Tag visibility'),
  og_image: z.string().nullable().optional().describe('Open Graph image URL'),
  og_title: z.string().nullable().optional().describe('Open Graph title'),
  og_description: z
    .string()
    .nullable()
    .optional()
    .describe('Open Graph description'),
  twitter_image: z
    .string()
    .nullable()
    .optional()
    .describe('Twitter card image URL'),
  twitter_title: z
    .string()
    .nullable()
    .optional()
    .describe('Twitter card title'),
  twitter_description: z
    .string()
    .nullable()
    .optional()
    .describe('Twitter card description'),
  meta_title: z.string().nullable().optional().describe('SEO meta title'),
  meta_description: z
    .string()
    .nullable()
    .optional()
    .describe('SEO meta description'),
  codeinjection_head: z
    .string()
    .nullable()
    .optional()
    .describe('Code to inject in <head>'),
  codeinjection_foot: z
    .string()
    .nullable()
    .optional()
    .describe('Code to inject before </body>'),
  canonical_url: z
    .string()
    .nullable()
    .optional()
    .describe('Canonical URL for SEO'),
  accent_color: z
    .string()
    .nullable()
    .optional()
    .describe('Accent color (hex code, e.g., #ff0000)'),
});

/**
 * Schema for admin_delete_tag tool input.
 */
export const AdminDeleteTagInputSchema = z.object({
  id: z.string().describe('Tag ID to delete (required)'),
});

/**
 * Inferred types from schemas.
 */
export type AdminBrowseTagsInput = z.infer<typeof AdminBrowseTagsInputSchema>;
export type AdminReadTagInput = z.infer<typeof AdminReadTagInputSchema>;
export type AdminCreateTagInput = z.infer<typeof AdminCreateTagInputSchema>;
export type AdminUpdateTagInput = z.infer<typeof AdminUpdateTagInputSchema>;
export type AdminDeleteTagInput = z.infer<typeof AdminDeleteTagInputSchema>;
