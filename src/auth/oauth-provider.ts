/**
 * GhostOAuthProvider - OAuthServerProvider implementation for Ghost MCP.
 *
 * Implements the MCP SDK's OAuthServerProvider interface to provide
 * OAuth 2.1 authentication with Ghost CMS credentials. When credentials
 * are stored in the CredentialStore, authorization codes are issued
 * immediately. Otherwise, users are redirected to /login.
 */

import { Response } from 'express';
import type { OAuthServerProvider, AuthorizationParams } from '@modelcontextprotocol/sdk/server/auth/provider.js';
import type { OAuthRegisteredClientsStore } from '@modelcontextprotocol/sdk/server/auth/clients.js';
import type { OAuthClientInformationFull, OAuthTokens, OAuthTokenRevocationRequest } from '@modelcontextprotocol/sdk/shared/auth.js';
import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';
import { InvalidGrantError, InvalidTokenError } from '@modelcontextprotocol/sdk/server/auth/errors.js';
import {
  InMemoryClientsStore,
  AuthorizationCodeStore,
  TokenStore,
  generateRandomToken,
} from './oauth-store.js';
import type { GhostOAuthConfig } from './oauth-types.js';
import { OAUTH_CONSTANTS } from './oauth-types.js';
import type { CredentialStore } from './credential-store.js';

export class GhostOAuthProvider implements OAuthServerProvider {
  private readonly _clientsStore: InMemoryClientsStore;
  private readonly authCodeStore: AuthorizationCodeStore;
  private readonly tokenStore: TokenStore;
  private readonly credentialStore?: CredentialStore;
  private readonly issuerUrl?: string;

  constructor(options?: { credentialStore?: CredentialStore; issuerUrl?: string }) {
    this._clientsStore = new InMemoryClientsStore();
    this.authCodeStore = new AuthorizationCodeStore();
    this.tokenStore = new TokenStore();
    this.credentialStore = options?.credentialStore;
    this.issuerUrl = options?.issuerUrl;
  }

  get clientsStore(): OAuthRegisteredClientsStore {
    return this._clientsStore;
  }

  /**
   * Handles GET /authorize.
   * If credentials are stored, issues an auth code and redirects back.
   * If not, redirects to /login with returnTo pointing back to this authorize URL.
   */
  async authorize(
    client: OAuthClientInformationFull,
    params: AuthorizationParams,
    res: Response
  ): Promise<void> {
    if (this.credentialStore?.has()) {
      // Credentials available - issue auth code and redirect
      const ghostConfig = this.credentialStore.get()!;
      const code = this.issueAuthorizationCode(client.client_id, params, ghostConfig);
      const redirectUrl = new URL(params.redirectUri);
      redirectUrl.searchParams.set('code', code);
      if (params.state) {
        redirectUrl.searchParams.set('state', params.state);
      }
      res.redirect(redirectUrl.toString());
    } else {
      // No credentials - redirect to /login
      const authorizeParams = new URLSearchParams();
      authorizeParams.set('client_id', client.client_id);
      authorizeParams.set('redirect_uri', params.redirectUri);
      authorizeParams.set('code_challenge', params.codeChallenge);
      authorizeParams.set('code_challenge_method', 'S256');
      authorizeParams.set('response_type', 'code');
      if (params.state) {
        authorizeParams.set('state', params.state);
      }
      if (params.resource) {
        authorizeParams.set('resource', params.resource.toString());
      }

      const baseUrl = this.issuerUrl ?? '';
      const authorizeUrl = `${baseUrl}/authorize?${authorizeParams.toString()}`;
      const loginParams = new URLSearchParams({ returnTo: authorizeUrl });
      res.redirect(`${baseUrl}/login?${loginParams.toString()}`);
    }
  }

  /**
   * Issues an authorization code for the given client and Ghost config.
   * Used internally by authorize() and by the settings redirect flow.
   */
  issueAuthorizationCode(
    clientId: string,
    params: { redirectUri: string; state?: string; codeChallenge: string; resource?: string | URL },
    ghostConfig: GhostOAuthConfig
  ): string {
    const code = generateRandomToken();
    this.authCodeStore.save({
      code,
      clientId,
      codeChallenge: params.codeChallenge,
      redirectUri: params.redirectUri,
      ghostConfig,
      expiresAt: Date.now() + OAUTH_CONSTANTS.AUTH_CODE_EXPIRY * 1000,
      resource: params.resource?.toString(),
    });
    return code;
  }

  /**
   * Returns the code_challenge associated with an authorization code.
   */
  async challengeForAuthorizationCode(
    _client: OAuthClientInformationFull,
    authorizationCode: string
  ): Promise<string> {
    const record = this.authCodeStore.get(authorizationCode);
    if (!record) {
      throw new InvalidGrantError('Invalid or expired authorization code');
    }
    return record.codeChallenge;
  }

