/**
 * Tests for Ghost Content API Authors tools.
 */

import { GhostContentClient } from '../../client/ghost-content-client.js';
import { GhostApiError } from '../../client/errors.js';
import {
  BrowseAuthorsInputSchema,
  ReadAuthorInputSchema,
} from './schemas.js';
import { executeBrowseAuthors } from './browse-authors.js';
import { executeReadAuthor } from './read-author.js';

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

describe('BrowseAuthorsInputSchema', () => {
  it('should accept empty object (all optional)', () => {
    const result = BrowseAuthorsInputSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should accept include parameter', () => {
    const result = BrowseAuthorsInputSchema.safeParse({ include: 'count.posts' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.include).toBe('count.posts');
    }
  });

  it('should accept fields parameter', () => {
    const result = BrowseAuthorsInputSchema.safeParse({ fields: 'name,slug' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fields).toBe('name,slug');
    }
  });

  it('should accept filter parameter', () => {
    const result = BrowseAuthorsInputSchema.safeParse({ filter: 'slug:john-doe' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.filter).toBe('slug:john-doe');
    }
  });

  it('should accept numeric limit', () => {
    const result = BrowseAuthorsInputSchema.safeParse({ limit: 10 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(10);
    }
  });

  it('should accept "all" as limit', () => {
    const result = BrowseAuthorsInputSchema.safeParse({ limit: 'all' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe('all');
    }
  });

  it('should accept page parameter', () => {
    const result = BrowseAuthorsInputSchema.safeParse({ page: 2 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
    }
  });

  it('should accept order parameter', () => {
    const result = BrowseAuthorsInputSchema.safeParse({ order: 'name ASC' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.order).toBe('name ASC');
    }
  });

  it('should accept all parameters together', () => {
    const input = {
      include: 'count.posts',
      fields: 'name,slug',
      filter: 'slug:john-doe',
      limit: 5,
      page: 1,
      order: 'name ASC',
    };
    const result = BrowseAuthorsInputSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(input);
    }
  });

  it('should reject invalid limit (negative)', () => {
    const result = BrowseAuthorsInputSchema.safeParse({ limit: -1 });
    expect(result.success).toBe(false);
  });

  it('should reject invalid limit (zero)', () => {
    const result = BrowseAuthorsInputSchema.safeParse({ limit: 0 });
    expect(result.success).toBe(false);
  });

  it('should reject invalid page (negative)', () => {
    const result = BrowseAuthorsInputSchema.safeParse({ page: -1 });
    expect(result.success).toBe(false);
  });

  it('should reject invalid page (zero)', () => {
    const result = BrowseAuthorsInputSchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
  });
});

describe('ReadAuthorInputSchema', () => {
  it('should accept id parameter', () => {
    const result = ReadAuthorInputSchema.safeParse({ id: '123' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('123');
    }
  });

  it('should accept slug parameter', () => {
    const result = ReadAuthorInputSchema.safeParse({ slug: 'john-doe' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.slug).toBe('john-doe');
    }
  });

  it('should reject if neither id nor slug provided', () => {
    const result = ReadAuthorInputSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      // Check that the error message is present in the error
      const errorMessage = result.error.message || JSON.stringify(result.error);
      expect(errorMessage).toContain('Either id or slug must be provided');
    }
  });

  it('should reject if both id and slug provided', () => {
    const result = ReadAuthorInputSchema.safeParse({ id: '123', slug: 'john-doe' });
    expect(result.success).toBe(false);
    if (!result.success) {
      // Check that the error message is present in the error
      const errorMessage = result.error.message || JSON.stringify(result.error);
      expect(errorMessage).toContain('Only one of id or slug should be provided');
    }
  });

  it('should accept include parameter with id', () => {
    const result = ReadAuthorInputSchema.safeParse({ id: '123', include: 'count.posts' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.include).toBe('count.posts');
    }
  });

  it('should accept fields parameter with slug', () => {
    const result = ReadAuthorInputSchema.safeParse({ slug: 'john-doe', fields: 'name,bio' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fields).toBe('name,bio');
    }
  });
});

describe('executeBrowseAuthors', () => {
  it('should call client.get with correct endpoint', async () => {
    const client = new GhostContentClient({
      url: TEST_URL,
      key: TEST_CONTENT_API_KEY,
    });

    mockFetch({ status: 200, body: { authors: [], meta: {} } }, (url) => {
      const parsed = new URL(url);
      expect(parsed.pathname).toBe('/ghost/api/content/authors/');
    });

    await executeBrowseAuthors(client, {});
  });

  it('should pass include parameter', async () => {
    const client = new GhostContentClient({
      url: TEST_URL,
      key: TEST_CONTENT_API_KEY,
    });

    mockFetch({ status: 200, body: { authors: [], meta: {} } }, (url) => {
      const parsed = new URL(url);
      expect(parsed.searchParams.get('include')).toBe('count.posts');
    });

    await executeBrowseAuthors(client, { include: 'count.posts' });
  });

  it('should pass filter parameter', async () => {
    const client = new GhostContentClient({
      url: TEST_URL,
      key: TEST_CONTENT_API_KEY,
    });

    mockFetch({ status: 200, body: { authors: [], meta: {} } }, (url) => {
      const parsed = new URL(url);
      expect(parsed.searchParams.get('filter')).toBe('slug:john-doe');
    });

    await executeBrowseAuthors(client, { filter: 'slug:john-doe' });
  });

  it('should pass limit parameter', async () => {
    const client = new GhostContentClient({
      url: TEST_URL,
      key: TEST_CONTENT_API_KEY,
    });

    mockFetch({ status: 200, body: { authors: [], meta: {} } }, (url) => {
      const parsed = new URL(url);
      expect(parsed.searchParams.get('limit')).toBe('10');
    });

    await executeBrowseAuthors(client, { limit: 10 });
  });

  it('should pass "all" as limit', async () => {
    const client = new GhostContentClient({
      url: TEST_URL,
      key: TEST_CONTENT_API_KEY,
    });

    mockFetch({ status: 200, body: { authors: [], meta: {} } }, (url) => {
      const parsed = new URL(url);
      expect(parsed.searchParams.get('limit')).toBe('all');
    });

    await executeBrowseAuthors(client, { limit: 'all' });
  });

  it('should pass page parameter', async () => {
    const client = new GhostContentClient({
      url: TEST_URL,
      key: TEST_CONTENT_API_KEY,
    });

    mockFetch({ status: 200, body: { authors: [], meta: {} } }, (url) => {
      const parsed = new URL(url);
      expect(parsed.searchParams.get('page')).toBe('2');
    });

    await executeBrowseAuthors(client, { page: 2 });
  });

  it('should pass order parameter', async () => {
    const client = new GhostContentClient({
      url: TEST_URL,
      key: TEST_CONTENT_API_KEY,
    });

    mockFetch({ status: 200, body: { authors: [], meta: {} } }, (url) => {
      const parsed = new URL(url);
      expect(parsed.searchParams.get('order')).toBe('name ASC');
    });

    await executeBrowseAuthors(client, { order: 'name ASC' });
  });

  it('should return authors response', async () => {
    const client = new GhostContentClient({
      url: TEST_URL,
      key: TEST_CONTENT_API_KEY,
    });

    const expectedResponse = {
      authors: [{ id: '1', name: 'John Doe', slug: 'john-doe' }],
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

    const result = await executeBrowseAuthors(client, {});
    expect(result.authors).toHaveLength(1);
    expect(result.authors[0].name).toBe('John Doe');
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

    await expect(executeBrowseAuthors(client, {})).rejects.toThrow(GhostApiError);
  });
});

describe('executeReadAuthor', () => {
  it('should call client.get with id endpoint', async () => {
    const client = new GhostContentClient({
      url: TEST_URL,
      key: TEST_CONTENT_API_KEY,
    });

    mockFetch({ status: 200, body: { authors: [{ id: '123' }] } }, (url) => {
      const parsed = new URL(url);
      expect(parsed.pathname).toBe('/ghost/api/content/authors/123/');
    });

    await executeReadAuthor(client, { id: '123' });
  });

  it('should call client.get with slug endpoint', async () => {
    const client = new GhostContentClient({
      url: TEST_URL,
      key: TEST_CONTENT_API_KEY,
    });

    mockFetch({ status: 200, body: { authors: [{ slug: 'john-doe' }] } }, (url) => {
      const parsed = new URL(url);
      expect(parsed.pathname).toBe('/ghost/api/content/authors/slug/john-doe/');
    });

    await executeReadAuthor(client, { slug: 'john-doe' });
  });

  it('should pass include parameter', async () => {
    const client = new GhostContentClient({
      url: TEST_URL,
      key: TEST_CONTENT_API_KEY,
    });

    mockFetch({ status: 200, body: { authors: [{ id: '123' }] } }, (url) => {
      const parsed = new URL(url);
      expect(parsed.searchParams.get('include')).toBe('count.posts');
    });

    await executeReadAuthor(client, { id: '123', include: 'count.posts' });
  });

  it('should pass fields parameter', async () => {
    const client = new GhostContentClient({
      url: TEST_URL,
      key: TEST_CONTENT_API_KEY,
    });

    mockFetch({ status: 200, body: { authors: [{ id: '123' }] } }, (url) => {
      const parsed = new URL(url);
      expect(parsed.searchParams.get('fields')).toBe('name,bio');
    });

    await executeReadAuthor(client, { id: '123', fields: 'name,bio' });
  });

  it('should return author response', async () => {
    const client = new GhostContentClient({
      url: TEST_URL,
      key: TEST_CONTENT_API_KEY,
    });

    const expectedResponse = {
      authors: [
        {
          id: '123',
          name: 'John Doe',
          slug: 'john-doe',
          bio: 'A writer of things',
        },
      ],
    };

    mockFetch({ status: 200, body: expectedResponse });

    const result = await executeReadAuthor(client, { id: '123' });
    expect(result.authors).toHaveLength(1);
    expect(result.authors[0].name).toBe('John Doe');
    expect(result.authors[0].bio).toBe('A writer of things');
  });

  it('should throw GhostApiError on 404', async () => {
    const client = new GhostContentClient({
      url: TEST_URL,
      key: TEST_CONTENT_API_KEY,
    });

    mockFetch({
      status: 404,
      body: { errors: [{ message: 'Author not found', type: 'NotFoundError' }] },
    });

    await expect(executeReadAuthor(client, { id: 'nonexistent' })).rejects.toThrow(
      GhostApiError
    );
  });
});
