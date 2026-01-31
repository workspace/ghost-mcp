/**
 * Ghost Admin API Tags tools.
 *
 * Provides tools for managing tags via the Ghost Admin API.
 */

export {
  executeAdminBrowseTags,
  TOOL_NAME as ADMIN_BROWSE_TAGS_TOOL_NAME,
  TOOL_DESCRIPTION as ADMIN_BROWSE_TAGS_TOOL_DESCRIPTION,
} from './browse-tags.js';

export {
  executeAdminReadTag,
  TOOL_NAME as ADMIN_READ_TAG_TOOL_NAME,
  TOOL_DESCRIPTION as ADMIN_READ_TAG_TOOL_DESCRIPTION,
} from './read-tag.js';

export {
  executeAdminCreateTag,
  TOOL_NAME as ADMIN_CREATE_TAG_TOOL_NAME,
  TOOL_DESCRIPTION as ADMIN_CREATE_TAG_TOOL_DESCRIPTION,
} from './create-tag.js';

export {
  executeAdminUpdateTag,
  TOOL_NAME as ADMIN_UPDATE_TAG_TOOL_NAME,
  TOOL_DESCRIPTION as ADMIN_UPDATE_TAG_TOOL_DESCRIPTION,
} from './update-tag.js';

export {
  executeAdminDeleteTag,
  TOOL_NAME as ADMIN_DELETE_TAG_TOOL_NAME,
  TOOL_DESCRIPTION as ADMIN_DELETE_TAG_TOOL_DESCRIPTION,
  type DeleteTagResponse,
} from './delete-tag.js';

export {
  AdminBrowseTagsInputSchema,
  AdminReadTagInputSchema,
  AdminCreateTagInputSchema,
  AdminUpdateTagInputSchema,
  AdminDeleteTagInputSchema,
  type AdminBrowseTagsInput,
  type AdminReadTagInput,
  type AdminCreateTagInput,
  type AdminUpdateTagInput,
  type AdminDeleteTagInput,
} from './schemas.js';
