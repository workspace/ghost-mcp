import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp, DEFAULT_PORT } from './sse.js';

describe('ghost-mcp SSE transport', () => {
  describe('configuration', () => {
    it('should export default port', () => {
      expect(DEFAULT_PORT).toBe(3000);
    });

    it('should create an Express app', () => {
      const app = createApp();
      expect(app).toBeDefined();
    });
  });

  describe('health endpoint', () => {
    it('should respond with ok status', async () => {
      const app = createApp();
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'ok' });
    });
  });

  describe('Streamable HTTP transport (/mcp)', () => {
    it('should reject requests without session ID or initialization', async () => {
      const app = createApp();
      const response = await request(app)
        .post('/mcp')
        .set('Accept', 'application/json, text/event-stream')
        .set('Content-Type', 'application/json')
        .send({ jsonrpc: '2.0', method: 'tools/list', id: 1 });

      // Should return a 4xx error (400 Bad Request from our handler)
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.status).toBeLessThan(500);
      expect(response.body.error).toBeDefined();
    });

    it('should accept initialization request', async () => {
      const app = createApp();
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

      // Should return 200
      expect(response.status).toBe(200);
      // The response should contain the session ID header
      expect(response.headers['mcp-session-id']).toBeDefined();
    });

    it('should reject requests without proper Accept header', async () => {
      const app = createApp();
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

      // Should return 406 Not Acceptable without proper Accept header
      expect(response.status).toBe(406);
    });
  });

  describe('deprecated SSE transport', () => {
    it('should reject /messages without valid session', async () => {
      const app = createApp();
      const response = await request(app)
        .post('/messages')
        .query({ sessionId: 'invalid-session' })
        .send({ jsonrpc: '2.0', method: 'tools/list', id: 1 });

      expect(response.status).toBe(400);
    });
  });
});
