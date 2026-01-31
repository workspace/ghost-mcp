/**
 * Ghost Admin API Pages tools.
 *
 * Provides tools for managing pages via the Ghost Admin API.
 */

export {
  executeAdminBrowsePages,
  TOOL_NAME as ADMIN_BROWSE_PAGES_TOOL_NAME,
  TOOL_DESCRIPTION as ADMIN_BROWSE_PAGES_TOOL_DESCRIPTION,
} from './browse-pages.js';

export {
  executeAdminReadPage,
  TOOL_NAME as ADMIN_READ_PAGE_TOOL_NAME,
  TOOL_DESCRIPTION as ADMIN_READ_PAGE_TOOL_DESCRIPTION,
} from './read-page.js';

export {
  executeAdminCreatePage,
  TOOL_NAME as ADMIN_CREATE_PAGE_TOOL_NAME,
  TOOL_DESCRIPTION as ADMIN_CREATE_PAGE_TOOL_DESCRIPTION,
} from './create-page.js';

export {
  executeAdminUpdatePage,
  TOOL_NAME as ADMIN_UPDATE_PAGE_TOOL_NAME,
  TOOL_DESCRIPTION as ADMIN_UPDATE_PAGE_TOOL_DESCRIPTION,
} from './update-page.js';

export {
  executeAdminDeletePage,
  TOOL_NAME as ADMIN_DELETE_PAGE_TOOL_NAME,
  TOOL_DESCRIPTION as ADMIN_DELETE_PAGE_TOOL_DESCRIPTION,
  type DeletePageResponse,
} from './delete-page.js';

export {
  executeAdminCopyPage,
  TOOL_NAME as ADMIN_COPY_PAGE_TOOL_NAME,
  TOOL_DESCRIPTION as ADMIN_COPY_PAGE_TOOL_DESCRIPTION,
} from './copy-page.js';

export {
  AdminBrowsePagesInputSchema,
  AdminReadPageInputSchema,
  AdminCreatePageInputSchema,
  AdminUpdatePageInputSchema,
  AdminDeletePageInputSchema,
  AdminCopyPageInputSchema,
  type AdminBrowsePagesInput,
  type AdminReadPageInput,
  type AdminCreatePageInput,
  type AdminUpdatePageInput,
  type AdminDeletePageInput,
  type AdminCopyPageInput,
} from './schemas.js';
