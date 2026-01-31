/**
 * Zod validation schemas for Ghost Admin API Site tools.
 */

import { z } from 'zod';

/**
 * Schema for admin_read_site tool input.
 * The site endpoint accepts no parameters.
 */
export const AdminReadSiteInputSchema = z.object({});

/**
 * Inferred types from schemas.
 */
export type AdminReadSiteInput = z.infer<typeof AdminReadSiteInputSchema>;
