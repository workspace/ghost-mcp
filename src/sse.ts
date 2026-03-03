#!/usr/bin/env node
/**
 * ghost-mcp - SSE Transport Entry Point
 *
 * This is the SSE/HTTP entry point for the ghost-mcp MCP server.
 * It provides HTTP-based transports for remote deployment, supporting both:
 * 1. Streamable HTTP transport (protocol version 2025-11-25) - recommended
 * 2. HTTP+SSE transport (protocol version 2024-11-05) - deprecated, for backwards compatibility
 *
 * When MCP_AUTH=true or GHOST_URL is not set, OAuth 2.1 authentication is enabled,
 * allowing per-user Ghost configuration via the browser-based authorization flow.
 * In auth mode, an admin password and secret key are required to protect
 * the settings page where Ghost credentials are configured.
 */

import { randomUUID } from 'node:crypto';
import express, { Request, Response } from 'express';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { mcpAuthRouter } from '@modelcontextprotocol/sdk/server/auth/router.js';
import { requireBearerAuth } from '@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js';
import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';
import { createServer } from './index.js';
import { GhostOAuthProvider } from './auth/index.js';
import { CredentialStore } from './auth/credential-store.js';
import { safeCompare } from './auth/crypto.js';
import { setSessionCookie, getSessionFromRequest, clearSessionCookie } from './auth/session.js';
import { renderLoginPage, renderSettingsPage } from './auth/pages.js';
import type { ToolRegistrationConfig } from './tools/index.js';

// Default port for SSE server
const DEFAULT_PORT = 3000;

// Transport storage by session ID
type TransportType = SSEServerTransport | StreamableHTTPServerTransport;
const transports: Map<string, TransportType> = new Map();

/**
 * Options for creating the Express application.
 */
export interface CreateAppOptions {
  /** Enable OAuth authentication (overrides auto-detection) */
  auth?: boolean;
  /** Base URL for OAuth metadata (defaults to http://localhost:{port}) */
  baseUrl?: string;
  /** Custom OAuth provider (for testing) */
  oauthProvider?: GhostOAuthProvider;
  /** Admin password for login (auth mode) */
  adminPassword?: string;
  /** Secret key for encryption/sessions (64-char hex) */
  secretKey?: string;
  /** Custom credential store (for testing) */
  credentialStore?: CredentialStore;
}

/**
 * Determines whether OAuth should be enabled.
 * Returns true if explicitly requested or if no GHOST_URL is configured.
 */
function shouldEnableAuth(options?: CreateAppOptions): boolean {
  if (options?.auth !== undefined) return options.auth;
  if (process.env.MCP_AUTH === 'true') return true;
  if (process.env.MCP_AUTH === 'false') return false;
  return !process.env.GHOST_URL;
}

/**
 * Extracts ToolRegistrationConfig from AuthInfo.extra (Ghost config from OAuth).
 */
function toolConfigFromAuthInfo(authInfo: AuthInfo): ToolRegistrationConfig {
  const config: ToolRegistrationConfig = {};
  const extra = authInfo.extra;
  if (!extra) return config;

  const ghostUrl = extra.ghostUrl as string | undefined;
  const ghostContentApiKey = extra.ghostContentApiKey as string | undefined;
  const ghostAdminApiKey = extra.ghostAdminApiKey as string | undefined;

  if (ghostUrl && ghostContentApiKey) {
    config.contentApi = { url: ghostUrl, key: ghostContentApiKey };
  }
  if (ghostUrl && ghostAdminApiKey) {
    config.adminApi = { url: ghostUrl, key: ghostAdminApiKey };
  }
  return config;
}

/**
 * Creates and configures the Express application for MCP HTTP transports.
 * Supports two modes:
 * - Auth mode: OAuth 2.1 flow, per-user Ghost config
 * - No-auth mode: environment variable config (backwards compatible)
 */
