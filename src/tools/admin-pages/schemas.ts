/**
 * Zod validation schemas for Ghost Admin API Pages tools.
 */

import { z } from 'zod';

/**
 * Tag reference schema for creating/updating pages.
 * Can identify tag by id, name, or slug.
 */
const TagReferenceSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().optional(),
    slug: z.string().optional(),
  })
  .refine(
    (data) =>
      data.id !== undefined || data.name !== undefined || data.slug !== undefined,
    { message: 'Tag must have at least one of: id, name, or slug' }
  );

/**
 * Author reference schema for creating/updating pages.
 * Can identify author by id, email, or slug.
 */
const AuthorReferenceSchema = z
  .object({
    id: z.string().optional(),
    email: z.string().optional(),
    slug: z.string().optional(),
  })
  .refine(
    (data) =>
      data.id !== undefined ||
      data.email !== undefined ||
      data.slug !== undefined,
    { message: 'Author must have at least one of: id, email, or slug' }
  );

/**
 * Schema for admin_browse_pages tool input.
 */
export const AdminBrowsePagesInputSchema = z.object({
  include: z
    .string()
    .optional()
    .describe('Related data to include: tags, authors (comma-separated)'),
  fields: z
    .string()
    .optional()
    .describe('Comma-separated list of fields to return'),
  formats: z
    .string()
    .optional()
    .describe(
      'Content formats: html, lexical (comma-separated). Default is lexical'
    ),
  filter: z
    .string()
    .optional()
    .describe(
      'NQL filter expression (e.g., status:draft, tag:getting-started)'
    ),
  limit: z
    .union([z.number().int().positive(), z.literal('all')])
    .optional()
    .describe('Number of pages to return (default: 15, or "all")'),
  page: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('Page number for pagination'),
  order: z
    .string()
    .optional()
    .describe('Sort order (e.g., title ASC)'),
});

/**
 * Schema for admin_read_page tool input.
 */
export const AdminReadPageInputSchema = z
  .object({
    id: z.string().optional().describe('Page ID'),
    slug: z.string().optional().describe('Page slug'),
    include: z
      .string()
      .optional()
      .describe('Related data to include: tags, authors (comma-separated)'),
    fields: z
      .string()
      .optional()
      .describe('Comma-separated list of fields to return'),
    formats: z
      .string()
      .optional()
      .describe('Content formats: html, lexical (comma-separated)'),
  })
  .refine((data) => data.id !== undefined || data.slug !== undefined, {
    message: 'Either id or slug must be provided',
  })
  .refine((data) => !(data.id !== undefined && data.slug !== undefined), {
    message: 'Only one of id or slug should be provided, not both',
  });

/**
 * Schema for admin_create_page tool input.
 */
export const AdminCreatePageInputSchema = z.object({
  title: z.string().describe('Page title (required)'),
  slug: z
    .string()
    .optional()
    .describe('URL slug (auto-generated from title if not provided)'),
  lexical: z
    .string()
    .optional()
    .describe('Page content in Lexical JSON format'),
  mobiledoc: z
    .string()
    .optional()
    .describe('Page content in Mobiledoc JSON format (legacy)'),
  html: z.string().optional().describe('Page content in HTML format'),
  feature_image: z
    .string()
    .nullable()
    .optional()
    .describe('URL of the feature image'),
  featured: z.boolean().optional().describe('Whether the page is featured'),
  status: z
    .enum(['published', 'draft', 'scheduled'])
    .optional()
    .describe('Publication status (default: draft)'),
  visibility: z
    .enum(['public', 'members', 'paid', 'tiers'])
    .optional()
    .describe('Content visibility (default: public)'),
  tags: z
    .array(TagReferenceSchema)
    .optional()
    .describe('Tags to assign (each with id, name, or slug)'),
  authors: z
    .array(AuthorReferenceSchema)
    .optional()
    .describe('Authors to assign (each with id, email, or slug)'),
  custom_excerpt: z
    .string()
    .nullable()
    .optional()
    .describe('Custom excerpt text'),
  canonical_url: z
    .string()
    .nullable()
    .optional()
    .describe('Canonical URL for SEO'),
  meta_title: z.string().nullable().optional().describe('SEO meta title'),
  meta_description: z
    .string()
    .nullable()
    .optional()
    .describe('SEO meta description'),
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
  published_at: z
    .string()
    .nullable()
    .optional()
    .describe('Publication date (ISO 8601)'),
});

/**
 * Schema for admin_update_page tool input.
 */
export const AdminUpdatePageInputSchema = z.object({
  id: z.string().describe('Page ID (required)'),
  updated_at: z
    .string()
    .describe(
      'Current updated_at timestamp for conflict prevention (required)'
    ),
  title: z.string().optional().describe('Page title'),
  slug: z.string().optional().describe('URL slug'),
  lexical: z
    .string()
    .optional()
    .describe('Page content in Lexical JSON format'),
  mobiledoc: z
    .string()
    .optional()
    .describe('Page content in Mobiledoc JSON format (legacy)'),
  html: z.string().optional().describe('Page content in HTML format'),
  feature_image: z
    .string()
    .nullable()
    .optional()
    .describe('URL of the feature image'),
  featured: z.boolean().optional().describe('Whether the page is featured'),
  status: z
    .enum(['published', 'draft', 'scheduled'])
    .optional()
    .describe('Publication status'),
  visibility: z
    .enum(['public', 'members', 'paid', 'tiers'])
    .optional()
    .describe('Content visibility'),
  tags: z
    .array(TagReferenceSchema)
    .optional()
    .describe('Tags to assign (replaces existing)'),
  authors: z
    .array(AuthorReferenceSchema)
    .optional()
    .describe('Authors to assign (replaces existing)'),
  custom_excerpt: z
    .string()
    .nullable()
    .optional()
    .describe('Custom excerpt text'),
  canonical_url: z
    .string()
    .nullable()
    .optional()
    .describe('Canonical URL for SEO'),
  meta_title: z.string().nullable().optional().describe('SEO meta title'),
  meta_description: z
    .string()
    .nullable()
    .optional()
    .describe('SEO meta description'),
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
  published_at: z
    .string()
    .nullable()
    .optional()
    .describe('Publication date (ISO 8601)'),
});

/**
 * Schema for admin_delete_page tool input.
 */
export const AdminDeletePageInputSchema = z.object({
  id: z.string().describe('Page ID to delete (required)'),
});

/**
 * Schema for admin_copy_page tool input.
 */
export const AdminCopyPageInputSchema = z.object({
  id: z.string().describe('Page ID to copy (required)'),
});

/**
 * Inferred types from schemas.
 */
export type AdminBrowsePagesInput = z.infer<typeof AdminBrowsePagesInputSchema>;
export type AdminReadPageInput = z.infer<typeof AdminReadPageInputSchema>;
export type AdminCreatePageInput = z.infer<typeof AdminCreatePageInputSchema>;
export type AdminUpdatePageInput = z.infer<typeof AdminUpdatePageInputSchema>;
export type AdminDeletePageInput = z.infer<typeof AdminDeletePageInputSchema>;
export type AdminCopyPageInput = z.infer<typeof AdminCopyPageInputSchema>;
