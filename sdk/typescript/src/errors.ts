/**
 * Base error class for all Jusho SDK errors.
 *
 * All errors thrown by the SDK extend this class, making it easy to
 * catch any Jusho-related error in a single catch block.
 *
 * @example
 * ```typescript
 * try {
 *   await jusho.normalize('...');
 * } catch (err) {
 *   if (err instanceof JushoError) {
 *     console.error('Jusho error:', err.message);
 *   }
 * }
 * ```
 */
export class JushoError extends Error {
  /** HTTP status code, if available */
  public readonly statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'JushoError';
    this.statusCode = statusCode;
    // Maintains proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Error thrown when a network request fails (e.g. DNS resolution failure,
 * connection refused, timeout).
 *
 * This error wraps the original error from the fetch API.
 *
 * @example
 * ```typescript
 * try {
 *   await jusho.normalize('...');
 * } catch (err) {
 *   if (err instanceof NetworkError) {
 *     console.error('Network issue:', err.cause);
 *   }
 * }
 * ```
 */
export class NetworkError extends JushoError {
  /** The original error that caused the network failure */
  public readonly cause?: Error;

  constructor(message: string, cause?: Error) {
    super(message);
    this.name = 'NetworkError';
    this.cause = cause;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Error thrown when the request times out.
 *
 * @example
 * ```typescript
 * try {
 *   await jusho.normalize('...');
 * } catch (err) {
 *   if (err instanceof TimeoutError) {
 *     console.error('Request timed out after', err.timeoutMs, 'ms');
 *   }
 * }
 * ```
 */
export class TimeoutError extends JushoError {
  /** The timeout duration in milliseconds */
  public readonly timeoutMs: number;

  constructor(timeoutMs: number) {
    super(`Request timed out after ${timeoutMs}ms`);
    this.name = 'TimeoutError';
    this.timeoutMs = timeoutMs;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Error thrown when the API returns a 429 Too Many Requests response.
 *
 * Includes rate limit information when available from response headers.
 *
 * @example
 * ```typescript
 * try {
 *   await jusho.normalize('...');
 * } catch (err) {
 *   if (err instanceof RateLimitError) {
 *     console.error('Rate limited. Retry after', err.retryAfterSeconds, 'seconds');
 *   }
 * }
 * ```
 */
export class RateLimitError extends JushoError {
  /** Number of seconds to wait before retrying, if provided by the API */
  public readonly retryAfterSeconds?: number;

  constructor(message: string, retryAfterSeconds?: number) {
    super(message, 429);
    this.name = 'RateLimitError';
    this.retryAfterSeconds = retryAfterSeconds;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Error thrown when the requested address is not found (404).
 *
 * @example
 * ```typescript
 * try {
 *   await jusho.normalize('存在しない住所');
 * } catch (err) {
 *   if (err instanceof NotFoundError) {
 *     console.error('Address not found');
 *   }
 * }
 * ```
 */
export class NotFoundError extends JushoError {
  constructor(message: string) {
    super(message, 404);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Error thrown when the request is invalid (422 Validation Error).
 *
 * @example
 * ```typescript
 * try {
 *   await jusho.normalize('');
 * } catch (err) {
 *   if (err instanceof ValidationError) {
 *     console.error('Invalid request:', err.message);
 *   }
 * }
 * ```
 */
export class ValidationError extends JushoError {
  constructor(message: string) {
    super(message, 422);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
