/**
 * Ghost Content API Posts tools.
 */

export {
  executeBrowsePosts,
  TOOL_NAME as BROWSE_POSTS_TOOL_NAME,
  TOOL_DESCRIPTION as BROWSE_POSTS_TOOL_DESCRIPTION,
} from './browse-posts.js';

export {
  executeReadPost,
  TOOL_NAME as READ_POST_TOOL_NAME,
  TOOL_DESCRIPTION as READ_POST_TOOL_DESCRIPTION,
} from './read-post.js';

export {
  BrowsePostsInputSchema,
  ReadPostInputSchema,
  type BrowsePostsInput,
  type ReadPostInput,
} from './schemas.js';
