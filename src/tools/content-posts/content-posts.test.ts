/**
 * Tests for Ghost Content API Posts tools.
 */

import { GhostContentClient } from '../../client/ghost-content-client.js';
import { GhostApiError } from '../../client/errors.js';
import {
  BrowsePostsInputSchema,
  ReadPostInputSchema,
} from './schemas.js';
import { executeBrowsePosts } from './browse-posts.js';
import { executeReadPost } from './read-post.js';

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

describe('BrowsePostsInputSchema', () => {
  it('should accept empty object (all optional)', () => {
    const result = BrowsePostsInputSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should accept include parameter', () => {
    const result = BrowsePostsInputSchema.safeParse({ include: 'tags,authors' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.include).toBe('tags,authors');
    }
  });

  it('should accept fields parameter', () => {
    const result = BrowsePostsInputSchema.safeParse({ fields: 'title,slug' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fields).toBe('title,slug');
    }
  });

  it('should accept formats parameter', () => {
    const result = BrowsePostsInputSchema.safeParse({ formats: 'html,plaintext' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.formats).toBe('html,plaintext');
    }
  });

  it('should accept filter parameter', () => {
    const result = BrowsePostsInputSchema.safeParse({ filter: 'tag:getting-started' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.filter).toBe('tag:getting-started');
    }
  });

  it('should accept numeric limit', () => {
    const result = BrowsePostsInputSchema.safeParse({ limit: 10 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(10);
    }
  });

  it('should accept "all" as limit', () => {
    const result = BrowsePostsInputSchema.safeParse({ limit: 'all' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe('all');
    }
  });

  it('should accept page parameter', () => {
    const result = BrowsePostsInputSchema.safeParse({ page: 2 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
    }
  });

  it('should accept order parameter', () => {
    const result = BrowsePostsInputSchema.safeParse({ order: 'published_at DESC' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.order).toBe('published_at DESC');
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
    const result = BrowsePostsInputSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(input);
    }
  });

  it('should reject invalid limit (negative)', () => {
    const result = BrowsePostsInputSchema.safeParse({ limit: -1 });
    expect(result.success).toBe(false);
  });

  it('should reject invalid limit (zero)', () => {
    const result = BrowsePostsInputSchema.safeParse({ limit: 0 });
    expect(result.success).toBe(false);
  });

  it('should reject invalid page (negative)', () => {
    const result = BrowsePostsInputSchema.safeParse({ page: -1 });
    expect(result.success).toBe(false);
  });

  it('should reject invalid page (zero)', () => {
    const result = BrowsePostsInputSchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
  });
});

describe('ReadPostInputSchema', () => {
  it('should accept id parameter', () => {
    const result = ReadPostInputSchema.safeParse({ id: '123' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('123');
    }
  });

  it('should accept slug parameter', () => {
    const result = ReadPostInputSchema.safeParse({ slug: 'my-post' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.slug).toBe('my-post');
    }
  });

  it('should reject if neither id nor slug provided', () => {
    const result = ReadPostInputSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      // Check that the error message is present in the error
      const errorMessage = result.error.message || JSON.stringify(result.error);
      expect(errorMessage).toContain('Either id or slug must be provided');
    }
  });

  it('should reject if both id and slug provided', () => {
    const result = ReadPostInputSchema.safeParse({ id: '123', slug: 'my-post' });
    expect(result.success).toBe(false);
    if (!result.success) {
      // Check that the error message is present in the error
      const errorMessage = result.error.message || JSON.stringify(result.error);
      expect(errorMessage).toContain('Only one of id or slug should be provided');
    }
  });

  it('should accept include parameter with id', () => {
    const result = ReadPostInputSchema.safeParse({ id: '123', include: 'tags,authors' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.include).toBe('tags,authors');
    }
  });

  it('should accept fields parameter with slug', () => {
    const result = ReadPostInputSchema.safeParse({ slug: 'my-post', fields: 'title,html' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fields).toBe('title,html');
    }
  });

  it('should accept formats parameter', () => {
    const result = ReadPostInputSchema.safeParse({ id: '123', formats: 'html,plaintext' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.formats).toBe('html,plaintext');
    }
  });
});

describe('executeBrowsePosts', () => {
  it('should call client.get with correct endpoint', async () => {
    const client = new GhostContentClient({
      url: TEST_URL,
      key: TEST_CONTENT_API_KEY,
    });

    mockFetch({ status: 200, body: { posts: [], meta: {} } }, (url) => {
      const parsed = new URL(url);
      expect(parsed.pathname).toBe('/ghost/api/content/posts/');
    });

    await executeBrowsePosts(client, {});
  });

  it('should pass include parameter', async () => {
    const client = new GhostContentClient({
      url: TEST_URL,
      key: TEST_CONTENT_API_KEY,
    });

    mockFetch({ status: 200, body: { posts: [], meta: {} } }, (url) => {
      const parsed = new URL(url);
      expect(parsed.searchParams.get('include')).toBe('tags,authors');
    });

    await executeBrowsePosts(client, { include: 'tags,authors' });
  });

  it('should pass filter parameter', async () => {
    const client = new GhostContentClient({
      url: TEST_URL,
      key: TEST_CONTENT_API_KEY,
    });

    mockFetch({ status: 200, body: { posts: [], meta: {} } }, (url) => {
      const parsed = new URL(url);
      expect(parsed.searchParams.get('filter')).toBe('tag:news');
    });

    await executeBrowsePosts(client, { filter: 'tag:news' });
  });

  it('should pass limit parameter', async () => {
    const client = new GhostContentClient({
      url: TEST_URL,
      key: TEST_CONTENT_API_KEY,
    });

    mockFetch({ status: 200, body: { posts: [], meta: {} } }, (url) => {
      const parsed = new URL(url);
      expect(parsed.searchParams.get('limit')).toBe('10');
    });

    await executeBrowsePosts(client, { limit: 10 });
  });

  it('should pass "all" as limit', async () => {
    const client = new GhostContentClient({
      url: TEST_URL,
      key: TEST_CONTENT_API_KEY,
    });

    mockFetch({ status: 200, body: { posts: [], meta: {} } }, (url) => {
      const parsed = new URL(url);
      expect(parsed.searchParams.get('limit')).toBe('all');
    });

    await executeBrowsePosts(client, { limit: 'all' });
  });

  it('should pass page parameter', async () => {
    const client = new GhostContentClient({
      url: TEST_URL,
      key: TEST_CONTENT_API_KEY,
    });

    mockFetch({ status: 200, body: { posts: [], meta: {} } }, (url) => {
      const parsed = new URL(url);
      expect(parsed.searchParams.get('page')).toBe('2');
    });

    await executeBrowsePosts(client, { page: 2 });
  });

  it('should return posts response', async () => {
    const client = new GhostContentClient({
      url: TEST_URL,
      key: TEST_CONTENT_API_KEY,
    });

    const expectedResponse = {
      posts: [{ id: '1', title: 'Test Post', slug: 'test-post' }],
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

    const result = await executeBrowsePosts(client, {});
    expect(result.posts).toHaveLength(1);
    expect(result.posts[0].title).toBe('Test Post');
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

    await expect(executeBrowsePosts(client, {})).rejects.toThrow(GhostApiError);
  });
});

describe('executeReadPost', () => {
  it('should call client.get with id endpoint', async () => {
    const client = new GhostContentClient({
      url: TEST_URL,
      key: TEST_CONTENT_API_KEY,
    });

    mockFetch({ status: 200, body: { posts: [{ id: '123' }] } }, (url) => {
      const parsed = new URL(url);
      expect(parsed.pathname).toBe('/ghost/api/content/posts/123/');
    });

    await executeReadPost(client, { id: '123' });
  });

  it('should call client.get with slug endpoint', async () => {
    const client = new GhostContentClient({
      url: TEST_URL,
      key: TEST_CONTENT_API_KEY,
    });

    mockFetch({ status: 200, body: { posts: [{ slug: 'my-post' }] } }, (url) => {
      const parsed = new URL(url);
      expect(parsed.pathname).toBe('/ghost/api/content/posts/slug/my-post/');
    });

    await executeReadPost(client, { slug: 'my-post' });
  });

  it('should pass include parameter', async () => {
    const client = new GhostContentClient({
      url: TEST_URL,
      key: TEST_CONTENT_API_KEY,
    });

    mockFetch({ status: 200, body: { posts: [{ id: '123' }] } }, (url) => {
      const parsed = new URL(url);
      expect(parsed.searchParams.get('include')).toBe('tags,authors');
    });

    await executeReadPost(client, { id: '123', include: 'tags,authors' });
  });

  it('should pass fields parameter', async () => {
    const client = new GhostContentClient({
      url: TEST_URL,
      key: TEST_CONTENT_API_KEY,
    });

    mockFetch({ status: 200, body: { posts: [{ id: '123' }] } }, (url) => {
      const parsed = new URL(url);
      expect(parsed.searchParams.get('fields')).toBe('title,html');
    });

    await executeReadPost(client, { id: '123', fields: 'title,html' });
  });

  it('should pass formats parameter', async () => {
    const client = new GhostContentClient({
      url: TEST_URL,
      key: TEST_CONTENT_API_KEY,
    });

    mockFetch({ status: 200, body: { posts: [{ id: '123' }] } }, (url) => {
      const parsed = new URL(url);
      expect(parsed.searchParams.get('formats')).toBe('html,plaintext');
    });

    await executeReadPost(client, { id: '123', formats: 'html,plaintext' });
  });

  it('should return post response', async () => {
    const client = new GhostContentClient({
      url: TEST_URL,
      key: TEST_CONTENT_API_KEY,
    });

    const expectedResponse = {
      posts: [
        {
          id: '123',
          title: 'Test Post',
          slug: 'test-post',
          html: '<p>Hello</p>',
        },
      ],
    };

    mockFetch({ status: 200, body: expectedResponse });

    const result = await executeReadPost(client, { id: '123' });
    expect(result.posts).toHaveLength(1);
    expect(result.posts[0].title).toBe('Test Post');
    expect(result.posts[0].html).toBe('<p>Hello</p>');
  });

  it('should throw GhostApiError on 404', async () => {
    const client = new GhostContentClient({
      url: TEST_URL,
      key: TEST_CONTENT_API_KEY,
    });

    mockFetch({
      status: 404,
      body: { errors: [{ message: 'Post not found', type: 'NotFoundError' }] },
    });

    await expect(executeReadPost(client, { id: 'nonexistent' })).rejects.toThrow(
      GhostApiError
    );
  });
});
