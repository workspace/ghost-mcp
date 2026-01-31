/**
 * ghost-mcp - MCP Server Entry Point
 *
 * This is the main entry point for the ghost-mcp MCP server.
 * It initializes the server with stdio transport for local development.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { ServerInfo, GhostMcpCapabilities } from './types/index.js';
import {
  registerAllTools,
  type ToolRegistrationConfig,
} from './tools/index.js';

/**
 * Server metadata following MCP Implementation interface.
 */
const SERVER_INFO: ServerInfo = {
  name: 'ghost-mcp',
  version: '1.0.0',
  title: 'Ghost MCP Server',
  description:
    'An MCP server providing tools for interacting with Ghost CMS blogs',
};

/**
 * Server capabilities declaration.
 * Defines what features this MCP server supports.
 */
const SERVER_CAPABILITIES: GhostMcpCapabilities = {
  tools: {
    listChanged: true,
  },
};

// Legacy exports for backward compatibility
const SERVER_NAME = SERVER_INFO.name;
const SERVER_VERSION = SERVER_INFO.version;

/**
 * Gets tool configuration from environment variables.
 */
function getToolConfig(): ToolRegistrationConfig {
  const config: ToolRegistrationConfig = {};

  // Content API configuration
  const contentUrl = process.env.GHOST_URL;
  const contentKey = process.env.GHOST_CONTENT_API_KEY;

  if (contentUrl && contentKey) {
    config.contentApi = {
      url: contentUrl,
      key: contentKey,
      version: process.env.GHOST_API_VERSION,
    };
  }

  return config;
}

/**
 * Creates and configures the MCP server instance.
 *
 * @param toolConfig - Optional tool configuration (defaults to environment variables)
 */
function createServer(toolConfig?: ToolRegistrationConfig): McpServer {
  const server = new McpServer(SERVER_INFO, {
    capabilities: SERVER_CAPABILITIES,
  });

  // Register tools
  const config = toolConfig ?? getToolConfig();
  registerAllTools(server, config);

  return server;
}

/**
 * Main entry point - starts the MCP server with stdio transport.
 */
async function main(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();

  // Handle graceful shutdown
  const shutdown = async (): Promise<void> => {
    await server.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // Handle uncaught errors
  process.on('uncaughtException', (error: Error) => {
    console.error('Uncaught exception:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason: unknown) => {
    console.error('Unhandled rejection:', reason);
    process.exit(1);
  });

  // Connect the server to the transport
  await server.connect(transport);
}

// Export for testing and for use by other entry points (e.g., sse.ts)
export {
  createServer,
  getToolConfig,
  SERVER_INFO,
  SERVER_CAPABILITIES,
  SERVER_NAME,
  SERVER_VERSION,
};

// Re-export types for convenience
export type { ToolRegistrationConfig } from './tools/index.js';

// Run the server only when executed directly (not when imported as a module)
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  main().catch((error: unknown) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}
