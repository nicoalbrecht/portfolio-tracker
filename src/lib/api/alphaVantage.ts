import { Quote } from "@/types";
import { ApiError } from "./errors";

const DEFAULT_TIMEOUT_MS = 10000;
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

/** Response from the /api/quotes endpoint */
export interface QuotesResponse {
  /** Successfully fetched quotes keyed by symbol */
  quotes: Record<string, Quote>;
  /** Symbols that failed to fetch with error messages */
  errors?: Record<string, string>;
}

/** Single search result from symbol lookup */
export interface SearchResult {
  /** Stock/ETF ticker symbol */
  symbol: string;
  /** Company or fund name */
  name: string;
  /** Security type (e.g., "Equity", "ETF") */
  type: string;
  /** Trading region (e.g., "United States") */
  region: string;
  /** Currency code (e.g., "USD") */
  currency: string;
}

/** Response from the /api/search endpoint */
export interface SearchResponse {
  /** Matching search results */
  results: SearchResult[];
  /** Error message if search failed */
  error?: string;
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw ApiError.timeout();
    }
    throw ApiError.networkError(error instanceof Error ? error.message : undefined);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries: number = MAX_RETRIES
): Promise<Response> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options);

      if (response.status === 429) {
        throw ApiError.fromResponse(response);
      }

      if (response.status >= 500) {
        throw ApiError.fromResponse(response);
      }

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      const isRetryable = error instanceof ApiError && error.retryable;
      const hasRetriesLeft = attempt < maxRetries;

      if (isRetryable && hasRetriesLeft) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      throw error;
    }
  }

  throw lastError ?? ApiError.networkError();
}

/**
 * Fetches quotes for multiple symbols via the /api/quotes endpoint.
 * Includes automatic retry with exponential backoff for transient failures.
 * @param symbols - Array of stock/ETF symbols
 * @returns Quotes response with successful quotes and any errors
 * @throws ApiError on network failure or non-retryable errors
 */
export async function fetchQuotes(symbols: string[]): Promise<QuotesResponse> {
  if (symbols.length === 0) {
    return { quotes: {} };
  }

  const response = await fetchWithRetry(`/api/quotes?symbols=${symbols.join(",")}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Network error" }));
    throw ApiError.fromResponse(response, errorData.error);
  }

  return response.json();
}

/**
 * Fetches a single quote by symbol.
 * @param symbol - Stock/ETF symbol
 * @returns Quote data or null if not found
 */
export async function fetchQuote(symbol: string): Promise<Quote | null> {
  const result = await fetchQuotes([symbol]);
  return result.quotes[symbol] ?? null;
}

/**
 * Fetches quotes for multiple symbols, returning only the quotes map.
 * Used by useQuotes hook for React Query integration.
 * @param symbols - Array of stock/ETF symbols
 * @returns Record of quotes keyed by symbol
 */
export async function fetchBulkQuotes(symbols: string[]): Promise<Record<string, Quote>> {
  const result = await fetchQuotes(symbols);
  return result.quotes;
}

/**
 * Searches for symbols matching a query string.
 * Uses the /api/search endpoint with automatic retry.
 * @param query - Search query (company name or symbol prefix)
 * @returns Array of matching search results
 * @throws ApiError on network failure or non-retryable errors
 */
export async function searchSymbols(query: string): Promise<SearchResult[]> {
  if (!query.trim()) {
    return [];
  }

  const response = await fetchWithRetry(`/api/search?q=${encodeURIComponent(query)}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Network error" }));
    throw ApiError.fromResponse(response, errorData.error);
  }

  const data: SearchResponse = await response.json();
  return data.results;
}
