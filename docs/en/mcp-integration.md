# MCP (Model Context Protocol) Integration

Jusho provides a built-in MCP server that allows AI assistants such as Claude, Cursor, and other MCP-compatible clients to normalize Japanese addresses directly through natural language.

The recommended pattern is to let the assistant extract address candidates, then call the `normalize_address` tool for normalization and structured data instead of guessing or rewriting the address by itself.

## What is MCP?

The Model Context Protocol (MCP) is a standard for connecting AI assistants to external tools and data sources. With Jusho's MCP integration, an AI assistant can:

- Normalize Japanese addresses on demand
- Look up postal codes
- Resolve business office names to addresses
- Identify building addresses with per-floor postal codes

## Client Configuration

### Claude Desktop

Add to your Claude Desktop MCP configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "jusho": {
      "url": "https://api.jusho.dev/mcp"
    }
  }
}
```

### Cursor

Add to your Cursor MCP settings:

```json
{
  "mcpServers": {
    "jusho": {
      "url": "https://api.jusho.dev/mcp"
    }
  }
}
```

### Generic MCP Client

Any MCP-compatible client that supports Streamable HTTP transport can connect to:

```
https://api.jusho.dev/mcp
```

## Available Tools

Once connected, the MCP server exposes the following tool:

### `normalize_address`

Normalize a Japanese address string and return structured data.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `address` | string | Japanese address, business name, or building name |

**Returns:**

A structured dict with the following top-level keys:

- `address` -- Normalized address components (pref, city, town, banchi, etc.)
- `address_variants` -- Source-specific representations (kokudo vs kenall)
- `kana` -- Katakana readings
- `codes` -- Postal code, prefecture code, city code, town code
- `geo` -- Latitude and longitude
- `meta` -- Match type, version info

Returns `None` if the address cannot be matched.

## Usage Examples

Once configured, you can ask your AI assistant questions like:

- "What is the postal code for 東京都千代田区千代田1-1?"
- "Normalize this address: 大阪府大阪市北区梅田1-1-1"
- "Look up the address for 宮内庁"
- "What is the postal code for 六本木ヒルズ森タワー 30th floor?"
- "Convert this address to structured data: 渋谷区道玄坂1-2-3"

The AI assistant will call the `normalize_address` tool and return the structured result.

## Recommended Agent Workflow

```text
User input / OCR / business card image / application form
  -> AI agent extracts address candidates
  -> Agent calls Jusho MCP normalize_address
  -> Store normalized address, postal code, administrative codes, etc.
  -> Route failed or ambiguous cases to human review
```

Use instructions like:

```text
Before saving an address, always normalize it with Jusho's normalize_address tool.
If normalization fails or is ambiguous, keep the original input and route it to human review.
Do not infer or overwrite address data only by guessing.
```

For LLM, OCR, and OpenAPI tool workflows, see the [AI Agent / LLM / OCR Guide](ai-agents.md).

## Checking MCP Status

You can verify that MCP is available on the server:

```bash
curl https://api.jusho.dev/mcp-status
```

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

## Troubleshooting

### MCP not available

If `/mcp-status` returns `"available": false`, retry later or contact the service operator via [Contact](https://jusho.dev/contact).

### Connection refused

Ensure your MCP client is configured with the correct URL (`https://api.jusho.dev/mcp`) and supports Streamable HTTP transport.

### First request is slow

The first MCP tool call triggers dictionary data loading, which may take several seconds. Subsequent calls are fast. You can warm up the server by calling `POST /warmup` on the REST API.
