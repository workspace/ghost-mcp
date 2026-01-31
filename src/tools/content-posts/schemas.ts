/**
 * Zod validation schemas for Ghost Content API Posts tools.
 */

import { z } from 'zod';

/**
 * Schema for content_browse_posts tool input.
 */
export const BrowsePostsInputSchema = z.object({
  /**
   * Related data to include: 'tags', 'authors' (comma-separated)
   */
  include: z
    .string()
    .optional()
    .describe('Related data to include: tags, authors (comma-separated)'),

  /**
   * Specific fields to return (comma-separated).
   * Example: 'title,slug,published_at'
   */
  fields: z
    .string()
    .optional()
    .describe('Comma-separated list of fields to return'),

  /**
   * Content format(s) to return (comma-separated).
   * Valid values: 'html', 'plaintext', 'mobiledoc'
   */
  formats: z
    .string()
    .optional()
    .describe('Content formats: html, plaintext, mobiledoc (comma-separated)'),

  /**
   * NQL filter expression.
   * Examples: 'tag:getting-started', 'featured:true', 'published_at:>2023-01-01'
   */
  filter: z
    .string()
    .optional()
    .describe('NQL filter expression (e.g., tag:getting-started)'),

  /**
   * Number of posts to return.
   * Default: 15, can be set to 'all' for unlimited.
   */
  limit: z
    .union([z.number().int().positive(), z.literal('all')])
    .optional()
    .describe('Number of posts to return (default: 15, or "all")'),

  /**
   * Page number for pagination.
   */
  page: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('Page number for pagination'),

  /**
   * Sort order.
   * Example: 'published_at DESC', 'title ASC'
   */
  order: z
    .string()
    .optional()
    .describe('Sort order (e.g., published_at DESC)'),
});

/**
 * Schema for content_read_post tool input.
 * Either id or slug must be provided, but not both.
 */
export const ReadPostInputSchema = z
  .object({
    /**
     * Post ID to fetch.
     */
    id: z
      .string()
      .optional()
      .describe('Post ID. Provide either id OR slug, not both.'),

    /**
     * Post slug to fetch.
     */
    slug: z
      .string()
      .optional()
      .describe('Post slug (URL identifier). Provide either id OR slug, not both.'),

    /**
     * Related data to include (comma-separated).
     */
    include: z
      .string()
      .optional()
      .describe('Related data to include: tags, authors (comma-separated)'),

    /**
     * Specific fields to return (comma-separated).
     */
    fields: z
      .string()
      .optional()
      .describe('Comma-separated list of fields to return'),

    /**
     * Content format(s) to return (comma-separated).
     */
    formats: z
      .string()
      .optional()
      .describe('Content formats: html, plaintext, mobiledoc (comma-separated)'),
  })
  .refine((data) => data.id !== undefined || data.slug !== undefined, {
    message: 'Either id or slug must be provided',
  })
  .refine((data) => !(data.id !== undefined && data.slug !== undefined), {
    message: 'Only one of id or slug should be provided, not both',
  });

/**
 * Inferred types from schemas.
 */
export type BrowsePostsInput = z.infer<typeof BrowsePostsInputSchema>;
export type ReadPostInput = z.infer<typeof ReadPostInputSchema>;
