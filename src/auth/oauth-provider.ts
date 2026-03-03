/**
 * GhostOAuthProvider - OAuthServerProvider implementation for Ghost MCP.
 *
 * Implements the MCP SDK's OAuthServerProvider interface to provide
 * OAuth 2.1 authentication with Ghost CMS credentials. Users authenticate
 * by entering their Ghost URL and API keys through a browser-based form.
 */

import { Response } from 'express';
import type { OAuthServerProvider, AuthorizationParams } from '@modelcontextprotocol/sdk/server/auth/provider.js';
import type { OAuthRegisteredClientsStore } from '@modelcontextprotocol/sdk/server/auth/clients.js';
import type { OAuthClientInformationFull, OAuthTokens, OAuthTokenRevocationRequest } from '@modelcontextprotocol/sdk/shared/auth.js';
import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';
import { InvalidGrantError, InvalidRequestError } from '@modelcontextprotocol/sdk/server/auth/errors.js';
import {
  InMemoryClientsStore,
  AuthorizationCodeStore,
  TokenStore,
  generateRandomToken,
} from './oauth-store.js';
import type { GhostOAuthConfig } from './oauth-types.js';
import { OAUTH_CONSTANTS } from './oauth-types.js';

/**
 * Renders the Ghost credentials authorization page.
 */
function renderAuthorizePage(params: {
  clientId: string;
  redirectUri: string;
  state?: string;
  codeChallenge: string;
  resource?: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Connect to Ghost - Ghost MCP</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
    .card { background: white; border-radius: 12px; padding: 2rem; max-width: 480px; width: 100%; box-shadow: 0 2px 12px rgba(0,0,0,0.1); }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; color: #15171a; }
    p.desc { color: #738a94; margin-bottom: 1.5rem; font-size: 0.9rem; }
    label { display: block; font-weight: 600; margin-bottom: 0.25rem; color: #15171a; font-size: 0.9rem; }
    input[type="text"], input[type="url"] { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #dfe1e3; border-radius: 6px; font-size: 0.9rem; margin-bottom: 1rem; }
    input:focus { outline: none; border-color: #15171a; }
    .hint { color: #738a94; font-size: 0.8rem; margin-top: -0.75rem; margin-bottom: 1rem; }
    button { width: 100%; padding: 0.75rem; background: #15171a; color: white; border: none; border-radius: 6px; font-size: 1rem; font-weight: 600; cursor: pointer; }
    button:hover { background: #2c3039; }
    .error { color: #e25440; font-size: 0.85rem; margin-bottom: 1rem; display: none; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Connect to Ghost</h1>
    <p class="desc">Enter your Ghost site credentials to connect via MCP.</p>
    <div class="error" id="error"></div>
    <form method="POST" action="/authorize" id="authForm">
      <input type="hidden" name="client_id" value="${escapeHtml(params.clientId)}" />
      <input type="hidden" name="redirect_uri" value="${escapeHtml(params.redirectUri)}" />
      <input type="hidden" name="code_challenge" value="${escapeHtml(params.codeChallenge)}" />
      ${params.state ? `<input type="hidden" name="state" value="${escapeHtml(params.state)}" />` : ''}
      ${params.resource ? `<input type="hidden" name="resource" value="${escapeHtml(params.resource)}" />` : ''}
      <label for="ghost_url">Ghost URL *</label>
      <input type="url" id="ghost_url" name="ghost_url" placeholder="https://your-site.ghost.io" required />
      <p class="hint">Your Ghost site URL (e.g., https://example.ghost.io)</p>
      <label for="ghost_admin_api_key">Admin API Key</label>
      <input type="text" id="ghost_admin_api_key" name="ghost_admin_api_key" placeholder="64-character hex key" />
      <p class="hint">Found in Ghost Admin &rarr; Settings &rarr; Integrations</p>
      <label for="ghost_content_api_key">Content API Key</label>
      <input type="text" id="ghost_content_api_key" name="ghost_content_api_key" placeholder="Content API key" />
      <p class="hint">Read-only access. At least one API key is required.</p>
      <button type="submit">Connect</button>
    </form>
  </div>
  <script>
    document.getElementById('authForm').addEventListener('submit', function(e) {
      var admin = document.getElementById('ghost_admin_api_key').value.trim();
      var content = document.getElementById('ghost_content_api_key').value.trim();
      if (!admin && !content) {
        e.preventDefault();
        var err = document.getElementById('error');
        err.textContent = 'Please provide at least one API key (Admin or Content).';
        err.style.display = 'block';
      }
    });
  </script>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export class GhostOAuthProvider implements OAuthServerProvider {
  private readonly _clientsStore: InMemoryClientsStore;
  private readonly authCodeStore: AuthorizationCodeStore;
  private readonly tokenStore: TokenStore;

  constructor() {
    this._clientsStore = new InMemoryClientsStore();
    this.authCodeStore = new AuthorizationCodeStore();
    this.tokenStore = new TokenStore();
  }

  get clientsStore(): OAuthRegisteredClientsStore {
    return this._clientsStore;
  }

  /**
   * Renders the authorization page with Ghost credentials form.
   * Called by the SDK for GET /authorize.
   */
  async authorize(
    client: OAuthClientInformationFull,
    params: AuthorizationParams,
    res: Response
  ): Promise<void> {
    const html = renderAuthorizePage({
      clientId: client.client_id,
      redirectUri: params.redirectUri,
      state: params.state,
      codeChallenge: params.codeChallenge,
      resource: params.resource?.toString(),
    });
    res.type('html').send(html);
  }

  /**
   * Handles the POST /authorize form submission.
   * Validates Ghost config and generates an authorization code.
   * This is a custom method (not part of OAuthServerProvider interface),
   * called from the custom POST /authorize route handler.
   */
  async handleAuthorizationSubmit(
    clientId: string,
    params: {
      redirectUri: string;
      state?: string;
      codeChallenge: string;
      resource?: string;
    },
    ghostConfig: GhostOAuthConfig
  ): Promise<{ code: string; redirectUri: string; state?: string }> {
    // Validate at least one API key
    if (!ghostConfig.ghostAdminApiKey && !ghostConfig.ghostContentApiKey) {
      throw new InvalidRequestError('At least one API key (Admin or Content) is required');
    }

    // Validate Ghost URL
    if (!ghostConfig.ghostUrl) {
      throw new InvalidRequestError('Ghost URL is required');
    }

    // Generate authorization code
    const code = generateRandomToken();
    this.authCodeStore.save({
      code,
      clientId,
      codeChallenge: params.codeChallenge,
      redirectUri: params.redirectUri,
      ghostConfig,
      expiresAt: Date.now() + OAUTH_CONSTANTS.AUTH_CODE_EXPIRY * 1000,
      resource: params.resource,
    });

    return {
      code,
      redirectUri: params.redirectUri,
      state: params.state,
    };
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
      throw new InvalidGrantError('Invalid or expired access token');
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
