/**
 * Tests for Ghost API HTTP client wrapper.
 */

import { GhostClient } from './ghost-client.js';
import { GhostApiError } from './errors.js';

// Test API key (matches format from jwt.test.ts)
const TEST_API_KEY_ID = '6489d0c3c3c3c3c3c3c3c3c3';
const TEST_API_KEY_SECRET =
  'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2';
const TEST_API_KEY = `${TEST_API_KEY_ID}:${TEST_API_KEY_SECRET}`;
const TEST_URL = 'https://example.ghost.io';

// Store original fetch
const originalFetch = globalThis.fetch;

// Mock fetch for testing
function mockFetch(
  response: { status: number; body?: unknown; headers?: Record<string, string> },
  validator?: (url: string, init?: RequestInit) => void
): void {
  globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
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
  });
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

describe('GhostClient', () => {
  describe('constructor', () => {
    it('should create client with valid config', () => {
      const client = new GhostClient({
        url: TEST_URL,
        apiKey: TEST_API_KEY,
      });

      expect(client).toBeInstanceOf(GhostClient);
    });

    it('should throw if url is missing', () => {
      expect(() => new GhostClient({ url: '', apiKey: TEST_API_KEY })).toThrow(
        'Ghost API URL is required'
      );
    });

    it('should throw if apiKey is missing', () => {
      expect(() => new GhostClient({ url: TEST_URL, apiKey: '' })).toThrow(
        'Ghost API key is required'
      );
    });

    it('should use default API version', () => {
      const client = new GhostClient({
        url: TEST_URL,
        apiKey: TEST_API_KEY,
      });

      expect(client.getVersion()).toBe('v5.0');
    });

    it('should accept custom API version', () => {
      const client = new GhostClient({
        url: TEST_URL,
        apiKey: TEST_API_KEY,
        version: 'v4.0',
      });

      expect(client.getVersion()).toBe('v4.0');
    });
  });

  describe('URL normalization', () => {
    it('should normalize URL with trailing slash', () => {
      const client = new GhostClient({
        url: 'https://example.ghost.io/',
        apiKey: TEST_API_KEY,
      });

      expect(client.getBaseUrl()).toBe('https://example.ghost.io/ghost/api/admin');
    });

    it('should normalize URL without trailing slash', () => {
      const client = new GhostClient({
        url: 'https://example.ghost.io',
        apiKey: TEST_API_KEY,
      });

      expect(client.getBaseUrl()).toBe('https://example.ghost.io/ghost/api/admin');
    });

    it('should handle URL with /ghost already', () => {
      const client = new GhostClient({
        url: 'https://example.ghost.io/ghost',
        apiKey: TEST_API_KEY,
      });

      expect(client.getBaseUrl()).toBe('https://example.ghost.io/ghost/api/admin');
    });

    it('should handle URL with /ghost/api already', () => {
      const client = new GhostClient({
        url: 'https://example.ghost.io/ghost/api',
        apiKey: TEST_API_KEY,
      });

      expect(client.getBaseUrl()).toBe('https://example.ghost.io/ghost/api/admin');
    });

    it('should handle URL with full path already', () => {
      const client = new GhostClient({
        url: 'https://example.ghost.io/ghost/api/admin',
        apiKey: TEST_API_KEY,
      });

      expect(client.getBaseUrl()).toBe('https://example.ghost.io/ghost/api/admin');
    });

    it('should handle URL with multiple trailing slashes', () => {
      const client = new GhostClient({
        url: 'https://example.ghost.io///',
        apiKey: TEST_API_KEY,
      });

      expect(client.getBaseUrl()).toBe('https://example.ghost.io/ghost/api/admin');
    });
  });

  describe('request headers', () => {
    it('should include Authorization header with Ghost prefix', async () => {
      const client = new GhostClient({
        url: TEST_URL,
        apiKey: TEST_API_KEY,
      });

      mockFetch({ status: 200, body: { posts: [] } }, (_url, init) => {
        const headers = init?.headers as Headers;
        const auth = headers.get('Authorization');
        expect(auth).toMatch(/^Ghost /);
      });

      await client.get('/posts/');
    });

    it('should include Accept-Version header', async () => {
      const client = new GhostClient({
        url: TEST_URL,
        apiKey: TEST_API_KEY,
        version: 'v5.0',
      });

      mockFetch({ status: 200, body: { posts: [] } }, (_url, init) => {
        const headers = init?.headers as Headers;
        expect(headers.get('Accept-Version')).toBe('v5.0');
      });

      await client.get('/posts/');
    });

    it('should include Content-Type for POST requests', async () => {
      const client = new GhostClient({
        url: TEST_URL,
        apiKey: TEST_API_KEY,
      });

      mockFetch({ status: 201, body: { posts: [{ id: '1' }] } }, (_url, init) => {
        const headers = init?.headers as Headers;
        expect(headers.get('Content-Type')).toBe('application/json');
      });

      await client.post('/posts/', { body: { posts: [{ title: 'Test' }] } });
    });

    it('should not include Content-Type for GET requests', async () => {
      const client = new GhostClient({
        url: TEST_URL,
        apiKey: TEST_API_KEY,
      });

      mockFetch({ status: 200, body: { posts: [] } }, (_url, init) => {
        const headers = init?.headers as Headers;
        expect(headers.get('Content-Type')).toBeNull();
      });

      await client.get('/posts/');
    });
  });

  describe('GET requests', () => {
    it('should make GET request to correct URL', async () => {
      const client = new GhostClient({
        url: TEST_URL,
        apiKey: TEST_API_KEY,
      });

      mockFetch({ status: 200, body: { posts: [] } }, (url) => {
        expect(url).toBe('https://example.ghost.io/ghost/api/admin/posts/');
      });

      await client.get('/posts/');
    });

    it('should handle query parameters', async () => {
      const client = new GhostClient({
        url: TEST_URL,
        apiKey: TEST_API_KEY,
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
      const client = new GhostClient({
        url: TEST_URL,
        apiKey: TEST_API_KEY,
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
      const client = new GhostClient({
        url: TEST_URL,
        apiKey: TEST_API_KEY,
      });

      const expectedPosts = [{ id: '1', title: 'Test Post' }];
      mockFetch({ status: 200, body: { posts: expectedPosts } });

      const response = await client.get<{ posts: typeof expectedPosts }>('/posts/');
      expect(response.posts).toEqual(expectedPosts);
    });
  });

  describe('POST requests', () => {
    it('should make POST request with body', async () => {
      const client = new GhostClient({
        url: TEST_URL,
        apiKey: TEST_API_KEY,
      });

      const postData = { posts: [{ title: 'New Post', status: 'draft' }] };

      mockFetch({ status: 201, body: { posts: [{ id: '1', ...postData.posts[0] }] } }, (_url, init) => {
        expect(init?.method).toBe('POST');
        expect(JSON.parse(init?.body as string)).toEqual(postData);
      });

      await client.post('/posts/', { body: postData });
    });
  });

  describe('PUT requests', () => {
    it('should make PUT request with body', async () => {
      const client = new GhostClient({
        url: TEST_URL,
        apiKey: TEST_API_KEY,
      });

      const postData = { posts: [{ title: 'Updated Post' }] };

      mockFetch({ status: 200, body: { posts: [{ id: '1', title: 'Updated Post' }] } }, (_url, init) => {
        expect(init?.method).toBe('PUT');
        expect(JSON.parse(init?.body as string)).toEqual(postData);
      });

      await client.put('/posts/1/', { body: postData });
    });
  });

  describe('DELETE requests', () => {
    it('should make DELETE request', async () => {
      const client = new GhostClient({
        url: TEST_URL,
        apiKey: TEST_API_KEY,
      });

      mockFetch({ status: 204 }, (_url, init) => {
        expect(init?.method).toBe('DELETE');
      });

      const result = await client.delete('/posts/1/');
      expect(result).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('should throw GhostApiError for 400 responses', async () => {
      const client = new GhostClient({
        url: TEST_URL,
        apiKey: TEST_API_KEY,
      });

      mockFetch({
        status: 400,
        body: {
          errors: [{ message: 'Validation failed', type: 'ValidationError' }],
        },
      });

      await expect(client.post('/posts/', { body: {} })).rejects.toThrow(
        GhostApiError
      );
    });

    it('should throw GhostApiError for 401 responses', async () => {
      const client = new GhostClient({
        url: TEST_URL,
        apiKey: TEST_API_KEY,
      });

      mockFetch({
        status: 401,
        body: {
          errors: [{ message: 'Invalid token', type: 'UnauthorizedError' }],
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
      const client = new GhostClient({
        url: TEST_URL,
        apiKey: TEST_API_KEY,
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
      const client = new GhostClient({
        url: TEST_URL,
        apiKey: TEST_API_KEY,
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
      const client = new GhostClient({
        url: TEST_URL,
        apiKey: TEST_API_KEY,
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
      const client = new GhostClient({
        url: TEST_URL,
        apiKey: TEST_API_KEY,
      });

      const errorDetails = [
        {
          message: 'Validation error',
          context: 'Title is required',
          type: 'ValidationError',
          property: 'title',
        },
      ];

      mockFetch({
        status: 422,
        body: { errors: errorDetails },
      });

      try {
        await client.post('/posts/', { body: {} });
      } catch (error) {
        expect(error).toBeInstanceOf(GhostApiError);
        expect((error as GhostApiError).errors).toEqual(errorDetails);
        expect((error as GhostApiError).type).toBe('ValidationError');
      }
    });
  });

  describe('timeout handling', () => {
    it('should timeout after specified duration', async () => {
      const client = new GhostClient({
        url: TEST_URL,
        apiKey: TEST_API_KEY,
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
      const client = new GhostClient({
        url: TEST_URL,
        apiKey: TEST_API_KEY,
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
      const client = new GhostClient({
        url: TEST_URL,
        apiKey: TEST_API_KEY,
      });

      mockFetch({ status: 200, body: { posts: [] } }, (url) => {
        expect(url).toBe('https://example.ghost.io/ghost/api/admin/posts/');
      });

      await client.get('posts/');
    });

    it('should handle endpoint with leading slash', async () => {
      const client = new GhostClient({
        url: TEST_URL,
        apiKey: TEST_API_KEY,
      });

      mockFetch({ status: 200, body: { posts: [] } }, (url) => {
        expect(url).toBe('https://example.ghost.io/ghost/api/admin/posts/');
      });

      await client.get('/posts/');
    });
  });
});

describe('GhostApiError', () => {
  describe('constructor', () => {
    it('should create error with message and status code', () => {
      const error = new GhostApiError('Test error', 400);

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('GhostApiError');
    });

    it('should include error details', () => {
      const details = [{ message: 'Detail 1', type: 'ValidationError' }];
      const error = new GhostApiError('Test error', 400, details);

      expect(error.errors).toEqual(details);
      expect(error.type).toBe('ValidationError');
    });

    it('should be instanceof Error', () => {
      const error = new GhostApiError('Test', 400);
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('fromResponse', () => {
    it('should create error from API response', () => {
      const error = GhostApiError.fromResponse(404, [
        { message: 'Resource not found', type: 'NotFoundError' },
      ]);

      expect(error.message).toBe('Resource not found');
      expect(error.statusCode).toBe(404);
      expect(error.type).toBe('NotFoundError');
    });

    it('should use fallback message when errors are empty', () => {
      const error = GhostApiError.fromResponse(500, []);

      expect(error.message).toBe('Ghost API error (status 500)');
      expect(error.statusCode).toBe(500);
    });
  });

  describe('networkError', () => {
    it('should create network error from cause', () => {
      const cause = new Error('Connection refused');
      const error = GhostApiError.networkError(cause);

      expect(error.message).toContain('Network error');
      expect(error.message).toContain('Connection refused');
      expect(error.statusCode).toBe(0);
      expect(error.isNetworkError()).toBe(true);
      expect(error.cause).toBe(cause);
    });
  });

  describe('timeoutError', () => {
    it('should create timeout error', () => {
      const error = GhostApiError.timeoutError(5000);

      expect(error.message).toContain('5000ms');
      expect(error.statusCode).toBe(0);
      expect(error.isTimeoutError()).toBe(true);
    });
  });

  describe('error type checking', () => {
    it('should identify validation errors', () => {
      const error = new GhostApiError('Invalid', 400, [
        { message: 'Invalid', type: 'ValidationError' },
      ]);
      expect(error.isValidationError()).toBe(true);
    });

    it('should identify authentication errors', () => {
      const error = new GhostApiError('Unauthorized', 401);
      expect(error.isAuthenticationError()).toBe(true);
    });

    it('should identify authorization errors', () => {
      const error = new GhostApiError('Forbidden', 403);
      expect(error.isAuthorizationError()).toBe(true);
    });

    it('should identify not found errors', () => {
      const error = new GhostApiError('Not found', 404);
      expect(error.isNotFoundError()).toBe(true);
    });

    it('should identify rate limit errors', () => {
      const error = new GhostApiError('Too many requests', 429);
      expect(error.isRateLimitError()).toBe(true);
    });

    it('should identify server errors', () => {
      const error500 = new GhostApiError('Internal error', 500);
      const error502 = new GhostApiError('Bad gateway', 502);
      const error503 = new GhostApiError('Service unavailable', 503);

      expect(error500.isServerError()).toBe(true);
      expect(error502.isServerError()).toBe(true);
      expect(error503.isServerError()).toBe(true);
    });
  });
});
