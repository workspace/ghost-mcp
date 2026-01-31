/**
 * Ghost Admin API Themes tools.
 *
 * Provides tools for uploading and activating themes via the Ghost Admin API.
 */

export {
  executeAdminUploadTheme,
  TOOL_NAME as ADMIN_UPLOAD_THEME_TOOL_NAME,
  TOOL_DESCRIPTION as ADMIN_UPLOAD_THEME_TOOL_DESCRIPTION,
} from './upload-theme.js';

export {
  executeAdminActivateTheme,
  TOOL_NAME as ADMIN_ACTIVATE_THEME_TOOL_NAME,
  TOOL_DESCRIPTION as ADMIN_ACTIVATE_THEME_TOOL_DESCRIPTION,
} from './activate-theme.js';

export {
  AdminUploadThemeInputSchema,
  AdminActivateThemeInputSchema,
  type AdminUploadThemeInput,
  type AdminActivateThemeInput,
} from './schemas.js';
