/**
 * Zod validation schemas for Ghost Admin API Roles tools.
 */

import { z } from 'zod';

/**
 * Schema for admin_browse_roles tool input.
 */
export const AdminBrowseRolesInputSchema = z.object({
  limit: z
    .union([z.number().int().positive(), z.literal('all')])
    .optional()
    .describe('Number of roles to return (default: all)'),
  fields: z
    .string()
    .optional()
    .describe('Comma-separated list of fields to return'),
});

/**
 * Inferred types from schemas.
 */
export type AdminBrowseRolesInput = z.infer<typeof AdminBrowseRolesInputSchema>;
