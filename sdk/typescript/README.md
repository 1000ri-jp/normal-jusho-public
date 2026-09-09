# jusho

TypeScript/JavaScript SDK for the [Jusho](https://jusho.dev) Japanese address normalization API.

Normalize, validate, and look up Japanese addresses with full TypeScript types, zero runtime dependencies, and support for both Node.js and browsers.

[日本語版 README はこちら](./README.ja.md)

## Features

- Zero runtime dependencies (uses native `fetch`)
- Full TypeScript types included
- Dual package: ESM and CommonJS
- Works in Node.js 18+ and modern browsers
- Typed error classes for precise error handling
- Configurable timeout and base URL

## Installation

```bash
npm install normal-jusho
```

```bash
yarn add normal-jusho
```

```bash
pnpm add normal-jusho
```

## Quick Start

```typescript
import { Jusho } from 'jusho';

const jusho = new Jusho();

const result = await jusho.normalize('東京都千代田区千代田1-1');
console.log(result.address.pref);      // '東京都'
console.log(result.address.city);      // '千代田区'
console.log(result.codes.post_code);   // '1000001'
console.log(result.geo.lat);           // Latitude
```

## Usage

### Create a Client

```typescript
import { Jusho } from 'jusho';

// Default configuration
const jusho = new Jusho();

// Custom configuration
const jusho = new Jusho({
  baseUrl: 'https://api.jusho.dev',
  timeout: 10000, // 10 seconds
  headers: { 'X-Custom-Header': 'value' },
});
```

### Normalize a Single Address

```typescript
const result = await jusho.normalize('東京都渋谷区道玄坂1-2-3');

// Address components
console.log(result.address.full);     // Full normalized address
console.log(result.address.pref);     // Prefecture
console.log(result.address.city);     // City / ward
console.log(result.address.town);     // Town area
console.log(result.address.banchi);   // Block number
console.log(result.address.go);       // House number
console.log(result.address.building); // Building name

// Codes
console.log(result.codes.post_code);  // Postal code (7 digits)
console.log(result.codes.pref_code);  // Prefecture code
console.log(result.codes.city_code);  // City code

// Kana readings
console.log(result.kana.pref);        // Prefecture reading
console.log(result.kana.city);        // City reading

// Coordinates
console.log(result.geo.lat);          // Latitude
console.log(result.geo.lng);          // Longitude

// Data source variants
console.log(result.address_variants.kokudo.city); // MLIT notation
console.log(result.address_variants.kenall.city); // Japan Post notation
```

### Batch Normalization

```typescript
const results = await jusho.normalizeBatch([
  '東京都千代田区千代田1-1',
  '大阪府大阪市北区梅田1-1-1',
  '北海道札幌市中央区北1条西2丁目',
]);

console.log(results.total);         // 3
console.log(results.success_count); // Number of successes
console.log(results.error_count);   // Number of failures

for (const item of results.results) {
  if (item.success) {
    console.log(item.result!.address.full);
  } else {
    console.error(`Failed: ${item.input} - ${item.error}`);
  }
}
```

### Postal Code Lookup

```typescript
const result = await jusho.postal('1500043');
console.log(result.address.pref); // '東京都'
console.log(result.address.city); // '渋谷区'
```

### Address Suggestions

```typescript
const result = await jusho.suggest('渋谷区道玄');
for (const suggestion of result.suggestions) {
  console.log(suggestion.address, suggestion.postal_code);
}
```

### Address Validation

```typescript
const result = await jusho.validate('東京都渋谷区道玄坂1-2-3');
console.log(result.valid);       // true
console.log(result.match_level); // 'full'
if (result.normalized) {
  console.log(result.normalized.codes.post_code);
}
```

### Reverse Lookup

```typescript
const result = await jusho.reverse('東京都渋谷区道玄坂1-2-3');
console.log(result.postal_code); // '1500043'
```

## Error Handling

The SDK provides typed error classes for precise error handling:

```typescript
import {
  Jusho,
  JushoError,
  NetworkError,
  TimeoutError,
  RateLimitError,
  NotFoundError,
  ValidationError,
} from 'jusho';

const jusho = new Jusho();

try {
  const result = await jusho.normalize('東京都千代田区千代田1-1');
} catch (error) {
  if (error instanceof NotFoundError) {
    // Address not found (HTTP 404)
    console.error('Address not found:', error.message);
  } else if (error instanceof RateLimitError) {
    // Rate limit exceeded (HTTP 429)
    console.error('Rate limited. Retry after:', error.retryAfterSeconds, 'seconds');
  } else if (error instanceof TimeoutError) {
    // Request timed out
    console.error('Timed out after:', error.timeoutMs, 'ms');
  } else if (error instanceof NetworkError) {
    // Network error (DNS failure, connection refused, etc.)
    console.error('Network error:', error.message);
  } else if (error instanceof ValidationError) {
    // Invalid request (HTTP 422)
    console.error('Invalid request:', error.message);
  } else if (error instanceof JushoError) {
    // Other API error
    console.error('API error:', error.statusCode, error.message);
  }
}
```

## Error Classes

| Class | HTTP Status | Description |
|-------|-------------|-------------|
| `JushoError` | Any | Base error class for all SDK errors |
| `NetworkError` | N/A | Network failure (DNS, connection, etc.) |
| `TimeoutError` | N/A | Request exceeded timeout |
| `RateLimitError` | 429 | Rate limit exceeded |
| `NotFoundError` | 404 | Address not found |
| `ValidationError` | 422 | Invalid request parameters |

## CommonJS Usage

```javascript
const { Jusho } = require('jusho');

const jusho = new Jusho();
const result = await jusho.normalize('東京都千代田区千代田1-1');
```

## API Reference

### `new Jusho(options?)`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `baseUrl` | `string` | `https://api.jusho.dev` | API base URL |
| `timeout` | `number` | `30000` | Request timeout (ms) |
| `headers` | `Record<string, string>` | `{}` | Custom request headers |

### Methods

| Method | Description |
|--------|-------------|
| `normalize(address)` | Normalize a single address |
| `normalizeBatch(addresses)` | Normalize up to 100 addresses |
| `postal(code)` | Look up address by postal code |
| `suggest(query)` | Get address suggestions |
| `validate(address)` | Validate an address |
| `reverse(address)` | Reverse lookup (address to postal code) |

## License

MIT
