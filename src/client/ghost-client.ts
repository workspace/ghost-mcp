/**
 * HTTP client wrapper for Ghost Admin API communication.
 *
 * Reference: https://docs.ghost.org/admin-api/
 */

import { createAuthorizationHeader } from '../auth/index.js';
import type {
  GhostClientConfig,
  GhostRequestOptions,
  GhostApiErrorResponse,
  FormDataUploadOptions,
} from '../types/ghost-api.js';
import { GhostApiError } from './errors.js';

/**
 * Default request timeout in milliseconds.
 */
const DEFAULT_TIMEOUT_MS = 30000;

/**
 * Default API version.
 */
const DEFAULT_API_VERSION = 'v5.0';

/**
 * HTTP client for Ghost Admin API.
 *
 * Handles authentication, request formatting, and error handling
 * for all Ghost Admin API endpoints.
 *
 * @example
 * ```typescript
 * const client = new GhostClient({
 *   url: 'https://yourblog.ghost.io',
 *   apiKey: 'your-api-key:your-secret',
 * });
 *
 * // Get all posts
 * const posts = await client.get<{ posts: Post[] }>('/posts/');
 *
 * // Create a new post
 * const newPost = await client.post<{ posts: Post[] }>('/posts/', {
 *   body: { posts: [{ title: 'My New Post', status: 'draft' }] },
 * });
 * ```
 */
