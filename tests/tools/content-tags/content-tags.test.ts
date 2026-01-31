/**
 * Tests for Ghost Content API Tags tools.
 */

import { GhostContentClient } from '../../../src/client/ghost-content-client.js';
import { GhostApiError } from '../../../src/client/errors.js';
import {
  BrowseTagsInputSchema,
  ReadTagInputSchema,
} from '../../../src/tools/content-tags/schemas.js';
import { executeBrowseTags } from '../../../src/tools/content-tags/browse-tags.js';
import { executeReadTag } from '../../../src/tools/content-tags/read-tag.js';

// Test Content API key
const TEST_CONTENT_API_KEY = '22444f78447824223cefc48062';
const TEST_URL = 'https://example.ghost.io';

// Store original fetch
const originalFetch = globalThis.fetch;

// Mock fetch for testing
function mockFetch(
  response: {
    status: number;
    body?: unknown;
  },
  validator?: (url: string) => void
): void {
  globalThis.fetch = vi.fn(
    async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();

      if (validator) {
        validator(url);
      }

      return new Response(
        response.body !== undefined ? JSON.stringify(response.body) : null,
        {
          status: response.status,
          headers: { 'content-type': 'application/json' },
        }
      );
    }
  );
}

// Restore fetch after each test
afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe('BrowseTagsInputSchema', () => {
  it('should accept empty object (all optional)', () => {
    const result = BrowseTagsInputSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should accept include parameter', () => {
    const result = BrowseTagsInputSchema.safeParse({ include: 'count.posts' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.include).toBe('count.posts');
    }
  });

  it('should accept fields parameter', () => {
    const result = BrowseTagsInputSchema.safeParse({ fields: 'name,slug' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fields).toBe('name,slug');
    }
  });

  it('should accept filter parameter', () => {
    const result = BrowseTagsInputSchema.safeParse({ filter: 'visibility:public' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.filter).toBe('visibility:public');
    }
  });

  it('should accept numeric limit', () => {
    const result = BrowseTagsInputSchema.safeParse({ limit: 10 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(10);
    }
  });

  it('should accept "all" as limit', () => {
    const result = BrowseTagsInputSchema.safeParse({ limit: 'all' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe('all');
    }
  });

  it('should accept page parameter', () => {
    const result = BrowseTagsInputSchema.safeParse({ page: 2 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
    }
  });

  it('should accept order parameter', () => {
    const result = BrowseTagsInputSchema.safeParse({ order: 'name ASC' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.order).toBe('name ASC');
    }
  });

  it('should accept all parameters together', () => {
    const input = {
      include: 'count.posts',
      fields: 'name,slug',
      filter: 'visibility:public',
      limit: 5,
      page: 1,
      order: 'name ASC',
    };
    const result = BrowseTagsInputSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(input);
    }
  });

  it('should reject invalid limit (negative)', () => {
    const result = BrowseTagsInputSchema.safeParse({ limit: -1 });
    expect(result.success).toBe(false);
  });

  it('should reject invalid limit (zero)', () => {
    const result = BrowseTagsInputSchema.safeParse({ limit: 0 });
    expect(result.success).toBe(false);
  });

  it('should reject invalid page (negative)', () => {
    const result = BrowseTagsInputSchema.safeParse({ page: -1 });
    expect(result.success).toBe(false);
  });

  it('should reject invalid page (zero)', () => {
    const result = BrowseTagsInputSchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
  });
});

describe('ReadTagInputSchema', () => {
  it('should accept id parameter', () => {
    const result = ReadTagInputSchema.safeParse({ id: '123' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('123');
    }
  });

  it('should accept slug parameter', () => {
    const result = ReadTagInputSchema.safeParse({ slug: 'getting-started' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.slug).toBe('getting-started');
    }
  });

  it('should reject if neither id nor slug provided', () => {
    const result = ReadTagInputSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      // Check that the error message is present in the error
      const errorMessage = result.error.message || JSON.stringify(result.error);
      expect(errorMessage).toContain('Either id or slug must be provided');
    }
  });

  it('should reject if both id and slug provided', () => {
    const result = ReadTagInputSchema.safeParse({ id: '123', slug: 'getting-started' });
    expect(result.success).toBe(false);
    if (!result.success) {
      // Check that the error message is present in the error
      const errorMessage = result.error.message || JSON.stringify(result.error);
      expect(errorMessage).toContain('Only one of id or slug should be provided');
    }
  });

  it('should accept include parameter with id', () => {
    const result = ReadTagInputSchema.safeParse({ id: '123', include: 'count.posts' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.include).toBe('count.posts');
    }
  });

  it('should accept fields parameter with slug', () => {
    const result = ReadTagInputSchema.safeParse({ slug: 'getting-started', fields: 'name,description' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fields).toBe('name,description');
    }
  });
});

describe('executeBrowseTags', () => {
  it('should call client.get with correct endpoint', async () => {
    const client = new GhostContentClient({
      url: TEST_URL,
      key: TEST_CONTENT_API_KEY,
    });

    mockFetch({ status: 200, body: { tags: [], meta: {} } }, (url) => {
      const parsed = new URL(url);
      expect(parsed.pathname).toBe('/ghost/api/content/tags/');
    });

    await executeBrowseTags(client, {});
  });

  it('should pass include parameter', async () => {
    const client = new GhostContentClient({
      url: TEST_URL,
      key: TEST_CONTENT_API_KEY,
    });

    mockFetch({ status: 200, body: { tags: [], meta: {} } }, (url) => {
      const parsed = new URL(url);
      expect(parsed.searchParams.get('include')).toBe('count.posts');
    });

    await executeBrowseTags(client, { include: 'count.posts' });
  });

  it('should pass filter parameter', async () => {
    const client = new GhostContentClient({
      url: TEST_URL,
      key: TEST_CONTENT_API_KEY,
    });

    mockFetch({ status: 200, body: { tags: [], meta: {} } }, (url) => {
      const parsed = new URL(url);
      expect(parsed.searchParams.get('filter')).toBe('visibility:public');
    });

    await executeBrowseTags(client, { filter: 'visibility:public' });
  });

  it('should pass limit parameter', async () => {
    const client = new GhostContentClient({
      url: TEST_URL,
      key: TEST_CONTENT_API_KEY,
    });

    mockFetch({ status: 200, body: { tags: [], meta: {} } }, (url) => {
      const parsed = new URL(url);
      expect(parsed.searchParams.get('limit')).toBe('10');
    });

    await executeBrowseTags(client, { limit: 10 });
  });

  it('should pass "all" as limit', async () => {
    const client = new GhostContentClient({
      url: TEST_URL,
      key: TEST_CONTENT_API_KEY,
    });

    mockFetch({ status: 200, body: { tags: [], meta: {} } }, (url) => {
      const parsed = new URL(url);
      expect(parsed.searchParams.get('limit')).toBe('all');
    });

    await executeBrowseTags(client, { limit: 'all' });
  });

  it('should pass page parameter', async () => {
    const client = new GhostContentClient({
      url: TEST_URL,
      key: TEST_CONTENT_API_KEY,
    });

    mockFetch({ status: 200, body: { tags: [], meta: {} } }, (url) => {
      const parsed = new URL(url);
      expect(parsed.searchParams.get('page')).toBe('2');
    });

    await executeBrowseTags(client, { page: 2 });
  });

  it('should pass order parameter', async () => {
    const client = new GhostContentClient({
      url: TEST_URL,
      key: TEST_CONTENT_API_KEY,
    });

    mockFetch({ status: 200, body: { tags: [], meta: {} } }, (url) => {
      const parsed = new URL(url);
      expect(parsed.searchParams.get('order')).toBe('name ASC');
    });

    await executeBrowseTags(client, { order: 'name ASC' });
  });

  it('should return tags response', async () => {
    const client = new GhostContentClient({
      url: TEST_URL,
      key: TEST_CONTENT_API_KEY,
    });

    const expectedResponse = {
      tags: [{ id: '1', name: 'Getting Started', slug: 'getting-started' }],
      meta: {
        pagination: {
          page: 1,
          limit: 15,
          pages: 1,
          total: 1,
          next: null,
          prev: null,
        },
      },
    };

    mockFetch({ status: 200, body: expectedResponse });

    const result = await executeBrowseTags(client, {});
    expect(result.tags).toHaveLength(1);
    expect(result.tags[0].name).toBe('Getting Started');
    expect(result.meta?.pagination?.total).toBe(1);
  });

  it('should throw GhostApiError on API failure', async () => {
    const client = new GhostContentClient({
      url: TEST_URL,
      key: TEST_CONTENT_API_KEY,
    });

    mockFetch({
      status: 401,
      body: { errors: [{ message: 'Unknown Content API Key' }] },
    });

    await expect(executeBrowseTags(client, {})).rejects.toThrow(GhostApiError);
  });
});

describe('executeReadTag', () => {
  it('should call client.get with id endpoint', async () => {
    const client = new GhostContentClient({
      url: TEST_URL,
      key: TEST_CONTENT_API_KEY,
    });

    mockFetch({ status: 200, body: { tags: [{ id: '123' }] } }, (url) => {
      const parsed = new URL(url);
      expect(parsed.pathname).toBe('/ghost/api/content/tags/123/');
    });

    await executeReadTag(client, { id: '123' });
  });

  it('should call client.get with slug endpoint', async () => {
    const client = new GhostContentClient({
      url: TEST_URL,
      key: TEST_CONTENT_API_KEY,
    });

    mockFetch({ status: 200, body: { tags: [{ slug: 'getting-started' }] } }, (url) => {
      const parsed = new URL(url);
      expect(parsed.pathname).toBe('/ghost/api/content/tags/slug/getting-started/');
    });

    await executeReadTag(client, { slug: 'getting-started' });
  });

  it('should pass include parameter', async () => {
    const client = new GhostContentClient({
      url: TEST_URL,
      key: TEST_CONTENT_API_KEY,
    });

    mockFetch({ status: 200, body: { tags: [{ id: '123' }] } }, (url) => {
      const parsed = new URL(url);
      expect(parsed.searchParams.get('include')).toBe('count.posts');
    });

    await executeReadTag(client, { id: '123', include: 'count.posts' });
  });

  it('should pass fields parameter', async () => {
    const client = new GhostContentClient({
      url: TEST_URL,
      key: TEST_CONTENT_API_KEY,
    });

    mockFetch({ status: 200, body: { tags: [{ id: '123' }] } }, (url) => {
      const parsed = new URL(url);
      expect(parsed.searchParams.get('fields')).toBe('name,description');
    });

    await executeReadTag(client, { id: '123', fields: 'name,description' });
  });

  it('should return tag response', async () => {
    const client = new GhostContentClient({
      url: TEST_URL,
      key: TEST_CONTENT_API_KEY,
    });

    const expectedResponse = {
      tags: [
        {
          id: '123',
          name: 'Getting Started',
          slug: 'getting-started',
          description: 'A tag for beginners',
        },
      ],
    };

    mockFetch({ status: 200, body: expectedResponse });

    const result = await executeReadTag(client, { id: '123' });
    expect(result.tags).toHaveLength(1);
    expect(result.tags[0].name).toBe('Getting Started');
    expect(result.tags[0].description).toBe('A tag for beginners');
  });

  it('should throw GhostApiError on 404', async () => {
    const client = new GhostContentClient({
      url: TEST_URL,
      key: TEST_CONTENT_API_KEY,
    });

    mockFetch({
      status: 404,
      body: { errors: [{ message: 'Tag not found', type: 'NotFoundError' }] },
    });

    await expect(executeReadTag(client, { id: 'nonexistent' })).rejects.toThrow(
      GhostApiError
    );
  });
});
