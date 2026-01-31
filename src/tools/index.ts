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
import {
  executeBrowsePages,
  executeReadPage,
  BrowsePagesInputSchema,
  ReadPageInputSchema,
  BROWSE_PAGES_TOOL_NAME,
  BROWSE_PAGES_TOOL_DESCRIPTION,
  READ_PAGE_TOOL_NAME,
  READ_PAGE_TOOL_DESCRIPTION,
} from './content-pages/index.js';
import {
  executeBrowseTags,
  executeReadTag,
  BrowseTagsInputSchema,
  ReadTagInputSchema,
  BROWSE_TAGS_TOOL_NAME,
  BROWSE_TAGS_TOOL_DESCRIPTION,
  READ_TAG_TOOL_NAME,
  READ_TAG_TOOL_DESCRIPTION,
} from './content-tags/index.js';
import {
  executeBrowseAuthors,
  executeReadAuthor,
  BrowseAuthorsInputSchema,
  ReadAuthorInputSchema,
  BROWSE_AUTHORS_TOOL_NAME,
  BROWSE_AUTHORS_TOOL_DESCRIPTION,
  READ_AUTHOR_TOOL_NAME,
  READ_AUTHOR_TOOL_DESCRIPTION,
} from './content-authors/index.js';
import { GhostClient } from '../client/ghost-client.js';
import {
  executeAdminBrowsePosts,
  executeAdminReadPost,
  executeAdminCreatePost,
  executeAdminUpdatePost,
  executeAdminDeletePost,
  executeAdminCopyPost,
  AdminBrowsePostsInputSchema,
  AdminReadPostInputSchema,
  AdminCreatePostInputSchema,
  AdminUpdatePostInputSchema,
  AdminDeletePostInputSchema,
  AdminCopyPostInputSchema,
  ADMIN_BROWSE_POSTS_TOOL_NAME,
  ADMIN_BROWSE_POSTS_TOOL_DESCRIPTION,
  ADMIN_READ_POST_TOOL_NAME,
  ADMIN_READ_POST_TOOL_DESCRIPTION,
  ADMIN_CREATE_POST_TOOL_NAME,
  ADMIN_CREATE_POST_TOOL_DESCRIPTION,
  ADMIN_UPDATE_POST_TOOL_NAME,
  ADMIN_UPDATE_POST_TOOL_DESCRIPTION,
  ADMIN_DELETE_POST_TOOL_NAME,
  ADMIN_DELETE_POST_TOOL_DESCRIPTION,
  ADMIN_COPY_POST_TOOL_NAME,
  ADMIN_COPY_POST_TOOL_DESCRIPTION,
} from './admin-posts/index.js';
import {
  executeAdminBrowsePages,
  executeAdminReadPage,
  executeAdminCreatePage,
  executeAdminUpdatePage,
  executeAdminDeletePage,
  executeAdminCopyPage,
  AdminBrowsePagesInputSchema,
  AdminReadPageInputSchema,
  AdminCreatePageInputSchema,
  AdminUpdatePageInputSchema,
  AdminDeletePageInputSchema,
  AdminCopyPageInputSchema,
  ADMIN_BROWSE_PAGES_TOOL_NAME,
  ADMIN_BROWSE_PAGES_TOOL_DESCRIPTION,
  ADMIN_READ_PAGE_TOOL_NAME,
  ADMIN_READ_PAGE_TOOL_DESCRIPTION,
  ADMIN_CREATE_PAGE_TOOL_NAME,
  ADMIN_CREATE_PAGE_TOOL_DESCRIPTION,
  ADMIN_UPDATE_PAGE_TOOL_NAME,
  ADMIN_UPDATE_PAGE_TOOL_DESCRIPTION,
  ADMIN_DELETE_PAGE_TOOL_NAME,
  ADMIN_DELETE_PAGE_TOOL_DESCRIPTION,
  ADMIN_COPY_PAGE_TOOL_NAME,
  ADMIN_COPY_PAGE_TOOL_DESCRIPTION,
} from './admin-pages/index.js';
import {
  executeAdminBrowseTags,
  executeAdminReadTag,
  executeAdminCreateTag,
  executeAdminUpdateTag,
  executeAdminDeleteTag,
  AdminBrowseTagsInputSchema,
  AdminReadTagInputSchema,
  AdminCreateTagInputSchema,
  AdminUpdateTagInputSchema,
  AdminDeleteTagInputSchema,
  ADMIN_BROWSE_TAGS_TOOL_NAME,
  ADMIN_BROWSE_TAGS_TOOL_DESCRIPTION,
  ADMIN_READ_TAG_TOOL_NAME,
  ADMIN_READ_TAG_TOOL_DESCRIPTION,
  ADMIN_CREATE_TAG_TOOL_NAME,
  ADMIN_CREATE_TAG_TOOL_DESCRIPTION,
  ADMIN_UPDATE_TAG_TOOL_NAME,
  ADMIN_UPDATE_TAG_TOOL_DESCRIPTION,
  ADMIN_DELETE_TAG_TOOL_NAME,
  ADMIN_DELETE_TAG_TOOL_DESCRIPTION,
} from './admin-tags/index.js';
import {
  executeAdminBrowseMembers,
  executeAdminReadMember,
  executeAdminCreateMember,
  executeAdminUpdateMember,
  AdminBrowseMembersInputSchema,
  AdminReadMemberInputSchema,
  AdminCreateMemberInputSchema,
  AdminUpdateMemberInputSchema,
  ADMIN_BROWSE_MEMBERS_TOOL_NAME,
  ADMIN_BROWSE_MEMBERS_TOOL_DESCRIPTION,
  ADMIN_READ_MEMBER_TOOL_NAME,
  ADMIN_READ_MEMBER_TOOL_DESCRIPTION,
  ADMIN_CREATE_MEMBER_TOOL_NAME,
  ADMIN_CREATE_MEMBER_TOOL_DESCRIPTION,
  ADMIN_UPDATE_MEMBER_TOOL_NAME,
  ADMIN_UPDATE_MEMBER_TOOL_DESCRIPTION,
} from './admin-members/index.js';
import {
  executeAdminBrowseTiers,
  executeAdminReadTier,
  executeAdminCreateTier,
  executeAdminUpdateTier,
  AdminBrowseTiersInputSchema,
  AdminReadTierInputSchema,
  AdminCreateTierInputSchema,
  AdminUpdateTierInputSchema,
  ADMIN_BROWSE_TIERS_TOOL_NAME,
  ADMIN_BROWSE_TIERS_TOOL_DESCRIPTION,
  ADMIN_READ_TIER_TOOL_NAME,
  ADMIN_READ_TIER_TOOL_DESCRIPTION,
  ADMIN_CREATE_TIER_TOOL_NAME,
  ADMIN_CREATE_TIER_TOOL_DESCRIPTION,
  ADMIN_UPDATE_TIER_TOOL_NAME,
  ADMIN_UPDATE_TIER_TOOL_DESCRIPTION,
} from './admin-tiers/index.js';

