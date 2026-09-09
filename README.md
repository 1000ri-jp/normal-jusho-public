# Jusho

LLM-safe Japanese address normalization API.

Jusho は、日本の住所を正規化・構造化するための API です。LLM、OCR、音声入力、AI Agent、フォーム入力から来る揺れた住所を、都道府県・市区町村・町域・番地・郵便番号・行政コード・緯度経度などの機械で扱いやすいデータに変換します。

## Why

日本の住所は、人間には読めても機械には扱いづらい形式が多くあります。

- `東京都渋谷区渋谷２ー２１ー１`
- `京都市中京区御幸町通二条下る山本町`
- `札幌市中央区南二条西1-5`
- `東京都中央区日本橋一丁目二番三〇一`
- `東京都渋谷区渋谷ニ丁目21-1`
- `〒150-0002 渋谷区渋谷2-21-1`
- `府中市宮西町2-24`
- `千葉県袖ケ浦市長浦駅前5-21`

LLM に住所を「それっぽく補正」させるだけでは、住所マスタとの照合、表記ゆれ吸収、同定粒度、未解決部分の扱いが曖昧になります。

フォーム自動入力や配送システムでは、日本郵便系の住所表記が期待されることもあります。Jusho は正規化だけでなく、必要に応じて郵便住所表記へ変換する用途も想定しています。

Jusho は、AI Agent 時代に日本住所を安全に扱うための専用正規化レイヤーです。

## 公開内容

- [日本語クイックスタート](docs/ja/getting-started.md) / [APIリファレンス](docs/ja/api-reference.md)
- [English guide](docs/en/getting-started.md) / [API reference](docs/en/api-reference.md)
- [TypeScript SDK](sdk/typescript/README.md) / [Python SDK](sdk/python/README.md)
- [最小利用サンプル](examples/normalize.sh)

## Quick Start

```bash
curl -G "https://api.jusho.dev/normalize" \
  --data-urlencode "address=東京都渋谷区渋谷２ー２１ー１"
```

レスポンス例:

```json
{
  "full_address": "東京都渋谷区渋谷二丁目21-1",
  "post_code": "1500002",
  "pref": "東京都",
  "city": "渋谷区",
  "town": "渋谷二丁目",
  "banchi": "21",
  "go": "1",
  "lat": "35.659609",
  "lng": "139.705829",
  "match_type": "address"
}
```

## AI Agent / MCP

MCP 対応クライアントでは、Jusho を `normalize_address` ツールとして利用できます。

```json
{
  "mcpServers": {
    "jusho": {
      "url": "https://api.jusho.dev/mcp"
    }
  }
}
```

推奨フロー:

```text
LLM / OCR が住所候補を抽出
  -> Jusho が正規化・構造化
  -> CRM / 配送 / 請求 / 物件DB などへ保存
```

## SDKs

TypeScript / JavaScript:

```bash
npm install normal-jusho
```

```typescript
import { Jusho } from 'normal-jusho';

const jusho = new Jusho();
const result = await jusho.normalize('東京都渋谷区渋谷２ー２１ー１');

console.log(result.address.full);
console.log(result.codes.post_code);
```

Python:

```bash
pip install normal-jusho
```

```python
from jusho import Jusho

client = Jusho()
result = client.normalize("東京都渋谷区渋谷２ー２１ー１")

print(result.address.full)
print(result.codes.post_code)
```

## Use Cases

- AI Agent / MCP ツール
- OCR・名刺・申込書の後処理
- CRM・顧客マスタのクレンジング
- EC・配送先住所の正規化
- 不動産・物件・店舗データの構造化
- SaaS の住所入力・住所検証

## License

この公開リポジトリに含まれるAPI利用ドキュメント、接続用SDK、最小限の利用サンプルには [MIT License](LICENSE) が適用されます。SDKの公開パッケージも同様です。

フロントエンド、バックエンド、ウィジェット、辞書生成・更新処理、生成済み辞書、運用スクリプト、内部検証資料は配布対象に含まれません。これは今回の配布範囲の説明であり、過去に公開されたコピーや既に付与されたMIT許諾を取り消すものではありません。

- npm: [`normal-jusho`](https://www.npmjs.com/package/normal-jusho) -- MIT
- PyPI: [`normal-jusho`](https://pypi.org/project/normal-jusho/) -- MIT

なお、以下は MIT の対象外です。

- `https://api.jusho.dev` で運用しているホスティング API は Jusho が提供するサービスであり、利用にあたってはレート制限等の運用条件に従ってください。
- 住所データは「[位置参照情報ダウンロードサービス](https://nlftp.mlit.go.jp)」（国土交通省）および「[郵便番号データ](https://www.post.japanpost.jp/zipcode/dl/readme.html)」（日本郵便株式会社）を加工して作成しており、各提供元の利用条件・出典表示が適用されます。

## Links

- Website: [https://jusho.dev/](https://jusho.dev/)
- API Docs: [https://jusho.dev/docs](https://jusho.dev/docs)
- OpenAPI: [https://api.jusho.dev/openapi.json](https://api.jusho.dev/openapi.json)
- MCP endpoint: [https://api.jusho.dev/mcp](https://api.jusho.dev/mcp)
- Issues: [https://github.com/1000ri-jp/normal-jusho-public/issues](https://github.com/1000ri-jp/normal-jusho-public/issues)
