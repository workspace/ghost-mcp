/**
 * Ghost Content API Authors tools.
 */

export {
  executeBrowseAuthors,
  TOOL_NAME as BROWSE_AUTHORS_TOOL_NAME,
  TOOL_DESCRIPTION as BROWSE_AUTHORS_TOOL_DESCRIPTION,
} from './browse-authors.js';

export {
  executeReadAuthor,
  TOOL_NAME as READ_AUTHOR_TOOL_NAME,
  TOOL_DESCRIPTION as READ_AUTHOR_TOOL_DESCRIPTION,
} from './read-author.js';

export {
  BrowseAuthorsInputSchema,
  ReadAuthorInputSchema,
  type BrowseAuthorsInput,
  type ReadAuthorInput,
} from './schemas.js';
