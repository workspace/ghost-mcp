/**
 * Ghost Content API Tags tools.
 */

export {
  executeBrowseTags,
  TOOL_NAME as BROWSE_TAGS_TOOL_NAME,
  TOOL_DESCRIPTION as BROWSE_TAGS_TOOL_DESCRIPTION,
} from './browse-tags.js';

export {
  executeReadTag,
  TOOL_NAME as READ_TAG_TOOL_NAME,
  TOOL_DESCRIPTION as READ_TAG_TOOL_DESCRIPTION,
} from './read-tag.js';

export {
  BrowseTagsInputSchema,
  ReadTagInputSchema,
  type BrowseTagsInput,
  type ReadTagInput,
} from './schemas.js';
