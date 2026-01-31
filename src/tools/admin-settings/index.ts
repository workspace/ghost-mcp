/**
 * Ghost Admin API Settings tools.
 *
 * Provides tools for reading site settings via the Ghost Admin API.
 */

export {
  executeAdminReadSettings,
  TOOL_NAME as ADMIN_READ_SETTINGS_TOOL_NAME,
  TOOL_DESCRIPTION as ADMIN_READ_SETTINGS_TOOL_DESCRIPTION,
} from './read-settings.js';

export {
  AdminReadSettingsInputSchema,
  type AdminReadSettingsInput,
} from './schemas.js';
