/**
 * Tests for Ghost Content API Pages tools.
 */

import { GhostContentClient } from '../../client/ghost-content-client.js';
import { GhostApiError } from '../../client/errors.js';
import {
  BrowsePagesInputSchema,
  ReadPageInputSchema,
} from './schemas.js';
import { executeBrowsePages } from './browse-pages.js';
import { executeReadPage } from './read-page.js';

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

describe('BrowsePagesInputSchema', () => {
  it('should accept empty object (all optional)', () => {
    const result = BrowsePagesInputSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should accept include parameter', () => {
    const result = BrowsePagesInputSchema.safeParse({ include: 'tags,authors' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.include).toBe('tags,authors');
    }
  });

  it('should accept fields parameter', () => {
    const result = BrowsePagesInputSchema.safeParse({ fields: 'title,slug' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fields).toBe('title,slug');
    }
  });

  it('should accept formats parameter', () => {
    const result = BrowsePagesInputSchema.safeParse({ formats: 'html,plaintext' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.formats).toBe('html,plaintext');
    }
  });

  it('should accept filter parameter', () => {
    const result = BrowsePagesInputSchema.safeParse({ filter: 'tag:getting-started' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.filter).toBe('tag:getting-started');
    }
  });

  it('should accept numeric limit', () => {
    const result = BrowsePagesInputSchema.safeParse({ limit: 10 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(10);
    }
  });

  it('should accept "all" as limit', () => {
    const result = BrowsePagesInputSchema.safeParse({ limit: 'all' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe('all');
    }
  });

  it('should accept page parameter', () => {
    const result = BrowsePagesInputSchema.safeParse({ page: 2 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
    }
  });

  it('should accept order parameter', () => {
    const result = BrowsePagesInputSchema.safeParse({ order: 'title ASC' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.order).toBe('title ASC');
    }
  });

  it('should accept all parameters together', () => {
    const input = {
      include: 'tags,authors',
      fields: 'title,slug',
      formats: 'html',
      filter: 'featured:true',
      limit: 5,
      page: 1,
      order: 'title ASC',
    };
    const result = BrowsePagesInputSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(input);
    }
  });

  it('should reject invalid limit (negative)', () => {
    const result = BrowsePagesInputSchema.safeParse({ limit: -1 });
    expect(result.success).toBe(false);
  });

  it('should reject invalid limit (zero)', () => {
    const result = BrowsePagesInputSchema.safeParse({ limit: 0 });
    expect(result.success).toBe(false);
  });

  it('should reject invalid page (negative)', () => {
    const result = BrowsePagesInputSchema.safeParse({ page: -1 });
    expect(result.success).toBe(false);
  });

  it('should reject invalid page (zero)', () => {
    const result = BrowsePagesInputSchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
  });
});

describe('ReadPageInputSchema', () => {
  it('should accept id parameter', () => {
    const result = ReadPageInputSchema.safeParse({ id: '123' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('123');
    }
  });

  it('should accept slug parameter', () => {
    const result = ReadPageInputSchema.safeParse({ slug: 'about' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.slug).toBe('about');
    }
  });

  it('should reject if neither id nor slug provided', () => {
    const result = ReadPageInputSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      // Check that the error message is present in the error
      const errorMessage = result.error.message || JSON.stringify(result.error);
      expect(errorMessage).toContain('Either id or slug must be provided');
    }
  });

  it('should reject if both id and slug provided', () => {
    const result = ReadPageInputSchema.safeParse({ id: '123', slug: 'about' });
    expect(result.success).toBe(false);
    if (!result.success) {
      // Check that the error message is present in the error
      const errorMessage = result.error.message || JSON.stringify(result.error);
      expect(errorMessage).toContain('Only one of id or slug should be provided');
    }
  });

  it('should accept include parameter with id', () => {
    const result = ReadPageInputSchema.safeParse({ id: '123', include: 'tags,authors' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.include).toBe('tags,authors');
    }
  });

  it('should accept fields parameter with slug', () => {
    const result = ReadPageInputSchema.safeParse({ slug: 'about', fields: 'title,html' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fields).toBe('title,html');
    }
  });

  it('should accept formats parameter', () => {
    const result = ReadPageInputSchema.safeParse({ id: '123', formats: 'html,plaintext' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.formats).toBe('html,plaintext');
    }
  });
});

describe('executeBrowsePages', () => {
  it('should call client.get with correct endpoint', async () => {
    const client = new GhostContentClient({
      url: TEST_URL,
      key: TEST_CONTENT_API_KEY,
    });

    mockFetch({ status: 200, body: { pages: [], meta: {} } }, (url) => {
      const parsed = new URL(url);
      expect(parsed.pathname).toBe('/ghost/api/content/pages/');
    });

    await executeBrowsePages(client, {});
  });

  it('should pass include parameter', async () => {
    const client = new GhostContentClient({
      url: TEST_URL,
      key: TEST_CONTENT_API_KEY,
    });

    mockFetch({ status: 200, body: { pages: [], meta: {} } }, (url) => {
      const parsed = new URL(url);
      expect(parsed.searchParams.get('include')).toBe('tags,authors');
    });

    await executeBrowsePages(client, { include: 'tags,authors' });
  });

  it('should pass filter parameter', async () => {
    const client = new GhostContentClient({
      url: TEST_URL,
      key: TEST_CONTENT_API_KEY,
    });

    mockFetch({ status: 200, body: { pages: [], meta: {} } }, (url) => {
      const parsed = new URL(url);
      expect(parsed.searchParams.get('filter')).toBe('tag:news');
    });

    await executeBrowsePages(client, { filter: 'tag:news' });
  });

  it('should pass limit parameter', async () => {
    const client = new GhostContentClient({
      url: TEST_URL,
      key: TEST_CONTENT_API_KEY,
    });

    mockFetch({ status: 200, body: { pages: [], meta: {} } }, (url) => {
      const parsed = new URL(url);
      expect(parsed.searchParams.get('limit')).toBe('10');
    });

    await executeBrowsePages(client, { limit: 10 });
  });

  it('should pass "all" as limit', async () => {
    const client = new GhostContentClient({
      url: TEST_URL,
      key: TEST_CONTENT_API_KEY,
    });

    mockFetch({ status: 200, body: { pages: [], meta: {} } }, (url) => {
      const parsed = new URL(url);
      expect(parsed.searchParams.get('limit')).toBe('all');
    });

    await executeBrowsePages(client, { limit: 'all' });
  });

  it('should pass page parameter', async () => {
    const client = new GhostContentClient({
      url: TEST_URL,
      key: TEST_CONTENT_API_KEY,
    });

    mockFetch({ status: 200, body: { pages: [], meta: {} } }, (url) => {
      const parsed = new URL(url);
      expect(parsed.searchParams.get('page')).toBe('2');
    });

    await executeBrowsePages(client, { page: 2 });
  });

  it('should pass order parameter', async () => {
    const client = new GhostContentClient({
      url: TEST_URL,
      key: TEST_CONTENT_API_KEY,
    });

    mockFetch({ status: 200, body: { pages: [], meta: {} } }, (url) => {
      const parsed = new URL(url);
      expect(parsed.searchParams.get('order')).toBe('title ASC');
    });

    await executeBrowsePages(client, { order: 'title ASC' });
  });

  it('should return pages response', async () => {
    const client = new GhostContentClient({
      url: TEST_URL,
      key: TEST_CONTENT_API_KEY,
    });

    const expectedResponse = {
      pages: [{ id: '1', title: 'About Us', slug: 'about' }],
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

    const result = await executeBrowsePages(client, {});
    expect(result.pages).toHaveLength(1);
    expect(result.pages[0].title).toBe('About Us');
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

    await expect(executeBrowsePages(client, {})).rejects.toThrow(GhostApiError);
  });
});

describe('executeReadPage', () => {
  it('should call client.get with id endpoint', async () => {
    const client = new GhostContentClient({
      url: TEST_URL,
      key: TEST_CONTENT_API_KEY,
    });

    mockFetch({ status: 200, body: { pages: [{ id: '123' }] } }, (url) => {
      const parsed = new URL(url);
      expect(parsed.pathname).toBe('/ghost/api/content/pages/123/');
    });

    await executeReadPage(client, { id: '123' });
  });

  it('should call client.get with slug endpoint', async () => {
    const client = new GhostContentClient({
      url: TEST_URL,
      key: TEST_CONTENT_API_KEY,
    });

    mockFetch({ status: 200, body: { pages: [{ slug: 'about' }] } }, (url) => {
      const parsed = new URL(url);
      expect(parsed.pathname).toBe('/ghost/api/content/pages/slug/about/');
    });

    await executeReadPage(client, { slug: 'about' });
  });

  it('should pass include parameter', async () => {
    const client = new GhostContentClient({
      url: TEST_URL,
      key: TEST_CONTENT_API_KEY,
    });

    mockFetch({ status: 200, body: { pages: [{ id: '123' }] } }, (url) => {
      const parsed = new URL(url);
      expect(parsed.searchParams.get('include')).toBe('tags,authors');
    });

    await executeReadPage(client, { id: '123', include: 'tags,authors' });
  });

  it('should pass fields parameter', async () => {
    const client = new GhostContentClient({
      url: TEST_URL,
      key: TEST_CONTENT_API_KEY,
    });

    mockFetch({ status: 200, body: { pages: [{ id: '123' }] } }, (url) => {
      const parsed = new URL(url);
      expect(parsed.searchParams.get('fields')).toBe('title,html');
    });

    await executeReadPage(client, { id: '123', fields: 'title,html' });
  });

  it('should pass formats parameter', async () => {
    const client = new GhostContentClient({
      url: TEST_URL,
      key: TEST_CONTENT_API_KEY,
    });

    mockFetch({ status: 200, body: { pages: [{ id: '123' }] } }, (url) => {
      const parsed = new URL(url);
      expect(parsed.searchParams.get('formats')).toBe('html,plaintext');
    });

    await executeReadPage(client, { id: '123', formats: 'html,plaintext' });
  });

  it('should return page response', async () => {
    const client = new GhostContentClient({
      url: TEST_URL,
      key: TEST_CONTENT_API_KEY,
    });

    const expectedResponse = {
      pages: [
        {
          id: '123',
          title: 'About Us',
          slug: 'about',
          html: '<p>Welcome to our company</p>',
        },
      ],
    };

    mockFetch({ status: 200, body: expectedResponse });

    const result = await executeReadPage(client, { id: '123' });
    expect(result.pages).toHaveLength(1);
    expect(result.pages[0].title).toBe('About Us');
    expect(result.pages[0].html).toBe('<p>Welcome to our company</p>');
  });

  it('should throw GhostApiError on 404', async () => {
    const client = new GhostContentClient({
      url: TEST_URL,
      key: TEST_CONTENT_API_KEY,
    });

    mockFetch({
      status: 404,
      body: { errors: [{ message: 'Page not found', type: 'NotFoundError' }] },
    });

    await expect(executeReadPage(client, { id: 'nonexistent' })).rejects.toThrow(
      GhostApiError
    );
  });
});
