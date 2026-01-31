/**
 * Type definitions for ghost-mcp.
 */

export type {
  ServerInfo,
  ServerCapabilities,
  GhostMcpCapabilities,
} from './server.js';

export type {
  GhostAdminApiKey,
  GhostJwtHeader,
  GhostJwtPayload,
  JwtGenerationOptions,
  ParsedApiKey,
} from './auth.js';

export type {
  GhostClientConfig,
  GhostRequestOptions,
  GhostApiErrorResponse,
  GhostApiErrorDetail,
  GhostApiResponse,
  GhostApiMeta,
  GhostPagination,
  GhostPost,
  GhostPage,
  GhostTag,
  GhostAuthor,
  GhostRole,
  GhostMember,
  GhostLabel,
  GhostTier,
  GhostNewsletter,
  GhostSite,
  GhostWebhook,
  GhostImage,
  GhostOffer,
} from './ghost-api.js';
