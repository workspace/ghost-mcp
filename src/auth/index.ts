/**
 * Authentication module for Ghost Admin API and MCP OAuth protocol.
 *
 * Provides JWT token generation following Ghost's authentication requirements
 * and OAuth 2.1 support for remote MCP access.
 */

export {
  parseApiKey,
  decodeSecret,
  generateToken,
  createAuthorizationHeader,
  GhostAuthError,
} from './jwt.js';

export type {
  GhostOAuthConfig,
  AuthorizationCodeRecord,
  AccessTokenRecord,
  RefreshTokenRecord,
} from './oauth-types.js';
export { OAUTH_CONSTANTS } from './oauth-types.js';

export {
  generateRandomToken,
  InMemoryClientsStore,
  AuthorizationCodeStore,
  TokenStore,
} from './oauth-store.js';

export { GhostOAuthProvider } from './oauth-provider.js';
