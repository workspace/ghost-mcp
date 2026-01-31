/**
 * Zod validation schemas for Ghost Admin API Posts tools.
 */

import { z } from 'zod';

/**
 * Tag reference schema for creating/updating posts.
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
 * Author reference schema for creating/updating posts.
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
 * Schema for admin_browse_posts tool input.
 */
export const AdminBrowsePostsInputSchema = z.object({
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
    .describe('Number of posts to return (default: 15, or "all")'),
  page: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('Page number for pagination'),
  order: z
    .string()
    .optional()
    .describe('Sort order (e.g., published_at DESC)'),
});

/**
 * Schema for admin_read_post tool input.
 */
export const AdminReadPostInputSchema = z
  .object({
    id: z.string().optional().describe('Post ID. Provide either id OR slug, not both.'),
    slug: z.string().optional().describe('Post slug (URL identifier). Provide either id OR slug, not both.'),
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
 * Schema for admin_create_post tool input.
 */
export const AdminCreatePostInputSchema = z.object({
  title: z.string().describe('Post title (required)'),
  slug: z
    .string()
    .optional()
    .describe('URL slug (auto-generated from title if not provided)'),
  lexical: z
    .string()
    .optional()
    .describe('Post content in Lexical JSON format'),
  mobiledoc: z
    .string()
    .optional()
    .describe('Post content in Mobiledoc JSON format (legacy)'),
  html: z.string().optional().describe('Post content in HTML format'),
  feature_image: z
    .string()
    .nullable()
    .optional()
    .describe('URL of the feature image'),
  featured: z.boolean().optional().describe('Whether the post is featured'),
  status: z
    .enum(['published', 'draft', 'scheduled', 'sent'])
    .optional()
    .describe('Publication status (default: draft)'),
  visibility: z
    .enum(['public', 'members', 'paid', 'tiers'])
    .optional()
    .describe('Content visibility (default: public)'),
  tags: z
    .array(TagReferenceSchema)
    .optional()
    .describe(
      'Tags to assign. Each object needs {id}, {name}, or {slug}. ' +
        'Example: [{"name": "Technology"}, {"slug": "featured"}]'
    ),
  authors: z
    .array(AuthorReferenceSchema)
    .optional()
    .describe(
      'Authors to assign. Each object needs {id}, {email}, or {slug}. ' +
        'Example: [{"email": "author@site.com"}, {"slug": "john"}]'
    ),
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
  email_only: z.boolean().optional().describe('Whether post is email-only'),
  published_at: z
    .string()
    .nullable()
    .optional()
    .describe('Publication date (ISO 8601)'),
});

/**
 * Schema for admin_update_post tool input.
 */
export const AdminUpdatePostInputSchema = z.object({
  id: z.string().describe('Post ID (required)'),
  updated_at: z
    .string()
    .describe(
      'Current updated_at timestamp from admin_read_post (required). Prevents concurrent edit conflicts.'
    ),
  title: z.string().optional().describe('Post title'),
  slug: z.string().optional().describe('URL slug'),
  lexical: z
    .string()
    .optional()
    .describe('Post content in Lexical JSON format'),
  mobiledoc: z
    .string()
    .optional()
    .describe('Post content in Mobiledoc JSON format (legacy)'),
  html: z.string().optional().describe('Post content in HTML format'),
  feature_image: z
    .string()
    .nullable()
    .optional()
    .describe('URL of the feature image'),
  featured: z.boolean().optional().describe('Whether the post is featured'),
  status: z
    .enum(['published', 'draft', 'scheduled', 'sent'])
    .optional()
    .describe('Publication status'),
  visibility: z
    .enum(['public', 'members', 'paid', 'tiers'])
    .optional()
    .describe('Content visibility'),
  tags: z
    .array(TagReferenceSchema)
    .optional()
    .describe(
      'Tags to assign (REPLACES all existing). Each: {id}, {name}, or {slug}. ' +
        'Include all desired tags, not just new ones.'
    ),
  authors: z
    .array(AuthorReferenceSchema)
    .optional()
    .describe(
      'Authors to assign (REPLACES all existing). Each: {id}, {email}, or {slug}. ' +
        'Include all desired authors.'
    ),
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
  email_only: z.boolean().optional().describe('Whether post is email-only'),
  published_at: z
    .string()
    .nullable()
    .optional()
    .describe('Publication date (ISO 8601)'),
});

/**
 * Schema for admin_delete_post tool input.
 */
export const AdminDeletePostInputSchema = z.object({
  id: z.string().describe('Post ID to delete (required)'),
});

/**
 * Schema for admin_copy_post tool input.
 */
export const AdminCopyPostInputSchema = z.object({
  id: z.string().describe('Post ID to copy (required)'),
});

/**
 * Inferred types from schemas.
 */
export type AdminBrowsePostsInput = z.infer<typeof AdminBrowsePostsInputSchema>;
export type AdminReadPostInput = z.infer<typeof AdminReadPostInputSchema>;
export type AdminCreatePostInput = z.infer<typeof AdminCreatePostInputSchema>;
export type AdminUpdatePostInput = z.infer<typeof AdminUpdatePostInputSchema>;
export type AdminDeletePostInput = z.infer<typeof AdminDeletePostInputSchema>;
export type AdminCopyPostInput = z.infer<typeof AdminCopyPostInputSchema>;
