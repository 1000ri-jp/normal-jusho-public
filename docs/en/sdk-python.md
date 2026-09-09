# Python SDK Guide

The `normal-jusho` Python package provides a typed client for the Jusho Japanese address normalization API. It supports both synchronous and asynchronous usage via `httpx`.

## Installation

```bash
pip install normal-jusho
```

Requires Python 3.9+.

## Quick Start

```python
from jusho import Jusho

client = Jusho()

result = client.normalize("東京都千代田区千代田1-1")
print(result.codes.post_code)  # "1000001"
print(result.address.pref)     # "東京都"
print(result.geo.lat)          # "35.685175"
```

## Client Configuration

```python
from jusho import Jusho

client = Jusho(
    base_url="https://api.jusho.dev",  # Default
    timeout=30.0,                       # Request timeout in seconds
    headers={"X-Custom-Header": "value"},
)
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `base_url` | `str` | `"https://api.jusho.dev"` | API base URL |
| `timeout` | `float` | `30.0` | Request timeout in seconds |
| `headers` | `dict` | `{}` | Custom headers sent with every request |

## Methods

### `normalize(address: str) -> NormalizeResult`

Normalize a single Japanese address.

```python
result = client.normalize("大阪府大阪市北区梅田1-1-1")

print(result.address.full)       # Full normalized address
print(result.address.pref)       # "大阪府"
print(result.address.city)       # "大阪市北区"
print(result.codes.post_code)    # "5300001"
print(result.kana.pref)          # "オオサカフ"
print(result.geo.lat)            # Latitude
print(result.meta.match_type)    # "address"
```

Business offices and large buildings:

```python
# Business office
office = client.normalize("宮内庁")
print(office.meta.match_type)    # "jigyosyo"
print(office.meta.is_jigyosyo)   # True
print(office.codes.post_code)    # "1008111"

# Large building with floor
building = client.normalize("六本木ヒルズ森タワー30F")
print(building.meta.match_type)  # "building"
print(building.meta.is_tatemono) # True
```

### `normalize_batch(addresses: list[str]) -> BatchResult`

Normalize up to 100 addresses in one request.

```python
batch = client.normalize_batch([
    "東京都千代田区千代田1-1",
    "大阪府大阪市北区梅田1-1-1",
    "存在しない住所",
])

print(batch.total)          # 3
print(batch.success_count)  # 2
print(batch.error_count)    # 1

for item in batch.results:
    if item.success:
        print(f"{item.input} => {item.result.codes.post_code}")
    else:
        print(f"{item.input} => ERROR: {item.error}")
```

### `postal(code: str) -> PostalResult`

Look up address information by postal code.

```python
result = client.postal("1500043")
for addr in result.addresses:
    print(addr.address.pref)  # "東京都"
    print(addr.address.city)  # "渋谷区"
```

### `suggest(query: str) -> SuggestResult`

Get address suggestions for auto-complete.

```python
result = client.suggest("渋谷区道玄")
for s in result.suggestions:
    print(s.address, s.post_code)
```

### `validate(address: str) -> ValidationResult`

Validate whether an address exists.

```python
result = client.validate("東京都渋谷区道玄坂1-2-3")
print(result.valid)       # True
print(result.normalized)  # Normalized form
```

### `reverse(address: str) -> ReverseResult`

Reverse-lookup: get postal code and codes from an address string.

```python
result = client.reverse("東京都渋谷区道玄坂1-2-3")
print(result.codes.post_code)  # "1500043"
```

## Async Client

For async/await usage with `asyncio`:

```python
import asyncio
from jusho import AsyncJusho

async def main():
    client = AsyncJusho()
    result = await client.normalize("東京都千代田区千代田1-1")
    print(result.codes.post_code)

asyncio.run(main())
```

The `AsyncJusho` class has the same methods as `Jusho`, but all return coroutines.

## Response Models

### `NormalizeResult`

```python
@dataclass(frozen=True)
class NormalizeResult:
    address: AddressInfo
    address_variants: AddressVariantsInfo
    kana: KanaInfo
    codes: CodesInfo
    geo: GeoInfo
    meta: MetaInfo
    building_info: BuildingInfo | None   # When meta.is_tatemono is True
    jigyosyo_info: JigyosyoInfo | None   # When meta.is_jigyosyo is True
    raw: dict                             # Raw API response
```

### `AddressInfo`

```python
@dataclass(frozen=True)
class AddressInfo:
    full: str       # Full normalized address
    pref: str       # Prefecture
    city: str       # City/ward/municipality
    town: str       # Town area (with chome)
    koaza: str      # Sub-area
    banchi: str     # Block number
    go: str         # House number
    building: str   # Building name
```

### `CodesInfo`

```python
@dataclass(frozen=True)
class CodesInfo:
    post_code: str   # 7-digit postal code
    pref_code: str   # Prefecture code (e.g. "13")
    city_code: str   # Municipality code (e.g. "13101")
    town_code: str   # Town area code
```

### `BatchResult`

```python
@dataclass(frozen=True)
class BatchResult:
    total: int
    success_count: int
    error_count: int
    results: list[BatchResultItem]
    raw: dict
```

### `BuildingInfo`

```python
@dataclass(frozen=True)
class BuildingInfo:
    building: str        # Full building name
    building_short: str  # Abbreviated name
    floor: str           # Floor number (Arabic)
    floor_kanji: str     # Floor in kanji (e.g. "三十階")
    room: str            # Room number
```

### `JigyosyoInfo`

```python
@dataclass(frozen=True)
class JigyosyoInfo:
    jigyosyo_name: str       # Business office name
    jigyosyo_name_kana: str  # Name in katakana
    handling_office: str     # Post office handling this office
    address_detail: str      # Detailed address (block/lot)
```

## Error Handling

```python
from jusho.errors import (
    JushoError,
    NotFoundError,
    RateLimitError,
    NetworkError,
    TimeoutError,
    ValidationError,
    APIError,
)

try:
    result = client.normalize("...")
except NotFoundError:
    print("Address not recognized")
except RateLimitError as e:
    print(f"Rate limited. Retry after {e.retry_after}s")
except TimeoutError:
    print("Request timed out")
except NetworkError:
    print("Network error (DNS, connection, etc.)")
except ValidationError:
    print("Invalid input")
except JushoError as e:
    print(f"Jusho error ({e.status_code}): {e.message}")
```

### Error Hierarchy

```
JushoError (base)
  +-- NetworkError
  +-- TimeoutError
  +-- APIError
  +-- NotFoundError
  +-- ValidationError
  +-- RateLimitError
```

## Raw Response Access

Every result object includes a `raw` attribute containing the original API response dict:

```python
result = client.normalize("東京都千代田区千代田1-1")
print(result.raw)  # Full JSON response as a Python dict
```

## Address Variants

Use `address_variants` to choose the right notation for your use case:

```python
result = client.normalize("千葉県袖ケ浦市...")

# MLIT notation (for GIS, administrative codes)
print(result.address_variants.kokudo.city)  # "袖ヶ浦市"

# Japan Post notation (for delivery services)
print(result.address_variants.kenall.city)  # "袖ケ浦市"
```
