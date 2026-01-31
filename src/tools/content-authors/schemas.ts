/**
 * Zod validation schemas for Ghost Content API Authors tools.
 */

import { z } from 'zod';

/**
 * Schema for content_browse_authors tool input.
 */
export const BrowseAuthorsInputSchema = z.object({
  /**
   * Related data to include: 'count.posts'
   */
  include: z
    .string()
    .optional()
    .describe('Related data to include: count.posts'),

  /**
   * Specific fields to return (comma-separated).
   * Example: 'name,slug,bio'
   */
  fields: z
    .string()
    .optional()
    .describe('Comma-separated list of fields to return'),

  /**
   * NQL filter expression.
   * Examples: 'slug:john-doe'
   */
  filter: z
    .string()
    .optional()
    .describe('NQL filter expression (e.g., slug:john-doe)'),

  /**
   * Number of authors to return.
   * Default: 15, can be set to 'all' for unlimited.
   */
  limit: z
    .union([z.number().int().positive(), z.literal('all')])
    .optional()
    .describe('Number of authors to return (default: 15, or "all")'),

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
   * Example: 'name ASC', 'slug DESC'
   */
  order: z
    .string()
    .optional()
    .describe('Sort order (e.g., name ASC)'),
});

/**
 * Schema for content_read_author tool input.
 * Either id or slug must be provided, but not both.
 */
export const ReadAuthorInputSchema = z
  .object({
    /**
     * Author ID to fetch.
     */
    id: z.string().optional().describe('Author ID'),

    /**
     * Author slug to fetch.
     */
    slug: z.string().optional().describe('Author slug'),

    /**
     * Related data to include (comma-separated).
     */
    include: z
      .string()
      .optional()
      .describe('Related data to include: count.posts'),

    /**
     * Specific fields to return (comma-separated).
     */
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
 * Inferred types from schemas.
 */
export type BrowseAuthorsInput = z.infer<typeof BrowseAuthorsInputSchema>;
export type ReadAuthorInput = z.infer<typeof ReadAuthorInputSchema>;
