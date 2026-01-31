/**
 * Ghost Admin API Webhooks tools.
 *
 * Provides tools for managing webhooks via the Ghost Admin API.
 */

export {
  executeAdminCreateWebhook,
  TOOL_NAME as ADMIN_CREATE_WEBHOOK_TOOL_NAME,
  TOOL_DESCRIPTION as ADMIN_CREATE_WEBHOOK_TOOL_DESCRIPTION,
} from './create-webhook.js';

export {
  executeAdminUpdateWebhook,
  TOOL_NAME as ADMIN_UPDATE_WEBHOOK_TOOL_NAME,
  TOOL_DESCRIPTION as ADMIN_UPDATE_WEBHOOK_TOOL_DESCRIPTION,
} from './update-webhook.js';

export {
  executeAdminDeleteWebhook,
  TOOL_NAME as ADMIN_DELETE_WEBHOOK_TOOL_NAME,
  TOOL_DESCRIPTION as ADMIN_DELETE_WEBHOOK_TOOL_DESCRIPTION,
  type DeleteWebhookResponse,
} from './delete-webhook.js';

export {
  AdminCreateWebhookInputSchema,
  AdminUpdateWebhookInputSchema,
  AdminDeleteWebhookInputSchema,
  type AdminCreateWebhookInput,
  type AdminUpdateWebhookInput,
  type AdminDeleteWebhookInput,
} from './schemas.js';
