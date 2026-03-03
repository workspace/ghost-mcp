/**
 * In-memory stores for OAuth data: clients, authorization codes, and tokens.
 *
 * These stores implement or complement the MCP SDK's OAuth interfaces
 * for managing the OAuth 2.1 lifecycle in a single-process server.
 */

import { randomBytes } from 'node:crypto';
import type { OAuthClientInformationFull } from '@modelcontextprotocol/sdk/shared/auth.js';
import type { OAuthRegisteredClientsStore } from '@modelcontextprotocol/sdk/server/auth/clients.js';
import type {
  AuthorizationCodeRecord,
  AccessTokenRecord,
  RefreshTokenRecord,
} from './oauth-types.js';

/**
 * Generates a cryptographically random token string.
 */
export function generateRandomToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * In-memory implementation of OAuthRegisteredClientsStore.
 * Stores dynamically registered OAuth clients.
 */
export class InMemoryClientsStore implements OAuthRegisteredClientsStore {
  private clients = new Map<string, OAuthClientInformationFull>();

  async getClient(
    clientId: string
  ): Promise<OAuthClientInformationFull | undefined> {
    return this.clients.get(clientId);
  }

  async registerClient(
    client: Omit<
      OAuthClientInformationFull,
      'client_id' | 'client_id_issued_at'
    >
  ): Promise<OAuthClientInformationFull> {
    const clientId = generateRandomToken();
    const fullClient: OAuthClientInformationFull = {
      ...client,
      client_id: clientId,
      client_id_issued_at: Math.floor(Date.now() / 1000),
    };
    this.clients.set(clientId, fullClient);
    return fullClient;
  }
}

/**
 * In-memory store for authorization codes.
 * Codes are single-use and expire automatically.
 */
export class AuthorizationCodeStore {
  private codes = new Map<string, AuthorizationCodeRecord>();

  save(record: AuthorizationCodeRecord): void {
    this.codes.set(record.code, record);
  }

  get(code: string): AuthorizationCodeRecord | undefined {
    const record = this.codes.get(code);
    if (!record) return undefined;
    if (Date.now() > record.expiresAt) {
      this.codes.delete(code);
      return undefined;
    }
    return record;
  }

  /**
   * Retrieves and deletes the code (single-use consumption).
   */
  consume(code: string): AuthorizationCodeRecord | undefined {
    const record = this.get(code);
    if (record) {
      this.codes.delete(code);
    }
    return record;
  }
}

/**
 * In-memory store for access and refresh tokens.
 * Expired tokens are cleaned up on access.
 */
export class TokenStore {
  private accessTokens = new Map<string, AccessTokenRecord>();
  private refreshTokens = new Map<string, RefreshTokenRecord>();

  saveAccessToken(record: AccessTokenRecord): void {
    this.accessTokens.set(record.token, record);
  }

  getAccessToken(token: string): AccessTokenRecord | undefined {
    const record = this.accessTokens.get(token);
    if (!record) return undefined;
    if (Date.now() > record.expiresAt) {
      this.accessTokens.delete(token);
      return undefined;
    }
    return record;
  }

  revokeAccessToken(token: string): void {
    this.accessTokens.delete(token);
  }

  saveRefreshToken(record: RefreshTokenRecord): void {
    this.refreshTokens.set(record.token, record);
  }

  getRefreshToken(token: string): RefreshTokenRecord | undefined {
    const record = this.refreshTokens.get(token);
    if (!record) return undefined;
    if (Date.now() > record.expiresAt) {
      this.refreshTokens.delete(token);
      return undefined;
    }
    return record;
  }

  revokeRefreshToken(token: string): void {
    this.refreshTokens.delete(token);
  }
}
