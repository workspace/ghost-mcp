/**
 * JWT token generation for Ghost Admin API authentication.
 *
 * Reference: https://docs.ghost.org/admin-api/#token-authentication
 *
 * Ghost Admin API uses JWT tokens signed with HS256 for authentication.
 * The API key format is "id:secret" where:
 * - id: Used as the JWT "kid" (key ID) header
 * - secret: Hex-encoded bytes used to sign the token
 */

import jwt from 'jsonwebtoken';
import type {
  GhostAdminApiKey,
  GhostJwtHeader,
  GhostJwtPayload,
  JwtGenerationOptions,
} from '../types/auth.js';

/**
 * Maximum allowed expiration time in minutes per Ghost API requirements.
 */
const MAX_EXPIRATION_MINUTES = 5;

/**
 * Default expiration time in minutes.
 */
const DEFAULT_EXPIRATION_MINUTES = 5;

/**
 * Audience claim required by Ghost Admin API.
 */
const GHOST_AUDIENCE = '/admin/' as const;

/**
 * Error thrown when API key parsing or JWT generation fails.
 */
export class GhostAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GhostAuthError';
  }
}

/**
 * Parses a Ghost Admin API key string into its id and secret components.
 *
 * @param apiKey - The API key in format "id:secret"
 * @returns Parsed API key with id and secret
 * @throws GhostAuthError if the key format is invalid
 *
 * @example
 * ```typescript
 * const { id, secret } = parseApiKey('abc123:def456...');
 * ```
 */
export function parseApiKey(apiKey: string): GhostAdminApiKey {
  if (!apiKey || typeof apiKey !== 'string') {
    throw new GhostAuthError('API key must be a non-empty string');
  }

  const colonIndex = apiKey.indexOf(':');

  if (colonIndex === -1) {
    throw new GhostAuthError(
      'Invalid API key format: expected "id:secret" format'
    );
  }

  const id = apiKey.substring(0, colonIndex);
  const secret = apiKey.substring(colonIndex + 1);

  if (!id) {
    throw new GhostAuthError('Invalid API key format: id cannot be empty');
  }

  if (!secret) {
    throw new GhostAuthError('Invalid API key format: secret cannot be empty');
  }

  // Validate secret is valid hexadecimal
  if (!/^[a-fA-F0-9]+$/.test(secret)) {
    throw new GhostAuthError(
      'Invalid API key format: secret must be hexadecimal'
    );
  }

  return { id, secret };
}

/**
 * Decodes a hex-encoded secret string into a Buffer.
 *
 * @param hexSecret - Hex-encoded secret string
 * @returns Buffer containing the decoded bytes
 */
export function decodeSecret(hexSecret: string): Buffer {
  return Buffer.from(hexSecret, 'hex');
}

/**
 * Generates a JWT token for Ghost Admin API authentication.
 *
 * @param apiKey - The Ghost Admin API key (either as "id:secret" string or parsed object)
 * @param options - Optional configuration for token generation
 * @returns Signed JWT token string
 * @throws GhostAuthError if the API key is invalid or expiration exceeds 5 minutes
 *
 * @example
 * ```typescript
 * // Using string API key
 * const token = generateToken('abc123:def456...');
 *
 * // Using parsed API key with custom expiration
 * const { id, secret } = parseApiKey('abc123:def456...');
 * const token = generateToken({ id, secret }, { expiresInMinutes: 3 });
 * ```
 */
export function generateToken(
  apiKey: string | GhostAdminApiKey,
  options: JwtGenerationOptions = {}
): string {
  const { id, secret } =
    typeof apiKey === 'string' ? parseApiKey(apiKey) : apiKey;

  const expiresInMinutes =
    options.expiresInMinutes ?? DEFAULT_EXPIRATION_MINUTES;

  if (expiresInMinutes <= 0) {
    throw new GhostAuthError('Expiration time must be positive');
  }

  if (expiresInMinutes > MAX_EXPIRATION_MINUTES) {
    throw new GhostAuthError(
      `Expiration time cannot exceed ${MAX_EXPIRATION_MINUTES} minutes per Ghost API requirements`
    );
  }

  // Current time in seconds (Unix timestamp)
  const now = Math.floor(Date.now() / 1000);

  const header: GhostJwtHeader = {
    alg: 'HS256',
    kid: id,
    typ: 'JWT',
  };

  const payload: GhostJwtPayload = {
    iat: now,
    exp: now + expiresInMinutes * 60,
    aud: GHOST_AUDIENCE,
  };

  // Decode the hex-encoded secret to bytes
  const secretBytes = decodeSecret(secret);

  return jwt.sign(payload, secretBytes, {
    algorithm: 'HS256',
    header,
  });
}

/**
 * Creates an Authorization header value for Ghost Admin API requests.
 *
 * @param apiKey - The Ghost Admin API key
 * @param options - Optional configuration for token generation
 * @returns Authorization header value in format "Ghost {token}"
 *
 * @example
 * ```typescript
 * const authHeader = createAuthorizationHeader('abc123:def456...');
 * // Returns: "Ghost eyJhbGciOiJIUzI1NiIs..."
 *
 * // Use in fetch request:
 * fetch(url, {
 *   headers: {
 *     'Authorization': authHeader,
 *   }
 * });
 * ```
 */
export function createAuthorizationHeader(
  apiKey: string | GhostAdminApiKey,
  options: JwtGenerationOptions = {}
): string {
  const token = generateToken(apiKey, options);
  return `Ghost ${token}`;
}
