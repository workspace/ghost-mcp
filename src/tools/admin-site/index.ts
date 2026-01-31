/**
 * Ghost Admin API Site tools.
 *
 * Provides tools for reading site information via the Ghost Admin API.
 */

export {
  executeAdminReadSite,
  TOOL_NAME as ADMIN_READ_SITE_TOOL_NAME,
  TOOL_DESCRIPTION as ADMIN_READ_SITE_TOOL_DESCRIPTION,
} from './read-site.js';

export {
  AdminReadSiteInputSchema,
  type AdminReadSiteInput,
} from './schemas.js';
