/**
 * Zod validation schemas for Ghost Content API Pages tools.
 */

import { z } from 'zod';

/**
 * Schema for content_browse_pages tool input.
 */
export const BrowsePagesInputSchema = z.object({
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
   * Number of pages to return.
   * Default: 15, can be set to 'all' for unlimited.
   */
  limit: z
    .union([z.number().int().positive(), z.literal('all')])
    .optional()
    .describe('Number of pages to return (default: 15, or "all")'),

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
   * Example: 'title ASC', 'published_at DESC'
   * Note: Pages are sorted by title by default.
   */
  order: z
    .string()
    .optional()
    .describe('Sort order (e.g., title ASC). Default: title'),
});

/**
 * Schema for content_read_page tool input.
 * Either id or slug must be provided, but not both.
 */
export const ReadPageInputSchema = z
  .object({
    /**
     * Page ID to fetch.
     */
    id: z.string().optional().describe('Page ID'),

    /**
     * Page slug to fetch.
     */
    slug: z.string().optional().describe('Page slug'),

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
export type BrowsePagesInput = z.infer<typeof BrowsePagesInputSchema>;
export type ReadPageInput = z.infer<typeof ReadPageInputSchema>;