function createApp(options?: CreateAppOptions): express.Application {
  const app = express();
  const useAuth = shouldEnableAuth(options);

  // Health check endpoint (always available, no auth)
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', auth: useAuth });
  });

  if (useAuth) {
    return configureAuthApp(app, options);
  } else {
    return configureNoAuthApp(app);
  }
}

/**
 * Configures the Express app with OAuth authentication.
 */
function configureAuthApp(
  app: express.Application,
  options?: CreateAppOptions
): express.Application {
  const port = parseInt(process.env.PORT || String(DEFAULT_PORT), 10);
  const baseUrl = options?.baseUrl ?? `http://localhost:${port}`;
  const issuerUrl = new URL(baseUrl);

  // Resolve admin password and secret key
  const adminPassword = options?.adminPassword ?? process.env.GHOST_MCP_ADMIN_PASSWORD;
  const secretKey = options?.secretKey ?? process.env.GHOST_MCP_SECRET_KEY;

  if (!adminPassword) {
    throw new Error('GHOST_MCP_ADMIN_PASSWORD is required in auth mode');
  }
  if (!secretKey || secretKey.length !== 64) {
    throw new Error('GHOST_MCP_SECRET_KEY must be a 64-character hex string (32 bytes)');
  }

  // Create or use provided credential store and oauth provider
  const credentialStore = options?.credentialStore ?? new CredentialStore(secretKey);
  const provider = options?.oauthProvider ?? new GhostOAuthProvider({
    credentialStore,
    issuerUrl: baseUrl,
  });

  // ----- Login routes -----
  app.get('/login', (req: Request, res: Response) => {
    const returnTo = req.query.returnTo as string | undefined;
    res.type('html').send(renderLoginPage({ returnTo }));
  });

  app.post('/login', express.urlencoded({ extended: false }), (req: Request, res: Response) => {
    const { password, returnTo } = req.body;

    if (!password || !safeCompare(password, adminPassword)) {
      res.type('html').send(renderLoginPage({
        error: 'Invalid password.',
        returnTo,
      }));
      return;
    }

    setSessionCookie(res, secretKey);

    if (returnTo) {
      // returnTo points to /authorize?... — redirect to /settings with returnTo preserved
      const settingsUrl = new URL(`${baseUrl}/settings`);
      settingsUrl.searchParams.set('returnTo', returnTo);
      res.redirect(settingsUrl.toString());
    } else {
      res.redirect('/settings');
    }
  });

  // ----- Settings routes -----
  app.get('/settings', (req: Request, res: Response) => {
    if (!getSessionFromRequest(req, secretKey)) {
      const loginUrl = new URL(`${baseUrl}/login`);
      const currentUrl = new URL(`${baseUrl}/settings`);
      const returnTo = req.query.returnTo as string | undefined;
      if (returnTo) {
        currentUrl.searchParams.set('returnTo', returnTo);
      }
      loginUrl.searchParams.set('returnTo', currentUrl.toString());
      res.redirect(loginUrl.toString());
      return;
    }

    const returnTo = req.query.returnTo as string | undefined;
    const existing = credentialStore.has() ? credentialStore.get() : null;

    res.type('html').send(renderSettingsPage({
      ghostUrl: existing?.ghostUrl,
      ghostAdminApiKey: existing?.ghostAdminApiKey ? '********' : undefined,
      ghostContentApiKey: existing?.ghostContentApiKey ? '********' : undefined,
      returnTo,
    }));
  });

  app.post('/settings', express.urlencoded({ extended: false }), (req: Request, res: Response) => {
    if (!getSessionFromRequest(req, secretKey)) {
      res.redirect('/login');
      return;
    }

    const { ghost_url, ghost_admin_api_key, ghost_content_api_key, returnTo } = req.body;

    if (!ghost_url) {
      res.type('html').send(renderSettingsPage({
        error: 'Ghost URL is required.',
        returnTo,
      }));
      return;
    }

    // Merge with existing credentials (blank fields keep current values)
    const existing = credentialStore.has() ? credentialStore.get() : null;
    const adminApiKey = ghost_admin_api_key || existing?.ghostAdminApiKey;
    const contentApiKey = ghost_content_api_key || existing?.ghostContentApiKey;

    if (!adminApiKey && !contentApiKey) {
      res.type('html').send(renderSettingsPage({
        ghostUrl: ghost_url,
        error: 'At least one API key (Admin or Content) is required.',
        returnTo,
      }));
      return;
    }

    credentialStore.save({
      ghostUrl: ghost_url,
      ghostAdminApiKey: adminApiKey || undefined,
      ghostContentApiKey: contentApiKey || undefined,
    });

    // If returnTo is an /authorize URL, redirect there so OAuth can complete
    if (returnTo) {
      res.redirect(returnTo);
      return;
    }

    // No returnTo — show success on settings page
    res.type('html').send(renderSettingsPage({
      ghostUrl: ghost_url,
      ghostAdminApiKey: adminApiKey ? '********' : undefined,
      ghostContentApiKey: contentApiKey ? '********' : undefined,
      success: 'Settings saved successfully.',
    }));
  });

  // ----- Logout route -----
  app.post('/logout', (_req: Request, res: Response) => {
    clearSessionCookie(res);
    res.redirect('/login');
  });

  // Mount the MCP auth router (handles /.well-known/*, GET /authorize, POST /token, POST /register, POST /revoke)
  app.use(
    mcpAuthRouter({
      provider,
      issuerUrl,
      resourceServerUrl: issuerUrl,
      resourceName: 'Ghost MCP Server',
    })
  );

  // Bearer auth middleware for protected endpoints
  const bearerAuth = requireBearerAuth({ verifier: provider });

  // Parse JSON for MCP endpoints
  app.use(express.json());

  //=============================================================================
  // STREAMABLE HTTP TRANSPORT (PROTOCOL VERSION 2025-11-25) — AUTH MODE
  //=============================================================================
  app.all('/mcp', bearerAuth, async (req: Request, res: Response) => {
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

        // Create server with Ghost config from the authenticated user
        const toolConfig = toolConfigFromAuthInfo(req.auth!);
        const server = createServer(toolConfig);
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
  // DEPRECATED HTTP+SSE TRANSPORT (PROTOCOL VERSION 2024-11-05) — AUTH MODE
  //=============================================================================
  app.get('/sse', bearerAuth, async (req: Request, res: Response) => {
    const transport = new SSEServerTransport('/messages', res);
    transports.set(transport.sessionId, transport);

    res.on('close', () => {
      transports.delete(transport.sessionId);
    });

    const toolConfig = toolConfigFromAuthInfo(req.auth!);
    const server = createServer(toolConfig);
    await server.connect(transport);
  });

  app.post('/messages', bearerAuth, async (req: Request, res: Response) => {
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
 * Configures the Express app without authentication (backwards compatible mode).
 */
function configureNoAuthApp(app: express.Application): express.Application {
  app.use(express.json());

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
  const useAuth = shouldEnableAuth();
  const app = createApp({ baseUrl: `http://localhost:${port}` });

  const server = app.listen(port, () => {
    console.log(`ghost-mcp SSE server listening on port ${port}`);
    console.log(`Auth mode: ${useAuth ? 'enabled (OAuth 2.1)' : 'disabled (env config)'}`);
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
${useAuth ? `
4. OAuth 2.1 Endpoints
   - /.well-known/oauth-authorization-server (GET)
   - /.well-known/oauth-protected-resource (GET)
   - /authorize (GET/POST)
   - /token (POST)
   - /register (POST)
   - /revoke (POST)

5. Admin Endpoints
   - /login (GET/POST)
   - /settings (GET/POST)
   - /logout (POST)
` : ''}==============================================
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
export {
  createApp,
  shouldEnableAuth,
  toolConfigFromAuthInfo,
  DEFAULT_PORT,
};

// Run the server (skip during test imports)
if (!process.env.VITEST) {
  main().catch((error: unknown) => {
    console.error('Failed to start SSE server:', error);
    process.exit(1);
  });
}
