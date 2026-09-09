import type {
  JushoOptions,
  NormalizeResponse,
  BatchNormalizeResponse,
  PostalResponse,
  SuggestResponse,
  ValidationResponse,
  ReverseResponse,
  ErrorResponseBody,
} from './types';

import {
  JushoError,
  NetworkError,
  TimeoutError,
  RateLimitError,
  NotFoundError,
  ValidationError,
} from './errors';

/** Default API base URL */
const DEFAULT_BASE_URL = 'https://api.jusho.dev';

/** Default request timeout in milliseconds */
const DEFAULT_TIMEOUT = 30_000;

/**
 * Client for the Jusho Japanese address normalization API.
 *
 * Provides methods to normalize, validate, and look up Japanese addresses
 * using the Jusho REST API. Supports both Node.js (18+) and modern browsers.
 *
 * @example
 * ```typescript
 * import { Jusho } from 'jusho';
 *
 * const jusho = new Jusho();
 * const result = await jusho.normalize('東京都渋谷区道玄坂1-2-3');
 * console.log(result.address.pref); // '東京都'
 * console.log(result.codes.post_code); // '1500043'
 * ```
 *
 * @example
 * ```typescript
 * // With custom options
 * const jusho = new Jusho({
 *   baseUrl: 'https://api.jusho.dev',
 *   timeout: 10000,
 *   headers: { 'X-Custom-Header': 'value' },
 * });
 * ```
 */
export class Jusho {
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly headers: Record<string, string>;

  /**
   * Creates a new Jusho client instance.
   *
   * @param options - Configuration options for the client.
   */
  constructor(options: JushoOptions = {}) {
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.timeout = options.timeout ?? DEFAULT_TIMEOUT;
    this.headers = options.headers ?? {};
  }

  // -----------------------------------------------------------------------
  // Core API methods
  // -----------------------------------------------------------------------

  /**
   * Normalize a single Japanese address.
   *
   * Sends the address to the Jusho API and returns structured, normalized
   * address data including postal code, administrative codes, kana readings,
   * and geographic coordinates.
   *
   * Matching priority:
   * 1. Business office dictionary (jigyosyo with dedicated postal codes)
   * 2. Large building dictionary (buildings with per-floor postal codes)
   * 3. Standard addresses (MLIT + Japan Post data)
   *
   * @param address - The Japanese address string to normalize.
   * @returns Normalized address information.
   * @throws {NotFoundError} When the address cannot be found.
   * @throws {RateLimitError} When the rate limit is exceeded.
   * @throws {NetworkError} When a network error occurs.
   * @throws {TimeoutError} When the request times out.
   *
   * @example
   * ```typescript
   * const result = await jusho.normalize('東京都千代田区千代田1-1');
   * console.log(result.address.full);    // Full normalized address
   * console.log(result.codes.post_code); // '1000001'
   * console.log(result.geo.lat);         // Latitude
   * ```
   */
  async normalize(address: string): Promise<NormalizeResponse> {
    return this.request<NormalizeResponse>('/normalize', {
      method: 'POST',
      body: JSON.stringify({ address }),
    });
  }

  /**
   * Normalize multiple Japanese addresses in a single request.
   *
   * Processes up to 100 addresses at once. Individual failures do not cause
   * the entire request to fail; instead, each result includes a `success`
   * flag and either a `result` or `error` field.
   *
   * @param addresses - Array of address strings to normalize (max 100).
   * @returns Batch normalization results with per-address outcomes.
   * @throws {ValidationError} When the input is invalid (e.g. too many addresses).
   * @throws {RateLimitError} When the rate limit is exceeded.
   * @throws {NetworkError} When a network error occurs.
   * @throws {TimeoutError} When the request times out.
   *
   * @example
   * ```typescript
   * const results = await jusho.normalizeBatch([
   *   '東京都千代田区千代田1-1',
   *   '大阪府大阪市北区梅田1-1-1',
   * ]);
   *
   * console.log(results.total);         // 2
   * console.log(results.success_count); // Number of successes
   * for (const item of results.results) {
   *   if (item.success) {
   *     console.log(item.result!.address.full);
   *   } else {
   *     console.error(item.input, item.error);
   *   }
   * }
   * ```
   */
  async normalizeBatch(addresses: string[]): Promise<BatchNormalizeResponse> {
    return this.request<BatchNormalizeResponse>('/normalize/batch', {
      method: 'POST',
      body: JSON.stringify({ addresses }),
    });
  }

