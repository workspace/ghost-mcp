/**
 * Ghost Admin API Offers tools.
 *
 * Provides tools for managing offers via the Ghost Admin API.
 */

export {
  executeAdminBrowseOffers,
  TOOL_NAME as ADMIN_BROWSE_OFFERS_TOOL_NAME,
  TOOL_DESCRIPTION as ADMIN_BROWSE_OFFERS_TOOL_DESCRIPTION,
} from './browse-offers.js';

export {
  executeAdminCreateOffer,
  TOOL_NAME as ADMIN_CREATE_OFFER_TOOL_NAME,
  TOOL_DESCRIPTION as ADMIN_CREATE_OFFER_TOOL_DESCRIPTION,
} from './create-offer.js';

export {
  executeAdminUpdateOffer,
  TOOL_NAME as ADMIN_UPDATE_OFFER_TOOL_NAME,
  TOOL_DESCRIPTION as ADMIN_UPDATE_OFFER_TOOL_DESCRIPTION,
} from './update-offer.js';

export {
  AdminBrowseOffersInputSchema,
  AdminCreateOfferInputSchema,
  AdminUpdateOfferInputSchema,
  type AdminBrowseOffersInput,
  type AdminCreateOfferInput,
  type AdminUpdateOfferInput,
} from './schemas.js';
