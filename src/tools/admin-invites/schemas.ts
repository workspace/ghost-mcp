/**
 * Zod validation schemas for Ghost Admin API Invites tools.
 */

import { z } from 'zod';

/**
 * Schema for admin_create_invite tool input.
 */
export const AdminCreateInviteInputSchema = z.object({
  email: z
    .string()
    .email()
    .describe('Email address to send invitation to (required)'),
  role_id: z
    .string()
    .describe(
      'Role ID to assign to the invited user (required). Use admin_browse_roles to get available role IDs.'
    ),
});

/**
 * Inferred types from schemas.
 */
export type AdminCreateInviteInput = z.infer<
  typeof AdminCreateInviteInputSchema
>;
