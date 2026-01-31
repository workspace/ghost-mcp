/**
 * Ghost Admin API Invites tools.
 *
 * Provides tools for creating staff invitations via the Ghost Admin API.
 */

export {
  executeAdminCreateInvite,
  TOOL_NAME as ADMIN_CREATE_INVITE_TOOL_NAME,
  TOOL_DESCRIPTION as ADMIN_CREATE_INVITE_TOOL_DESCRIPTION,
} from './create-invite.js';

export {
  AdminCreateInviteInputSchema,
  type AdminCreateInviteInput,
} from './schemas.js';
