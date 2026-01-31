/**
 * Authentication module for Ghost Admin API.
 *
 * Provides JWT token generation following Ghost's authentication requirements.
 */

export {
  parseApiKey,
  decodeSecret,
  generateToken,
  createAuthorizationHeader,
  GhostAuthError,
} from './jwt.js';
