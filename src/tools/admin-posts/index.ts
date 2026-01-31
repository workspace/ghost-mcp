/**
 * Ghost Admin API Posts tools.
 *
 * Provides tools for managing posts via the Ghost Admin API.
 */

export {
  executeAdminBrowsePosts,
  TOOL_NAME as ADMIN_BROWSE_POSTS_TOOL_NAME,
  TOOL_DESCRIPTION as ADMIN_BROWSE_POSTS_TOOL_DESCRIPTION,
} from './browse-posts.js';

export {
  executeAdminReadPost,
  TOOL_NAME as ADMIN_READ_POST_TOOL_NAME,
  TOOL_DESCRIPTION as ADMIN_READ_POST_TOOL_DESCRIPTION,
} from './read-post.js';

export {
  executeAdminCreatePost,
  TOOL_NAME as ADMIN_CREATE_POST_TOOL_NAME,
  TOOL_DESCRIPTION as ADMIN_CREATE_POST_TOOL_DESCRIPTION,
} from './create-post.js';

export {
  executeAdminUpdatePost,
  TOOL_NAME as ADMIN_UPDATE_POST_TOOL_NAME,
  TOOL_DESCRIPTION as ADMIN_UPDATE_POST_TOOL_DESCRIPTION,
} from './update-post.js';

export {
  executeAdminDeletePost,
  TOOL_NAME as ADMIN_DELETE_POST_TOOL_NAME,
  TOOL_DESCRIPTION as ADMIN_DELETE_POST_TOOL_DESCRIPTION,
  type DeletePostResponse,
} from './delete-post.js';

export {
  executeAdminCopyPost,
  TOOL_NAME as ADMIN_COPY_POST_TOOL_NAME,
  TOOL_DESCRIPTION as ADMIN_COPY_POST_TOOL_DESCRIPTION,
} from './copy-post.js';

export {
  AdminBrowsePostsInputSchema,
  AdminReadPostInputSchema,
  AdminCreatePostInputSchema,
  AdminUpdatePostInputSchema,
  AdminDeletePostInputSchema,
  AdminCopyPostInputSchema,
  type AdminBrowsePostsInput,
  type AdminReadPostInput,
  type AdminCreatePostInput,
  type AdminUpdatePostInput,
  type AdminDeletePostInput,
  type AdminCopyPostInput,
} from './schemas.js';
