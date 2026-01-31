/**
 * Ghost Admin API Newsletters tools.
 *
 * Provides tools for managing newsletters via the Ghost Admin API.
 */

export {
  executeAdminBrowseNewsletters,
  TOOL_NAME as ADMIN_BROWSE_NEWSLETTERS_TOOL_NAME,
  TOOL_DESCRIPTION as ADMIN_BROWSE_NEWSLETTERS_TOOL_DESCRIPTION,
} from './browse-newsletters.js';

export {
  executeAdminReadNewsletter,
  TOOL_NAME as ADMIN_READ_NEWSLETTER_TOOL_NAME,
  TOOL_DESCRIPTION as ADMIN_READ_NEWSLETTER_TOOL_DESCRIPTION,
} from './read-newsletter.js';

export {
  executeAdminCreateNewsletter,
  TOOL_NAME as ADMIN_CREATE_NEWSLETTER_TOOL_NAME,
  TOOL_DESCRIPTION as ADMIN_CREATE_NEWSLETTER_TOOL_DESCRIPTION,
} from './create-newsletter.js';

export {
  executeAdminUpdateNewsletter,
  TOOL_NAME as ADMIN_UPDATE_NEWSLETTER_TOOL_NAME,
  TOOL_DESCRIPTION as ADMIN_UPDATE_NEWSLETTER_TOOL_DESCRIPTION,
} from './update-newsletter.js';

export {
  AdminBrowseNewslettersInputSchema,
  AdminReadNewsletterInputSchema,
  AdminCreateNewsletterInputSchema,
  AdminUpdateNewsletterInputSchema,
  type AdminBrowseNewslettersInput,
  type AdminReadNewsletterInput,
  type AdminCreateNewsletterInput,
  type AdminUpdateNewsletterInput,
} from './schemas.js';
