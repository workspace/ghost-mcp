/**
 * Zod validation schemas for Ghost Admin API Newsletters tools.
 */

import { z } from 'zod';

/**
 * Schema for admin_browse_newsletters tool input.
 */
export const AdminBrowseNewslettersInputSchema = z.object({
  include: z
    .string()
    .optional()
    .describe('Related data to include (comma-separated)'),
  filter: z
    .string()
    .optional()
    .describe(
      'NQL filter expression (e.g., status:active, visibility:members)'
    ),
  limit: z
    .union([z.number().int().positive(), z.literal('all')])
    .optional()
    .describe('Number of newsletters to return (default: 15, or "all")'),
  page: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('Page number for pagination'),
  order: z
    .string()
    .optional()
    .describe('Sort order (e.g., sort_order ASC, name ASC)'),
});

/**
 * Schema for admin_read_newsletter tool input.
 * Either id or slug must be provided, but not both.
 */
export const AdminReadNewsletterInputSchema = z
  .object({
    id: z.string().optional().describe('Newsletter ID'),
    slug: z.string().optional().describe('Newsletter slug'),
    include: z
      .string()
      .optional()
      .describe('Related data to include (comma-separated)'),
  })
  .refine((data) => data.id !== undefined || data.slug !== undefined, {
    message: 'Either id or slug must be provided',
  })
  .refine((data) => !(data.id !== undefined && data.slug !== undefined), {
    message: 'Only one of id or slug should be provided, not both',
  });

/**
 * Schema for admin_create_newsletter tool input.
 */
export const AdminCreateNewsletterInputSchema = z.object({
  name: z.string().describe('Newsletter name (required)'),
  slug: z
    .string()
    .optional()
    .describe('URL slug (auto-generated from name if not provided)'),
  description: z
    .string()
    .nullable()
    .optional()
    .describe('Newsletter description'),
  status: z
    .enum(['active', 'archived'])
    .optional()
    .describe('Newsletter status (default: active)'),
  visibility: z
    .enum(['members', 'paid'])
    .optional()
    .describe('Who can subscribe (default: members)'),
  sender_name: z
    .string()
    .nullable()
    .optional()
    .describe('Name shown as email sender'),
  sender_email: z
    .string()
    .nullable()
    .optional()
    .describe('Email address used as sender'),
  sender_reply_to: z
    .enum(['newsletter', 'support'])
    .optional()
    .describe('Reply-to address setting'),
  subscribe_on_signup: z
    .boolean()
    .optional()
    .describe('Auto-subscribe new members (default: true)'),
  sort_order: z
    .number()
    .int()
    .optional()
    .describe('Display order for newsletter'),
  header_image: z
    .string()
    .nullable()
    .optional()
    .describe('Header image URL'),
  show_header_icon: z
    .boolean()
    .optional()
    .describe('Show site icon in header'),
  show_header_title: z
    .boolean()
    .optional()
    .describe('Show site title in header'),
  show_header_name: z
    .boolean()
    .optional()
    .describe('Show newsletter name in header'),
  title_font_category: z
    .enum(['serif', 'sans_serif'])
    .optional()
    .describe('Title font style'),
  title_alignment: z
    .enum(['left', 'center'])
    .optional()
    .describe('Title alignment'),
  body_font_category: z
    .enum(['serif', 'sans_serif'])
    .optional()
    .describe('Body text font style'),
  show_feature_image: z
    .boolean()
    .optional()
    .describe('Show feature image in emails'),
  footer_content: z
    .string()
    .nullable()
    .optional()
    .describe('Custom footer content'),
  show_badge: z
    .boolean()
    .optional()
    .describe('Show Ghost badge in footer'),
  show_post_title_section: z
    .boolean()
    .optional()
    .describe('Show post title section'),
  show_comment_cta: z
    .boolean()
    .optional()
    .describe('Show comment call-to-action'),
  show_subscription_details: z
    .boolean()
    .optional()
    .describe('Show subscription details'),
  show_latest_posts: z
    .boolean()
    .optional()
    .describe('Show latest posts section'),
  background_color: z
    .string()
    .optional()
    .describe('Background color (hex code or "light"/"dark")'),
  border_color: z
    .string()
    .nullable()
    .optional()
    .describe('Border color (hex code)'),
  title_color: z
    .string()
    .nullable()
    .optional()
    .describe('Title color (hex code)'),
});

