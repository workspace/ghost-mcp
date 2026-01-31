/**
 * Tests for Ghost Content API HTTP client wrapper.
 */

import { GhostContentClient } from './ghost-content-client.js';
import { GhostApiError } from './errors.js';

// Test Content API key (simple string, unlike Admin API's id:secret format)
const TEST_CONTENT_API_KEY = '22444f78447824223cefc48062';
const TEST_URL = 'https://example.ghost.io';

// Store original fetch
const originalFetch = globalThis.fetch;

// Mock fetch for testing
function mockFetch(
  response: {
    status: number;
    body?: unknown;
    headers?: Record<string, string>;
  },
  validator?: (url: string, init?: RequestInit) => void
): void {
  globalThis.fetch = vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();

      if (validator) {
        validator(url, init);
      }

      const responseHeaders = new Headers(response.headers);
      if (!responseHeaders.has('content-type') && response.body !== undefined) {
        responseHeaders.set('content-type', 'application/json');
      }

      return new Response(
        response.body !== undefined ? JSON.stringify(response.body) : null,
        {
          status: response.status,
          statusText: getStatusText(response.status),
          headers: responseHeaders,
        }
      );
    }
  );
}

function getStatusText(status: number): string {
  const statusTexts: Record<number, string> = {
    200: 'OK',
    201: 'Created',
    204: 'No Content',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
  };
  return statusTexts[status] ?? '';
}

