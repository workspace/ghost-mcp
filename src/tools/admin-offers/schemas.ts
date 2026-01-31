/**
 * Zod validation schemas for Ghost Admin API Offers tools.
 */

import { z } from 'zod';

/**
 * Schema for admin_browse_offers tool input.
 */
export const AdminBrowseOffersInputSchema = z.object({
  filter: z
    .string()
    .optional()
    .describe(
      'NQL filter expression (e.g., status:active, tier.id:xxx, cadence:month)'
    ),
  limit: z
    .union([z.number().int().positive(), z.literal('all')])
    .optional()
    .describe('Number of offers to return (default: 15, or "all")'),
  page: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('Page number for pagination'),
  order: z
    .string()
    .optional()
    .describe('Sort order (e.g., created_at DESC)'),
});

/**
 * Schema for admin_create_offer tool input.
 */
export const AdminCreateOfferInputSchema = z.object({
  name: z.string().describe('Internal offer name (required)'),
  code: z
    .string()
    .describe('URL shortcode for the offer (required, used in offer URLs)'),
  tier: z.string().describe('Tier ID to apply this offer to (required)'),
  cadence: z
    .enum(['month', 'year'])
    .describe('Billing cadence the offer applies to (required)'),
  type: z
    .enum(['percent', 'fixed', 'trial'])
    .describe(
      'Discount type: percent (1-100), fixed (amount in cents), or trial (days)'
    ),
  amount: z
    .number()
    .int()
    .nonnegative()
    .describe(
      'Discount amount: percentage (1-100) for percent, cents for fixed, days for trial (required)'
    ),
  duration: z
    .enum(['once', 'forever', 'repeating', 'trial'])
    .describe(
      'How long the discount lasts: once (first payment), forever, repeating (for duration_in_months), or trial'
    ),
  display_title: z
    .string()
    .optional()
    .describe('Public-facing title shown to members'),
  display_description: z
    .string()
    .optional()
    .describe('Public-facing description shown to members'),
  duration_in_months: z
    .number()
    .int()
    .positive()
    .optional()
    .describe(
      'Number of months for repeating duration (required when duration is "repeating")'
    ),
  currency: z
    .string()
    .optional()
    .describe(
      'Three-letter ISO currency code (required for "fixed" type offers, e.g., usd, eur)'
    ),
});

/**
 * Schema for admin_update_offer tool input.
 * Note: type, cadence, amount, duration, duration_in_months, currency, and tier
 * cannot be changed after creation.
 */
export const AdminUpdateOfferInputSchema = z.object({
  id: z.string().describe('Offer ID (required)'),
  updated_at: z
    .string()
    .describe(
      'Current updated_at timestamp for conflict prevention (required)'
    ),
  name: z.string().optional().describe('Internal offer name'),
  code: z.string().optional().describe('URL shortcode for the offer'),
  display_title: z
    .string()
    .nullable()
    .optional()
    .describe('Public-facing title shown to members'),
  display_description: z
    .string()
    .nullable()
    .optional()
    .describe('Public-facing description shown to members'),
  status: z
    .enum(['active', 'archived'])
    .optional()
    .describe('Offer status: active or archived'),
});

/**
 * Inferred types from schemas.
 */
export type AdminBrowseOffersInput = z.infer<typeof AdminBrowseOffersInputSchema>;
export type AdminCreateOfferInput = z.infer<typeof AdminCreateOfferInputSchema>;
export type AdminUpdateOfferInput = z.infer<typeof AdminUpdateOfferInputSchema>;
