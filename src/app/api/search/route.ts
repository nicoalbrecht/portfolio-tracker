import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const ALPHA_VANTAGE_BASE_URL = "https://www.alphavantage.co/query";

// Fallback mock data for development when API is rate-limited
const MOCK_SYMBOLS = [
  { symbol: "AAPL", name: "Apple Inc", type: "Equity", region: "United States", currency: "USD" },
  { symbol: "MSFT", name: "Microsoft Corporation", type: "Equity", region: "United States", currency: "USD" },
  { symbol: "GOOGL", name: "Alphabet Inc - Class A", type: "Equity", region: "United States", currency: "USD" },
  { symbol: "GOOG", name: "Alphabet Inc - Class C", type: "Equity", region: "United States", currency: "USD" },
  { symbol: "AMZN", name: "Amazon.com Inc", type: "Equity", region: "United States", currency: "USD" },
  { symbol: "NVDA", name: "NVIDIA Corporation", type: "Equity", region: "United States", currency: "USD" },
  { symbol: "META", name: "Meta Platforms Inc", type: "Equity", region: "United States", currency: "USD" },
  { symbol: "TSLA", name: "Tesla Inc", type: "Equity", region: "United States", currency: "USD" },
  { symbol: "BRK.B", name: "Berkshire Hathaway Inc - Class B", type: "Equity", region: "United States", currency: "USD" },
  { symbol: "JPM", name: "JPMorgan Chase & Co", type: "Equity", region: "United States", currency: "USD" },
  { symbol: "V", name: "Visa Inc - Class A", type: "Equity", region: "United States", currency: "USD" },
  { symbol: "UNH", name: "UnitedHealth Group Incorporated", type: "Equity", region: "United States", currency: "USD" },
  { symbol: "HD", name: "The Home Depot Inc", type: "Equity", region: "United States", currency: "USD" },
  { symbol: "PG", name: "Procter & Gamble Company", type: "Equity", region: "United States", currency: "USD" },
  { symbol: "MA", name: "Mastercard Incorporated - Class A", type: "Equity", region: "United States", currency: "USD" },
  { symbol: "VTI", name: "Vanguard Total Stock Market ETF", type: "ETF", region: "United States", currency: "USD" },
  { symbol: "VOO", name: "Vanguard S&P 500 ETF", type: "ETF", region: "United States", currency: "USD" },
  { symbol: "VEA", name: "Vanguard FTSE Developed Markets ETF", type: "ETF", region: "United States", currency: "USD" },
  { symbol: "VWO", name: "Vanguard FTSE Emerging Markets ETF", type: "ETF", region: "United States", currency: "USD" },
  { symbol: "VGT", name: "Vanguard Information Technology ETF", type: "ETF", region: "United States", currency: "USD" },
  { symbol: "BND", name: "Vanguard Total Bond Market ETF", type: "ETF", region: "United States", currency: "USD" },
  { symbol: "VXUS", name: "Vanguard Total International Stock ETF", type: "ETF", region: "United States", currency: "USD" },
  { symbol: "SPY", name: "SPDR S&P 500 ETF Trust", type: "ETF", region: "United States", currency: "USD" },
  { symbol: "QQQ", name: "Invesco QQQ Trust", type: "ETF", region: "United States", currency: "USD" },
  { symbol: "IWM", name: "iShares Russell 2000 ETF", type: "ETF", region: "United States", currency: "USD" },
  { symbol: "AGG", name: "iShares Core U.S. Aggregate Bond ETF", type: "ETF", region: "United States", currency: "USD" },
  { symbol: "EFA", name: "iShares MSCI EAFE ETF", type: "ETF", region: "United States", currency: "USD" },
  { symbol: "EEM", name: "iShares MSCI Emerging Markets ETF", type: "ETF", region: "United States", currency: "USD" },
  { symbol: "GLD", name: "SPDR Gold Shares", type: "ETF", region: "United States", currency: "USD" },
  { symbol: "TLT", name: "iShares 20+ Year Treasury Bond ETF", type: "ETF", region: "United States", currency: "USD" },
];

function searchMockSymbols(query: string): typeof MOCK_SYMBOLS {
  const q = query.toUpperCase();
  return MOCK_SYMBOLS.filter(
    (s) => s.symbol.includes(q) || s.name.toUpperCase().includes(q)
  ).slice(0, 10);
}

const searchResponseSchema = z.object({
  bestMatches: z.array(
    z.object({
      "1. symbol": z.string(),
      "2. name": z.string(),
      "3. type": z.string(),
      "4. region": z.string(),
      "5. marketOpen": z.string(),
      "6. marketClose": z.string(),
      "7. timezone": z.string(),
      "8. currency": z.string(),
      "9. matchScore": z.string(),
    })
  ).optional(),
});

const errorResponseSchema = z.object({
  Note: z.string().optional(),
  Information: z.string().optional(),
  "Error Message": z.string().optional(),
});

function getApiKey(): string {
  const key = process.env.ALPHA_VANTAGE_API_KEY;
  if (!key) {
    throw new Error("ALPHA_VANTAGE_API_KEY environment variable is not set");
  }
  return key;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: "Missing search query" },
        { status: 400 }
      );
    }

    if (query.length > 100) {
      return NextResponse.json(
        { error: "Search query too long" },
        { status: 400 }
      );
    }

    const apiKey = getApiKey();
    const url = `${ALPHA_VANTAGE_BASE_URL}?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(query)}&apikey=${apiKey}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Upstream error: ${response.status}` },
        { status: 502 }
      );
    }

    const data = await response.json();

    const errorCheck = errorResponseSchema.safeParse(data);
    if (errorCheck.success && (errorCheck.data.Note || errorCheck.data.Information || errorCheck.data["Error Message"])) {
      const mockResults = searchMockSymbols(query);
      if (mockResults.length > 0) {
        return NextResponse.json({ results: mockResults });
      }
      return NextResponse.json(
        { error: errorCheck.data.Note || errorCheck.data.Information || errorCheck.data["Error Message"] },
        { status: 429 }
      );
    }

    const parsed = searchResponseSchema.safeParse(data);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid response from API" },
        { status: 502 }
      );
    }

    const results = (parsed.data.bestMatches ?? []).map((match) => ({
      symbol: match["1. symbol"],
      name: match["2. name"],
      type: match["3. type"],
      region: match["4. region"],
      currency: match["8. currency"],
    }));

    return NextResponse.json({ results });
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return NextResponse.json(
          { error: "Request timeout" },
          { status: 504 }
        );
      }
      if (error.message.includes("API_KEY")) {
        return NextResponse.json(
          { error: "Server configuration error" },
          { status: 500 }
        );
      }
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
