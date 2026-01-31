/**
 * ghost-mcp - SSE Transport Entry Point
 *
 * This is the SSE/HTTP entry point for the ghost-mcp MCP server.
 * It provides HTTP-based transports for remote deployment, supporting both:
 * 1. Streamable HTTP transport (protocol version 2025-11-25) - recommended
 * 2. HTTP+SSE transport (protocol version 2024-11-05) - deprecated, for backwards compatibility
 */

import { randomUUID } from 'node:crypto';
import express, { Request, Response } from 'express';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { createServer } from './index.js';

// Default port for SSE server
const DEFAULT_PORT = 3000;

// Transport storage by session ID
type TransportType = SSEServerTransport | StreamableHTTPServerTransport;
const transports: Map<string, TransportType> = new Map();

/**
 * Creates and configures the Express application for MCP HTTP transports.
 */
function createApp(): express.Application {
  const app = express();
  app.use(express.json());

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  //=============================================================================
  // STREAMABLE HTTP TRANSPORT (PROTOCOL VERSION 2025-11-25)
  //=============================================================================
  app.all('/mcp', async (req: Request, res: Response) => {
    try {
      const sessionId = req.headers['mcp-session-id'] as string | undefined;
      let transport: StreamableHTTPServerTransport | undefined;

      if (sessionId && transports.has(sessionId)) {
        const existingTransport = transports.get(sessionId);
        if (existingTransport instanceof StreamableHTTPServerTransport) {
          transport = existingTransport;
        } else {
          res.status(400).json({
            jsonrpc: '2.0',
            error: {
              code: -32000,
              message:
                'Bad Request: Session exists but uses a different transport protocol',
            },
            id: null,
          });
          return;
        }
      } else if (
        !sessionId &&
        req.method === 'POST' &&
        isInitializeRequest(req.body)
      ) {
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: (): string => randomUUID(),
          onsessioninitialized: (newSessionId: string): void => {
            transports.set(newSessionId, transport!);
          },
        });

        transport.onclose = (): void => {
          const sid = transport!.sessionId;
          if (sid && transports.has(sid)) {
            transports.delete(sid);
          }
        };

        const server = createServer();
        await server.connect(transport);
      } else {
        res.status(400).json({
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: 'Bad Request: No valid session ID provided',
          },
          id: null,
        });
        return;
      }

      await transport!.handleRequest(req, res, req.body);
    } catch (error) {
      console.error('Error handling MCP request:', error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal server error',
          },
          id: null,
        });
      }
    }
  });

  //=============================================================================
  // DEPRECATED HTTP+SSE TRANSPORT (PROTOCOL VERSION 2024-11-05)
  //=============================================================================
  app.get('/sse', async (_req: Request, res: Response) => {
    const transport = new SSEServerTransport('/messages', res);
    transports.set(transport.sessionId, transport);

    res.on('close', () => {
      transports.delete(transport.sessionId);
    });

    const server = createServer();
    await server.connect(transport);
  });

  app.post('/messages', async (req: Request, res: Response) => {
    const sessionId = req.query.sessionId as string;
    const existingTransport = transports.get(sessionId);

    if (existingTransport instanceof SSEServerTransport) {
      await existingTransport.handlePostMessage(req, res, req.body);
    } else if (existingTransport) {
      res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message:
            'Bad Request: Session exists but uses a different transport protocol',
        },
        id: null,
      });
    } else {
      res.status(400).send('No transport found for sessionId');
    }
  });

  return app;
}

/**
 * Main entry point - starts the MCP server with SSE/HTTP transport.
 */
async function main(): Promise<void> {
  const port = parseInt(process.env.PORT || String(DEFAULT_PORT), 10);
  const app = createApp();

  const server = app.listen(port, () => {
    console.log(`ghost-mcp SSE server listening on port ${port}`);
    console.log(`
==============================================
SUPPORTED TRANSPORT OPTIONS:

1. Streamable HTTP (Protocol version: 2025-11-25)
   Endpoint: /mcp
   Methods: GET, POST, DELETE
   Usage:
     - Initialize with POST to /mcp
     - Establish SSE stream with GET to /mcp
     - Send requests with POST to /mcp
     - Terminate session with DELETE to /mcp

2. HTTP + SSE (Protocol version: 2024-11-05) [DEPRECATED]
   Endpoints: /sse (GET) and /messages (POST)
   Usage:
     - Establish SSE stream with GET to /sse
     - Send requests with POST to /messages?sessionId=<id>

3. Health Check
   Endpoint: /health (GET)
==============================================
`);
  });

  // Handle graceful shutdown
  const shutdown = async (): Promise<void> => {
    console.log('Shutting down server...');

    // Close all active transports
    for (const [sessionId, transport] of transports) {
      try {
        await transport.close();
        transports.delete(sessionId);
      } catch (error) {
        console.error(
          `Error closing transport for session ${sessionId}:`,
          error
        );
      }
    }

    server.close(() => {
      console.log('Server shutdown complete');
      process.exit(0);
    });
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
}

// Export for testing
export { createApp, DEFAULT_PORT };

// Run the server
main().catch((error: unknown) => {
  console.error('Failed to start SSE server:', error);
  process.exit(1);
});
