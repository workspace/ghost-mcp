/**
 * Zod validation schemas for Ghost Admin API Tiers tools.
 */

import { z } from 'zod';

/**
 * Schema for admin_browse_tiers tool input.
 */
export const AdminBrowseTiersInputSchema = z.object({
  include: z
    .string()
    .optional()
    .describe(
      'Related data to include: monthly_price, yearly_price, benefits (comma-separated)'
    ),
  filter: z
    .string()
    .optional()
    .describe(
      'NQL filter expression (e.g., type:paid, visibility:public, active:true)'
    ),
  limit: z
    .union([z.number().int().positive(), z.literal('all')])
    .optional()
    .describe('Number of tiers to return (default: 15, or "all")'),
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
 * Schema for admin_read_tier tool input.
 * Either id or slug must be provided, but not both.
 */
export const AdminReadTierInputSchema = z
  .object({
    id: z.string().optional().describe('Tier ID'),
    slug: z.string().optional().describe('Tier slug'),
    include: z
      .string()
      .optional()
      .describe(
        'Related data to include: monthly_price, yearly_price, benefits (comma-separated)'
      ),
  })
  .refine((data) => data.id !== undefined || data.slug !== undefined, {
    message: 'Either id or slug must be provided',
  })
  .refine((data) => !(data.id !== undefined && data.slug !== undefined), {
    message: 'Only one of id or slug should be provided, not both',
  });

/**
 * Schema for admin_create_tier tool input.
 */
export const AdminCreateTierInputSchema = z.object({
  name: z.string().describe('Tier name (required)'),
  slug: z
    .string()
    .optional()
    .describe('URL slug (auto-generated from name if not provided)'),
  description: z
    .string()
    .nullable()
    .optional()
    .describe('Tier description'),
  active: z
    .boolean()
    .optional()
    .describe('Whether the tier is active (default: true)'),
  type: z
    .enum(['free', 'paid'])
    .optional()
    .describe('Tier type (default: paid)'),
  welcome_page_url: z
    .string()
    .nullable()
    .optional()
    .describe('URL to redirect members after signup'),
  monthly_price: z
    .number()
    .int()
    .nonnegative()
    .nullable()
    .optional()
    .describe('Monthly price in smallest currency unit (e.g., cents)'),
  yearly_price: z
    .number()
    .int()
    .nonnegative()
    .nullable()
    .optional()
    .describe('Yearly price in smallest currency unit (e.g., cents)'),
  currency: z
    .string()
    .nullable()
    .optional()
    .describe('Currency code (e.g., usd, eur) - required for paid tiers'),
  benefits: z
    .array(z.string())
    .optional()
    .describe('List of benefits for this tier'),
  visibility: z
    .enum(['public', 'none'])
    .optional()
    .describe('Tier visibility (default: public)'),
  trial_days: z
    .number()
    .int()
    .nonnegative()
    .optional()
    .describe('Number of trial days for this tier'),
});

/**
 * Schema for admin_update_tier tool input.
 */
export const AdminUpdateTierInputSchema = z.object({
  id: z.string().describe('Tier ID (required)'),
  updated_at: z
    .string()
    .describe(
      'Current updated_at timestamp for conflict prevention (required)'
    ),
  name: z.string().optional().describe('Tier name'),
  slug: z.string().optional().describe('URL slug'),
  description: z
    .string()
    .nullable()
    .optional()
    .describe('Tier description'),
  active: z
    .boolean()
    .optional()
    .describe('Whether the tier is active'),
  welcome_page_url: z
    .string()
    .nullable()
    .optional()
    .describe('URL to redirect members after signup'),
  monthly_price: z
    .number()
    .int()
    .nonnegative()
    .nullable()
    .optional()
    .describe('Monthly price in smallest currency unit (e.g., cents)'),
  yearly_price: z
    .number()
    .int()
    .nonnegative()
    .nullable()
    .optional()
    .describe('Yearly price in smallest currency unit (e.g., cents)'),
  benefits: z
    .array(z.string())
    .optional()
    .describe('List of benefits for this tier'),
  visibility: z
    .enum(['public', 'none'])
    .optional()
    .describe('Tier visibility'),
  trial_days: z
    .number()
    .int()
    .nonnegative()
    .optional()
    .describe('Number of trial days for this tier'),
});

/**
 * Inferred types from schemas.
 */
export type AdminBrowseTiersInput = z.infer<typeof AdminBrowseTiersInputSchema>;
export type AdminReadTierInput = z.infer<typeof AdminReadTierInputSchema>;
export type AdminCreateTierInput = z.infer<typeof AdminCreateTierInputSchema>;
export type AdminUpdateTierInput = z.infer<typeof AdminUpdateTierInputSchema>;
