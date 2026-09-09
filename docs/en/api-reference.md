# API Reference

Base URL: `https://api.jusho.dev`

All responses use `Content-Type: application/json; charset=utf-8` with Japanese characters returned unescaped (not as `\uXXXX` sequences).

---

## POST /normalize

Normalize a single Japanese address string into structured data.

### Request

**Content-Type**: `application/json`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `address` | string | Yes | Japanese address string to normalize |

```bash
curl -X POST https://api.jusho.dev/normalize \
  -H "Content-Type: application/json" \
  -d '{"address": "東京都千代田区千代田1-1"}'
```

### Response (200)

```json
{
  "address": {
    "full": "東京都千代田区千代田一丁目1",
    "pref": "千代田区",
    "city": "千代田区",
    "town": "千代田一丁目",
    "koaza": "",
    "banchi": "1",
    "go": "",
    "building": ""
  },
  "address_variants": {
    "kokudo": {
      "pref": "東京都",
      "city": "千代田区",
      "town": "千代田一丁目"
    },
    "kenall": {
      "pref": "東京都",
      "city": "千代田区",
      "town": "千代田"
    }
  },
  "kana": {
    "pref": "トウキョウト",
    "city": "チヨダク",
    "town": "チヨダ"
  },
  "codes": {
    "post_code": "1000001",
    "pref_code": "13",
    "city_code": "13101",
    "town_code": "131010001001"
  },
  "geo": {
    "lat": "35.685175",
    "lng": "139.752799"
  },
  "meta": {
    "match_type": "address",
    "is_jigyosyo": false,
    "is_tatemono": false,
    "version": "0.3.6"
  }
}
```

### Error Responses

| Status | Description |
|--------|-------------|
| 404 | Address not found |
| 422 | Validation error (empty or malformed request) |
| 429 | Rate limit exceeded |

---

## GET /normalize

Normalize a single address via query parameter.

### Request

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `address` | string | Yes | URL-encoded Japanese address string |

```bash
curl "https://api.jusho.dev/normalize?address=%E6%9D%B1%E4%BA%AC%E9%83%BD%E5%8D%83%E4%BB%A3%E7%94%B0%E5%8C%BA%E5%8D%83%E4%BB%A3%E7%94%B01-1"
```

The response format is identical to `POST /normalize`.

---

## POST /normalize/batch

Normalize multiple addresses in a single request (up to 100).

### Request

**Content-Type**: `application/json`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `addresses` | string[] | Yes | Array of address strings (1--100 items) |

```bash
curl -X POST https://api.jusho.dev/normalize/batch \
  -H "Content-Type: application/json" \
  -d '{
    "addresses": [
      "東京都千代田区千代田1-1",
      "大阪府大阪市北区梅田1-1-1",
      "北海道札幌市中央区北1条西2丁目"
    ]
  }'
```

### Response (200)

```json
{
  "total": 3,
  "success_count": 3,
  "error_count": 0,
  "results": [
    {
      "input": "東京都千代田区千代田1-1",
      "success": true,
      "result": { ... },
      "error": null
    },
    {
      "input": "大阪府大阪市北区梅田1-1-1",
      "success": true,
      "result": { ... },
      "error": null
    },
    {
      "input": "北海道札幌市中央区北1条西2丁目",
      "success": true,
      "result": { ... },
      "error": null
    }
  ]
}
```

Individual address failures do not cause the batch request to fail. Each item in `results` has its own `success` flag and either `result` (on success) or `error` (on failure).

### Error Responses

| Status | Description |
|--------|-------------|
| 422 | Validation error (empty array, more than 100 addresses) |
| 429 | Rate limit exceeded |

---

## GET /health

Health check endpoint for monitoring and orchestration.

```bash
curl https://api.jusho.dev/health
```

### Response (200)

```json
{
  "status": "healthy"
}
```

---

## GET /ready

Check whether dictionary data has been loaded.

```bash
curl https://api.jusho.dev/ready
```

### Response (200)

```json
{
  "status": "ready",
  "data_loaded": true
}
```

Possible `status` values: `"ready"`, `"loading"`, `"not_loaded"`.

---

## POST /warmup

Trigger background loading of dictionary data. Useful for warming up a cold-started instance.

```bash
curl -X POST https://api.jusho.dev/warmup
```

### Response (200)

