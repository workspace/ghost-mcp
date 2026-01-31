/**
 * Zod validation schemas for Ghost Content API Tags tools.
 */

import { z } from 'zod';

/**
 * Schema for content_browse_tags tool input.
 */
export const BrowseTagsInputSchema = z.object({
  /**
   * Related data to include: 'count.posts'
   */
  include: z
    .string()
    .optional()
    .describe('Related data to include: count.posts'),

  /**
   * Specific fields to return (comma-separated).
   * Example: 'name,slug,description'
   */
  fields: z
    .string()
    .optional()
    .describe('Comma-separated list of fields to return'),

  /**
   * NQL filter expression.
   * Examples: 'visibility:public', 'slug:getting-started'
   */
  filter: z
    .string()
    .optional()
    .describe('NQL filter expression (e.g., visibility:public)'),

  /**
   * Number of tags to return.
   * Default: 15, can be set to 'all' for unlimited.
   */
  limit: z
    .union([z.number().int().positive(), z.literal('all')])
    .optional()
    .describe('Number of tags to return (default: 15, or "all")'),

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
 * Schema for content_read_tag tool input.
 * Either id or slug must be provided, but not both.
 */
export const ReadTagInputSchema = z
  .object({
    /**
     * Tag ID to fetch.
     */
    id: z.string().optional().describe('Tag ID'),

    /**
     * Tag slug to fetch.
     */
    slug: z.string().optional().describe('Tag slug'),

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
export type BrowseTagsInput = z.infer<typeof BrowseTagsInputSchema>;
export type ReadTagInput = z.infer<typeof ReadTagInputSchema>;
