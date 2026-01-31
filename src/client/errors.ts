/**
 * Error handling for Ghost API client.
 */

import type { GhostApiErrorDetail } from '../types/ghost-api.js';

/**
 * Error thrown when Ghost API requests fail.
 */
export class GhostApiError extends Error {
  /**
   * HTTP status code from the response.
   */
  readonly statusCode: number;

  /**
   * Error details from the Ghost API response.
   */
  readonly errors: GhostApiErrorDetail[];

  /**
   * The error type from Ghost (e.g., "ValidationError", "NotFoundError").
   */
  readonly type?: string;

  /**
   * Ghost-specific error code if available.
   */
  readonly code?: string;

  constructor(
    message: string,
    statusCode: number,
    errors: GhostApiErrorDetail[] = []
  ) {
    super(message);
    this.name = 'GhostApiError';
    this.statusCode = statusCode;
    this.errors = errors;
    this.type = errors[0]?.type;
    this.code = errors[0]?.code ?? undefined;
  }

  /**
   * Creates a GhostApiError from an API response.
   */
  static fromResponse(
    statusCode: number,
    errors: GhostApiErrorDetail[]
  ): GhostApiError {
    const primaryError = errors[0];
    const message =
      primaryError?.message ?? `Ghost API error (status ${statusCode})`;
    return new GhostApiError(message, statusCode, errors);
  }

  /**
   * Creates a GhostApiError for network/connection failures.
   */
  static networkError(cause: Error): GhostApiError {
    const error = new GhostApiError(
      `Network error: ${cause.message}`,
      0,
      [{ message: cause.message, type: 'NetworkError' }]
    );
    error.cause = cause;
    return error;
  }

  /**
   * Creates a GhostApiError for request timeout.
   */
  static timeoutError(timeoutMs: number): GhostApiError {
    return new GhostApiError(
      `Request timed out after ${timeoutMs}ms`,
      0,
      [{ message: `Request timed out after ${timeoutMs}ms`, type: 'TimeoutError' }]
    );
  }

  /**
   * Returns true if this is a validation error (400).
   */
  isValidationError(): boolean {
    return this.statusCode === 400 || this.type === 'ValidationError';
  }

  /**
   * Returns true if this is an authentication error (401).
   */
  isAuthenticationError(): boolean {
    return this.statusCode === 401;
  }

  /**
   * Returns true if this is a permission/authorization error (403).
   */
  isAuthorizationError(): boolean {
    return this.statusCode === 403;
  }

  /**
   * Returns true if this is a not found error (404).
   */
  isNotFoundError(): boolean {
    return this.statusCode === 404 || this.type === 'NotFoundError';
  }

  /**
   * Returns true if this is a rate limit error (429).
   */
  isRateLimitError(): boolean {
    return this.statusCode === 429;
  }

  /**
   * Returns true if this is a server error (5xx).
   */
  isServerError(): boolean {
    return this.statusCode >= 500 && this.statusCode < 600;
  }

  /**
   * Returns true if this is a network error (no response received).
   */
  isNetworkError(): boolean {
    return this.statusCode === 0 && this.type === 'NetworkError';
  }

  /**
   * Returns true if this is a timeout error.
   */
  isTimeoutError(): boolean {
    return this.statusCode === 0 && this.type === 'TimeoutError';
  }
}
