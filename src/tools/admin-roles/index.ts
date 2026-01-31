/**
 * Ghost Admin API Roles tools.
 *
 * Provides tools for browsing roles via the Ghost Admin API.
 */

export {
  executeAdminBrowseRoles,
  TOOL_NAME as ADMIN_BROWSE_ROLES_TOOL_NAME,
  TOOL_DESCRIPTION as ADMIN_BROWSE_ROLES_TOOL_DESCRIPTION,
} from './browse-roles.js';

export {
  AdminBrowseRolesInputSchema,
  type AdminBrowseRolesInput,
} from './schemas.js';