export class GhostClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly version: string;

  /**
   * Creates a new Ghost API client.
   *
   * @param config - Client configuration options
   * @throws Error if url or apiKey are not provided
   */
  constructor(config: GhostClientConfig) {
    if (!config.url) {
      throw new Error('Ghost API URL is required');
    }
    if (!config.apiKey) {
      throw new Error('Ghost API key is required');
    }

    this.baseUrl = this.normalizeUrl(config.url);
    this.apiKey = config.apiKey;
    this.version = config.version ?? DEFAULT_API_VERSION;
  }

  /**
   * Normalizes the Ghost API URL to ensure consistent format.
   */
  private normalizeUrl(url: string): string {
    // Remove trailing slash
    let normalized = url.replace(/\/+$/, '');

    // If URL doesn't end with /ghost/api/admin, add it
    if (!normalized.endsWith('/ghost/api/admin')) {
      // Remove any partial path that might exist
      normalized = normalized.replace(/\/ghost\/?$/, '');
      normalized = normalized.replace(/\/ghost\/api\/?$/, '');
      normalized += '/ghost/api/admin';
    }

    return normalized;
  }

  /**
   * Builds the full URL for an API endpoint.
   */
  private buildUrl(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined>
  ): string {
    // Ensure endpoint starts with /
    const normalizedEndpoint = endpoint.startsWith('/')
      ? endpoint
      : `/${endpoint}`;

    const url = new URL(`${this.baseUrl}${normalizedEndpoint}`);

    // Add query parameters
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    return url.toString();
  }

  /**
   * Creates headers for API requests.
   */
  private createHeaders(includeContentType: boolean = false): Headers {
    const headers = new Headers();

    // Authorization with JWT token
    headers.set('Authorization', createAuthorizationHeader(this.apiKey));

    // API version header
    headers.set('Accept-Version', this.version);

    // Content type for requests with body
    if (includeContentType) {
      headers.set('Content-Type', 'application/json');
    }

    return headers;
  }

  /**
   * Performs an HTTP request to the Ghost API.
   *
   * @param endpoint - API endpoint path (e.g., '/posts/')
   * @param options - Request options
   * @returns Parsed JSON response
   * @throws GhostApiError on API errors
   */
  async request<T>(endpoint: string, options: GhostRequestOptions = {}): Promise<T> {
    const { method = 'GET', body, params, timeout = DEFAULT_TIMEOUT_MS } = options;

    const url = this.buildUrl(endpoint, params);
    const headers = this.createHeaders(body !== undefined);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle non-2xx responses
      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return undefined as T;
      }

      // Parse JSON response
      const data = await response.json();
      return data as T;
    } catch (error) {
      clearTimeout(timeoutId);

      // Re-throw GhostApiError as-is
      if (error instanceof GhostApiError) {
        throw error;
      }

      // Handle abort/timeout
      if (error instanceof Error && error.name === 'AbortError') {
        throw GhostApiError.timeoutError(timeout);
      }

      // Handle network errors
      if (error instanceof Error) {
        throw GhostApiError.networkError(error);
      }

      // Unknown error
      throw new GhostApiError(
        'An unknown error occurred',
        0,
        [{ message: String(error), type: 'UnknownError' }]
      );
    }
  }

  /**
   * Handles error responses from the Ghost API.
   */
  private async handleErrorResponse(response: Response): Promise<never> {
    let errors: GhostApiErrorResponse['errors'] = [];

    try {
      const errorBody = await response.json() as GhostApiErrorResponse;
      if (errorBody.errors && Array.isArray(errorBody.errors)) {
        errors = errorBody.errors;
      }
    } catch {
      // Response body wasn't valid JSON, use status text
      errors = [{ message: response.statusText || `HTTP ${response.status}` }];
    }

    throw GhostApiError.fromResponse(response.status, errors);
  }

  /**
   * Performs a GET request.
   *
   * @param endpoint - API endpoint path
   * @param options - Request options (params, timeout)
   * @returns Parsed JSON response
   */
  async get<T>(
    endpoint: string,
    options?: Omit<GhostRequestOptions, 'method' | 'body'>
  ): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  /**
   * Performs a POST request.
   *
   * @param endpoint - API endpoint path
   * @param options - Request options (body, params, timeout)
   * @returns Parsed JSON response
   */
  async post<T>(
    endpoint: string,
    options?: Omit<GhostRequestOptions, 'method'>
  ): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'POST' });
  }

  /**
   * Performs a PUT request.
   *
   * @param endpoint - API endpoint path
   * @param options - Request options (body, params, timeout)
   * @returns Parsed JSON response
   */
  async put<T>(
    endpoint: string,
    options?: Omit<GhostRequestOptions, 'method'>
  ): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PUT' });
  }

  /**
   * Performs a DELETE request.
   *
   * @param endpoint - API endpoint path
   * @param options - Request options (params, timeout)
   * @returns Parsed JSON response (usually undefined for 204 responses)
   */
  async delete<T>(
    endpoint: string,
    options?: Omit<GhostRequestOptions, 'method' | 'body'>
  ): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * Uploads form data to the Ghost API (for file uploads).
   *
   * Unlike the standard request method, this sends multipart/form-data
   * instead of JSON.
   *
   * @param endpoint - API endpoint path (e.g., '/images/upload/')
   * @param formData - FormData object containing files and fields
   * @param options - Request options
   * @returns Parsed JSON response
   * @throws GhostApiError on API errors
   */
  async uploadFormData<T>(
    endpoint: string,
    formData: FormData,
    options: FormDataUploadOptions = {}
  ): Promise<T> {
    const { timeout = DEFAULT_TIMEOUT_MS } = options;

    const url = this.buildUrl(endpoint);

    // Create headers without Content-Type (fetch will set it automatically with boundary)
    const headers = new Headers();
    headers.set('Authorization', createAuthorizationHeader(this.apiKey));
    headers.set('Accept-Version', this.version);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof GhostApiError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw GhostApiError.timeoutError(timeout);
      }

      if (error instanceof Error) {
        throw GhostApiError.networkError(error);
      }

      throw new GhostApiError('An unknown error occurred', 0, [
        { message: String(error), type: 'UnknownError' },
      ]);
    }
  }

  /**
   * Returns the configured base URL.
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Returns the configured API version.
   */
  getVersion(): string {
    return this.version;
  }
}
