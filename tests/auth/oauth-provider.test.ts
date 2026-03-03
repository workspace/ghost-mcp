import { randomBytes } from 'node:crypto';
import { describe, it, expect, beforeEach } from 'vitest';
import { GhostOAuthProvider } from '../../src/auth/index.js';
import { CredentialStore } from '../../src/auth/credential-store.js';
import type { OAuthClientInformationFull } from '@modelcontextprotocol/sdk/shared/auth.js';

const TEST_KEY = randomBytes(32).toString('hex');

// Helper to create a mock Express response
function createMockResponse(): {
  res: {
    type: (t: string) => typeof res;
    send: (body: string) => typeof res;
    redirect: (url: string) => void;
    sentBody?: string;
    sentType?: string;
    redirectUrl?: string;
  };
} {
  const res = {
    sentType: undefined as string | undefined,
    sentBody: undefined as string | undefined,
    redirectUrl: undefined as string | undefined,
    type(t: string) {
      res.sentType = t;
      return res;
    },
    send(body: string) {
      res.sentBody = body;
      return res;
    },
    redirect(url: string) {
      res.redirectUrl = url;
    },
  };
  return { res };
}

const mockClient: OAuthClientInformationFull = {
  client_id: 'test-client-id',
  client_id_issued_at: Math.floor(Date.now() / 1000),
  redirect_uris: ['http://localhost/callback'],
  client_name: 'Test Client',
};

const validGhostConfig = {
  ghostUrl: 'https://example.ghost.io',
  ghostAdminApiKey: '0123456789abcdef0123456789abcdef:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
};

const validParams = {
  redirectUri: 'http://localhost/callback',
  state: 'test-state',
  codeChallenge: 'challenge123',
};

