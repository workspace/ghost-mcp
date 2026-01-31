/**
 * Zod validation schemas for Ghost Admin API Members tools.
 */

import { z } from 'zod';

/**
 * Schema for label references in member create/update operations.
 * At least one of id, name, or slug must be provided.
 */
const LabelReferenceSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().optional(),
    slug: z.string().optional(),
  })
  .refine(
    (data) =>
      data.id !== undefined ||
      data.name !== undefined ||
      data.slug !== undefined,
    { message: 'Label must have at least one of: id, name, or slug' }
  );

/**
 * Schema for newsletter references in member create/update operations.
 */
const NewsletterReferenceSchema = z.object({
  id: z.string(),
});

/**
 * Schema for admin_browse_members tool input.
 */
export const AdminBrowseMembersInputSchema = z.object({
  include: z
    .string()
    .optional()
    .describe('Related data to include: labels, newsletters (comma-separated)'),
  fields: z
    .string()
    .optional()
    .describe('Comma-separated list of fields to return'),
  filter: z
    .string()
    .optional()
    .describe(
      'NQL filter expression (e.g., status:paid, subscribed:true, label:vip)'
    ),
  limit: z
    .union([z.number().int().positive(), z.literal('all')])
    .optional()
    .describe('Number of members to return (default: 15, or "all")'),
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
 * Schema for admin_read_member tool input.
 * Either id or email must be provided, but not both.
 */
export const AdminReadMemberInputSchema = z
  .object({
    id: z
      .string()
      .optional()
      .describe('Member ID. Provide either id OR email, not both.'),
    email: z
      .string()
      .optional()
      .describe('Member email address. Provide either id OR email, not both.'),
    include: z
      .string()
      .optional()
      .describe(
        'Related data to include: labels, newsletters (comma-separated)'
      ),
    fields: z
      .string()
      .optional()
      .describe('Comma-separated list of fields to return'),
  })
  .refine((data) => data.id !== undefined || data.email !== undefined, {
    message: 'Either id or email must be provided',
  })
  .refine((data) => !(data.id !== undefined && data.email !== undefined), {
    message: 'Only one of id or email should be provided, not both',
  });

/**
 * Schema for admin_create_member tool input.
 */
export const AdminCreateMemberInputSchema = z.object({
  email: z.string().email().describe('Member email address (required)'),
  name: z.string().optional().describe('Member name'),
  note: z
    .string()
    .nullable()
    .optional()
    .describe('Private note about the member'),
  subscribed: z
    .boolean()
    .optional()
    .describe('Whether member is subscribed to newsletters (default: true)'),
  labels: z
    .array(LabelReferenceSchema)
    .optional()
    .describe(
      'Labels to assign. Each object needs {id}, {name}, or {slug}. ' +
        'Example: [{"name": "VIP"}, {"slug": "early-access"}]'
    ),
  newsletters: z
    .array(NewsletterReferenceSchema)
    .optional()
    .describe(
      'Newsletters to subscribe to. Each object requires {id}. ' +
        'Get IDs from admin_browse_newsletters. Example: [{"id": "newsletter-uuid"}]'
    ),
  comped: z
    .boolean()
    .optional()
    .describe('Whether member has complimentary premium access'),
});

/**
 * Schema for admin_update_member tool input.
 */
export const AdminUpdateMemberInputSchema = z.object({
  id: z.string().describe('Member ID (required)'),
  updated_at: z
    .string()
    .describe(
      'Current updated_at timestamp from admin_read_member (required). Prevents concurrent edit conflicts.'
    ),
  name: z.string().optional().describe('Member name'),
  note: z
    .string()
    .nullable()
    .optional()
    .describe('Private note about the member'),
  subscribed: z
    .boolean()
    .optional()
    .describe('Whether member is subscribed to newsletters'),
  labels: z
    .array(LabelReferenceSchema)
    .optional()
    .describe(
      'Labels to assign (REPLACES all existing). Each: {id}, {name}, or {slug}. ' +
        'Include all desired labels.'
    ),
  newsletters: z
    .array(NewsletterReferenceSchema)
    .optional()
    .describe(
      'Newsletters to subscribe to (REPLACES all existing). Each: {id}. ' +
        'Include all desired newsletter subscriptions.'
    ),
  comped: z
    .boolean()
    .optional()
    .describe('Whether member has complimentary premium access'),
});

/**
 * Inferred types from schemas.
 */
export type AdminBrowseMembersInput = z.infer<
  typeof AdminBrowseMembersInputSchema
>;
export type AdminReadMemberInput = z.infer<typeof AdminReadMemberInputSchema>;
export type AdminCreateMemberInput = z.infer<
  typeof AdminCreateMemberInputSchema
>;
export type AdminUpdateMemberInput = z.infer<
  typeof AdminUpdateMemberInputSchema
>;
