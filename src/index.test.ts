import { describe, it, expect } from 'vitest';
import { createServer, SERVER_NAME, SERVER_VERSION } from './index.js';

describe('ghost-mcp', () => {
  describe('server metadata', () => {
    it('should export correct server name', () => {
      expect(SERVER_NAME).toBe('ghost-mcp');
    });

    it('should export correct server version', () => {
      expect(SERVER_VERSION).toBe('1.0.0');
    });
  });

  describe('createServer', () => {
    it('should create a server instance', () => {
      const server = createServer();
      expect(server).toBeDefined();
    });

    it('should create a server with tools capability', () => {
      const server = createServer();
      // The server should be an McpServer instance
      expect(server).toHaveProperty('server');
      expect(server).toHaveProperty('connect');
      expect(server).toHaveProperty('close');
    });
  });
});
