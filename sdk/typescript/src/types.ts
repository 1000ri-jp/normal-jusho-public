/**
 * Configuration options for the Jusho client.
 */
export interface JushoOptions {
  /**
   * Base URL of the Jusho API.
   * @default "https://api.jusho.dev"
   */
  baseUrl?: string;

  /**
   * Request timeout in milliseconds.
   * @default 30000
   */
  timeout?: number;

  /**
   * Custom headers to include with every request.
   */
  headers?: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Normalize response types (matching the nested API format)
// ---------------------------------------------------------------------------

/**
 * Parsed and normalized address components.
 */
export interface AddressInfo {
  /** Full normalized address string */
  full: string;
  /** Prefecture (都道府県) - kenall preferred */
  pref: string;
  /** City / ward / municipality (市区町村) - kenall preferred */
  city: string;
  /** Town area (町域, oaza + chome) - kokudo derived */
  town: string;
  /** Sub-area (小字) */
  koaza: string;
  /** Block number (番地) */
  banchi: string;
  /** House number (号) */
  go: string;
  /** Building name (建物名) */
  building: string;
}

/**
 * Address variant from a specific data source.
 */
export interface VariantAddress {
  /** Prefecture (都道府県) */
  pref: string;
  /** City (市区町村) */
  city: string;
  /** Town area (町域) */
  town: string;
}

/**
 * Address representations from different data sources.
 *
 * The same address may have different spellings depending on the data source.
 * For example: 袖ケ浦市 (kenall / Japan Post) vs 袖ヶ浦市 (kokudo / MLIT).
 *
 * Choose the appropriate source for your use case:
 * - kokudo: MLIT API integration, GIS, administrative codes
 * - kenall: Delivery service auto-fill, postal code lookup
 */
export interface AddressVariantsInfo {
  /** MLIT (Ministry of Land, Infrastructure, Transport and Tourism) notation */
  kokudo: VariantAddress;
  /** Japan Post notation */
  kenall: VariantAddress;
}

/**
 * Katakana readings for address components.
 */
export interface KanaInfo {
  /** Prefecture reading (都道府県カナ) */
  pref: string;
  /** City reading (市区町村カナ) */
  city: string;
  /** Town area reading (町域カナ) */
  town: string;
}

/**
 * Administrative and postal codes.
 */
export interface CodesInfo {
  /** Postal code, 7 digits (郵便番号) */
  post_code: string;
  /** Prefecture code (都道府県コード) */
  pref_code: string;
  /** City code (市区町村コード) */
  city_code: string;
  /** Town area code (町域コード) */
  town_code: string;
}

/**
 * Geographic coordinates.
 */
export interface GeoInfo {
  /** Latitude (緯度) */
  lat: string;
  /** Longitude (経度) */
  lng: string;
}

/**
 * Metadata about the normalization result.
 */
export interface MetaInfo {
  /** Match type: "address" | "building" | "jigyosyo" */
  match_type: string;
  /** Match level: 0=none, 1=pref, 2=city, 3=town, 4=block, 5=full */
  match_level: number;
  /** Match level label: "none" | "pref" | "city" | "town" | "block" | "full" */
  match_level_label: string;
  /** Confidence score (0.0-1.0) */
  confidence: number;
  /** Whether this is a business postal code (事業所郵便番号) */
  is_jigyosyo: boolean;
  /** Whether this is a large building (大型建物) */
  is_tatemono: boolean;
  /** API version */
  version: string;
}

/**
 * Romaji (romanized) address components.
 */
export interface RomajiInfo {
  /** Prefecture in romaji */
  pref: string;
  /** City in romaji */
  city: string;
  /** Town in romaji */
  town: string;
  /** Full address in romaji */
  full: string;
}

/**
 * Kyoto street name (通り名) information.
 * Only present for Kyoto city addresses that include street directions.
 */
export interface ToorinaInfo {
  /** Street name value (e.g., "烏丸通御池上ル") */
  value: string;
  /** Full address including street name */
  full_address_with_toorina: string;
}

/**
 * Response from the normalize endpoint.
 */
export interface NormalizeResponse {
  /** Normalized address components (representative values) */
  address: AddressInfo;
  /** Address representations from different data sources */
  address_variants: AddressVariantsInfo;
  /** Katakana readings */
  kana: KanaInfo;
  /** Romaji (romanized) readings */
  romaji?: RomajiInfo;
  /** Administrative and postal codes */
  codes: CodesInfo;
  /** Geographic coordinates */
  geo: GeoInfo;
  /** Normalization metadata */
  meta: MetaInfo;
  /** Kyoto street name info (通り名) - only present for Kyoto addresses */
  toorina?: ToorinaInfo;
}

// ---------------------------------------------------------------------------
// Batch response types
// ---------------------------------------------------------------------------

/**
 * Individual result within a batch normalization response.
 */
export interface BatchResultItem {
  /** Original input address */
  input: string;
  /** Whether normalization succeeded */
  success: boolean;
  /** Normalization result (present when success is true) */
  result: NormalizeResponse | null;
  /** Error message (present when success is false) */
  error: string | null;
}

/**
 * Response from the batch normalize endpoint.
 */
export interface BatchNormalizeResponse {
  /** Total number of input addresses */
  total: number;
  /** Number of successfully normalized addresses */
  success_count: number;
  /** Number of addresses that failed normalization */
  error_count: number;
  /** Individual results for each input address */
  results: BatchResultItem[];
}

// ---------------------------------------------------------------------------
// Postal lookup response types
// ---------------------------------------------------------------------------

/**
 * Response from the postal code lookup endpoint.
 */
export interface PostalResponse {
  /** Postal code that was looked up */
  postal_code: string;
  /** Address information associated with the postal code */
  address: AddressInfo;
  /** Katakana readings */
  kana: KanaInfo;
  /** Administrative codes */
  codes: CodesInfo;
  /** Geographic coordinates */
  geo: GeoInfo;
}

// ---------------------------------------------------------------------------
// Suggest response types
// ---------------------------------------------------------------------------

/**
 * A single address suggestion.
 */
export interface Suggestion {
  /** Suggested full address */
  address: string;
  /** Postal code for the suggested address */
  postal_code: string;
}

/**
 * Response from the suggest endpoint.
 */
export interface SuggestResponse {
  /** List of address suggestions */
  suggestions: Suggestion[];
}

// ---------------------------------------------------------------------------
// Validate response types
// ---------------------------------------------------------------------------

/**
 * Response from the validate endpoint.
 */
export interface ValidationResponse {
  /** Whether the address is valid */
  valid: boolean;
  /** Normalized address information (if valid) */
  normalized: NormalizeResponse | null;
  /** Match level: "full" | "partial" | "none" */
  match_level: string;
}

// ---------------------------------------------------------------------------
// Reverse response types
// ---------------------------------------------------------------------------

/**
 * Response from the reverse lookup endpoint.
 */
export interface ReverseResponse {
  /** Postal code for the address */
  postal_code: string;
  /** Address information */
  address: AddressInfo;
  /** Administrative codes */
  codes: CodesInfo;
}

// ---------------------------------------------------------------------------
// Error response type
// ---------------------------------------------------------------------------

/**
 * Error response body returned by the API.
 */
export interface ErrorResponseBody {
  /** Error type or short message */
  error?: string;
  /** Detailed error description */
  detail?: string;
}
