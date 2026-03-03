import { createHash, randomBytes } from 'node:crypto';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { createApp, shouldEnableAuth, toolConfigFromAuthInfo, DEFAULT_PORT } from '../src/sse.js';
import { GhostOAuthProvider } from '../src/auth/index.js';
import { CredentialStore } from '../src/auth/credential-store.js';
import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';

// PKCE S256 helper: challenge = base64url(sha256(verifier))
const PKCE_VERIFIER = 'test-code-verifier-that-is-long-enough';
const PKCE_CHALLENGE = createHash('sha256').update(PKCE_VERIFIER).digest('base64url');

// Test credentials for auth mode
const TEST_ADMIN_PASSWORD = 'test-password-123';
const TEST_SECRET_KEY = randomBytes(32).toString('hex');

function createAuthApp(options?: { credentialStore?: CredentialStore; oauthProvider?: GhostOAuthProvider }) {
  const credentialStore = options?.credentialStore ?? new CredentialStore(TEST_SECRET_KEY);
  const provider = options?.oauthProvider ?? new GhostOAuthProvider({
    credentialStore,
    issuerUrl: 'http://localhost:3000',
  });
  return createApp({
    auth: true,
    baseUrl: 'http://localhost:3000',
    adminPassword: TEST_ADMIN_PASSWORD,
    secretKey: TEST_SECRET_KEY,
    credentialStore,
    oauthProvider: provider,
  });
}

