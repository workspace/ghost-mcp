/**
 * MCP Tools registration module.
 *
 * Exports all tool registration functions and provides a central
 * function to register all tools with the MCP server.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { GhostContentClient } from '../client/ghost-content-client.js';
import { GhostApiError } from '../client/errors.js';
import {
  executeBrowsePosts,
  executeReadPost,
  BrowsePostsInputSchema,
  ReadPostInputSchema,
  BROWSE_POSTS_TOOL_NAME,
  BROWSE_POSTS_TOOL_DESCRIPTION,
  READ_POST_TOOL_NAME,
  READ_POST_TOOL_DESCRIPTION,
} from './content-posts/index.js';

/**
 * Configuration for Content API.
 */
export interface ContentApiConfig {
  url: string;
  key: string;
  version?: string;
}

/**
 * Configuration for tool registration.
 */
export interface ToolRegistrationConfig {
  /**
   * Ghost Content API configuration.
   */
  contentApi?: ContentApiConfig;
}

/**
 * Registers all Content API tools with the MCP server.
 *
 * @param server - MCP server instance
 * @param config - Content API configuration
 */
export function registerContentApiTools(
  server: McpServer,
  config: ContentApiConfig
): void {
  // Create a lazy client getter to avoid creating the client until needed
  let client: GhostContentClient | null = null;
  const getClient = (): GhostContentClient => {
    if (!client) {
      client = new GhostContentClient({
        url: config.url,
        key: config.key,
        version: config.version,
      });
    }
    return client;
  };

  // Register content_browse_posts tool
  server.tool(
    BROWSE_POSTS_TOOL_NAME,
    BROWSE_POSTS_TOOL_DESCRIPTION,
    {
      include: z
        .string()
        .optional()
        .describe('Related data to include: tags, authors (comma-separated)'),
      fields: z
        .string()
        .optional()
        .describe('Comma-separated list of fields to return'),
      formats: z
        .string()
        .optional()
        .describe(
          'Content formats: html, plaintext, mobiledoc (comma-separated)'
        ),
      filter: z
        .string()
        .optional()
        .describe('NQL filter expression (e.g., tag:getting-started)'),
      limit: z
        .union([z.number().int().positive(), z.literal('all')])
        .optional()
        .describe('Number of posts to return (default: 15, or "all")'),
      page: z
        .number()
        .int()
        .positive()
        .optional()
        .describe('Page number for pagination'),
      order: z
        .string()
        .optional()
        .describe('Sort order (e.g., published_at DESC)'),
    },
    async (input) => {
      try {
        // Validate input
        const validatedInput = BrowsePostsInputSchema.parse(input);

        // Get client and execute
        const contentClient = getClient();
        const result = await executeBrowsePosts(contentClient, validatedInput);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        if (error instanceof GhostApiError) {
          return {
            content: [
              {
                type: 'text',
                text: `Ghost API Error: ${error.message}`,
              },
            ],
            isError: true,
          };
        }

        throw error;
      }
    }
  );

  // Register content_read_post tool
  server.tool(
    READ_POST_TOOL_NAME,
    READ_POST_TOOL_DESCRIPTION,
    {
      id: z.string().optional().describe('Post ID'),
      slug: z.string().optional().describe('Post slug'),
      include: z
        .string()
        .optional()
        .describe('Related data to include: tags, authors (comma-separated)'),
      fields: z
        .string()
        .optional()
        .describe('Comma-separated list of fields to return'),
      formats: z
        .string()
        .optional()
        .describe(
          'Content formats: html, plaintext, mobiledoc (comma-separated)'
        ),
    },
    async (input) => {
      try {
        // Validate input
        const validatedInput = ReadPostInputSchema.parse(input);

        // Get client and execute
        const contentClient = getClient();
        const result = await executeReadPost(contentClient, validatedInput);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        if (error instanceof GhostApiError) {
          return {
            content: [
              {
                type: 'text',
                text: `Ghost API Error: ${error.message}`,
              },
            ],
            isError: true,
          };
        }

        throw error;
      }
    }
  );
}

/**
 * Registers all tools with the MCP server.
 *
 * @param server - MCP server instance
 * @param config - Tool registration configuration
 */
export function registerAllTools(
  server: McpServer,
  config: ToolRegistrationConfig
): void {
  if (config.contentApi) {
    registerContentApiTools(server, config.contentApi);
  }
}

// Re-export individual tool modules
export * from './content-posts/index.js';
