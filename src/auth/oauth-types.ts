/**
 * OAuth type definitions for MCP OAuth protocol support.
 *
 * Defines types for Ghost OAuth configuration, authorization codes,
 * access tokens, and refresh tokens used in the OAuth 2.1 flow.
 */

/**
 * Ghost connection configuration obtained during OAuth authorization.
 */
export interface GhostOAuthConfig {
  ghostUrl: string;
  ghostContentApiKey?: string;
  ghostAdminApiKey?: string;
}

/**
 * Authorization code record stored during the OAuth flow.
 */
export interface AuthorizationCodeRecord {
  code: string;
  clientId: string;
  codeChallenge: string;
  redirectUri: string;
  ghostConfig: GhostOAuthConfig;
  expiresAt: number;
  resource?: string;
}

/**
 * Access token record linking a token to Ghost configuration.
 */
export interface AccessTokenRecord {
  token: string;
  clientId: string;
  ghostConfig: GhostOAuthConfig;
  scopes: string[];
  expiresAt: number;
  resource?: string;
}

/**
 * Refresh token record for token rotation.
 */
export interface RefreshTokenRecord {
  token: string;
  clientId: string;
  ghostConfig: GhostOAuthConfig;
  scopes: string[];
  expiresAt: number;
  resource?: string;
}

/**
 * OAuth timing constants.
 */
export const OAUTH_CONSTANTS = {
  /** Access token expiry in seconds (1 hour) */
  ACCESS_TOKEN_EXPIRY: 3600,
  /** Refresh token expiry in seconds (30 days) */
  REFRESH_TOKEN_EXPIRY: 30 * 24 * 3600,
  /** Authorization code expiry in seconds (5 minutes) */
  AUTH_CODE_EXPIRY: 300,
} as const;