// Restore fetch after each test
afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe('GhostContentClient', () => {
  describe('constructor', () => {
    it('should create client with valid config', () => {
      const client = new GhostContentClient({
        url: TEST_URL,
        key: TEST_CONTENT_API_KEY,
      });

      expect(client).toBeInstanceOf(GhostContentClient);
    });

    it('should throw if url is missing', () => {
      expect(
        () => new GhostContentClient({ url: '', key: TEST_CONTENT_API_KEY })
      ).toThrow('Ghost site URL is required');
    });

    it('should throw if key is missing', () => {
      expect(() => new GhostContentClient({ url: TEST_URL, key: '' })).toThrow(
        'Ghost Content API key is required'
      );
    });

    it('should use default API version', () => {
      const client = new GhostContentClient({
        url: TEST_URL,
        key: TEST_CONTENT_API_KEY,
      });

      expect(client.getVersion()).toBe('v5.0');
    });

    it('should accept custom API version', () => {
      const client = new GhostContentClient({
        url: TEST_URL,
        key: TEST_CONTENT_API_KEY,
        version: 'v4.0',
      });

      expect(client.getVersion()).toBe('v4.0');
    });
  });

  describe('URL normalization', () => {
    it('should normalize URL with trailing slash', () => {
      const client = new GhostContentClient({
        url: 'https://example.ghost.io/',
        key: TEST_CONTENT_API_KEY,
      });

      expect(client.getBaseUrl()).toBe(
        'https://example.ghost.io/ghost/api/content'
      );
    });

    it('should normalize URL without trailing slash', () => {
      const client = new GhostContentClient({
        url: 'https://example.ghost.io',
        key: TEST_CONTENT_API_KEY,
      });

      expect(client.getBaseUrl()).toBe(
        'https://example.ghost.io/ghost/api/content'
      );
    });

    it('should handle URL with /ghost already', () => {
      const client = new GhostContentClient({
        url: 'https://example.ghost.io/ghost',
        key: TEST_CONTENT_API_KEY,
      });

      expect(client.getBaseUrl()).toBe(
        'https://example.ghost.io/ghost/api/content'
      );
    });

    it('should handle URL with /ghost/api already', () => {
      const client = new GhostContentClient({
        url: 'https://example.ghost.io/ghost/api',
        key: TEST_CONTENT_API_KEY,
      });

      expect(client.getBaseUrl()).toBe(
        'https://example.ghost.io/ghost/api/content'
      );
    });

    it('should handle URL with /ghost/api/content already', () => {
      const client = new GhostContentClient({
        url: 'https://example.ghost.io/ghost/api/content',
        key: TEST_CONTENT_API_KEY,
      });

      expect(client.getBaseUrl()).toBe(
        'https://example.ghost.io/ghost/api/content'
      );
    });

    it('should handle URL with /ghost/api/admin (replace with content)', () => {
      const client = new GhostContentClient({
        url: 'https://example.ghost.io/ghost/api/admin',
        key: TEST_CONTENT_API_KEY,
      });

      expect(client.getBaseUrl()).toBe(
        'https://example.ghost.io/ghost/api/content'
      );
    });

    it('should handle URL with multiple trailing slashes', () => {
      const client = new GhostContentClient({
        url: 'https://example.ghost.io///',
        key: TEST_CONTENT_API_KEY,
      });

      expect(client.getBaseUrl()).toBe(
        'https://example.ghost.io/ghost/api/content'
      );
    });
  });

  describe('request headers', () => {
    it('should NOT include Authorization header (Content API uses query param)', async () => {
      const client = new GhostContentClient({
        url: TEST_URL,
        key: TEST_CONTENT_API_KEY,
      });

      mockFetch({ status: 200, body: { posts: [] } }, (_url, init) => {
        const headers = init?.headers as Headers;
        // Content API should not have Authorization header
        expect(headers.get('Authorization')).toBeNull();
      });

      await client.get('/posts/');
    });

    it('should include Accept-Version header', async () => {
      const client = new GhostContentClient({
        url: TEST_URL,
        key: TEST_CONTENT_API_KEY,
        version: 'v5.0',
      });

      mockFetch({ status: 200, body: { posts: [] } }, (_url, init) => {
        const headers = init?.headers as Headers;
        expect(headers.get('Accept-Version')).toBe('v5.0');
      });

      await client.get('/posts/');
    });

    it('should NOT include Content-Type header (read-only API)', async () => {
      const client = new GhostContentClient({
        url: TEST_URL,
        key: TEST_CONTENT_API_KEY,
      });

      mockFetch({ status: 200, body: { posts: [] } }, (_url, init) => {
        const headers = init?.headers as Headers;
        expect(headers.get('Content-Type')).toBeNull();
      });

      await client.get('/posts/');
    });
  });

  describe('API key as query parameter', () => {
    it('should include API key as query parameter', async () => {
      const client = new GhostContentClient({
        url: TEST_URL,
        key: TEST_CONTENT_API_KEY,
      });

      mockFetch({ status: 200, body: { posts: [] } }, (url) => {
        const parsed = new URL(url);
        expect(parsed.searchParams.get('key')).toBe(TEST_CONTENT_API_KEY);
      });

      await client.get('/posts/');
    });

    it('should include API key even with other query params', async () => {
      const client = new GhostContentClient({
        url: TEST_URL,
        key: TEST_CONTENT_API_KEY,
      });

      mockFetch({ status: 200, body: { posts: [] } }, (url) => {
        const parsed = new URL(url);
        expect(parsed.searchParams.get('key')).toBe(TEST_CONTENT_API_KEY);
        expect(parsed.searchParams.get('limit')).toBe('10');
      });

      await client.get('/posts/', { params: { limit: 10 } });
    });
  });

  describe('GET requests', () => {
    it('should make GET request to correct URL', async () => {
      const client = new GhostContentClient({
        url: TEST_URL,
        key: TEST_CONTENT_API_KEY,
      });

      mockFetch({ status: 200, body: { posts: [] } }, (url) => {
        const parsed = new URL(url);
        expect(parsed.pathname).toBe('/ghost/api/content/posts/');
      });

      await client.get('/posts/');
    });

    it('should handle query parameters', async () => {
      const client = new GhostContentClient({
        url: TEST_URL,
        key: TEST_CONTENT_API_KEY,
      });

      mockFetch({ status: 200, body: { posts: [] } }, (url) => {
        const parsed = new URL(url);
        expect(parsed.searchParams.get('limit')).toBe('10');
        expect(parsed.searchParams.get('include')).toBe('tags,authors');
      });

      await client.get('/posts/', {
        params: { limit: 10, include: 'tags,authors' },
      });
    });

    it('should skip undefined query parameters', async () => {
      const client = new GhostContentClient({
        url: TEST_URL,
        key: TEST_CONTENT_API_KEY,
      });

      mockFetch({ status: 200, body: { posts: [] } }, (url) => {
        const parsed = new URL(url);
        expect(parsed.searchParams.get('limit')).toBe('10');
        expect(parsed.searchParams.has('filter')).toBe(false);
      });

      await client.get('/posts/', {
        params: { limit: 10, filter: undefined },
      });
    });

    it('should parse JSON response', async () => {
      const client = new GhostContentClient({
        url: TEST_URL,
        key: TEST_CONTENT_API_KEY,
      });

      const expectedPosts = [{ id: '1', title: 'Test Post' }];
      mockFetch({ status: 200, body: { posts: expectedPosts } });

      const response =
        await client.get<{ posts: typeof expectedPosts }>('/posts/');
      expect(response.posts).toEqual(expectedPosts);
    });

    it('should properly encode special characters in query params', async () => {
      const client = new GhostContentClient({
        url: TEST_URL,
        key: TEST_CONTENT_API_KEY,
      });

      mockFetch({ status: 200, body: { posts: [] } }, (url) => {
        const parsed = new URL(url);
        // Ghost filter syntax with special characters
        expect(parsed.searchParams.get('filter')).toBe(
          'status:published+tag:news'
        );
      });

      await client.get('/posts/', {
        params: { filter: 'status:published+tag:news' },
      });
    });

    it('should handle boolean query parameters', async () => {
      const client = new GhostContentClient({
        url: TEST_URL,
        key: TEST_CONTENT_API_KEY,
      });

      mockFetch({ status: 200, body: { posts: [] } }, (url) => {
        const parsed = new URL(url);
        expect(parsed.searchParams.get('include_tags')).toBe('true');
        expect(parsed.searchParams.get('include_authors')).toBe('false');
      });

      await client.get('/posts/', {
        params: { include_tags: true, include_authors: false },
      });
    });
  });

  describe('error handling', () => {
    it('should throw GhostApiError for 401 responses (invalid key)', async () => {
      const client = new GhostContentClient({
        url: TEST_URL,
        key: 'invalid-key',
      });

      mockFetch({
        status: 401,
        body: {
          errors: [
            { message: 'Unknown Content API Key', type: 'UnauthorizedError' },
          ],
        },
      });

      await expect(client.get('/posts/')).rejects.toThrow(GhostApiError);

      try {
        await client.get('/posts/');
      } catch (error) {
        expect(error).toBeInstanceOf(GhostApiError);
        expect((error as GhostApiError).statusCode).toBe(401);
        expect((error as GhostApiError).isAuthenticationError()).toBe(true);
      }
    });

    it('should throw GhostApiError for 404 responses', async () => {
      const client = new GhostContentClient({
        url: TEST_URL,
        key: TEST_CONTENT_API_KEY,
      });

      mockFetch({
        status: 404,
        body: {
          errors: [{ message: 'Post not found', type: 'NotFoundError' }],
        },
      });

      try {
        await client.get('/posts/nonexistent/');
      } catch (error) {
        expect(error).toBeInstanceOf(GhostApiError);
        expect((error as GhostApiError).statusCode).toBe(404);
        expect((error as GhostApiError).isNotFoundError()).toBe(true);
      }
    });

    it('should throw GhostApiError for 500 responses', async () => {
      const client = new GhostContentClient({
        url: TEST_URL,
        key: TEST_CONTENT_API_KEY,
      });

      mockFetch({
        status: 500,
        body: {
          errors: [{ message: 'Internal server error' }],
        },
      });

      try {
        await client.get('/posts/');
      } catch (error) {
        expect(error).toBeInstanceOf(GhostApiError);
        expect((error as GhostApiError).statusCode).toBe(500);
        expect((error as GhostApiError).isServerError()).toBe(true);
      }
    });

    it('should handle non-JSON error responses', async () => {
      const client = new GhostContentClient({
        url: TEST_URL,
        key: TEST_CONTENT_API_KEY,
      });

      globalThis.fetch = vi.fn(async () => {
        return new Response('Internal Server Error', {
          status: 500,
          statusText: 'Internal Server Error',
        });
      });

      try {
        await client.get('/posts/');
      } catch (error) {
        expect(error).toBeInstanceOf(GhostApiError);
        expect((error as GhostApiError).statusCode).toBe(500);
        expect((error as GhostApiError).message).toBe('Internal Server Error');
      }
    });

    it('should include all error details from response', async () => {
      const client = new GhostContentClient({
        url: TEST_URL,
        key: TEST_CONTENT_API_KEY,
      });

      const errorDetails = [
        {
          message: 'Resource not found',
          context: 'Post with id xyz not found',
          type: 'NotFoundError',
        },
      ];

      mockFetch({
        status: 404,
        body: { errors: errorDetails },
      });

      try {
        await client.get('/posts/xyz/');
      } catch (error) {
        expect(error).toBeInstanceOf(GhostApiError);
        expect((error as GhostApiError).errors).toEqual(errorDetails);
        expect((error as GhostApiError).type).toBe('NotFoundError');
      }
    });
  });

  describe('timeout handling', () => {
    it('should timeout after specified duration', async () => {
      const client = new GhostContentClient({
        url: TEST_URL,
        key: TEST_CONTENT_API_KEY,
      });

      globalThis.fetch = vi.fn(async (_, init) => {
        // Simulate a request that takes longer than timeout
        return new Promise((_, reject) => {
          const signal = (init as RequestInit)?.signal;
          signal?.addEventListener('abort', () => {
            const error = new Error('The operation was aborted');
            error.name = 'AbortError';
            reject(error);
          });
        });
      });

      try {
        await client.get('/posts/', { timeout: 10 });
      } catch (error) {
        expect(error).toBeInstanceOf(GhostApiError);
        expect((error as GhostApiError).isTimeoutError()).toBe(true);
        expect((error as GhostApiError).message).toContain('10ms');
      }
    });
  });

  describe('network error handling', () => {
    it('should wrap network errors in GhostApiError', async () => {
      const client = new GhostContentClient({
        url: TEST_URL,
        key: TEST_CONTENT_API_KEY,
      });

      globalThis.fetch = vi.fn(async () => {
        throw new Error('Network request failed');
      });

      try {
        await client.get('/posts/');
      } catch (error) {
        expect(error).toBeInstanceOf(GhostApiError);
        expect((error as GhostApiError).isNetworkError()).toBe(true);
        expect((error as GhostApiError).message).toContain('Network error');
      }
    });
  });

  describe('endpoint normalization', () => {
    it('should handle endpoint without leading slash', async () => {
      const client = new GhostContentClient({
        url: TEST_URL,
        key: TEST_CONTENT_API_KEY,
      });

      mockFetch({ status: 200, body: { posts: [] } }, (url) => {
        const parsed = new URL(url);
        expect(parsed.pathname).toBe('/ghost/api/content/posts/');
      });

      await client.get('posts/');
    });

    it('should handle endpoint with leading slash', async () => {
      const client = new GhostContentClient({
        url: TEST_URL,
        key: TEST_CONTENT_API_KEY,
      });

      mockFetch({ status: 200, body: { posts: [] } }, (url) => {
        const parsed = new URL(url);
        expect(parsed.pathname).toBe('/ghost/api/content/posts/');
      });

      await client.get('/posts/');
    });

    it('should handle slug endpoint', async () => {
      const client = new GhostContentClient({
        url: TEST_URL,
        key: TEST_CONTENT_API_KEY,
      });

      mockFetch({ status: 200, body: { posts: [{ id: '1', slug: 'my-post' }] } }, (url) => {
        const parsed = new URL(url);
        expect(parsed.pathname).toBe('/ghost/api/content/posts/slug/my-post/');
      });

      await client.get('/posts/slug/my-post/');
    });
  });
});
