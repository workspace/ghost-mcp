import { describe, it, expect } from 'vitest';
import {
  createServer,
  SERVER_INFO,
  SERVER_CAPABILITIES,
  SERVER_NAME,
  SERVER_VERSION,
} from './index.js';

describe('ghost-mcp', () => {
  describe('SERVER_INFO', () => {
    it('should have correct name', () => {
      expect(SERVER_INFO.name).toBe('ghost-mcp');
    });

    it('should have correct version', () => {
      expect(SERVER_INFO.version).toBe('1.0.0');
    });

    it('should have a human-readable title', () => {
      expect(SERVER_INFO.title).toBe('Ghost MCP Server');
    });

    it('should have a description', () => {
      expect(SERVER_INFO.description).toBe(
        'An MCP server providing tools for interacting with Ghost CMS blogs'
      );
    });
  });

  describe('SERVER_CAPABILITIES', () => {
    it('should declare tools capability', () => {
      expect(SERVER_CAPABILITIES.tools).toBeDefined();
    });

    it('should support tool list change notifications', () => {
      expect(SERVER_CAPABILITIES.tools.listChanged).toBe(true);
    });
  });

  describe('legacy exports', () => {
    it('should export SERVER_NAME matching SERVER_INFO.name', () => {
      expect(SERVER_NAME).toBe(SERVER_INFO.name);
    });

    it('should export SERVER_VERSION matching SERVER_INFO.version', () => {
      expect(SERVER_VERSION).toBe(SERVER_INFO.version);
    });
  });

  describe('createServer', () => {
    it('should create a server instance', () => {
      const server = createServer();
      expect(server).toBeDefined();
    });

    it('should create a server with expected methods', () => {
      const server = createServer();
      expect(server).toHaveProperty('server');
      expect(server).toHaveProperty('connect');
      expect(server).toHaveProperty('close');
    });

    it('should create a server that can register tools', () => {
      const server = createServer();
      // McpServer should have the registerTool method
      expect(typeof server.registerTool).toBe('function');
    });
  });
});
