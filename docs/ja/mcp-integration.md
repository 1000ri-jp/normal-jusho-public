# MCP（Model Context Protocol）連携ガイド

JushoはMCPサーバーを内蔵しており、Claude、Cursor等のAIアシスタントから直接住所正規化を利用できます。

AIアシスタントに住所を推測させて保存するのではなく、住所候補を抽出したあと `normalize_address` ツールで正規化・構造化する使い方を推奨します。

## MCPとは

Model Context Protocol（MCP）は、AIアシスタントと外部ツール・データソースを接続するための標準プロトコルです。JushoのMCP連携により、AIアシスタントが以下のことを行えます。

- 日本語住所の正規化
- 郵便番号の検索
- 事業所名から住所の取得
- 大型ビルの階別郵便番号の取得

## クライアント設定

### Claude Desktop

Claude DesktopのMCP設定ファイルに以下を追加します。

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

CursorのMCP設定に以下を追加します。

```json
{
  "mcpServers": {
    "jusho": {
      "url": "https://api.jusho.dev/mcp"
    }
  }
}
```

### その他のMCPクライアント

Streamable HTTPトランスポートに対応した任意のMCPクライアントから接続可能です。

```
https://api.jusho.dev/mcp
```

## 利用可能なツール

MCP接続後、以下のツールが利用可能になります。

### `normalize_address`

住所文字列を正規化し、構造化データを返します。

**パラメータ:**

| パラメータ | 型 | 説明 |
|------------|------|------|
| `address` | string | 住所文字列、事業所名、またはビル名 |

**戻り値:**

以下のトップレベルキーを持つ辞書を返します。

- `address` -- 正規化された住所の構成要素（pref, city, town, banchi 等）
- `address_variants` -- ソース別住所表記（kokudo vs kenall）
- `kana` -- カタカナ読み
- `codes` -- 郵便番号、都道府県コード、市区町村コード、町域コード
- `geo` -- 緯度・経度
- `meta` -- マッチタイプ、バージョン情報

住所がマッチしない場合は `None` を返します。

## 使用例

設定完了後、AIアシスタントに以下のように質問できます。

- 「東京都千代田区千代田1-1の郵便番号は？」
- 「この住所を正規化して: 大阪府大阪市北区梅田1-1-1」
- 「宮内庁の住所を調べて」
- 「六本木ヒルズ森タワー30階の郵便番号は？」
- 「渋谷区道玄坂1-2-3を構造化データに変換して」

AIアシスタントが `normalize_address` ツールを呼び出し、構造化された結果を返します。

## AI Agentでの推奨ワークフロー

```text
ユーザー入力 / OCR / 名刺画像 / 申込書
  -> AI Agentが住所候補を抽出
  -> Jusho MCPの normalize_address を呼び出す
  -> 正規化済み住所、郵便番号、行政コードなどを保存
  -> 正規化できない場合は人間確認に回す
```

Agentには次のような指示を入れると安全です。

```text
住所を保存する前に、必ず Jusho の normalize_address ツールで正規化してください。
正規化できない場合や曖昧な場合は、元の入力文字列を残して人間確認に回してください。
住所を推測だけで補完して保存しないでください。
```

LLM / OCR / OpenAPI tool と組み合わせる場合は [AI Agent / LLM / OCR向けガイド](ai-agents.md) も参照してください。

## MCP状態の確認

MCPが利用可能かどうかをAPIで確認できます。

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

## トラブルシューティング

### MCPが利用不可

`/mcp-status` が `"available": false` を返す場合は、時間をおいて再試行するか、[お問い合わせ](https://jusho.dev/contact)から運営者にご連絡ください。

### 接続拒否

MCPクライアントに正しいURL（`https://api.jusho.dev/mcp`）が設定されていること、およびStreamable HTTPトランスポートに対応していることを確認してください。

### 初回リクエストが遅い

初回のMCPツール呼び出しで辞書データの読み込みが発生するため、数秒かかることがあります。REST APIの `POST /warmup` を呼び出して事前にウォームアップできます。
