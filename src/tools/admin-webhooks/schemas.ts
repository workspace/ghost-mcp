/**
 * Zod validation schemas for Ghost Admin API Webhooks tools.
 */

import { z } from 'zod';

/**
 * Schema for admin_create_webhook tool input.
 */
export const AdminCreateWebhookInputSchema = z.object({
  event: z
    .string()
    .describe(
      'Webhook trigger event (required). Available events: site.changed, post.added, post.deleted, post.edited, post.published, post.unpublished, post.scheduled, post.unscheduled, post.rescheduled, page.added, page.deleted, page.edited, page.published, page.unpublished, page.scheduled, page.unscheduled, page.rescheduled, tag.added, tag.edited, tag.deleted, post.tag.attached, post.tag.detached, page.tag.attached, page.tag.detached, member.added, member.edited, member.deleted'
    ),
  target_url: z
    .string()
    .url()
    .describe('Destination URL for webhook payloads (required)'),
  name: z
    .string()
    .optional()
    .describe('Descriptive name for the webhook'),
  secret: z
    .string()
    .optional()
    .describe('Secret for request signature validation'),
  api_version: z
    .string()
    .optional()
    .describe('API version for payload format (default: v6)'),
});

/**
 * Schema for admin_update_webhook tool input.
 */
export const AdminUpdateWebhookInputSchema = z.object({
  id: z.string().describe('Webhook ID (required)'),
  event: z
    .string()
    .optional()
    .describe(
      'Webhook trigger event. Available events: site.changed, post.added, post.deleted, post.edited, post.published, post.unpublished, post.scheduled, post.unscheduled, post.rescheduled, page.added, page.deleted, page.edited, page.published, page.unpublished, page.scheduled, page.unscheduled, page.rescheduled, tag.added, tag.edited, tag.deleted, post.tag.attached, post.tag.detached, page.tag.attached, page.tag.detached, member.added, member.edited, member.deleted'
    ),
  target_url: z
    .string()
    .url()
    .optional()
    .describe('Destination URL for webhook payloads'),
  name: z
    .string()
    .optional()
    .describe('Descriptive name for the webhook'),
  api_version: z
    .string()
    .optional()
    .describe('API version for payload format'),
});

/**
 * Schema for admin_delete_webhook tool input.
 */
export const AdminDeleteWebhookInputSchema = z.object({
  id: z.string().describe('Webhook ID to delete (required)'),
});

/**
 * Inferred types from schemas.
 */
export type AdminCreateWebhookInput = z.infer<typeof AdminCreateWebhookInputSchema>;
export type AdminUpdateWebhookInput = z.infer<typeof AdminUpdateWebhookInputSchema>;
export type AdminDeleteWebhookInput = z.infer<typeof AdminDeleteWebhookInputSchema>;
