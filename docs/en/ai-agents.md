# AI Agent / LLM / OCR Guide

Jusho is a Japanese address normalization API for AI agents, MCP clients, OCR pipelines, voice input, and SaaS forms.

The recommended pattern is simple: let the LLM extract address candidates, then pass those candidates to Jusho for normalization and structured data.

## Why use a dedicated address tool

Japanese addresses often contain:

- Mixed full-width numbers, half-width numbers, and kanji numerals
- Different block formats such as `1-2-3`, `1丁目2番3号`, and `一丁目二番三号`
- Variant spellings such as `ヶ`, `ケ`, and `が`
- OCR mistakes such as kanji `二` being read as katakana `ニ`
- Hyphen-like separators including hyphen-minus, full-width hyphen, minus signs, and long vowel marks
- Missing prefectures or even missing municipality names
- Postal codes mixed into the address string
- Conversion to Japan Post address notation for form auto-fill
- Regional formats such as Kyoto street names, Sapporo blocks, and Hokkaido line/number addresses
- Business office names and large buildings that map to dedicated postal codes
- Business or branch names that include prefecture or municipality names
- Ambiguous municipality names such as Fuchu-shi and Date-shi

LLMs can produce natural-looking address strings, but they do not guarantee authoritative matching, match granularity, or preservation of unresolved input.

For business workflows, normalize addresses with a dedicated API before storing them.

## Recommended Architecture

```text
User input / OCR / voice input / image
  -> LLM extracts address candidates
  -> Jusho normalizes and structures the address
  -> CRM / delivery / billing / real estate DB / SaaS stores the result
```

Use the LLM for extraction. Use Jusho for normalization, structuring, and address matching.

## Use the REST API

```bash
curl -G "https://api.jusho.dev/normalize" \
  --data-urlencode "address=東京都渋谷区渋谷２ー２１ー１"
```

For batch processing:

```bash
curl -X POST "https://api.jusho.dev/normalize/batch" \
  -H "Content-Type: application/json" \
  -d '{
    "addresses": [
      "東京都渋谷区渋谷２ー２１ー１",
      "京都市中京区御幸町通二条下る山本町"
    ]
  }'
```

## Use MCP

For MCP-compatible clients, configure:

```json
{
  "mcpServers": {
    "jusho": {
      "url": "https://api.jusho.dev/mcp"
    }
  }
}
```

Tell your agent to call the `normalize_address` tool instead of rewriting addresses by itself.

```text
Extract the address from this business card image, normalize it with Jusho's normalize_address tool, then save the structured result to the CRM.
If normalization fails, keep the original input and route it to human review.
```

See the [MCP Integration Guide](mcp-integration.md) for details.

## Use OpenAPI Tools

For OpenAPI-compatible agent toolchains, load:

- OpenAPI: [https://api.jusho.dev/openapi.json](https://api.jusho.dev/openapi.json)
- Swagger UI: [https://api.jusho.dev/docs](https://api.jusho.dev/docs)
- ReDoc: [https://api.jusho.dev/redoc](https://api.jusho.dev/redoc)

Agents can send free-form address strings to `/normalize` or `/normalize/batch`.

## OCR Post-Processing

OCR often produces inconsistent numerals and separators.

```text
東京都渋谷区渋谷２ー２１ー１
東京都渋谷区渋谷2-21-1
東京都渋谷区渋谷二丁目二十一番一号
東京都渋谷区渋谷ニ丁目21-1
```

OCR can read kanji `二` as katakana `ニ`, and hyphen-like separators may be mixed as half-width hyphens, full-width hyphens, minus signs, or Japanese long vowel marks.

Do not store OCR output directly. Normalize it with Jusho before saving it to your downstream system.

Keep the original input string as well. It helps with manual review and future reprocessing.

## Human Input Pitfalls

Human-entered addresses often omit parts or include extra clues.

```text
渋谷区渋谷2-21-1
丸の内1-9-1
〒150-0002 渋谷区渋谷2-21-1
府中市宮西町2-24
伊達市保原町...
```

The prefecture may be missing, the municipality may be missing, a postal code may be included, or a municipality name may exist in multiple prefectures.

Business office names and branch names can also contain prefecture or municipality names. Keep the original input string and avoid overwriting it with an inferred normalized address when the match is ambiguous.

## Form Auto-Fill Pitfalls

Address forms and delivery systems often use address masters based on Japan Post notation.

For example, notation can differ between `袖ケ浦市` and `袖ヶ浦市` depending on the data source. An address may be correct, but still rejected by a form that validates against exact option labels.

```text
Input address
  -> identify the address
  -> normalize to an MLIT-style notation
  -> convert to Japan Post notation when needed
  -> submit to the target form or delivery system
```

If the downstream system expects Japan Post notation, normalize first, then convert the output to the notation expected by that system.

## Pre-Save Checklist

- Store the original input string
- Store the normalized address
- Store prefecture, city, town, block, and house number separately
- Convert to Japan Post notation when the target system expects it
- Store postal code, administrative codes, and coordinates if needed
- Route failed or ambiguous normalization cases to human review
- Make sure the agent does not silently invent or overwrite address data

## Links

- [Getting Started](getting-started.md)
- [API Reference](api-reference.md)
- [MCP Integration Guide](mcp-integration.md)
- [OpenAPI spec](https://api.jusho.dev/openapi.json)
