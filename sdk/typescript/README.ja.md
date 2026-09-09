# jusho

[Jusho](https://jusho.dev) 日本住所正規化APIの TypeScript/JavaScript SDK です。

日本の住所を正規化・検証・検索できます。TypeScript型定義付き、ランタイム依存なし、Node.jsとブラウザの両方に対応しています。

[English README](./README.md)

## 特徴

- ランタイム依存なし（ネイティブ `fetch` を使用）
- TypeScript型定義付き
- ESM / CommonJS 両対応
- Node.js 18+ およびモダンブラウザで動作
- 型付きエラークラスによる正確なエラーハンドリング
- タイムアウト・ベースURLの設定可能

## インストール

```bash
npm install normal-jusho
```

```bash
yarn add normal-jusho
```

```bash
pnpm add normal-jusho
```

## クイックスタート

```typescript
import { Jusho } from 'jusho';

const jusho = new Jusho();

const result = await jusho.normalize('東京都千代田区千代田1-1');
console.log(result.address.pref);      // '東京都'
console.log(result.address.city);      // '千代田区'
console.log(result.codes.post_code);   // '1000001'
console.log(result.geo.lat);           // 緯度
```

## 使い方

### クライアントの作成

```typescript
import { Jusho } from 'jusho';

// デフォルト設定
const jusho = new Jusho();

// カスタム設定
const jusho = new Jusho({
  baseUrl: 'https://api.jusho.dev',
  timeout: 10000, // 10秒
  headers: { 'X-Custom-Header': 'value' },
});
```

### 単一住所の正規化

```typescript
const result = await jusho.normalize('東京都渋谷区道玄坂1-2-3');

// 住所コンポーネント
console.log(result.address.full);     // 正規化された住所全体
console.log(result.address.pref);     // 都道府県
console.log(result.address.city);     // 市区町村
console.log(result.address.town);     // 町域
console.log(result.address.banchi);   // 番地
console.log(result.address.go);       // 号
console.log(result.address.building); // 建物名

// コード
console.log(result.codes.post_code);  // 郵便番号（7桁）
console.log(result.codes.pref_code);  // 都道府県コード
console.log(result.codes.city_code);  // 市区町村コード

// カナ
console.log(result.kana.pref);        // 都道府県カナ
console.log(result.kana.city);        // 市区町村カナ

// 座標
console.log(result.geo.lat);          // 緯度
console.log(result.geo.lng);          // 経度

// データソース別表記
console.log(result.address_variants.kokudo.city); // 国土交通省表記
console.log(result.address_variants.kenall.city); // 郵便局表記
```

### 一括正規化

```typescript
const results = await jusho.normalizeBatch([
  '東京都千代田区千代田1-1',
  '大阪府大阪市北区梅田1-1-1',
  '北海道札幌市中央区北1条西2丁目',
]);

console.log(results.total);         // 3
console.log(results.success_count); // 成功件数
console.log(results.error_count);   // 失敗件数

for (const item of results.results) {
  if (item.success) {
    console.log(item.result!.address.full);
  } else {
    console.error(`失敗: ${item.input} - ${item.error}`);
  }
}
```

### 郵便番号検索

```typescript
const result = await jusho.postal('1500043');
console.log(result.address.pref); // '東京都'
console.log(result.address.city); // '渋谷区'
```

### 住所候補の取得

```typescript
const result = await jusho.suggest('渋谷区道玄');
for (const suggestion of result.suggestions) {
  console.log(suggestion.address, suggestion.postal_code);
}
```

### 住所の検証

```typescript
const result = await jusho.validate('東京都渋谷区道玄坂1-2-3');
console.log(result.valid);       // true
console.log(result.match_level); // 'full'
if (result.normalized) {
  console.log(result.normalized.codes.post_code);
}
```

### 逆引き検索

```typescript
const result = await jusho.reverse('東京都渋谷区道玄坂1-2-3');
console.log(result.postal_code); // '1500043'
```

## エラーハンドリング

SDKは型付きエラークラスを提供しており、正確なエラーハンドリングが可能です。

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
    // 住所が見つからない（HTTP 404）
    console.error('住所が見つかりません:', error.message);
  } else if (error instanceof RateLimitError) {
    // レート制限超過（HTTP 429）
    console.error('レート制限超過。再試行まで:', error.retryAfterSeconds, '秒');
  } else if (error instanceof TimeoutError) {
    // タイムアウト
    console.error('タイムアウト:', error.timeoutMs, 'ms');
  } else if (error instanceof NetworkError) {
    // ネットワークエラー（DNS障害、接続拒否など）
    console.error('ネットワークエラー:', error.message);
  } else if (error instanceof ValidationError) {
    // 不正なリクエスト（HTTP 422）
    console.error('不正なリクエスト:', error.message);
  } else if (error instanceof JushoError) {
    // その他のAPIエラー
    console.error('APIエラー:', error.statusCode, error.message);
  }
}
```

## エラークラス一覧

| クラス | HTTPステータス | 説明 |
|--------|---------------|------|
| `JushoError` | 全般 | 全SDKエラーの基底クラス |
| `NetworkError` | N/A | ネットワーク障害（DNS、接続等） |
| `TimeoutError` | N/A | リクエストタイムアウト |
| `RateLimitError` | 429 | レート制限超過 |
| `NotFoundError` | 404 | 住所が見つからない |
| `ValidationError` | 422 | 不正なリクエストパラメータ |

## CommonJS での使用

```javascript
const { Jusho } = require('jusho');

const jusho = new Jusho();
const result = await jusho.normalize('東京都千代田区千代田1-1');
```

## APIリファレンス

### `new Jusho(options?)`

| オプション | 型 | デフォルト | 説明 |
|-----------|------|-----------|------|
| `baseUrl` | `string` | `https://api.jusho.dev` | APIベースURL |
| `timeout` | `number` | `30000` | リクエストタイムアウト（ミリ秒） |
| `headers` | `Record<string, string>` | `{}` | カスタムリクエストヘッダー |

### メソッド

| メソッド | 説明 |
|---------|------|
| `normalize(address)` | 単一住所を正規化 |
| `normalizeBatch(addresses)` | 最大100件の住所を一括正規化 |
| `postal(code)` | 郵便番号から住所を検索 |
| `suggest(query)` | 住所候補を取得 |
| `validate(address)` | 住所を検証 |
| `reverse(address)` | 住所から郵便番号を逆引き |

## ライセンス

MIT