  /**
   * Exchanges an authorization code for access + refresh tokens.
   * Consumes the code (single-use) and links tokens to Ghost config.
   */
  async exchangeAuthorizationCode(
    _client: OAuthClientInformationFull,
    authorizationCode: string,
    _codeVerifier?: string,
    _redirectUri?: string,
    resource?: URL
  ): Promise<OAuthTokens> {
    const record = this.authCodeStore.consume(authorizationCode);
    if (!record) {
      throw new InvalidGrantError('Invalid or expired authorization code');
    }

    const accessToken = generateRandomToken();
    const refreshToken = generateRandomToken();
    const now = Date.now();

    this.tokenStore.saveAccessToken({
      token: accessToken,
      clientId: record.clientId,
      ghostConfig: record.ghostConfig,
      scopes: [],
      expiresAt: now + OAUTH_CONSTANTS.ACCESS_TOKEN_EXPIRY * 1000,
      resource: resource?.toString() ?? record.resource,
    });

    this.tokenStore.saveRefreshToken({
      token: refreshToken,
      clientId: record.clientId,
      ghostConfig: record.ghostConfig,
      scopes: [],
      expiresAt: now + OAUTH_CONSTANTS.REFRESH_TOKEN_EXPIRY * 1000,
      resource: resource?.toString() ?? record.resource,
    });

    return {
      access_token: accessToken,
      token_type: 'bearer',
      expires_in: OAUTH_CONSTANTS.ACCESS_TOKEN_EXPIRY,
      refresh_token: refreshToken,
    };
  }

  /**
   * Exchanges a refresh token for new access + refresh tokens (token rotation).
   */
  async exchangeRefreshToken(
    _client: OAuthClientInformationFull,
    refreshToken: string,
    scopes?: string[],
    resource?: URL
  ): Promise<OAuthTokens> {
    const record = this.tokenStore.getRefreshToken(refreshToken);
    if (!record) {
      throw new InvalidGrantError('Invalid or expired refresh token');
    }

    // Revoke old refresh token (rotation)
    this.tokenStore.revokeRefreshToken(refreshToken);

    const newAccessToken = generateRandomToken();
    const newRefreshToken = generateRandomToken();
    const now = Date.now();
    const effectiveScopes = scopes ?? record.scopes;

    this.tokenStore.saveAccessToken({
      token: newAccessToken,
      clientId: record.clientId,
      ghostConfig: record.ghostConfig,
      scopes: effectiveScopes,
      expiresAt: now + OAUTH_CONSTANTS.ACCESS_TOKEN_EXPIRY * 1000,
      resource: resource?.toString() ?? record.resource,
    });

    this.tokenStore.saveRefreshToken({
      token: newRefreshToken,
      clientId: record.clientId,
      ghostConfig: record.ghostConfig,
      scopes: effectiveScopes,
      expiresAt: now + OAUTH_CONSTANTS.REFRESH_TOKEN_EXPIRY * 1000,
      resource: resource?.toString() ?? record.resource,
    });

    return {
      access_token: newAccessToken,
      token_type: 'bearer',
      expires_in: OAUTH_CONSTANTS.ACCESS_TOKEN_EXPIRY,
      refresh_token: newRefreshToken,
    };
  }

  /**
   * Verifies an access token and returns AuthInfo with Ghost config in `extra`.
   */
  async verifyAccessToken(token: string): Promise<AuthInfo> {
    const record = this.tokenStore.getAccessToken(token);
    if (!record) {
      throw new InvalidTokenError('Invalid or expired access token');
    }

    return {
      token: record.token,
      clientId: record.clientId,
      scopes: record.scopes,
      expiresAt: Math.floor(record.expiresAt / 1000),
      resource: record.resource ? new URL(record.resource) : undefined,
      extra: {
        ghostUrl: record.ghostConfig.ghostUrl,
        ghostAdminApiKey: record.ghostConfig.ghostAdminApiKey,
        ghostContentApiKey: record.ghostConfig.ghostContentApiKey,
      },
    };
  }

  /**
   * Revokes an access or refresh token.
   */
  async revokeToken(
    _client: OAuthClientInformationFull,
    request: OAuthTokenRevocationRequest
  ): Promise<void> {
    const { token, token_type_hint } = request;

    if (token_type_hint === 'refresh_token') {
      this.tokenStore.revokeRefreshToken(token);
    } else if (token_type_hint === 'access_token') {
      this.tokenStore.revokeAccessToken(token);
    } else {
      // Try both if no hint
      this.tokenStore.revokeAccessToken(token);
      this.tokenStore.revokeRefreshToken(token);
    }
  }
}
