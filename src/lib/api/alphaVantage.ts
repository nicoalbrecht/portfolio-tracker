import { Quote } from "@/types";

const ALPHA_VANTAGE_BASE_URL = "https://www.alphavantage.co/query";

export interface AlphaVantageQuote {
  "Global Quote": {
    "01. symbol": string;
    "02. open": string;
    "03. high": string;
    "04. low": string;
    "05. price": string;
    "06. volume": string;
    "07. latest trading day": string;
    "08. previous close": string;
    "09. change": string;
    "10. change percent": string;
  };
}

export interface AlphaVantageSearchResult {
  bestMatches: Array<{
    "1. symbol": string;
    "2. name": string;
    "3. type": string;
    "4. region": string;
    "5. marketOpen": string;
    "6. marketClose": string;
    "7. timezone": string;
    "8. currency": string;
    "9. matchScore": string;
  }>;
}

function getApiKey(): string {
  return process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY ?? "demo";
}

export async function fetchQuote(symbol: string): Promise<Quote | null> {
  try {
    const apiKey = getApiKey();
    const url = `${ALPHA_VANTAGE_BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error("Network error");

    const data: AlphaVantageQuote = await response.json();
    const quote = data["Global Quote"];

    if (!quote || !quote["05. price"]) {
      return null;
    }

    return {
      symbol: quote["01. symbol"],
      price: parseFloat(quote["05. price"]),
      change: parseFloat(quote["09. change"]),
      changePercent: parseFloat(quote["10. change percent"].replace("%", "")),
      previousClose: parseFloat(quote["08. previous close"]),
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Failed to fetch quote for ${symbol}:`, error);
    return null;
  }
}

export async function fetchBulkQuotes(symbols: string[]): Promise<Record<string, Quote>> {
  const quotes: Record<string, Quote> = {};

  const results = await Promise.allSettled(
    symbols.map((symbol) => fetchQuote(symbol))
  );

  results.forEach((result, index) => {
    if (result.status === "fulfilled" && result.value) {
      quotes[symbols[index]] = result.value;
    }
  });

  return quotes;
}

export async function searchSymbols(keywords: string): Promise<
  Array<{ symbol: string; name: string; type: string }>
> {
  try {
    const apiKey = getApiKey();
    const url = `${ALPHA_VANTAGE_BASE_URL}?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(keywords)}&apikey=${apiKey}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error("Network error");

    const data: AlphaVantageSearchResult = await response.json();

    if (!data.bestMatches) return [];

    return data.bestMatches.map((match) => ({
      symbol: match["1. symbol"],
      name: match["2. name"],
      type: match["3. type"],
    }));
  } catch (error) {
    console.error("Symbol search failed:", error);
    return [];
  }
}
