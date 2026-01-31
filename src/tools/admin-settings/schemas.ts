/**
 * Zod validation schemas for Ghost Admin API Settings tools.
 */

import { z } from 'zod';

/**
 * Schema for admin_read_settings tool input.
 * The settings endpoint accepts no parameters.
 */
export const AdminReadSettingsInputSchema = z.object({});

/**
 * Inferred types from schemas.
 */
export type AdminReadSettingsInput = z.infer<typeof AdminReadSettingsInputSchema>;