```json
{
  "status": "loading_started"
}
```

Possible `status` values: `"loading_started"`, `"loading"`, `"already_loaded"`.

---

## GET /rate-limit-status

Check current rate limit counters.

```bash
curl https://api.jusho.dev/rate-limit-status
```

### Response (200)

```json
{
  "global_remaining": 49985,
  "global_reset_seconds": 3421,
  "global_limit_per_hour": 50000,
  "ip_limit_per_minute": 100
}
```

---

## GET /mcp-status

Check whether MCP (Model Context Protocol) integration is available.

```bash
curl https://api.jusho.dev/mcp-status
```

### Response (200)

```json
{
  "available": true,
  "endpoint": "/mcp",
  "server_name": "jusho",
  "client_config": {
    "mcpServers": {
      "jusho": {
        "url": "https://api.jusho.dev/mcp"
      }
    }
  }
}
```

---

## GET /

Root endpoint returning service information.

```bash
curl https://api.jusho.dev/
```

### Response (200)

```json
{
  "status": "ok",
  "service": "address-normalizer",
  "version": "0.3.6",
  "mcp_available": true
}
```

---

## Response Field Reference

### `address` object

| Field | Type | Description |
|-------|------|-------------|
| `full` | string | Full normalized address string |
| `pref` | string | Prefecture (kenall-preferred for delivery use cases) |
| `city` | string | City / ward / municipality |
| `town` | string | Town area including chome (kokudo-derived, includes street-level detail) |
| `koaza` | string | Sub-area (koaza) |
| `banchi` | string | Block number |
| `go` | string | House/lot number |
| `building` | string | Building name, floor, room |

### `address_variants` object

Different data sources may write the same address differently. For example, `袖ケ浦市` (KEN_ALL / Japan Post) vs `袖ヶ浦市` (KOKUDO / MLIT).

| Field | Type | Description |
|-------|------|-------------|
| `kokudo.pref` | string | Prefecture per MLIT data |
| `kokudo.city` | string | City per MLIT data |
| `kokudo.town` | string | Town per MLIT data |
| `kenall.pref` | string | Prefecture per Japan Post data |
| `kenall.city` | string | City per Japan Post data |
| `kenall.town` | string | Town per Japan Post data |

**When to use which variant:**
- `kokudo`: MLIT API integration, GIS applications, administrative code lookups
- `kenall`: Delivery service auto-fill, postal code searches, shipping label generation

### `kana` object

| Field | Type | Description |
|-------|------|-------------|
| `pref` | string | Prefecture reading in katakana |
| `city` | string | City reading in katakana |
| `town` | string | Town reading in katakana |

### `codes` object

| Field | Type | Description |
|-------|------|-------------|
| `post_code` | string | 7-digit postal code (no hyphen) |
| `pref_code` | string | JIS prefecture code (e.g. `"13"` for Tokyo) |
| `city_code` | string | JIS municipality code (e.g. `"13101"`) |
| `town_code` | string | Town area code from MLIT data |

### `geo` object

| Field | Type | Description |
|-------|------|-------------|
| `lat` | string | Latitude (decimal degrees, WGS84) |
| `lng` | string | Longitude (decimal degrees, WGS84) |

Coordinates come from MLIT data and represent the block/town-level centroid.

### `meta` object

| Field | Type | Description |
|-------|------|-------------|
| `match_type` | string | `"address"`, `"building"`, or `"jigyosyo"` |
| `is_jigyosyo` | boolean | True if matched via business office dictionary |
| `is_tatemono` | boolean | True if matched via large building dictionary |
| `version` | string | API version |

---

## Rate Limit Headers

All normalization responses include these headers:

| Header | Description |
|--------|-------------|
| `X-RateLimit-Global-Remaining` | Number of requests remaining in the current hour window |
| `X-RateLimit-Global-Reset` | Seconds until the global counter resets |

When rate-limited (HTTP 429):

| Header | Description |
|--------|-------------|
| `Retry-After` | Seconds to wait before retrying |

---

## CORS

The API allows cross-origin requests from any origin (`Access-Control-Allow-Origin: *`), making it safe to call directly from browser-side JavaScript.

---

## Cold Start

The first request to a new instance loads dictionary data into memory, which may take several seconds. Use `POST /warmup` to trigger this loading proactively, or call `GET /ready` to check the loading status.
