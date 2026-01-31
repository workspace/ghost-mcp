/**
 * ghost-mcp - MCP Server Entry Point
 *
 * This is the main entry point for the ghost-mcp MCP server.
 * It initializes the server with stdio transport for local development.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// Server metadata
const SERVER_NAME = 'ghost-mcp';
const SERVER_VERSION = '1.0.0';

/**
 * Creates and configures the MCP server instance.
 */
function createServer(): McpServer {
  const server = new McpServer(
    {
      name: SERVER_NAME,
      version: SERVER_VERSION,
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

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

// Export for testing
export { createServer, SERVER_NAME, SERVER_VERSION };

// Run the server
main().catch((error: unknown) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
