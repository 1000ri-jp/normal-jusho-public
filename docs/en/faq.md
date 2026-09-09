# Frequently Asked Questions

## General

### What is Jusho?

Jusho is a Japanese address normalization API. It takes free-form Japanese address strings and returns structured, validated data including postal codes, administrative codes, geographic coordinates, and kana readings.

### What data sources does Jusho use?

Jusho combines data from two authoritative government sources:

- **KOKUDO** (Ministry of Land, Infrastructure, Transport and Tourism / MLIT): Provides geographic coordinates, administrative codes, and detailed address data down to the block level.
- **KEN_ALL** (Japan Post): Provides postal codes, kana readings, and delivery-oriented address data.

Additionally, two specialized dictionaries are included:

- **Jigyosyo**: Business offices with dedicated postal codes (~23,000 entries).
- **Tatemono**: Large buildings with per-floor postal codes (~86 buildings).

### Is Jusho free?

The public API at `api.jusho.dev` is free to use within the rate limits (100 requests/minute per IP, 50,000 requests/hour globally).

### What license is Jusho under?

The API documentation, client SDKs, and minimal examples in this repository are released under the MIT License. The hosted API service and its implementation are not distributed by this repository.

---

## API Usage

### What address formats are supported?

Jusho handles many Japanese address formats:

- Full addresses: `"東京都千代田区千代田1-1"`
- Without prefecture: `"渋谷区道玄坂1-2-3"` (auto-detected)
- With various number formats: `"千代田区千代田一丁目1番1号"`
- Business office names: `"宮内庁"`, `"株式会社日立製作所"`
- Building names with floors: `"六本木ヒルズ森タワー30F"`
- Mixed formats: `"大阪市北区梅田1-1-1"`

### Why are `address.pref` and `address_variants.kokudo.pref` different?

The `address` object uses kenall (Japan Post) as the preferred source for `pref` and `city`, since these are most commonly used for delivery and postal purposes. The `address_variants` object provides both kokudo (MLIT) and kenall representations so you can choose the appropriate one.

For example, the city `袖ケ浦市` is written with `ケ` (katakana ke) in Japan Post data but `ヶ` (small katakana ke) in MLIT data.

### What does `match_type` mean?

| Value | Description |
|-------|-------------|
| `"address"` | Matched via standard address data (MLIT + Japan Post) |
| `"building"` | Matched via the large building dictionary (per-floor postal codes) |
| `"jigyosyo"` | Matched via the business office dictionary (dedicated postal codes) |

### What is the matching order?

The API tries to match in this order:

1. **Jigyosyo** (business offices) -- For names like "宮内庁", "日本銀行"
2. **Tatemono** (large buildings) -- For names like "六本木ヒルズ森タワー"
3. **Standard address** -- For regular street addresses using MLIT + Japan Post data

### What happens if an address is not found?

The API returns HTTP 404 with a JSON error body:

```json
{
  "detail": "住所が見つかりませんでした: <input>"
}
```

In batch mode, individual failures are reported per-item with `success: false` and an `error` message, while the batch itself returns HTTP 200.

### Are coordinates accurate?

Coordinates come from MLIT data and represent the block or town-level centroid. They are not pinpoint building-level coordinates. Accuracy is typically within a few hundred meters for block-level matches and within a few kilometers for town-level matches.

### How do I handle rate limiting?

When rate-limited (HTTP 429), check the `Retry-After` header for the number of seconds to wait. The `X-RateLimit-Global-Remaining` header shows how many requests remain in the current hour.

```bash
# Check current rate limit status
curl https://api.jusho.dev/rate-limit-status
```

---

## Performance

### Why is the first request slow?

The first request to a fresh server instance triggers loading of dictionary data. This takes several seconds. Subsequent requests are fast.

To avoid cold-start delays:

```bash
# Trigger background data loading
curl -X POST https://api.jusho.dev/warmup

# Check if data is loaded
curl https://api.jusho.dev/ready
```

### How fast are subsequent requests?

After data is loaded, normalization typically completes in a few milliseconds.

### Should I use GET or POST for single addresses?

Both `GET /normalize?address=...` and `POST /normalize` return identical results. Use GET for simple integrations and testing. Use POST when the address contains characters that are difficult to URL-encode or when you want a cleaner API interface.

### When should I use batch mode?

Use `POST /normalize/batch` when you have multiple addresses to process. It accepts up to 100 addresses per request and is more efficient than making 100 individual requests.

---

## Data

### How often is the data updated?

The underlying government data is typically updated monthly:

- **KEN_ALL** (Japan Post): Updated monthly at [https://www.post.japanpost.jp/zipcode/download.html](https://www.post.japanpost.jp/zipcode/download.html)
- **KOKUDO** (MLIT): Updated periodically at [https://nlftp.mlit.go.jp/isj/](https://nlftp.mlit.go.jp/isj/)

### Does Jusho handle address changes from municipal mergers?

Yes, Jusho includes corrections for known municipal mergers. For example, Hamamatsu City's ward restructuring (2024) is handled, where former Naka-ku, Higashi-ku, Nishi-ku, and Minami-ku were merged into Chuo-ku.

### Does Jusho support Kyoto-style addresses?

Yes. Kyoto addresses with "toorina" (street intersection references like "上ル", "下ル", "東入", "西入") are recognized and preserved.

---

## Integration

### Can I use Jusho from a browser?

Yes. The API supports CORS (`Access-Control-Allow-Origin: *`), so you can call it directly from client-side JavaScript. The TypeScript SDK works in both Node.js and browsers.

### Does Jusho support MCP (Model Context Protocol)?

Yes. Jusho has a built-in MCP server at `/mcp`. See the [MCP Integration Guide](mcp-integration.md) for configuration details.

### Does this repository include a self-hosted server?

No. This repository contains API usage documentation, client SDKs, and minimal examples. Server implementation, dictionary generation and updates, and deployment tooling are not included.

---

## Troubleshooting

### I get `422 Validation Error`

Ensure you are sending a valid JSON body for POST requests:

```bash
# Correct
curl -X POST https://api.jusho.dev/normalize \
  -H "Content-Type: application/json" \
  -d '{"address": "東京都千代田区千代田1-1"}'

# Wrong (missing Content-Type)
curl -X POST https://api.jusho.dev/normalize \
  -d '{"address": "東京都千代田区千代田1-1"}'
```

### I get `404 Not Found` for a valid address

Some edge cases may not be in the current dictionary data. If you believe an address should be found, check:

1. Is the address using standard Japanese notation?
2. Is the municipality name current (not a pre-merger name)?
3. Does the address include at least prefecture + city + town?

### Batch request returns mixed results

This is expected behavior. In batch mode, each address is processed independently. Some may succeed and others may fail. Check the `success` flag on each item in the `results` array.
