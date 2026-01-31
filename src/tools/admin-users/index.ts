/**
 * Ghost Admin API Users tools.
 *
 * Provides tools for managing staff users via the Ghost Admin API.
 */

export {
  executeAdminBrowseUsers,
  TOOL_NAME as ADMIN_BROWSE_USERS_TOOL_NAME,
  TOOL_DESCRIPTION as ADMIN_BROWSE_USERS_TOOL_DESCRIPTION,
} from './browse-users.js';

export {
  executeAdminReadUser,
  TOOL_NAME as ADMIN_READ_USER_TOOL_NAME,
  TOOL_DESCRIPTION as ADMIN_READ_USER_TOOL_DESCRIPTION,
} from './read-user.js';

export {
  executeAdminUpdateUser,
  TOOL_NAME as ADMIN_UPDATE_USER_TOOL_NAME,
  TOOL_DESCRIPTION as ADMIN_UPDATE_USER_TOOL_DESCRIPTION,
} from './update-user.js';

export {
  executeAdminDeleteUser,
  TOOL_NAME as ADMIN_DELETE_USER_TOOL_NAME,
  TOOL_DESCRIPTION as ADMIN_DELETE_USER_TOOL_DESCRIPTION,
} from './delete-user.js';

export {
  AdminBrowseUsersInputSchema,
  AdminReadUserInputSchema,
  AdminUpdateUserInputSchema,
  AdminDeleteUserInputSchema,
  type AdminBrowseUsersInput,
  type AdminReadUserInput,
  type AdminUpdateUserInput,
  type AdminDeleteUserInput,
} from './schemas.js';