/**
 * Schema for admin_update_newsletter tool input.
 */
export const AdminUpdateNewsletterInputSchema = z.object({
  id: z.string().describe('Newsletter ID (required)'),
  updated_at: z
    .string()
    .describe(
      'Current updated_at timestamp for conflict prevention (required)'
    ),
  name: z.string().optional().describe('Newsletter name'),
  slug: z.string().optional().describe('URL slug'),
  description: z
    .string()
    .nullable()
    .optional()
    .describe('Newsletter description'),
  status: z
    .enum(['active', 'archived'])
    .optional()
    .describe('Newsletter status'),
  visibility: z
    .enum(['members', 'paid'])
    .optional()
    .describe('Who can subscribe'),
  sender_name: z
    .string()
    .nullable()
    .optional()
    .describe('Name shown as email sender'),
  sender_email: z
    .string()
    .nullable()
    .optional()
    .describe('Email address used as sender'),
  sender_reply_to: z
    .enum(['newsletter', 'support'])
    .optional()
    .describe('Reply-to address setting'),
  subscribe_on_signup: z
    .boolean()
    .optional()
    .describe('Auto-subscribe new members'),
  sort_order: z
    .number()
    .int()
    .optional()
    .describe('Display order for newsletter'),
  header_image: z
    .string()
    .nullable()
    .optional()
    .describe('Header image URL'),
  show_header_icon: z
    .boolean()
    .optional()
    .describe('Show site icon in header'),
  show_header_title: z
    .boolean()
    .optional()
    .describe('Show site title in header'),
  show_header_name: z
    .boolean()
    .optional()
    .describe('Show newsletter name in header'),
  title_font_category: z
    .enum(['serif', 'sans_serif'])
    .optional()
    .describe('Title font style'),
  title_alignment: z
    .enum(['left', 'center'])
    .optional()
    .describe('Title alignment'),
  body_font_category: z
    .enum(['serif', 'sans_serif'])
    .optional()
    .describe('Body text font style'),
  show_feature_image: z
    .boolean()
    .optional()
    .describe('Show feature image in emails'),
  footer_content: z
    .string()
    .nullable()
    .optional()
    .describe('Custom footer content'),
  show_badge: z
    .boolean()
    .optional()
    .describe('Show Ghost badge in footer'),
  show_post_title_section: z
    .boolean()
    .optional()
    .describe('Show post title section'),
  show_comment_cta: z
    .boolean()
    .optional()
    .describe('Show comment call-to-action'),
  show_subscription_details: z
    .boolean()
    .optional()
    .describe('Show subscription details'),
  show_latest_posts: z
    .boolean()
    .optional()
    .describe('Show latest posts section'),
  background_color: z
    .string()
    .optional()
    .describe('Background color (hex code or "light"/"dark")'),
  border_color: z
    .string()
    .nullable()
    .optional()
    .describe('Border color (hex code)'),
  title_color: z
    .string()
    .nullable()
    .optional()
    .describe('Title color (hex code)'),
});

/**
 * Inferred types from schemas.
 */
export type AdminBrowseNewslettersInput = z.infer<
  typeof AdminBrowseNewslettersInputSchema
>;
export type AdminReadNewsletterInput = z.infer<
  typeof AdminReadNewsletterInputSchema
>;
export type AdminCreateNewsletterInput = z.infer<
  typeof AdminCreateNewsletterInputSchema
>;
export type AdminUpdateNewsletterInput = z.infer<
  typeof AdminUpdateNewsletterInputSchema
>;
