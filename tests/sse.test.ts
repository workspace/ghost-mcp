import { createHash } from 'node:crypto';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { createApp, shouldEnableAuth, toolConfigFromAuthInfo, DEFAULT_PORT } from '../src/sse.js';
import { GhostOAuthProvider } from '../src/auth/index.js';
import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';

// PKCE S256 helper: challenge = base64url(sha256(verifier))
const PKCE_VERIFIER = 'test-code-verifier-that-is-long-enough';
const PKCE_CHALLENGE = createHash('sha256').update(PKCE_VERIFIER).digest('base64url');

describe('ghost-mcp SSE transport', () => {
  describe('configuration', () => {
    it('should export default port', () => {
      expect(DEFAULT_PORT).toBe(3000);
    });

    it('should create an Express app', () => {
      const app = createApp({ auth: false });
      expect(app).toBeDefined();
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
    let provider: GhostOAuthProvider;

    beforeEach(() => {
      provider = new GhostOAuthProvider();
    });

    describe('health endpoint', () => {
      it('should respond with ok status and auth=true', async () => {
        const app = createApp({ auth: true, oauthProvider: provider });
        const response = await request(app).get('/health');

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ status: 'ok', auth: true });
      });
    });

    describe('OAuth discovery endpoints', () => {
      it('should serve OAuth authorization server metadata', async () => {
        const app = createApp({
          auth: true,
          baseUrl: 'http://localhost:3000',
          oauthProvider: provider,
        });
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
        const app = createApp({
          auth: true,
          baseUrl: 'http://localhost:3000',
          oauthProvider: provider,
        });
        const response = await request(app).get(
          '/.well-known/oauth-protected-resource'
        );

        expect(response.status).toBe(200);
        expect(response.body.resource).toBeDefined();
      });
    });

    describe('dynamic client registration', () => {
      it('should register a new client', async () => {
        const app = createApp({
          auth: true,
          baseUrl: 'http://localhost:3000',
          oauthProvider: provider,
        });
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
      it('should render authorization page on GET /authorize', async () => {
        const app = createApp({
          auth: true,
          baseUrl: 'http://localhost:3000',
          oauthProvider: provider,
        });

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

        expect(response.status).toBe(200);
        expect(response.text).toContain('Connect to Ghost');
        expect(response.text).toContain(clientId);
      });

      it('should handle POST /authorize form submission', async () => {
        const app = createApp({
          auth: true,
          baseUrl: 'http://localhost:3000',
          oauthProvider: provider,
        });

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
          .post('/authorize')
          .type('form')
          .send({
            client_id: clientId,
            redirect_uri: 'http://localhost/callback',
            code_challenge: 'test-challenge',
            state: 'test-state',
            ghost_url: 'https://example.ghost.io',
            ghost_admin_api_key: 'test-admin-key',
          });

        // Should redirect with authorization code
        expect(response.status).toBe(302);
        const location = response.headers.location;
        expect(location).toContain('http://localhost/callback');
        expect(location).toContain('code=');
        expect(location).toContain('state=test-state');
      });

      it('should reject POST /authorize without API keys', async () => {
        const app = createApp({
          auth: true,
          baseUrl: 'http://localhost:3000',
          oauthProvider: provider,
        });

        const regResponse = await request(app)
          .post('/register')
          .set('Content-Type', 'application/json')
          .send({
            redirect_uris: ['http://localhost/callback'],
            client_name: 'Test Client',
          });
        const clientId = regResponse.body.client_id;

        const response = await request(app)
          .post('/authorize')
          .type('form')
          .send({
            client_id: clientId,
            redirect_uri: 'http://localhost/callback',
            code_challenge: 'test-challenge',
            ghost_url: 'https://example.ghost.io',
          });

        // Should redirect with error
        expect(response.status).toBe(302);
        const location = response.headers.location;
        expect(location).toContain('error=invalid_request');
      });
    });

    describe('protected MCP endpoints', () => {
      it('should reject /mcp without bearer token', async () => {
        const app = createApp({
          auth: true,
          baseUrl: 'http://localhost:3000',
          oauthProvider: provider,
        });

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
        const app = createApp({
          auth: true,
          baseUrl: 'http://localhost:3000',
          oauthProvider: provider,
        });

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
        const app = createApp({
          auth: true,
          baseUrl: 'http://localhost:3000',
          oauthProvider: provider,
        });

        // Full OAuth flow to get an access token
        const regResponse = await request(app)
          .post('/register')
          .set('Content-Type', 'application/json')
          .send({
            redirect_uris: ['http://localhost/callback'],
            client_name: 'Test Client',
            token_endpoint_auth_method: 'none',
          });
        const clientId = regResponse.body.client_id;

        // Submit authorization with proper PKCE S256 challenge
        const authResponse = await request(app)
          .post('/authorize')
          .type('form')
          .send({
            client_id: clientId,
            redirect_uri: 'http://localhost/callback',
            code_challenge: PKCE_CHALLENGE,
            ghost_url: 'https://example.ghost.io',
            ghost_admin_api_key: 'test-admin-key',
          });

        const location = new URL(authResponse.headers.location);
        const code = location.searchParams.get('code');
        expect(code).toBeDefined();

        // Exchange code for token with matching PKCE verifier
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
  });
});