/**
 * Configuration for Content API.
 */
export interface ContentApiConfig {
  url: string;
  key: string;
  version?: string;
}

/**
 * Configuration for Admin API.
 */
export interface AdminApiConfig {
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

  /**
   * Ghost Admin API configuration.
   */
  adminApi?: AdminApiConfig;
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

  // Register content_browse_pages tool
  server.tool(
    BROWSE_PAGES_TOOL_NAME,
    BROWSE_PAGES_TOOL_DESCRIPTION,
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
        .describe('Number of pages to return (default: 15, or "all")'),
      page: z
        .number()
        .int()
        .positive()
        .optional()
        .describe('Page number for pagination'),
      order: z
        .string()
        .optional()
        .describe('Sort order (e.g., title ASC). Default: title'),
    },
    async (input) => {
      try {
        // Validate input
        const validatedInput = BrowsePagesInputSchema.parse(input);

        // Get client and execute
        const contentClient = getClient();
        const result = await executeBrowsePages(contentClient, validatedInput);

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

  // Register content_read_page tool
  server.tool(
    READ_PAGE_TOOL_NAME,
    READ_PAGE_TOOL_DESCRIPTION,
    {
      id: z.string().optional().describe('Page ID'),
      slug: z.string().optional().describe('Page slug'),
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
        const validatedInput = ReadPageInputSchema.parse(input);

        // Get client and execute
        const contentClient = getClient();
        const result = await executeReadPage(contentClient, validatedInput);

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

  // Register content_browse_tags tool
  server.tool(
    BROWSE_TAGS_TOOL_NAME,
    BROWSE_TAGS_TOOL_DESCRIPTION,
    {
      include: z
        .string()
        .optional()
        .describe('Related data to include: count.posts'),
      fields: z
        .string()
        .optional()
        .describe('Comma-separated list of fields to return'),
      filter: z
        .string()
        .optional()
        .describe('NQL filter expression (e.g., visibility:public)'),
      limit: z
        .union([z.number().int().positive(), z.literal('all')])
        .optional()
        .describe('Number of tags to return (default: 15, or "all")'),
      page: z
        .number()
        .int()
        .positive()
        .optional()
        .describe('Page number for pagination'),
      order: z
        .string()
        .optional()
        .describe('Sort order (e.g., name ASC)'),
    },
    async (input) => {
      try {
        // Validate input
        const validatedInput = BrowseTagsInputSchema.parse(input);

        // Get client and execute
        const contentClient = getClient();
        const result = await executeBrowseTags(contentClient, validatedInput);

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

  // Register content_read_tag tool
  server.tool(
    READ_TAG_TOOL_NAME,
    READ_TAG_TOOL_DESCRIPTION,
    {
      id: z.string().optional().describe('Tag ID'),
      slug: z.string().optional().describe('Tag slug'),
      include: z
        .string()
        .optional()
        .describe('Related data to include: count.posts'),
      fields: z
        .string()
        .optional()
        .describe('Comma-separated list of fields to return'),
    },
    async (input) => {
      try {
        // Validate input
        const validatedInput = ReadTagInputSchema.parse(input);

        // Get client and execute
        const contentClient = getClient();
        const result = await executeReadTag(contentClient, validatedInput);

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

  // Register content_browse_authors tool
  server.tool(
    BROWSE_AUTHORS_TOOL_NAME,
    BROWSE_AUTHORS_TOOL_DESCRIPTION,
    {
      include: z
        .string()
        .optional()
        .describe('Related data to include: count.posts'),
      fields: z
        .string()
        .optional()
        .describe('Comma-separated list of fields to return'),
      filter: z
        .string()
        .optional()
        .describe('NQL filter expression (e.g., slug:john-doe)'),
      limit: z
        .union([z.number().int().positive(), z.literal('all')])
        .optional()
        .describe('Number of authors to return (default: 15, or "all")'),
      page: z
        .number()
        .int()
        .positive()
        .optional()
        .describe('Page number for pagination'),
      order: z
        .string()
        .optional()
        .describe('Sort order (e.g., name ASC)'),
    },
    async (input) => {
      try {
        // Validate input
        const validatedInput = BrowseAuthorsInputSchema.parse(input);

        // Get client and execute
        const contentClient = getClient();
        const result = await executeBrowseAuthors(contentClient, validatedInput);

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

  // Register content_read_author tool
  server.tool(
    READ_AUTHOR_TOOL_NAME,
    READ_AUTHOR_TOOL_DESCRIPTION,
    {
      id: z.string().optional().describe('Author ID'),
      slug: z.string().optional().describe('Author slug'),
      include: z
        .string()
        .optional()
        .describe('Related data to include: count.posts'),
      fields: z
        .string()
        .optional()
        .describe('Comma-separated list of fields to return'),
    },
    async (input) => {
      try {
        // Validate input
        const validatedInput = ReadAuthorInputSchema.parse(input);

        // Get client and execute
        const contentClient = getClient();
        const result = await executeReadAuthor(contentClient, validatedInput);

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
 * Registers all Admin API tools with the MCP server.
 *
 * @param server - MCP server instance
 * @param config - Admin API configuration
 */
export function registerAdminApiTools(
  server: McpServer,
  config: AdminApiConfig
): void {
  // Create a lazy client getter to avoid creating the client until needed
  let client: GhostClient | null = null;
  const getClient = (): GhostClient => {
    if (!client) {
      client = new GhostClient({
        url: config.url,
        apiKey: config.key,
        version: config.version,
      });
    }
    return client;
  };

  // Register admin_browse_posts tool
  server.tool(
    ADMIN_BROWSE_POSTS_TOOL_NAME,
    ADMIN_BROWSE_POSTS_TOOL_DESCRIPTION,
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
        .describe('Content formats: html, lexical (comma-separated)'),
      filter: z
        .string()
        .optional()
        .describe('NQL filter expression (e.g., status:draft)'),
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
        const validatedInput = AdminBrowsePostsInputSchema.parse(input);
        const adminClient = getClient();
        const result = await executeAdminBrowsePosts(adminClient, validatedInput);

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

  // Register admin_read_post tool
  server.tool(
    ADMIN_READ_POST_TOOL_NAME,
    ADMIN_READ_POST_TOOL_DESCRIPTION,
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
        .describe('Content formats: html, lexical (comma-separated)'),
    },
    async (input) => {
      try {
        const validatedInput = AdminReadPostInputSchema.parse(input);
        const adminClient = getClient();
        const result = await executeAdminReadPost(adminClient, validatedInput);

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

  // Register admin_create_post tool
  server.tool(
    ADMIN_CREATE_POST_TOOL_NAME,
    ADMIN_CREATE_POST_TOOL_DESCRIPTION,
    {
      title: z.string().describe('Post title (required)'),
      slug: z.string().optional().describe('URL slug'),
      lexical: z.string().optional().describe('Post content in Lexical JSON format'),
      mobiledoc: z.string().optional().describe('Post content in Mobiledoc JSON format'),
      html: z.string().optional().describe('Post content in HTML format'),
      feature_image: z.string().nullable().optional().describe('Feature image URL'),
      featured: z.boolean().optional().describe('Whether the post is featured'),
      status: z
        .enum(['published', 'draft', 'scheduled', 'sent'])
        .optional()
        .describe('Publication status (default: draft)'),
      visibility: z
        .enum(['public', 'members', 'paid', 'tiers'])
        .optional()
        .describe('Content visibility'),
      tags: z.array(z.object({
        id: z.string().optional(),
        name: z.string().optional(),
        slug: z.string().optional(),
      })).optional().describe('Tags to assign'),
      authors: z.array(z.object({
        id: z.string().optional(),
        email: z.string().optional(),
        slug: z.string().optional(),
      })).optional().describe('Authors to assign'),
      custom_excerpt: z.string().nullable().optional().describe('Custom excerpt'),
      canonical_url: z.string().nullable().optional().describe('Canonical URL'),
      meta_title: z.string().nullable().optional().describe('SEO meta title'),
      meta_description: z.string().nullable().optional().describe('SEO meta description'),
      og_image: z.string().nullable().optional().describe('Open Graph image URL'),
      og_title: z.string().nullable().optional().describe('Open Graph title'),
      og_description: z.string().nullable().optional().describe('Open Graph description'),
      twitter_image: z.string().nullable().optional().describe('Twitter card image URL'),
      twitter_title: z.string().nullable().optional().describe('Twitter card title'),
      twitter_description: z.string().nullable().optional().describe('Twitter card description'),
      codeinjection_head: z.string().nullable().optional().describe('Code for <head>'),
      codeinjection_foot: z.string().nullable().optional().describe('Code for </body>'),
      email_only: z.boolean().optional().describe('Email-only post'),
      published_at: z.string().nullable().optional().describe('Publication date (ISO 8601)'),
    },
    async (input) => {
      try {
        const validatedInput = AdminCreatePostInputSchema.parse(input);
        const adminClient = getClient();
        const result = await executeAdminCreatePost(adminClient, validatedInput);

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

  // Register admin_update_post tool
  server.tool(
    ADMIN_UPDATE_POST_TOOL_NAME,
    ADMIN_UPDATE_POST_TOOL_DESCRIPTION,
    {
      id: z.string().describe('Post ID (required)'),
      updated_at: z.string().describe('Current updated_at timestamp (required for conflict prevention)'),
      title: z.string().optional().describe('Post title'),
      slug: z.string().optional().describe('URL slug'),
      lexical: z.string().optional().describe('Post content in Lexical JSON format'),
      mobiledoc: z.string().optional().describe('Post content in Mobiledoc JSON format'),
      html: z.string().optional().describe('Post content in HTML format'),
      feature_image: z.string().nullable().optional().describe('Feature image URL'),
      featured: z.boolean().optional().describe('Whether the post is featured'),
      status: z
        .enum(['published', 'draft', 'scheduled', 'sent'])
        .optional()
        .describe('Publication status'),
      visibility: z
        .enum(['public', 'members', 'paid', 'tiers'])
        .optional()
        .describe('Content visibility'),
      tags: z.array(z.object({
        id: z.string().optional(),
        name: z.string().optional(),
        slug: z.string().optional(),
      })).optional().describe('Tags to assign (replaces existing)'),
      authors: z.array(z.object({
        id: z.string().optional(),
        email: z.string().optional(),
        slug: z.string().optional(),
      })).optional().describe('Authors to assign (replaces existing)'),
      custom_excerpt: z.string().nullable().optional().describe('Custom excerpt'),
      canonical_url: z.string().nullable().optional().describe('Canonical URL'),
      meta_title: z.string().nullable().optional().describe('SEO meta title'),
      meta_description: z.string().nullable().optional().describe('SEO meta description'),
      og_image: z.string().nullable().optional().describe('Open Graph image URL'),
      og_title: z.string().nullable().optional().describe('Open Graph title'),
      og_description: z.string().nullable().optional().describe('Open Graph description'),
      twitter_image: z.string().nullable().optional().describe('Twitter card image URL'),
      twitter_title: z.string().nullable().optional().describe('Twitter card title'),
      twitter_description: z.string().nullable().optional().describe('Twitter card description'),
      codeinjection_head: z.string().nullable().optional().describe('Code for <head>'),
      codeinjection_foot: z.string().nullable().optional().describe('Code for </body>'),
      email_only: z.boolean().optional().describe('Email-only post'),
      published_at: z.string().nullable().optional().describe('Publication date (ISO 8601)'),
    },
    async (input) => {
      try {
        const validatedInput = AdminUpdatePostInputSchema.parse(input);
        const adminClient = getClient();
        const result = await executeAdminUpdatePost(adminClient, validatedInput);

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

  // Register admin_delete_post tool
  server.tool(
    ADMIN_DELETE_POST_TOOL_NAME,
    ADMIN_DELETE_POST_TOOL_DESCRIPTION,
    {
      id: z.string().describe('Post ID to delete (required)'),
    },
    async (input) => {
      try {
        const validatedInput = AdminDeletePostInputSchema.parse(input);
        const adminClient = getClient();
        const result = await executeAdminDeletePost(adminClient, validatedInput);

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

  // Register admin_copy_post tool
  server.tool(
    ADMIN_COPY_POST_TOOL_NAME,
    ADMIN_COPY_POST_TOOL_DESCRIPTION,
    {
      id: z.string().describe('Post ID to copy (required)'),
    },
    async (input) => {
      try {
        const validatedInput = AdminCopyPostInputSchema.parse(input);
        const adminClient = getClient();
        const result = await executeAdminCopyPost(adminClient, validatedInput);

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

  // Register admin_browse_pages tool
  server.tool(
    ADMIN_BROWSE_PAGES_TOOL_NAME,
    ADMIN_BROWSE_PAGES_TOOL_DESCRIPTION,
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
        .describe('Content formats: html, lexical (comma-separated)'),
      filter: z
        .string()
        .optional()
        .describe('NQL filter expression (e.g., status:draft)'),
      limit: z
        .union([z.number().int().positive(), z.literal('all')])
        .optional()
        .describe('Number of pages to return (default: 15, or "all")'),
      page: z
        .number()
        .int()
        .positive()
        .optional()
        .describe('Page number for pagination'),
      order: z
        .string()
        .optional()
        .describe('Sort order (e.g., title ASC)'),
    },
    async (input) => {
      try {
        const validatedInput = AdminBrowsePagesInputSchema.parse(input);
        const adminClient = getClient();
        const result = await executeAdminBrowsePages(adminClient, validatedInput);

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

  // Register admin_read_page tool
  server.tool(
    ADMIN_READ_PAGE_TOOL_NAME,
    ADMIN_READ_PAGE_TOOL_DESCRIPTION,
    {
      id: z.string().optional().describe('Page ID'),
      slug: z.string().optional().describe('Page slug'),
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
        .describe('Content formats: html, lexical (comma-separated)'),
    },
    async (input) => {
      try {
        const validatedInput = AdminReadPageInputSchema.parse(input);
        const adminClient = getClient();
        const result = await executeAdminReadPage(adminClient, validatedInput);

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

  // Register admin_create_page tool
  server.tool(
    ADMIN_CREATE_PAGE_TOOL_NAME,
    ADMIN_CREATE_PAGE_TOOL_DESCRIPTION,
    {
      title: z.string().describe('Page title (required)'),
      slug: z.string().optional().describe('URL slug'),
      lexical: z.string().optional().describe('Page content in Lexical JSON format'),
      mobiledoc: z.string().optional().describe('Page content in Mobiledoc JSON format'),
      html: z.string().optional().describe('Page content in HTML format'),
      feature_image: z.string().nullable().optional().describe('Feature image URL'),
      featured: z.boolean().optional().describe('Whether the page is featured'),
      status: z
        .enum(['published', 'draft', 'scheduled'])
        .optional()
        .describe('Publication status (default: draft)'),
      visibility: z
        .enum(['public', 'members', 'paid', 'tiers'])
        .optional()
        .describe('Content visibility'),
      tags: z.array(z.object({
        id: z.string().optional(),
        name: z.string().optional(),
        slug: z.string().optional(),
      })).optional().describe('Tags to assign'),
      authors: z.array(z.object({
        id: z.string().optional(),
        email: z.string().optional(),
        slug: z.string().optional(),
      })).optional().describe('Authors to assign'),
      custom_excerpt: z.string().nullable().optional().describe('Custom excerpt'),
      canonical_url: z.string().nullable().optional().describe('Canonical URL'),
      meta_title: z.string().nullable().optional().describe('SEO meta title'),
      meta_description: z.string().nullable().optional().describe('SEO meta description'),
      og_image: z.string().nullable().optional().describe('Open Graph image URL'),
      og_title: z.string().nullable().optional().describe('Open Graph title'),
      og_description: z.string().nullable().optional().describe('Open Graph description'),
      twitter_image: z.string().nullable().optional().describe('Twitter card image URL'),
      twitter_title: z.string().nullable().optional().describe('Twitter card title'),
      twitter_description: z.string().nullable().optional().describe('Twitter card description'),
      codeinjection_head: z.string().nullable().optional().describe('Code for <head>'),
      codeinjection_foot: z.string().nullable().optional().describe('Code for </body>'),
      published_at: z.string().nullable().optional().describe('Publication date (ISO 8601)'),
    },
    async (input) => {
      try {
        const validatedInput = AdminCreatePageInputSchema.parse(input);
        const adminClient = getClient();
        const result = await executeAdminCreatePage(adminClient, validatedInput);

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

  // Register admin_update_page tool
  server.tool(
    ADMIN_UPDATE_PAGE_TOOL_NAME,
    ADMIN_UPDATE_PAGE_TOOL_DESCRIPTION,
    {
      id: z.string().describe('Page ID (required)'),
      updated_at: z.string().describe('Current updated_at timestamp (required for conflict prevention)'),
      title: z.string().optional().describe('Page title'),
      slug: z.string().optional().describe('URL slug'),
      lexical: z.string().optional().describe('Page content in Lexical JSON format'),
      mobiledoc: z.string().optional().describe('Page content in Mobiledoc JSON format'),
      html: z.string().optional().describe('Page content in HTML format'),
      feature_image: z.string().nullable().optional().describe('Feature image URL'),
      featured: z.boolean().optional().describe('Whether the page is featured'),
      status: z
        .enum(['published', 'draft', 'scheduled'])
        .optional()
        .describe('Publication status'),
      visibility: z
        .enum(['public', 'members', 'paid', 'tiers'])
        .optional()
        .describe('Content visibility'),
      tags: z.array(z.object({
        id: z.string().optional(),
        name: z.string().optional(),
        slug: z.string().optional(),
      })).optional().describe('Tags to assign (replaces existing)'),
      authors: z.array(z.object({
        id: z.string().optional(),
        email: z.string().optional(),
        slug: z.string().optional(),
      })).optional().describe('Authors to assign (replaces existing)'),
      custom_excerpt: z.string().nullable().optional().describe('Custom excerpt'),
      canonical_url: z.string().nullable().optional().describe('Canonical URL'),
      meta_title: z.string().nullable().optional().describe('SEO meta title'),
      meta_description: z.string().nullable().optional().describe('SEO meta description'),
      og_image: z.string().nullable().optional().describe('Open Graph image URL'),
      og_title: z.string().nullable().optional().describe('Open Graph title'),
      og_description: z.string().nullable().optional().describe('Open Graph description'),
      twitter_image: z.string().nullable().optional().describe('Twitter card image URL'),
      twitter_title: z.string().nullable().optional().describe('Twitter card title'),
      twitter_description: z.string().nullable().optional().describe('Twitter card description'),
      codeinjection_head: z.string().nullable().optional().describe('Code for <head>'),
      codeinjection_foot: z.string().nullable().optional().describe('Code for </body>'),
      published_at: z.string().nullable().optional().describe('Publication date (ISO 8601)'),
    },
    async (input) => {
      try {
        const validatedInput = AdminUpdatePageInputSchema.parse(input);
        const adminClient = getClient();
        const result = await executeAdminUpdatePage(adminClient, validatedInput);

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

  // Register admin_delete_page tool
  server.tool(
    ADMIN_DELETE_PAGE_TOOL_NAME,
    ADMIN_DELETE_PAGE_TOOL_DESCRIPTION,
    {
      id: z.string().describe('Page ID to delete (required)'),
    },
    async (input) => {
      try {
        const validatedInput = AdminDeletePageInputSchema.parse(input);
        const adminClient = getClient();
        const result = await executeAdminDeletePage(adminClient, validatedInput);

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

  // Register admin_copy_page tool
  server.tool(
    ADMIN_COPY_PAGE_TOOL_NAME,
    ADMIN_COPY_PAGE_TOOL_DESCRIPTION,
    {
      id: z.string().describe('Page ID to copy (required)'),
    },
    async (input) => {
      try {
        const validatedInput = AdminCopyPageInputSchema.parse(input);
        const adminClient = getClient();
        const result = await executeAdminCopyPage(adminClient, validatedInput);

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

  // Register admin_browse_tags tool
  server.tool(
    ADMIN_BROWSE_TAGS_TOOL_NAME,
    ADMIN_BROWSE_TAGS_TOOL_DESCRIPTION,
    {
      include: z
        .string()
        .optional()
        .describe('Related data to include: count.posts'),
      fields: z
        .string()
        .optional()
        .describe('Comma-separated list of fields to return'),
      filter: z
        .string()
        .optional()
        .describe('NQL filter expression (e.g., visibility:public)'),
      limit: z
        .union([z.number().int().positive(), z.literal('all')])
        .optional()
        .describe('Number of tags to return (default: 15, or "all")'),
      page: z
        .number()
        .int()
        .positive()
        .optional()
        .describe('Page number for pagination'),
      order: z
        .string()
        .optional()
        .describe('Sort order (e.g., name ASC)'),
    },
    async (input) => {
      try {
        const validatedInput = AdminBrowseTagsInputSchema.parse(input);
        const adminClient = getClient();
        const result = await executeAdminBrowseTags(adminClient, validatedInput);

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

  // Register admin_read_tag tool
  server.tool(
    ADMIN_READ_TAG_TOOL_NAME,
    ADMIN_READ_TAG_TOOL_DESCRIPTION,
    {
      id: z.string().optional().describe('Tag ID'),
      slug: z.string().optional().describe('Tag slug'),
      include: z
        .string()
        .optional()
        .describe('Related data to include: count.posts'),
      fields: z
        .string()
        .optional()
        .describe('Comma-separated list of fields to return'),
    },
    async (input) => {
      try {
        const validatedInput = AdminReadTagInputSchema.parse(input);
        const adminClient = getClient();
        const result = await executeAdminReadTag(adminClient, validatedInput);

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

  // Register admin_create_tag tool
  server.tool(
    ADMIN_CREATE_TAG_TOOL_NAME,
    ADMIN_CREATE_TAG_TOOL_DESCRIPTION,
    {
      name: z.string().describe('Tag name (required)'),
      slug: z.string().optional().describe('URL slug'),
      description: z.string().nullable().optional().describe('Tag description'),
      feature_image: z.string().nullable().optional().describe('Feature image URL'),
      visibility: z
        .enum(['public', 'internal'])
        .optional()
        .describe('Tag visibility (default: public)'),
      og_image: z.string().nullable().optional().describe('Open Graph image URL'),
      og_title: z.string().nullable().optional().describe('Open Graph title'),
      og_description: z.string().nullable().optional().describe('Open Graph description'),
      twitter_image: z.string().nullable().optional().describe('Twitter card image URL'),
      twitter_title: z.string().nullable().optional().describe('Twitter card title'),
      twitter_description: z.string().nullable().optional().describe('Twitter card description'),
      meta_title: z.string().nullable().optional().describe('SEO meta title'),
      meta_description: z.string().nullable().optional().describe('SEO meta description'),
      codeinjection_head: z.string().nullable().optional().describe('Code for <head>'),
      codeinjection_foot: z.string().nullable().optional().describe('Code for </body>'),
      canonical_url: z.string().nullable().optional().describe('Canonical URL'),
      accent_color: z.string().nullable().optional().describe('Accent color (hex code)'),
    },
    async (input) => {
      try {
        const validatedInput = AdminCreateTagInputSchema.parse(input);
        const adminClient = getClient();
        const result = await executeAdminCreateTag(adminClient, validatedInput);

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

  // Register admin_update_tag tool
  server.tool(
    ADMIN_UPDATE_TAG_TOOL_NAME,
    ADMIN_UPDATE_TAG_TOOL_DESCRIPTION,
    {
      id: z.string().describe('Tag ID (required)'),
      updated_at: z.string().describe('Current updated_at timestamp (required for conflict prevention)'),
      name: z.string().optional().describe('Tag name'),
      slug: z.string().optional().describe('URL slug'),
      description: z.string().nullable().optional().describe('Tag description'),
      feature_image: z.string().nullable().optional().describe('Feature image URL'),
      visibility: z
        .enum(['public', 'internal'])
        .optional()
        .describe('Tag visibility'),
      og_image: z.string().nullable().optional().describe('Open Graph image URL'),
      og_title: z.string().nullable().optional().describe('Open Graph title'),
      og_description: z.string().nullable().optional().describe('Open Graph description'),
      twitter_image: z.string().nullable().optional().describe('Twitter card image URL'),
      twitter_title: z.string().nullable().optional().describe('Twitter card title'),
      twitter_description: z.string().nullable().optional().describe('Twitter card description'),
      meta_title: z.string().nullable().optional().describe('SEO meta title'),
      meta_description: z.string().nullable().optional().describe('SEO meta description'),
      codeinjection_head: z.string().nullable().optional().describe('Code for <head>'),
      codeinjection_foot: z.string().nullable().optional().describe('Code for </body>'),
      canonical_url: z.string().nullable().optional().describe('Canonical URL'),
      accent_color: z.string().nullable().optional().describe('Accent color (hex code)'),
    },
    async (input) => {
      try {
        const validatedInput = AdminUpdateTagInputSchema.parse(input);
        const adminClient = getClient();
        const result = await executeAdminUpdateTag(adminClient, validatedInput);

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

  // Register admin_delete_tag tool
  server.tool(
    ADMIN_DELETE_TAG_TOOL_NAME,
    ADMIN_DELETE_TAG_TOOL_DESCRIPTION,
    {
      id: z.string().describe('Tag ID to delete (required)'),
    },
    async (input) => {
      try {
        const validatedInput = AdminDeleteTagInputSchema.parse(input);
        const adminClient = getClient();
        const result = await executeAdminDeleteTag(adminClient, validatedInput);

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

  // Register admin_browse_members tool
  server.tool(
    ADMIN_BROWSE_MEMBERS_TOOL_NAME,
    ADMIN_BROWSE_MEMBERS_TOOL_DESCRIPTION,
    {
      include: z
        .string()
        .optional()
        .describe(
          'Related data to include: labels, newsletters (comma-separated)'
        ),
      fields: z
        .string()
        .optional()
        .describe('Comma-separated list of fields to return'),
      filter: z
        .string()
        .optional()
        .describe(
          'NQL filter expression (e.g., status:paid, subscribed:true, label:vip)'
        ),
      limit: z
        .union([z.number().int().positive(), z.literal('all')])
        .optional()
        .describe('Number of members to return (default: 15, or "all")'),
      page: z
        .number()
        .int()
        .positive()
        .optional()
        .describe('Page number for pagination'),
      order: z
        .string()
        .optional()
        .describe('Sort order (e.g., created_at DESC)'),
    },
    async (input) => {
      try {
        const validatedInput = AdminBrowseMembersInputSchema.parse(input);
        const adminClient = getClient();
        const result = await executeAdminBrowseMembers(
          adminClient,
          validatedInput
        );

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

  // Register admin_read_member tool
  server.tool(
    ADMIN_READ_MEMBER_TOOL_NAME,
    ADMIN_READ_MEMBER_TOOL_DESCRIPTION,
    {
      id: z.string().optional().describe('Member ID'),
      email: z.string().optional().describe('Member email address'),
      include: z
        .string()
        .optional()
        .describe(
          'Related data to include: labels, newsletters (comma-separated)'
        ),
      fields: z
        .string()
        .optional()
        .describe('Comma-separated list of fields to return'),
    },
    async (input) => {
      try {
        const validatedInput = AdminReadMemberInputSchema.parse(input);
        const adminClient = getClient();
        const result = await executeAdminReadMember(
          adminClient,
          validatedInput
        );

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

  // Register admin_create_member tool
  server.tool(
    ADMIN_CREATE_MEMBER_TOOL_NAME,
    ADMIN_CREATE_MEMBER_TOOL_DESCRIPTION,
    {
      email: z.string().describe('Member email address (required)'),
      name: z.string().optional().describe('Member name'),
      note: z
        .string()
        .nullable()
        .optional()
        .describe('Private note about the member'),
      subscribed: z
        .boolean()
        .optional()
        .describe('Whether member is subscribed to newsletters (default: true)'),
      labels: z
        .array(
          z.object({
            id: z.string().optional(),
            name: z.string().optional(),
            slug: z.string().optional(),
          })
        )
        .optional()
        .describe('Labels to assign to the member'),
      newsletters: z
        .array(z.object({ id: z.string() }))
        .optional()
        .describe('Newsletters to subscribe the member to'),
      comped: z
        .boolean()
        .optional()
        .describe('Whether member has complimentary premium access'),
    },
    async (input) => {
      try {
        const validatedInput = AdminCreateMemberInputSchema.parse(input);
        const adminClient = getClient();
        const result = await executeAdminCreateMember(
          adminClient,
          validatedInput
        );

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

  // Register admin_update_member tool
  server.tool(
    ADMIN_UPDATE_MEMBER_TOOL_NAME,
    ADMIN_UPDATE_MEMBER_TOOL_DESCRIPTION,
    {
      id: z.string().describe('Member ID (required)'),
      updated_at: z
        .string()
        .describe(
          'Current updated_at timestamp for conflict prevention (required)'
        ),
      name: z.string().optional().describe('Member name'),
      note: z
        .string()
        .nullable()
        .optional()
        .describe('Private note about the member'),
      subscribed: z
        .boolean()
        .optional()
        .describe('Whether member is subscribed to newsletters'),
      labels: z
        .array(
          z.object({
            id: z.string().optional(),
            name: z.string().optional(),
            slug: z.string().optional(),
          })
        )
        .optional()
        .describe('Labels to assign (replaces existing labels)'),
      newsletters: z
        .array(z.object({ id: z.string() }))
        .optional()
        .describe('Newsletters to subscribe to (replaces existing subscriptions)'),
      comped: z
        .boolean()
        .optional()
        .describe('Whether member has complimentary premium access'),
    },
    async (input) => {
      try {
        const validatedInput = AdminUpdateMemberInputSchema.parse(input);
        const adminClient = getClient();
        const result = await executeAdminUpdateMember(
          adminClient,
          validatedInput
        );

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

  // Register admin_browse_tiers tool
  server.tool(
    ADMIN_BROWSE_TIERS_TOOL_NAME,
    ADMIN_BROWSE_TIERS_TOOL_DESCRIPTION,
    {
      include: z
        .string()
        .optional()
        .describe(
          'Related data to include: monthly_price, yearly_price, benefits (comma-separated)'
        ),
      filter: z
        .string()
        .optional()
        .describe(
          'NQL filter expression (e.g., type:paid, visibility:public, active:true)'
        ),
      limit: z
        .union([z.number().int().positive(), z.literal('all')])
        .optional()
        .describe('Number of tiers to return (default: 15, or "all")'),
      page: z
        .number()
        .int()
        .positive()
        .optional()
        .describe('Page number for pagination'),
      order: z
        .string()
        .optional()
        .describe('Sort order (e.g., name ASC)'),
    },
    async (input) => {
      try {
        const validatedInput = AdminBrowseTiersInputSchema.parse(input);
        const adminClient = getClient();
        const result = await executeAdminBrowseTiers(
          adminClient,
          validatedInput
        );

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

  // Register admin_read_tier tool
  server.tool(
    ADMIN_READ_TIER_TOOL_NAME,
    ADMIN_READ_TIER_TOOL_DESCRIPTION,
    {
      id: z.string().optional().describe('Tier ID'),
      slug: z.string().optional().describe('Tier slug'),
      include: z
        .string()
        .optional()
        .describe(
          'Related data to include: monthly_price, yearly_price, benefits (comma-separated)'
        ),
    },
    async (input) => {
      try {
        const validatedInput = AdminReadTierInputSchema.parse(input);
        const adminClient = getClient();
        const result = await executeAdminReadTier(adminClient, validatedInput);

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

  // Register admin_create_tier tool
  server.tool(
    ADMIN_CREATE_TIER_TOOL_NAME,
    ADMIN_CREATE_TIER_TOOL_DESCRIPTION,
    {
      name: z.string().describe('Tier name (required)'),
      slug: z.string().optional().describe('URL slug'),
      description: z.string().nullable().optional().describe('Tier description'),
      active: z
        .boolean()
        .optional()
        .describe('Whether the tier is active (default: true)'),
      type: z
        .enum(['free', 'paid'])
        .optional()
        .describe('Tier type (default: paid)'),
      welcome_page_url: z
        .string()
        .nullable()
        .optional()
        .describe('URL to redirect members after signup'),
      monthly_price: z
        .number()
        .int()
        .nonnegative()
        .nullable()
        .optional()
        .describe('Monthly price in smallest currency unit (e.g., cents)'),
      yearly_price: z
        .number()
        .int()
        .nonnegative()
        .nullable()
        .optional()
        .describe('Yearly price in smallest currency unit (e.g., cents)'),
      currency: z
        .string()
        .nullable()
        .optional()
        .describe('Currency code (e.g., usd, eur) - required for paid tiers'),
      benefits: z
        .array(z.string())
        .optional()
        .describe('List of benefits for this tier'),
      visibility: z
        .enum(['public', 'none'])
        .optional()
        .describe('Tier visibility (default: public)'),
      trial_days: z
        .number()
        .int()
        .nonnegative()
        .optional()
        .describe('Number of trial days for this tier'),
    },
    async (input) => {
      try {
        const validatedInput = AdminCreateTierInputSchema.parse(input);
        const adminClient = getClient();
        const result = await executeAdminCreateTier(
          adminClient,
          validatedInput
        );

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

  // Register admin_update_tier tool
  server.tool(
    ADMIN_UPDATE_TIER_TOOL_NAME,
    ADMIN_UPDATE_TIER_TOOL_DESCRIPTION,
    {
      id: z.string().describe('Tier ID (required)'),
      updated_at: z
        .string()
        .describe(
          'Current updated_at timestamp for conflict prevention (required)'
        ),
      name: z.string().optional().describe('Tier name'),
      slug: z.string().optional().describe('URL slug'),
      description: z.string().nullable().optional().describe('Tier description'),
      active: z.boolean().optional().describe('Whether the tier is active'),
      welcome_page_url: z
        .string()
        .nullable()
        .optional()
        .describe('URL to redirect members after signup'),
      monthly_price: z
        .number()
        .int()
        .nonnegative()
        .nullable()
        .optional()
        .describe('Monthly price in smallest currency unit (e.g., cents)'),
      yearly_price: z
        .number()
        .int()
        .nonnegative()
        .nullable()
        .optional()
        .describe('Yearly price in smallest currency unit (e.g., cents)'),
      benefits: z
        .array(z.string())
        .optional()
        .describe('List of benefits for this tier'),
      visibility: z
        .enum(['public', 'none'])
        .optional()
        .describe('Tier visibility'),
      trial_days: z
        .number()
        .int()
        .nonnegative()
        .optional()
        .describe('Number of trial days for this tier'),
    },
    async (input) => {
      try {
        const validatedInput = AdminUpdateTierInputSchema.parse(input);
        const adminClient = getClient();
        const result = await executeAdminUpdateTier(
          adminClient,
          validatedInput
        );

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
  if (config.adminApi) {
    registerAdminApiTools(server, config.adminApi);
  }
}

// Re-export individual tool modules
export * from './content-posts/index.js';
export * from './content-pages/index.js';
export * from './content-tags/index.js';
export * from './content-authors/index.js';
export * from './admin-posts/index.js';
export * from './admin-pages/index.js';
export * from './admin-tags/index.js';
export * from './admin-members/index.js';
export * from './admin-tiers/index.js';