describe('ghost-mcp SSE transport', () => {
  describe('configuration', () => {
    it('should export default port', () => {
      expect(DEFAULT_PORT).toBe(3000);
    });

    it('should create an Express app', () => {
      const app = createApp({ auth: false });
      expect(app).toBeDefined();
    });

    it('should throw when auth mode is missing admin password', () => {
      expect(() => createApp({
        auth: true,
        baseUrl: 'http://localhost:3000',
        secretKey: TEST_SECRET_KEY,
      })).toThrow('GHOST_MCP_ADMIN_PASSWORD is required');
    });

    it('should throw when auth mode has invalid secret key', () => {
      expect(() => createApp({
        auth: true,
        baseUrl: 'http://localhost:3000',
        adminPassword: TEST_ADMIN_PASSWORD,
        secretKey: 'too-short',
      })).toThrow('GHOST_MCP_SECRET_KEY must be a 64-character hex string');
    });
  });

  describe('shouldEnableAuth', () => {
    const originalEnv = { ...process.env };

    afterEach(() => {
      process.env = { ...originalEnv };
    });

    it('should respect explicit auth option', () => {
      expect(shouldEnableAuth({ auth: true })).toBe(true);
      expect(shouldEnableAuth({ auth: false })).toBe(false);
    });

    it('should respect MCP_AUTH=true env', () => {
      process.env.MCP_AUTH = 'true';
      expect(shouldEnableAuth()).toBe(true);
    });

    it('should respect MCP_AUTH=false env', () => {
      process.env.MCP_AUTH = 'false';
      expect(shouldEnableAuth()).toBe(false);
    });

    it('should enable auth when GHOST_URL is not set', () => {
      delete process.env.GHOST_URL;
      delete process.env.MCP_AUTH;
      expect(shouldEnableAuth()).toBe(true);
    });

    it('should disable auth when GHOST_URL is set', () => {
      process.env.GHOST_URL = 'https://example.ghost.io';
      delete process.env.MCP_AUTH;
      expect(shouldEnableAuth()).toBe(false);
    });
  });

  describe('toolConfigFromAuthInfo', () => {
    it('should extract tool config from AuthInfo.extra', () => {
      const authInfo: AuthInfo = {
        token: 'test',
        clientId: 'test',
        scopes: [],
        extra: {
          ghostUrl: 'https://example.ghost.io',
          ghostAdminApiKey: 'admin-key',
          ghostContentApiKey: 'content-key',
        },
      };

      const config = toolConfigFromAuthInfo(authInfo);
      expect(config.adminApi?.url).toBe('https://example.ghost.io');
      expect(config.adminApi?.key).toBe('admin-key');
      expect(config.contentApi?.url).toBe('https://example.ghost.io');
      expect(config.contentApi?.key).toBe('content-key');
    });

    it('should handle missing extra', () => {
      const authInfo: AuthInfo = {
        token: 'test',
        clientId: 'test',
        scopes: [],
      };
      const config = toolConfigFromAuthInfo(authInfo);
      expect(config.adminApi).toBeUndefined();
      expect(config.contentApi).toBeUndefined();
    });

    it('should handle partial config (admin only)', () => {
      const authInfo: AuthInfo = {
        token: 'test',
        clientId: 'test',
        scopes: [],
        extra: {
          ghostUrl: 'https://example.ghost.io',
          ghostAdminApiKey: 'admin-key',
        },
      };
      const config = toolConfigFromAuthInfo(authInfo);
      expect(config.adminApi?.key).toBe('admin-key');
      expect(config.contentApi).toBeUndefined();
    });
  });

  describe('no-auth mode (backwards compatible)', () => {
    describe('health endpoint', () => {
      it('should respond with ok status and auth=false', async () => {
        const app = createApp({ auth: false });
        const response = await request(app).get('/health');

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ status: 'ok', auth: false });
      });
    });

    describe('Streamable HTTP transport (/mcp)', () => {
      it('should reject requests without session ID or initialization', async () => {
        const app = createApp({ auth: false });
        const response = await request(app)
          .post('/mcp')
          .set('Accept', 'application/json, text/event-stream')
          .set('Content-Type', 'application/json')
          .send({ jsonrpc: '2.0', method: 'tools/list', id: 1 });

        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(response.status).toBeLessThan(500);
        expect(response.body.error).toBeDefined();
      });

      it('should accept initialization request', async () => {
        const app = createApp({ auth: false });
        const response = await request(app)
          .post('/mcp')
          .set('Accept', 'application/json, text/event-stream')
          .set('Content-Type', 'application/json')
          .send({
            jsonrpc: '2.0',
            method: 'initialize',
            params: {
              protocolVersion: '2024-11-05',
              capabilities: {},
              clientInfo: { name: 'test-client', version: '1.0.0' },
            },
            id: 1,
          });

        expect(response.status).toBe(200);
        expect(response.headers['mcp-session-id']).toBeDefined();
      });

      it('should reject requests without proper Accept header', async () => {
        const app = createApp({ auth: false });
        const response = await request(app)
          .post('/mcp')
          .set('Content-Type', 'application/json')
          .send({
            jsonrpc: '2.0',
            method: 'initialize',
            params: {
              protocolVersion: '2024-11-05',
              capabilities: {},
              clientInfo: { name: 'test-client', version: '1.0.0' },
            },
            id: 1,
          });

        expect(response.status).toBe(406);
      });
    });

    describe('deprecated SSE transport', () => {
      it('should reject /messages without valid session', async () => {
        const app = createApp({ auth: false });
        const response = await request(app)
          .post('/messages')
          .query({ sessionId: 'invalid-session' })
          .send({ jsonrpc: '2.0', method: 'tools/list', id: 1 });

        expect(response.status).toBe(400);
      });
    });
  });

  describe('auth mode (OAuth 2.1)', () => {
    describe('health endpoint', () => {
      it('should respond with ok status and auth=true', async () => {
        const app = createAuthApp();
        const response = await request(app).get('/health');

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ status: 'ok', auth: true });
      });
    });

    describe('login flow', () => {
      it('should render login page on GET /login', async () => {
        const app = createAuthApp();
        const response = await request(app).get('/login');

        expect(response.status).toBe(200);
        expect(response.text).toContain('Admin Login');
        expect(response.text).toContain('password');
      });

      it('should render login page with returnTo', async () => {
        const app = createAuthApp();
        const response = await request(app)
          .get('/login')
          .query({ returnTo: 'http://localhost:3000/authorize?client_id=test' });

        expect(response.status).toBe(200);
        expect(response.text).toContain('returnTo');
      });

      it('should reject wrong password on POST /login', async () => {
        const app = createAuthApp();
        const response = await request(app)
          .post('/login')
          .type('form')
          .send({ password: 'wrong-password' });

        expect(response.status).toBe(200);
        expect(response.text).toContain('Invalid password');
      });

      it('should set session cookie and redirect on correct password', async () => {
        const app = createAuthApp();
        const response = await request(app)
          .post('/login')
          .type('form')
          .send({ password: TEST_ADMIN_PASSWORD });

        expect(response.status).toBe(302);
        expect(response.headers.location).toContain('/settings');
        expect(response.headers['set-cookie']).toBeDefined();
        expect(response.headers['set-cookie'][0]).toContain('ghost_mcp_session');
      });

      it('should redirect to /settings with returnTo after login', async () => {
        const app = createAuthApp();
        const response = await request(app)
          .post('/login')
          .type('form')
          .send({
            password: TEST_ADMIN_PASSWORD,
            returnTo: 'http://localhost:3000/authorize?client_id=test',
          });

        expect(response.status).toBe(302);
        expect(response.headers.location).toContain('/settings');
        expect(response.headers.location).toContain('returnTo=');
      });
    });

    describe('settings flow', () => {
      it('should redirect to /login when accessing /settings without session', async () => {
        const app = createAuthApp();
        const response = await request(app).get('/settings');

        expect(response.status).toBe(302);
        expect(response.headers.location).toContain('/login');
      });

      it('should render settings page with valid session', async () => {
        const app = createAuthApp();

        // Login first
        const loginResponse = await request(app)
          .post('/login')
          .type('form')
          .send({ password: TEST_ADMIN_PASSWORD });

        const cookies = loginResponse.headers['set-cookie'];

        // Access settings with session cookie
        const response = await request(app)
          .get('/settings')
          .set('Cookie', cookies);

        expect(response.status).toBe(200);
        expect(response.text).toContain('Ghost Settings');
        expect(response.text).toContain('ghost_url');
      });

      it('should save credentials on POST /settings', async () => {
        const app = createAuthApp();

        // Login first
        const loginResponse = await request(app)
          .post('/login')
          .type('form')
          .send({ password: TEST_ADMIN_PASSWORD });
        const cookies = loginResponse.headers['set-cookie'];

        // Save settings
        const response = await request(app)
          .post('/settings')
          .set('Cookie', cookies)
          .type('form')
          .send({
            ghost_url: 'https://example.ghost.io',
            ghost_admin_api_key: 'test-admin-key',
          });

        expect(response.status).toBe(200);
        expect(response.text).toContain('Settings saved successfully');
      });

      it('should reject POST /settings without ghost_url', async () => {
        const app = createAuthApp();

        const loginResponse = await request(app)
          .post('/login')
          .type('form')
          .send({ password: TEST_ADMIN_PASSWORD });
        const cookies = loginResponse.headers['set-cookie'];

        const response = await request(app)
          .post('/settings')
          .set('Cookie', cookies)
          .type('form')
          .send({ ghost_admin_api_key: 'test-admin-key' });

        expect(response.status).toBe(200);
        expect(response.text).toContain('Ghost URL is required');
      });

      it('should reject POST /settings without any API key', async () => {
        const app = createAuthApp();

        const loginResponse = await request(app)
          .post('/login')
          .type('form')
          .send({ password: TEST_ADMIN_PASSWORD });
        const cookies = loginResponse.headers['set-cookie'];

        const response = await request(app)
          .post('/settings')
          .set('Cookie', cookies)
          .type('form')
          .send({ ghost_url: 'https://example.ghost.io' });

        expect(response.status).toBe(200);
        expect(response.text).toContain('At least one API key');
      });

      it('should redirect to returnTo after saving settings', async () => {
        const app = createAuthApp();

        const loginResponse = await request(app)
          .post('/login')
          .type('form')
          .send({ password: TEST_ADMIN_PASSWORD });
        const cookies = loginResponse.headers['set-cookie'];

        const response = await request(app)
          .post('/settings')
          .set('Cookie', cookies)
          .type('form')
          .send({
            ghost_url: 'https://example.ghost.io',
            ghost_admin_api_key: 'test-admin-key',
            returnTo: 'http://localhost:3000/authorize?client_id=test',
          });

        expect(response.status).toBe(302);
        expect(response.headers.location).toContain('/authorize');
      });
    });

    describe('OAuth discovery endpoints', () => {
      it('should serve OAuth authorization server metadata', async () => {
        const app = createAuthApp();
        const response = await request(app).get(
          '/.well-known/oauth-authorization-server'
        );

        expect(response.status).toBe(200);
        expect(response.body.issuer).toContain('http://localhost:3000');
        expect(response.body.authorization_endpoint).toContain('/authorize');
        expect(response.body.token_endpoint).toContain('/token');
        expect(response.body.registration_endpoint).toContain('/register');
      });

      it('should serve protected resource metadata', async () => {
        const app = createAuthApp();
        const response = await request(app).get(
          '/.well-known/oauth-protected-resource'
        );

        expect(response.status).toBe(200);
        expect(response.body.resource).toBeDefined();
      });
    });

    describe('dynamic client registration', () => {
      it('should register a new client', async () => {
        const app = createAuthApp();
        const response = await request(app)
          .post('/register')
          .set('Content-Type', 'application/json')
          .send({
            redirect_uris: ['http://localhost/callback'],
            client_name: 'Test Client',
          });

        expect(response.status).toBe(201);
        expect(response.body.client_id).toBeDefined();
        expect(response.body.client_name).toBe('Test Client');
      });
    });

    describe('authorization flow', () => {
      it('should redirect to /login on GET /authorize when no credentials', async () => {
        const app = createAuthApp();

        // Register a client first
        const regResponse = await request(app)
          .post('/register')
          .set('Content-Type', 'application/json')
          .send({
            redirect_uris: ['http://localhost/callback'],
            client_name: 'Test Client',
          });
        const clientId = regResponse.body.client_id;

        const response = await request(app)
          .get('/authorize')
          .query({
            client_id: clientId,
            redirect_uri: 'http://localhost/callback',
            response_type: 'code',
            code_challenge: 'test-challenge',
            code_challenge_method: 'S256',
          });

        expect(response.status).toBe(302);
        expect(response.headers.location).toContain('/login');
        expect(response.headers.location).toContain('returnTo=');
      });

      it('should redirect with code on GET /authorize when credentials are stored', async () => {
        const credentialStore = new CredentialStore(TEST_SECRET_KEY);
        credentialStore.save({
          ghostUrl: 'https://example.ghost.io',
          ghostAdminApiKey: 'test-admin-key',
        });
        const app = createAuthApp({ credentialStore });

        // Register a client
        const regResponse = await request(app)
          .post('/register')
          .set('Content-Type', 'application/json')
          .send({
            redirect_uris: ['http://localhost/callback'],
            client_name: 'Test Client',
          });
        const clientId = regResponse.body.client_id;

        const response = await request(app)
          .get('/authorize')
          .query({
            client_id: clientId,
            redirect_uri: 'http://localhost/callback',
            response_type: 'code',
            code_challenge: PKCE_CHALLENGE,
            code_challenge_method: 'S256',
          });

        expect(response.status).toBe(302);
        expect(response.headers.location).toContain('http://localhost/callback');
        expect(response.headers.location).toContain('code=');
      });
    });

    describe('protected MCP endpoints', () => {
      it('should reject /mcp without bearer token', async () => {
        const app = createAuthApp();

        const response = await request(app)
          .post('/mcp')
          .set('Accept', 'application/json, text/event-stream')
          .set('Content-Type', 'application/json')
          .send({
            jsonrpc: '2.0',
            method: 'initialize',
            params: {
              protocolVersion: '2024-11-05',
              capabilities: {},
              clientInfo: { name: 'test', version: '1.0' },
            },
            id: 1,
          });

        expect(response.status).toBe(401);
      });

      it('should reject /mcp with invalid bearer token', async () => {
        const app = createAuthApp();

        const response = await request(app)
          .post('/mcp')
          .set('Accept', 'application/json, text/event-stream')
          .set('Content-Type', 'application/json')
          .set('Authorization', 'Bearer invalid-token')
          .send({
            jsonrpc: '2.0',
            method: 'initialize',
            params: {
              protocolVersion: '2024-11-05',
              capabilities: {},
              clientInfo: { name: 'test', version: '1.0' },
            },
            id: 1,
          });

        expect(response.status).toBe(401);
      });

      it('should accept /mcp with valid bearer token and initialize', async () => {
        // Pre-store credentials
        const credentialStore = new CredentialStore(TEST_SECRET_KEY);
        credentialStore.save({
          ghostUrl: 'https://example.ghost.io',
          ghostAdminApiKey: 'test-admin-key',
        });
        const provider = new GhostOAuthProvider({
          credentialStore,
          issuerUrl: 'http://localhost:3000',
        });
        const app = createAuthApp({ credentialStore, oauthProvider: provider });

        // Register client
        const regResponse = await request(app)
          .post('/register')
          .set('Content-Type', 'application/json')
          .send({
            redirect_uris: ['http://localhost/callback'],
            client_name: 'Test Client',
            token_endpoint_auth_method: 'none',
          });
        const clientId = regResponse.body.client_id;

        // Authorize (should auto-redirect with code since credentials exist)
        const authResponse = await request(app)
          .get('/authorize')
          .query({
            client_id: clientId,
            redirect_uri: 'http://localhost/callback',
            response_type: 'code',
            code_challenge: PKCE_CHALLENGE,
            code_challenge_method: 'S256',
          });

        const location = new URL(authResponse.headers.location);
        const code = location.searchParams.get('code');
        expect(code).toBeDefined();

        // Exchange code for token
        const tokenResponse = await request(app)
          .post('/token')
          .type('form')
          .send({
            grant_type: 'authorization_code',
            code,
            client_id: clientId,
            redirect_uri: 'http://localhost/callback',
            code_verifier: PKCE_VERIFIER,
          });

        expect(tokenResponse.status).toBe(200);
        const accessToken = tokenResponse.body.access_token;
        expect(accessToken).toBeDefined();

        // Use the token to access /mcp
        const mcpResponse = await request(app)
          .post('/mcp')
          .set('Accept', 'application/json, text/event-stream')
          .set('Content-Type', 'application/json')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            jsonrpc: '2.0',
            method: 'initialize',
            params: {
              protocolVersion: '2024-11-05',
              capabilities: {},
              clientInfo: { name: 'test', version: '1.0' },
            },
            id: 1,
          });

        expect(mcpResponse.status).toBe(200);
        expect(mcpResponse.headers['mcp-session-id']).toBeDefined();
      });
    });

    describe('full login → settings → authorize flow', () => {
      it('should complete the full flow', async () => {
        const credentialStore = new CredentialStore(TEST_SECRET_KEY);
        const provider = new GhostOAuthProvider({
          credentialStore,
          issuerUrl: 'http://localhost:3000',
        });
        const app = createAuthApp({ credentialStore, oauthProvider: provider });

        // 1. Register client
        const regResponse = await request(app)
          .post('/register')
          .set('Content-Type', 'application/json')
          .send({
            redirect_uris: ['http://localhost/callback'],
            client_name: 'Test Client',
            token_endpoint_auth_method: 'none',
          });
        const clientId = regResponse.body.client_id;

        // 2. GET /authorize → should redirect to /login (no credentials yet)
        const authorizeResponse = await request(app)
          .get('/authorize')
          .query({
            client_id: clientId,
            redirect_uri: 'http://localhost/callback',
            response_type: 'code',
            code_challenge: PKCE_CHALLENGE,
            code_challenge_method: 'S256',
          });
        expect(authorizeResponse.status).toBe(302);
        expect(authorizeResponse.headers.location).toContain('/login');

        // 3. POST /login → get session cookie
        const loginResponse = await request(app)
          .post('/login')
          .type('form')
          .send({ password: TEST_ADMIN_PASSWORD });
        expect(loginResponse.status).toBe(302);
        const cookies = loginResponse.headers['set-cookie'];

        // 4. POST /settings → save Ghost credentials
        const settingsResponse = await request(app)
          .post('/settings')
          .set('Cookie', cookies)
          .type('form')
          .send({
            ghost_url: 'https://example.ghost.io',
            ghost_admin_api_key: 'test-admin-key',
          });
        expect(settingsResponse.status).toBe(200);
        expect(settingsResponse.text).toContain('Settings saved');

        // 5. GET /authorize again → should redirect with code (credentials now stored)
        const authorize2 = await request(app)
          .get('/authorize')
          .query({
            client_id: clientId,
            redirect_uri: 'http://localhost/callback',
            response_type: 'code',
            code_challenge: PKCE_CHALLENGE,
            code_challenge_method: 'S256',
          });
        expect(authorize2.status).toBe(302);
        expect(authorize2.headers.location).toContain('code=');

        // 6. Exchange code for token
        const location = new URL(authorize2.headers.location);
        const code = location.searchParams.get('code')!;
        const tokenResponse = await request(app)
          .post('/token')
          .type('form')
          .send({
            grant_type: 'authorization_code',
            code,
            client_id: clientId,
            redirect_uri: 'http://localhost/callback',
            code_verifier: PKCE_VERIFIER,
          });
        expect(tokenResponse.status).toBe(200);
        expect(tokenResponse.body.access_token).toBeDefined();
      });
    });
  });
});
