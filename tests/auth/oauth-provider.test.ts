import { describe, it, expect, beforeEach } from 'vitest';
import { GhostOAuthProvider } from '../../src/auth/index.js';
import type { OAuthClientInformationFull } from '@modelcontextprotocol/sdk/shared/auth.js';

// Helper to create a mock Express response
function createMockResponse(): {
  res: { type: ReturnType<typeof import('vitest').vi.fn>; send: ReturnType<typeof import('vitest').vi.fn>; sentBody?: string; sentType?: string };
} {
  const res = {
    sentType: undefined as string | undefined,
    sentBody: undefined as string | undefined,
    type(t: string) {
      res.sentType = t;
      return res;
    },
    send(body: string) {
      res.sentBody = body;
      return res;
    },
  };
  return { res: res as never };
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
    it('should render an HTML authorization page', async () => {
      const { res } = createMockResponse();
      await provider.authorize(mockClient, {
        redirectUri: 'http://localhost/callback',
        state: 'test-state',
        codeChallenge: 'challenge123',
      }, res as never);

      expect(res.sentType).toBe('html');
      expect(res.sentBody).toContain('Connect to Ghost');
      expect(res.sentBody).toContain('test-client-id');
      expect(res.sentBody).toContain('http://localhost/callback');
      expect(res.sentBody).toContain('test-state');
      expect(res.sentBody).toContain('challenge123');
    });

    it('should render page with resource parameter', async () => {
      const { res } = createMockResponse();
      await provider.authorize(mockClient, {
        redirectUri: 'http://localhost/callback',
        codeChallenge: 'challenge123',
        resource: new URL('http://localhost:3000'),
      }, res as never);

      expect(res.sentBody).toContain('http://localhost:3000');
    });

    it('should render page without optional state', async () => {
      const { res } = createMockResponse();
      await provider.authorize(mockClient, {
        redirectUri: 'http://localhost/callback',
        codeChallenge: 'challenge123',
      }, res as never);

      expect(res.sentBody).not.toContain('name="state"');
    });
  });

  describe('handleAuthorizationSubmit', () => {
    it('should generate an authorization code', async () => {
      const result = await provider.handleAuthorizationSubmit(
        mockClient.client_id,
        validParams,
        validGhostConfig
      );

      expect(result.code).toBeDefined();
      expect(result.code).toMatch(/^[0-9a-f]{64}$/);
      expect(result.redirectUri).toBe(validParams.redirectUri);
      expect(result.state).toBe(validParams.state);
    });

    it('should reject when no API keys provided', async () => {
      await expect(
        provider.handleAuthorizationSubmit(
          mockClient.client_id,
          validParams,
          { ghostUrl: 'https://example.ghost.io' }
        )
      ).rejects.toThrow('At least one API key');
    });

    it('should reject when Ghost URL is empty', async () => {
      await expect(
        provider.handleAuthorizationSubmit(
          mockClient.client_id,
          validParams,
          { ghostUrl: '', ghostAdminApiKey: 'some-key' }
        )
      ).rejects.toThrow('Ghost URL is required');
    });

    it('should accept content API key only', async () => {
      const result = await provider.handleAuthorizationSubmit(
        mockClient.client_id,
        validParams,
        { ghostUrl: 'https://example.ghost.io', ghostContentApiKey: 'content-key-123' }
      );
      expect(result.code).toBeDefined();
    });
  });

  describe('challengeForAuthorizationCode', () => {
    it('should return the code challenge', async () => {
      const result = await provider.handleAuthorizationSubmit(
        mockClient.client_id,
        validParams,
        validGhostConfig
      );

      const challenge = await provider.challengeForAuthorizationCode(mockClient, result.code);
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
      const { code } = await provider.handleAuthorizationSubmit(
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
      const { code } = await provider.handleAuthorizationSubmit(
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
      const { code } = await provider.handleAuthorizationSubmit(
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
      const { code } = await provider.handleAuthorizationSubmit(
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
      const { code } = await provider.handleAuthorizationSubmit(
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
      const { code } = await provider.handleAuthorizationSubmit(
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
      const { code } = await provider.handleAuthorizationSubmit(
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
