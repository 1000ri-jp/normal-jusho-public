# TypeScript SDK Guide

The `normal-jusho` npm package provides a typed client for the Jusho Japanese address normalization API. It works in both Node.js (18+) and modern browsers.

## Installation

```bash
npm install normal-jusho
```

## Quick Start

```typescript
import { Jusho } from 'normal-jusho';

const jusho = new Jusho();

// Normalize a single address
const result = await jusho.normalize('東京都千代田区千代田1-1');
console.log(result.codes.post_code);  // "1000001"
console.log(result.address.pref);     // "東京都" (via kenall)
console.log(result.geo.lat);          // "35.685175"
```

## Client Configuration

```typescript
const jusho = new Jusho({
  baseUrl: 'https://api.jusho.dev',  // Default
  timeout: 30000,                     // Request timeout in ms (default: 30s)
  headers: {                          // Custom headers for every request
    'X-Custom-Header': 'value',
  },
});
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `baseUrl` | `string` | `"https://api.jusho.dev"` | API base URL |
| `timeout` | `number` | `30000` | Request timeout in milliseconds |
| `headers` | `Record<string, string>` | `{}` | Custom headers sent with every request |

## Methods

### `normalize(address: string): Promise<NormalizeResponse>`

Normalize a single Japanese address.

```typescript
const result = await jusho.normalize('大阪府大阪市北区梅田1-1-1');

console.log(result.address.full);           // Full normalized address
console.log(result.address.pref);           // "大阪府"
console.log(result.address.city);           // "大阪市北区"
console.log(result.address.town);           // Town area
console.log(result.address.banchi);         // Block number
console.log(result.codes.post_code);        // "5300001"
console.log(result.kana.pref);              // "オオサカフ"
console.log(result.geo.lat);               // Latitude
console.log(result.meta.match_type);        // "address"
```

The method also handles business offices and large buildings:

```typescript
// Business office (jigyosyo)
const office = await jusho.normalize('宮内庁');
console.log(office.meta.match_type);    // "jigyosyo"
console.log(office.meta.is_jigyosyo);   // true
console.log(office.codes.post_code);    // "1008111"

// Large building with floor
const building = await jusho.normalize('六本木ヒルズ森タワー30F');
console.log(building.meta.match_type);  // "building"
console.log(building.meta.is_tatemono); // true
```

### `normalizeBatch(addresses: string[]): Promise<BatchNormalizeResponse>`

Normalize up to 100 addresses in a single request.

```typescript
const batch = await jusho.normalizeBatch([
  '東京都千代田区千代田1-1',
  '大阪府大阪市北区梅田1-1-1',
  '存在しない住所',
]);

console.log(batch.total);          // 3
console.log(batch.success_count);  // 2
console.log(batch.error_count);    // 1

for (const item of batch.results) {
  if (item.success) {
    console.log(`${item.input} => ${item.result!.codes.post_code}`);
  } else {
    console.log(`${item.input} => ERROR: ${item.error}`);
  }
}
```

### `postal(code: string): Promise<PostalResponse>`

Look up address information by postal code.

```typescript
const result = await jusho.postal('1500043');
console.log(result.address.pref); // "東京都"
console.log(result.address.city); // "渋谷区"
```

### `suggest(query: string): Promise<SuggestResponse>`

Get address suggestions for auto-complete.

```typescript
const result = await jusho.suggest('渋谷区道玄');
for (const s of result.suggestions) {
  console.log(s.address, s.postal_code);
}
```

### `validate(address: string): Promise<ValidationResponse>`

Validate whether an address exists.

```typescript
const result = await jusho.validate('東京都渋谷区道玄坂1-2-3');
console.log(result.valid);        // true
console.log(result.match_level);  // "full"
```

### `reverse(address: string): Promise<ReverseResponse>`

Reverse-lookup: get postal code and codes from an address string.

```typescript
const result = await jusho.reverse('東京都渋谷区道玄坂1-2-3');
console.log(result.postal_code);  // "1500043"
```

## Response Types

### `NormalizeResponse`

```typescript
interface NormalizeResponse {
  address: AddressInfo;
  address_variants: AddressVariantsInfo;
  kana: KanaInfo;
  codes: CodesInfo;
  geo: GeoInfo;
  meta: MetaInfo;
}
```

### `AddressInfo`

```typescript
interface AddressInfo {
  full: string;      // Full normalized address
  pref: string;      // Prefecture
  city: string;      // City/ward/municipality
  town: string;      // Town area (with chome)
  koaza: string;     // Sub-area
  banchi: string;    // Block number
  go: string;        // House number
  building: string;  // Building name
}
```

### `AddressVariantsInfo`

```typescript
interface AddressVariantsInfo {
  kokudo: VariantAddress;  // MLIT notation
  kenall: VariantAddress;  // Japan Post notation
}
```

### `CodesInfo`

```typescript
interface CodesInfo {
  post_code: string;  // 7-digit postal code
  pref_code: string;  // Prefecture code
  city_code: string;   // Municipality code
  town_code: string;   // Town area code
}
```

### `BatchNormalizeResponse`

```typescript
interface BatchNormalizeResponse {
  total: number;
  success_count: number;
  error_count: number;
  results: BatchResultItem[];
}

interface BatchResultItem {
  input: string;
  success: boolean;
  result: NormalizeResponse | null;
  error: string | null;
}
```

## Error Handling

The SDK provides typed error classes for different failure modes:

```typescript
import {
  Jusho,
  JushoError,
  NotFoundError,
  RateLimitError,
  NetworkError,
  TimeoutError,
  ValidationError,
} from 'normal-jusho';

try {
  const result = await jusho.normalize('...');
} catch (err) {
  if (err instanceof NotFoundError) {
    // Address not found (404)
    console.error('Address not recognized');
  } else if (err instanceof RateLimitError) {
    // Rate limit exceeded (429)
    console.error(`Rate limited. Retry after ${err.retryAfterSeconds}s`);
  } else if (err instanceof TimeoutError) {
    // Request timed out
    console.error(`Timeout after ${err.timeoutMs}ms`);
  } else if (err instanceof NetworkError) {
    // DNS failure, connection refused, etc.
    console.error('Network error:', err.cause);
  } else if (err instanceof ValidationError) {
    // Invalid input (422)
    console.error('Invalid input:', err.message);
  } else if (err instanceof JushoError) {
    // Catch-all for any Jusho error
    console.error(`Jusho error (${err.statusCode}):`, err.message);
  }
}
```

### Error Hierarchy

```
JushoError (base)
  +-- NetworkError
  +-- TimeoutError
  +-- RateLimitError
  +-- NotFoundError
  +-- ValidationError
```

## Address Variants

The same physical address may be written differently depending on the data source. Use the `address_variants` field to choose the right representation:

```typescript
const result = await jusho.normalize('千葉県袖ケ浦市...');

// MLIT notation (for GIS, administrative code lookups)
console.log(result.address_variants.kokudo.city);  // "袖ヶ浦市"

// Japan Post notation (for delivery services, postal lookups)
console.log(result.address_variants.kenall.city);  // "袖ケ浦市"
```

## Browser Usage

The SDK uses the standard `fetch` API and works in all modern browsers:

```html
<script type="module">
  import { Jusho } from 'https://cdn.jsdelivr.net/npm/normal-jusho/+esm';

  const jusho = new Jusho();
  const result = await jusho.normalize('東京都渋谷区道玄坂1-2-3');
  document.getElementById('result').textContent = result.codes.post_code;
</script>
```

The API supports CORS (`Access-Control-Allow-Origin: *`), so direct browser calls are permitted.
