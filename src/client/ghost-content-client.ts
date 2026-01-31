/**
 * HTTP client wrapper for Ghost Content API communication.
 *
 * Reference: https://ghost.org/docs/content-api/
 */

import type {
  GhostContentClientConfig,
  GhostApiErrorResponse,
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
 * HTTP client for Ghost Content API.
 *
 * Handles authentication (via query parameter), request formatting, and error handling
 * for all Ghost Content API endpoints. This API is read-only and only supports GET requests.
 *
 * @example
 * ```typescript
 * const client = new GhostContentClient({
 *   url: 'https://yourblog.ghost.io',
 *   key: 'your-content-api-key',
 * });
 *
 * // Get all posts
 * const posts = await client.get<{ posts: Post[] }>('/posts/', {
 *   params: { include: 'tags,authors' }
 * });
 * ```
 */
export class GhostContentClient {
  private readonly baseUrl: string;
  private readonly key: string;
  private readonly version: string;

  /**
   * Creates a new Ghost Content API client.
   *
   * @param config - Client configuration options
   * @throws Error if url or key are not provided
   */
  constructor(config: GhostContentClientConfig) {
    if (!config.url) {
      throw new Error('Ghost site URL is required');
    }
    if (!config.key) {
      throw new Error('Ghost Content API key is required');
    }

    this.baseUrl = this.normalizeUrl(config.url);
    this.key = config.key;
    this.version = config.version ?? DEFAULT_API_VERSION;
  }

  /**
   * Normalizes the Ghost URL to use Content API base path.
   */
  private normalizeUrl(url: string): string {
    // Remove trailing slash
    let normalized = url.replace(/\/+$/, '');

    // Remove any existing Ghost path parts
    normalized = normalized.replace(/\/ghost\/?$/, '');
    normalized = normalized.replace(/\/ghost\/api\/?$/, '');
    normalized = normalized.replace(/\/ghost\/api\/content\/?$/, '');
    normalized = normalized.replace(/\/ghost\/api\/admin\/?$/, '');

    // Add Content API path
    normalized += '/ghost/api/content';

    return normalized;
  }

  /**
   * Builds the full URL for an API endpoint with the API key.
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

    // Always add the API key as query parameter
    url.searchParams.set('key', this.key);

    // Add other query parameters
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
  private createHeaders(): Headers {
    const headers = new Headers();

    // API version header
    headers.set('Accept-Version', this.version);

    return headers;
  }

  /**
   * Performs a GET request to the Ghost Content API.
   *
   * @param endpoint - API endpoint path (e.g., '/posts/')
   * @param options - Request options
   * @returns Parsed JSON response
   * @throws GhostApiError on API errors
   */
  async get<T>(
    endpoint: string,
    options: {
      params?: Record<string, string | number | boolean | undefined>;
      timeout?: number;
    } = {}
  ): Promise<T> {
    const { params, timeout = DEFAULT_TIMEOUT_MS } = options;

    const url = this.buildUrl(endpoint, params);
    const headers = this.createHeaders();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle non-2xx responses
      if (!response.ok) {
        await this.handleErrorResponse(response);
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
      throw new GhostApiError('An unknown error occurred', 0, [
        { message: String(error), type: 'UnknownError' },
      ]);
    }
  }

  /**
   * Handles error responses from the Ghost API.
   */
  private async handleErrorResponse(response: Response): Promise<never> {
    let errors: GhostApiErrorResponse['errors'] = [];

    try {
      const errorBody = (await response.json()) as GhostApiErrorResponse;
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
