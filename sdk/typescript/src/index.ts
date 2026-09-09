/**
 * Jusho - Japanese Address Normalization SDK
 *
 * @packageDocumentation
 *
 * @example
 * ```typescript
 * import { Jusho } from 'jusho';
 *
 * const jusho = new Jusho();
 * const result = await jusho.normalize('東京都千代田区千代田1-1');
 * console.log(result.codes.post_code); // '1000001'
 * ```
 */

// Client
export { Jusho } from './client';

// Default export for convenience
export { Jusho as default } from './client';

// Types
export type {
  JushoOptions,
  AddressInfo,
  VariantAddress,
  AddressVariantsInfo,
  KanaInfo,
  CodesInfo,
  GeoInfo,
  MetaInfo,
  NormalizeResponse,
  BatchResultItem,
  BatchNormalizeResponse,
  PostalResponse,
  Suggestion,
  SuggestResponse,
  ValidationResponse,
  ReverseResponse,
  ErrorResponseBody,
} from './types';

// Errors
export {
  JushoError,
  NetworkError,
  TimeoutError,
  RateLimitError,
  NotFoundError,
  ValidationError,
} from './errors';
