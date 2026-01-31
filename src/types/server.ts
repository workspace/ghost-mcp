/**
 * Server info and capabilities type definitions for ghost-mcp.
 */

import type {
  Implementation,
  ServerCapabilities,
} from '@modelcontextprotocol/sdk/types.js';

/**
 * Server information following MCP Implementation interface.
 */
export interface ServerInfo extends Implementation {
  name: string;
  version: string;
  title?: string;
  description?: string;
}

/**
 * Re-export ServerCapabilities from SDK for convenience.
 */
export type { ServerCapabilities };

/**
 * Capabilities configuration for the ghost-mcp server.
 * This defines what features the server supports.
 */
export interface GhostMcpCapabilities extends ServerCapabilities {
  tools: {
    listChanged: boolean;
  };
}
