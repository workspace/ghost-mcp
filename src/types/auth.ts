/**
 * Authentication type definitions for Ghost Admin API.
 */

/**
 * Ghost Admin API key in the format "id:secret".
 * - id: The API key identifier (used as JWT kid header)
 * - secret: Hex-encoded secret for signing JWTs
 */
export interface GhostAdminApiKey {
  id: string;
  secret: string;
}

/**
 * JWT header structure for Ghost Admin API authentication.
 */
export interface GhostJwtHeader {
  alg: 'HS256';
  kid: string;
  typ: 'JWT';
}

/**
 * JWT payload structure for Ghost Admin API authentication.
 */
export interface GhostJwtPayload {
  iat: number;
  exp: number;
  aud: '/admin/';
}

/**
 * Options for JWT token generation.
 */
export interface JwtGenerationOptions {
  /**
   * Token expiration time in minutes.
   * Must be <= 5 minutes per Ghost API requirements.
   * Defaults to 5 minutes.
   */
  expiresInMinutes?: number;
}

/**
 * Result of parsing a Ghost Admin API key.
 */
export type ParsedApiKey = GhostAdminApiKey;
