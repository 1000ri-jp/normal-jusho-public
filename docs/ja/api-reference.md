# API リファレンス

ベースURL: `https://api.jusho.dev`

全レスポンスは `Content-Type: application/json; charset=utf-8` で、日本語はエスケープせずそのまま返されます。

---

## POST /normalize

住所文字列を正規化し、構造化データを返します。

### リクエスト

**Content-Type**: `application/json`

| フィールド | 型 | 必須 | 説明 |
|------------|------|------|------|
| `address` | string | はい | 正規化対象の住所文字列 |

```bash
curl -X POST https://api.jusho.dev/normalize \
  -H "Content-Type: application/json" \
  -d '{"address": "東京都千代田区千代田1-1"}'
```

### レスポンス (200)

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

### エラーレスポンス

| ステータス | 説明 |
|------------|------|
| 404 | 住所が見つからない |
| 422 | バリデーションエラー（空リクエスト等） |
| 429 | レート制限超過 |

---

## GET /normalize

クエリパラメータで住所を正規化します。

| パラメータ | 型 | 必須 | 説明 |
|------------|------|------|------|
| `address` | string | はい | URLエンコード済みの住所文字列 |

```bash
curl "https://api.jusho.dev/normalize?address=東京都千代田区千代田1-1"
```

レスポンス形式は `POST /normalize` と同一です。

---

## POST /normalize/batch

最大100件の住所を一括正規化します。

### リクエスト

**Content-Type**: `application/json`

| フィールド | 型 | 必須 | 説明 |
|------------|------|------|------|
| `addresses` | string[] | はい | 住所文字列の配列（1〜100件） |

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

### レスポンス (200)

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
    }
  ]
}
```

個別の住所が見つからない場合でも、バッチリクエスト全体はエラーになりません。各アイテムの `success` フラグと `result` / `error` を確認してください。

---

## GET /health

ヘルスチェックエンドポイント（Cloud Run、Kubernetes等の監視用）。

```bash
curl https://api.jusho.dev/health
```

```json
{ "status": "healthy" }
```

---

## GET /ready

辞書データの読み込み状況を確認します。

```bash
curl https://api.jusho.dev/ready
```

```json
{ "status": "ready", "data_loaded": true }
```

`status` の値: `"ready"`, `"loading"`, `"not_loaded"`

---

## POST /warmup

辞書データのバックグラウンド読み込みを開始します。コールドスタート回避に使用します。

```bash
curl -X POST https://api.jusho.dev/warmup
```

```json
{ "status": "loading_started" }
```

---

## GET /rate-limit-status

現在のレート制限状況を取得します。

```bash
curl https://api.jusho.dev/rate-limit-status
```

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

MCP（Model Context Protocol）の利用可否を確認します。

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

---

## GET /

サービス情報を返すルートエンドポイント。

```bash
curl https://api.jusho.dev/
```

```json
{
  "status": "ok",
  "service": "address-normalizer",
  "version": "0.3.6",
  "mcp_available": true
}
```

---

## レスポンスフィールド詳細

### `address` オブジェクト

| フィールド | 型 | 説明 |
|------------|------|------|
| `full` | string | 正規化された住所全体 |
| `pref` | string | 都道府県（kenall優先） |
| `city` | string | 市区町村（kenall優先） |
| `town` | string | 町域（大字＋丁目、kokudo由来） |
| `koaza` | string | 小字 |
| `banchi` | string | 番地 |
| `go` | string | 号 |
| `building` | string | 建物名 |

### `address_variants` オブジェクト

同じ住所でもデータソースによって表記が異なる場合があります。

例: `袖ケ浦市`（郵便局データ）vs `袖ヶ浦市`（国土交通省データ）

| フィールド | 説明 | 用途 |
|------------|------|------|
| `kokudo` | 国土交通省表記 | GIS・行政コード取得・国交省API連携 |
| `kenall` | 郵便局表記 | 配送業者サイト自動入力・郵便番号検索 |

### `kana` オブジェクト

| フィールド | 型 | 説明 |
|------------|------|------|
| `pref` | string | 都道府県カナ |
| `city` | string | 市区町村カナ |
| `town` | string | 町域カナ |

### `codes` オブジェクト

| フィールド | 型 | 説明 |
|------------|------|------|
| `post_code` | string | 郵便番号（7桁、ハイフンなし） |
| `pref_code` | string | 都道府県コード（例: `"13"`） |
| `city_code` | string | 市区町村コード（例: `"13101"`） |
| `town_code` | string | 町域コード（国土交通省データ由来） |

### `geo` オブジェクト

| フィールド | 型 | 説明 |
|------------|------|------|
| `lat` | string | 緯度（十進法、WGS84） |
| `lng` | string | 経度（十進法、WGS84） |

座標は国土交通省データに基づく街区・町域レベルの代表点です。

### `meta` オブジェクト

| フィールド | 型 | 説明 |
|------------|------|------|
| `match_type` | string | `"address"`, `"building"`, `"jigyosyo"` |
| `is_jigyosyo` | boolean | 事業所辞書でマッチした場合 true |
| `is_tatemono` | boolean | 大型ビル辞書でマッチした場合 true |
| `version` | string | APIバージョン |

---

## レート制限ヘッダー

正規化レスポンスには以下のヘッダーが付与されます。

| ヘッダー | 説明 |
|----------|------|
| `X-RateLimit-Global-Remaining` | 現在の時間枠での残りリクエスト数 |
| `X-RateLimit-Global-Reset` | グローバルカウンターがリセットされるまでの秒数 |

レート制限超過時（HTTP 429）:

| ヘッダー | 説明 |
|----------|------|
| `Retry-After` | 再試行までの待機秒数 |

---

## CORS

APIは全オリジンからのクロスオリジンリクエストを許可しています（`Access-Control-Allow-Origin: *`）。ブラウザのJavaScriptから直接呼び出せます。

---

## コールドスタート

新しいインスタンスへの初回リクエスト時に辞書データをメモリに読み込むため、数秒かかることがあります。`POST /warmup` で事前読み込みを開始するか、`GET /ready` で読み込み状況を確認してください。