  /**
   * Look up address information by postal code.
   *
   * @param code - The postal code to look up (7 digits, with or without hyphen).
   * @returns Address information for the given postal code.
   * @throws {NotFoundError} When no address is found for the postal code.
   * @throws {RateLimitError} When the rate limit is exceeded.
   * @throws {NetworkError} When a network error occurs.
   * @throws {TimeoutError} When the request times out.
   *
   * @example
   * ```typescript
   * const result = await jusho.postal('1500043');
   * console.log(result.address.pref); // '東京都'
   * console.log(result.address.city); // '渋谷区'
   * ```
   */
  async postal(code: string): Promise<PostalResponse> {
    const sanitized = code.replace(/[-\u30FC\uFF0D]/g, '');
    return this.request<PostalResponse>(`/postal/${encodeURIComponent(sanitized)}`);
  }

  /**
   * Get address suggestions based on a partial query.
   *
   * Useful for implementing address auto-complete in user interfaces.
   *
   * @param query - Partial address string to search for.
   * @returns List of matching address suggestions.
   * @throws {RateLimitError} When the rate limit is exceeded.
   * @throws {NetworkError} When a network error occurs.
   * @throws {TimeoutError} When the request times out.
   *
   * @example
   * ```typescript
   * const result = await jusho.suggest('渋谷区道玄');
   * for (const s of result.suggestions) {
   *   console.log(s.address, s.postal_code);
   * }
   * ```
   */
  async suggest(query: string): Promise<SuggestResponse> {
    return this.request<SuggestResponse>(
      `/suggest?q=${encodeURIComponent(query)}`,
    );
  }

  /**
   * Validate a Japanese address.
   *
   * Checks whether the given address is valid and returns the match level.
   *
   * @param address - The address string to validate.
   * @returns Validation result with match level and normalized form.
   * @throws {RateLimitError} When the rate limit is exceeded.
   * @throws {NetworkError} When a network error occurs.
   * @throws {TimeoutError} When the request times out.
   *
   * @example
   * ```typescript
   * const result = await jusho.validate('東京都渋谷区道玄坂1-2-3');
   * console.log(result.valid);       // true
   * console.log(result.match_level); // 'full'
   * ```
   */
  async validate(address: string): Promise<ValidationResponse> {
    return this.request<ValidationResponse>(
      `/validate?address=${encodeURIComponent(address)}`,
    );
  }

  /**
   * Reverse-lookup an address to find its postal code and codes.
   *
   * Given a full or partial address, returns the associated postal code
   * and administrative codes.
   *
   * @param address - The address string to look up.
   * @returns Reverse lookup result with postal code and codes.
   * @throws {NotFoundError} When the address cannot be found.
   * @throws {RateLimitError} When the rate limit is exceeded.
   * @throws {NetworkError} When a network error occurs.
   * @throws {TimeoutError} When the request times out.
   *
   * @example
   * ```typescript
   * const result = await jusho.reverse('東京都渋谷区道玄坂1-2-3');
   * console.log(result.postal_code); // '1500043'
   * ```
   */
  async reverse(address: string): Promise<ReverseResponse> {
    return this.request<ReverseResponse>(
      `/reverse?address=${encodeURIComponent(address)}`,
    );
  }

  // -----------------------------------------------------------------------
  // Internal helpers
  // -----------------------------------------------------------------------

  /**
   * Sends an HTTP request to the Jusho API and returns the parsed response.
   *
   * Handles timeout via AbortController, maps HTTP error codes to typed
   * error classes, and parses the JSON response body.
   */
  private async request<T>(
    path: string,
    init: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...this.headers,
          ...(init.headers as Record<string, string> | undefined),
        },
      });

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      return (await response.json()) as T;
    } catch (error: unknown) {
      if (error instanceof JushoError) {
        throw error;
      }

      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new TimeoutError(this.timeout);
      }

      if (error instanceof TypeError) {
        // fetch throws TypeError for network errors (DNS, connection refused, etc.)
        throw new NetworkError(
          error.message || 'Network request failed',
          error,
        );
      }

      throw new NetworkError(
        error instanceof Error ? error.message : 'Unknown network error',
        error instanceof Error ? error : undefined,
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Parses an error response and throws the appropriate typed error.
   */
  private async handleErrorResponse(response: Response): Promise<never> {
    let body: ErrorResponseBody | undefined;
    try {
      body = (await response.json()) as ErrorResponseBody;
    } catch {
      // Response body may not be valid JSON
    }

    const message =
      body?.detail ?? body?.error ?? `HTTP ${response.status}`;

    switch (response.status) {
      case 404:
        throw new NotFoundError(message);

      case 422:
        throw new ValidationError(message);

      case 429: {
        const retryAfter = response.headers.get('Retry-After');
        const seconds = retryAfter ? parseInt(retryAfter, 10) : undefined;
        throw new RateLimitError(
          message,
          Number.isFinite(seconds) ? seconds : undefined,
        );
      }

      default:
        throw new JushoError(message, response.status);
    }
  }
}
