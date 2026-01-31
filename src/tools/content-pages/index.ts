/**
 * Ghost Content API Pages tools.
 */

export {
  executeBrowsePages,
  TOOL_NAME as BROWSE_PAGES_TOOL_NAME,
  TOOL_DESCRIPTION as BROWSE_PAGES_TOOL_DESCRIPTION,
} from './browse-pages.js';

export {
  executeReadPage,
  TOOL_NAME as READ_PAGE_TOOL_NAME,
  TOOL_DESCRIPTION as READ_PAGE_TOOL_DESCRIPTION,
} from './read-page.js';

export {
  BrowsePagesInputSchema,
  ReadPageInputSchema,
  type BrowsePagesInput,
  type ReadPageInput,
} from './schemas.js';
