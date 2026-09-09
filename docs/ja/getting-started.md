# Jusho クイックスタートガイド

Jusho は日本の住所正規化APIです。自由形式の住所文字列を、郵便番号・行政コード・緯度経度・カナ読みなどの構造化データに変換します。

## ベースURL

```
https://api.jusho.dev
```

## 簡単な例

HTTPリクエスト一つで住所を正規化できます。

```bash
curl "https://api.jusho.dev/normalize?address=東京都千代田区千代田1-1"
```

レスポンス:

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

## データソース

Jusho は以下の政府公開データを組み合わせて使用しています。

| ソース | 提供元 | 用途 |
|--------|--------|------|
| **KOKUDO** | 国土交通省（位置参照情報） | 緯度経度、行政コード、詳細住所データ |
| **KEN_ALL** | 日本郵便（郵便番号データ） | 郵便番号、カナ読み、配送用住所マッチング |

さらに、2つの特殊辞書を搭載しています。

| 辞書 | 説明 | 例 |
|------|------|-----|
| **事業所辞書** | 大口事業所個別郵便番号（約23,000件） | `"宮内庁"` → 〒100-8111 |
| **大型建物辞書** | 階別郵便番号を持つ大型ビル（約86棟） | `"六本木ヒルズ森タワー30F"` → 〒106-6130 |

## 対応する入力形式

```bash
# 都道府県付きフル住所
curl "https://api.jusho.dev/normalize?address=東京都千代田区千代田1-1"

# 事業所名
curl -X POST https://api.jusho.dev/normalize \
  -H "Content-Type: application/json" \
  -d '{"address": "宮内庁"}'

# ビル名＋階数
curl -X POST https://api.jusho.dev/normalize \
  -H "Content-Type: application/json" \
  -d '{"address": "六本木ヒルズ森タワー30F"}'

# 都道府県省略（自動判定）
curl "https://api.jusho.dev/normalize?address=渋谷区道玄坂1-2-3"
```

## 一括処理

最大100件の住所を1リクエストで処理できます。

```bash
curl -X POST https://api.jusho.dev/normalize/batch \
  -H "Content-Type: application/json" \
  -d '{
    "addresses": [
      "東京都千代田区千代田1-1",
      "大阪府大阪市北区梅田1-1-1"
    ]
  }'
```

## SDK

公式SDKを用意しています。

### TypeScript / JavaScript

```bash
npm install normal-jusho
```

```typescript
import { Jusho } from 'normal-jusho';

const jusho = new Jusho();
const result = await jusho.normalize('東京都千代田区千代田1-1');
console.log(result.codes.post_code);  // "1000001"
```

### Python

```bash
pip install normal-jusho
```

```python
from jusho import Jusho

client = Jusho()
result = client.normalize("東京都千代田区千代田1-1")
print(result.codes.post_code)  # "1000001"
```

## MCP連携

AI アシスタント（Claude、Cursor等）から直接住所正規化を利用できます。詳しくは [MCP連携ガイド](mcp-integration.md) をご覧ください。

## AI Agent / LLM / OCR で使う

LLM、OCR、音声入力、AI Agent から来る住所は、全角半角・漢数字・番地表記・地域固有表記によって揺れやすくなります。

AI Agent に住所を推測させて保存するのではなく、住所候補を抽出したあと Jusho に渡して正規化・構造化する使い方を推奨します。

- [AI Agent / LLM / OCR向けガイド](ai-agents.md) -- Agent、MCP、OpenAPI、OCR後処理での使い方
- [MCP連携ガイド](mcp-integration.md) -- Claude Desktop、Cursor等からの利用方法

## レート制限

| スコープ | 制限 |
|----------|------|
| IP単位 | 100リクエスト/分 |
| グローバル | 50,000リクエスト/時 |

制限超過時はHTTP 429が返されます。`Retry-After` ヘッダーで再試行までの秒数を確認できます。

## インタラクティブドキュメント

APIをブラウザから試すことができます。

- **Swagger UI**: [https://api.jusho.dev/docs](https://api.jusho.dev/docs)
- **ReDoc**: [https://api.jusho.dev/redoc](https://api.jusho.dev/redoc)
- **OpenAPI仕様**: [https://api.jusho.dev/openapi.json](https://api.jusho.dev/openapi.json)

## 次のステップ

- [API リファレンス](api-reference.md) -- 全エンドポイント・パラメータ・レスポンスフィールドの詳細
- [AI Agent / LLM / OCR向けガイド](ai-agents.md) -- AIワークフローで住所を安全に扱う方法
- [MCP連携ガイド](mcp-integration.md) -- AIアシスタントとの連携方法