describe('GhostOAuthProvider', () => {
  let provider: GhostOAuthProvider;

  beforeEach(() => {
    provider = new GhostOAuthProvider();
  });

  describe('clientsStore', () => {
    it('should provide a clients store', () => {
      expect(provider.clientsStore).toBeDefined();
    });

    it('should register and retrieve clients', async () => {
      const registered = await provider.clientsStore.registerClient!({
        redirect_uris: ['http://localhost/callback'],
        client_name: 'Test',
      });
      const retrieved = await provider.clientsStore.getClient(registered.client_id);
      expect(retrieved).toEqual(registered);
    });
  });

  describe('authorize', () => {
    it('should redirect to /login when no credentials stored', async () => {
      const { res } = createMockResponse();
      await provider.authorize(mockClient, {
        redirectUri: 'http://localhost/callback',
        state: 'test-state',
        codeChallenge: 'challenge123',
      }, res as never);

      expect(res.redirectUrl).toBeDefined();
      expect(res.redirectUrl).toContain('/login');
      expect(res.redirectUrl).toContain('returnTo=');
    });

    it('should redirect with auth code when credentials are stored', async () => {
      const credStore = new CredentialStore(TEST_KEY);
      credStore.save(validGhostConfig);
      const providerWithCreds = new GhostOAuthProvider({
        credentialStore: credStore,
        issuerUrl: 'http://localhost:3000',
      });

      const { res } = createMockResponse();
      await providerWithCreds.authorize(mockClient, {
        redirectUri: 'http://localhost/callback',
        state: 'test-state',
        codeChallenge: 'challenge123',
      }, res as never);

      expect(res.redirectUrl).toBeDefined();
      expect(res.redirectUrl).toContain('http://localhost/callback');
      expect(res.redirectUrl).toContain('code=');
      expect(res.redirectUrl).toContain('state=test-state');
    });

    it('should redirect without state when state is not provided', async () => {
      const credStore = new CredentialStore(TEST_KEY);
      credStore.save(validGhostConfig);
      const providerWithCreds = new GhostOAuthProvider({
        credentialStore: credStore,
        issuerUrl: 'http://localhost:3000',
      });

      const { res } = createMockResponse();
      await providerWithCreds.authorize(mockClient, {
        redirectUri: 'http://localhost/callback',
        codeChallenge: 'challenge123',
      }, res as never);

      expect(res.redirectUrl).toContain('code=');
      expect(res.redirectUrl).not.toContain('state=');
    });

    it('should include resource in login redirect', async () => {
      const { res } = createMockResponse();
      await provider.authorize(mockClient, {
        redirectUri: 'http://localhost/callback',
        codeChallenge: 'challenge123',
        resource: new URL('http://localhost:3000'),
      }, res as never);

      expect(res.redirectUrl).toContain('/login');
      // resource is URL-encoded inside the returnTo parameter
      const returnTo = decodeURIComponent(res.redirectUrl!.split('returnTo=')[1]);
      expect(returnTo).toContain('resource=');
    });
  });

  describe('issueAuthorizationCode', () => {
    it('should generate an authorization code', () => {
      const code = provider.issueAuthorizationCode(
        mockClient.client_id,
        validParams,
        validGhostConfig
      );

      expect(code).toBeDefined();
      expect(code).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should allow code to be used for challenge retrieval', async () => {
      const code = provider.issueAuthorizationCode(
        mockClient.client_id,
        validParams,
        validGhostConfig
      );

      const challenge = await provider.challengeForAuthorizationCode(mockClient, code);
      expect(challenge).toBe(validParams.codeChallenge);
    });
  });

  describe('challengeForAuthorizationCode', () => {
    it('should return the code challenge', async () => {
      const code = provider.issueAuthorizationCode(
        mockClient.client_id,
        validParams,
        validGhostConfig
      );

      const challenge = await provider.challengeForAuthorizationCode(mockClient, code);
      expect(challenge).toBe(validParams.codeChallenge);
    });

    it('should throw for unknown code', async () => {
      await expect(
        provider.challengeForAuthorizationCode(mockClient, 'nonexistent')
      ).rejects.toThrow('Invalid or expired');
    });
  });

  describe('exchangeAuthorizationCode', () => {
    it('should exchange code for tokens', async () => {
      const code = provider.issueAuthorizationCode(
        mockClient.client_id,
        validParams,
        validGhostConfig
      );

      const tokens = await provider.exchangeAuthorizationCode(mockClient, code);
      expect(tokens.access_token).toBeDefined();
      expect(tokens.refresh_token).toBeDefined();
      expect(tokens.token_type).toBe('bearer');
      expect(tokens.expires_in).toBe(3600);
    });

    it('should consume the code (single-use)', async () => {
      const code = provider.issueAuthorizationCode(
        mockClient.client_id,
        validParams,
        validGhostConfig
      );

      await provider.exchangeAuthorizationCode(mockClient, code);

      await expect(
        provider.exchangeAuthorizationCode(mockClient, code)
      ).rejects.toThrow('Invalid or expired');
    });

    it('should reject invalid code', async () => {
      await expect(
        provider.exchangeAuthorizationCode(mockClient, 'bad-code')
      ).rejects.toThrow('Invalid or expired');
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid access token and return Ghost config in extra', async () => {
      const code = provider.issueAuthorizationCode(
        mockClient.client_id,
        validParams,
        validGhostConfig
      );
      const tokens = await provider.exchangeAuthorizationCode(mockClient, code);

      const authInfo = await provider.verifyAccessToken(tokens.access_token);
      expect(authInfo.token).toBe(tokens.access_token);
      expect(authInfo.clientId).toBe(mockClient.client_id);
      expect(authInfo.extra?.ghostUrl).toBe(validGhostConfig.ghostUrl);
      expect(authInfo.extra?.ghostAdminApiKey).toBe(validGhostConfig.ghostAdminApiKey);
    });

    it('should reject invalid token', async () => {
      await expect(
        provider.verifyAccessToken('invalid-token')
      ).rejects.toThrow('Invalid or expired');
    });
  });

  describe('exchangeRefreshToken', () => {
    it('should issue new tokens and revoke old refresh token', async () => {
      const code = provider.issueAuthorizationCode(
        mockClient.client_id,
        validParams,
        validGhostConfig
      );
      const tokens = await provider.exchangeAuthorizationCode(mockClient, code);

      const newTokens = await provider.exchangeRefreshToken(
        mockClient,
        tokens.refresh_token!
      );

      expect(newTokens.access_token).toBeDefined();
      expect(newTokens.refresh_token).toBeDefined();
      expect(newTokens.access_token).not.toBe(tokens.access_token);
      expect(newTokens.refresh_token).not.toBe(tokens.refresh_token);

      // Old refresh token should be revoked
      await expect(
        provider.exchangeRefreshToken(mockClient, tokens.refresh_token!)
      ).rejects.toThrow('Invalid or expired');

      // New access token should work
      const authInfo = await provider.verifyAccessToken(newTokens.access_token);
      expect(authInfo.extra?.ghostUrl).toBe(validGhostConfig.ghostUrl);
    });

    it('should reject invalid refresh token', async () => {
      await expect(
        provider.exchangeRefreshToken(mockClient, 'bad-token')
      ).rejects.toThrow('Invalid or expired');
    });
  });

  describe('revokeToken', () => {
    it('should revoke an access token', async () => {
      const code = provider.issueAuthorizationCode(
        mockClient.client_id,
        validParams,
        validGhostConfig
      );
      const tokens = await provider.exchangeAuthorizationCode(mockClient, code);

      await provider.revokeToken!(mockClient, {
        token: tokens.access_token,
        token_type_hint: 'access_token',
      });

      await expect(
        provider.verifyAccessToken(tokens.access_token)
      ).rejects.toThrow('Invalid or expired');
    });

    it('should revoke a refresh token', async () => {
      const code = provider.issueAuthorizationCode(
        mockClient.client_id,
        validParams,
        validGhostConfig
      );
      const tokens = await provider.exchangeAuthorizationCode(mockClient, code);

      await provider.revokeToken!(mockClient, {
        token: tokens.refresh_token!,
        token_type_hint: 'refresh_token',
      });

      await expect(
        provider.exchangeRefreshToken(mockClient, tokens.refresh_token!)
      ).rejects.toThrow('Invalid or expired');
    });

    it('should handle revocation without hint', async () => {
      const code = provider.issueAuthorizationCode(
        mockClient.client_id,
        validParams,
        validGhostConfig
      );
      const tokens = await provider.exchangeAuthorizationCode(mockClient, code);

      await provider.revokeToken!(mockClient, {
        token: tokens.access_token,
      });

      await expect(
        provider.verifyAccessToken(tokens.access_token)
      ).rejects.toThrow('Invalid or expired');
    });

    it('should not throw when revoking unknown token', async () => {
      await expect(
        provider.revokeToken!(mockClient, { token: 'unknown' })
      ).resolves.not.toThrow();
    });
  });
});
