# Getting Started with Jusho

Jusho is a Japanese address normalization API that converts free-form address strings into structured, validated data with postal codes, administrative codes, geographic coordinates, and kana readings.

## Base URL

```
https://api.jusho.dev
```

## Quick Example

Normalize a Japanese address with a single HTTP request:

```bash
curl "https://api.jusho.dev/normalize?address=東京都千代田区千代田1-1"
```

Response:

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
    "kokudo": { "pref": "東京都", "city": "千代田区", "town": "千代田一丁目" },
    "kenall": { "pref": "東京都", "city": "千代田区", "town": "千代田" }
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

## How It Works

Jusho combines data from two authoritative Japanese government sources:

| Source | Provider | Use Case |
|--------|----------|----------|
| **KOKUDO** | Ministry of Land, Infrastructure, Transport and Tourism (MLIT) | GIS data, administrative codes, lat/lng coordinates |
| **KEN_ALL** | Japan Post | Postal codes, kana readings, delivery address matching |

Additionally, Jusho includes two specialized dictionaries:

| Dictionary | Description | Example |
|------------|-------------|---------|
| **Jigyosyo** (Business Office) | Dedicated postal codes for large-volume mail offices | `"宮内庁"` (Imperial Household Agency) |
| **Tatemono** (Large Building) | Per-floor postal codes for large buildings | `"六本木ヒルズ森タワー30F"` |

## Supported Input Formats

Jusho handles various Japanese address formats:

```bash
# Full address with prefecture
curl "https://api.jusho.dev/normalize?address=東京都千代田区千代田1-1"

# Business office name
curl -X POST https://api.jusho.dev/normalize \
  -H "Content-Type: application/json" \
  -d '{"address": "宮内庁"}'

# Building name with floor
curl -X POST https://api.jusho.dev/normalize \
  -H "Content-Type: application/json" \
  -d '{"address": "六本木ヒルズ森タワー30F"}'

# Address without prefecture (auto-detected)
curl "https://api.jusho.dev/normalize?address=渋谷区道玄坂1-2-3"
```

## SDKs

Official SDKs are available for:

- **TypeScript/JavaScript**: `npm install normal-jusho` -- See [TypeScript SDK Guide](sdk-typescript.md)
- **Python**: `pip install normal-jusho` -- See [Python SDK Guide](sdk-python.md)

## MCP Integration

Jusho supports the Model Context Protocol (MCP) for AI assistant integration. See the [MCP Integration Guide](mcp-integration.md).

## AI Agents / LLMs / OCR

Addresses coming from LLMs, OCR, voice input, and AI agents often contain mixed numerals, inconsistent separators, and regional formats.

Instead of asking an agent to guess a normalized address, extract the address candidate and pass it to Jusho for normalization and structured data.

- [AI Agent / LLM / OCR Guide](ai-agents.md) -- Use Jusho in agent, MCP, OpenAPI, and OCR workflows
- [MCP Integration Guide](mcp-integration.md) -- Connect from Claude Desktop, Cursor, and other MCP clients

## Interactive Documentation

Explore the API interactively:

- **Swagger UI**: [https://api.jusho.dev/docs](https://api.jusho.dev/docs)
- **ReDoc**: [https://api.jusho.dev/redoc](https://api.jusho.dev/redoc)
- **OpenAPI spec**: [https://api.jusho.dev/openapi.json](https://api.jusho.dev/openapi.json)

## Rate Limits

| Scope | Limit |
|-------|-------|
| Per IP | 100 requests/minute |
| Global | 50,000 requests/hour |

When rate-limited, the API returns HTTP 429 with `Retry-After` and `X-RateLimit-Global-Remaining` headers.

## Next Steps

- [Full API Reference](api-reference.md) -- All endpoints, parameters, and response fields
- [AI Agent / LLM / OCR Guide](ai-agents.md) -- Handle Japanese addresses safely in AI workflows
- [TypeScript SDK](sdk-typescript.md) -- Use Jusho in Node.js or browser apps
- [Python SDK](sdk-python.md) -- Use Jusho in Python applications
- [FAQ](faq.md) -- Common questions and troubleshooting
