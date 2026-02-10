import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const ALPHA_VANTAGE_BASE_URL = "https://www.alphavantage.co/query";

const quoteResponseSchema = z.object({
  "Global Quote": z.object({
    "01. symbol": z.string(),
    "02. open": z.string(),
    "03. high": z.string(),
    "04. low": z.string(),
    "05. price": z.string(),
    "06. volume": z.string(),
    "07. latest trading day": z.string(),
    "08. previous close": z.string(),
    "09. change": z.string(),
    "10. change percent": z.string(),
  }),
});

const errorResponseSchema = z.object({
  Note: z.string().optional(),
  "Error Message": z.string().optional(),
});

function getApiKey(): string {
  const key = process.env.ALPHA_VANTAGE_API_KEY;
  if (!key) {
    throw new Error("ALPHA_VANTAGE_API_KEY environment variable is not set");
  }
  return key;
}

function parseQuote(data: z.infer<typeof quoteResponseSchema>) {
  const quote = data["Global Quote"];
  const price = parseFloat(quote["05. price"]);
  const change = parseFloat(quote["09. change"]);
  const changePercent = parseFloat(quote["10. change percent"].replace("%", ""));
  const previousClose = parseFloat(quote["08. previous close"]);

  if (isNaN(price) || isNaN(change) || isNaN(changePercent) || isNaN(previousClose)) {
    return null;
  }

  return {
    symbol: quote["01. symbol"],
    price,
    change,
    changePercent,
    previousClose,
    timestamp: new Date().toISOString(),
  };
}

const requestSymbolsSchema = z.object({
  symbols: z.string().transform((s) =>
    s
      .split(",")
      .map((sym) => sym.trim().toUpperCase())
      .filter((sym) => sym.length > 0 && sym.length <= 10)
  ),
});

const rateLimitState = {
  requests: [] as number[],
  maxRequests: 5,
  windowMs: 60 * 1000,
};

function checkRateLimit(): boolean {
  const now = Date.now();
  rateLimitState.requests = rateLimitState.requests.filter(
    (t) => now - t < rateLimitState.windowMs
  );
  return rateLimitState.requests.length < rateLimitState.maxRequests;
}

function recordRequest(): void {
  rateLimitState.requests.push(Date.now());
}

async function fetchSingleQuote(symbol: string, apiKey: string) {
  const url = `${ALPHA_VANTAGE_BASE_URL}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      return { symbol, error: `HTTP ${response.status}` };
    }

    const data = await response.json();

    const errorCheck = errorResponseSchema.safeParse(data);
    if (errorCheck.success && (errorCheck.data.Note || errorCheck.data["Error Message"])) {
      return {
        symbol,
        error: errorCheck.data.Note || errorCheck.data["Error Message"],
      };
    }

    const parsed = quoteResponseSchema.safeParse(data);
    if (!parsed.success) {
      return { symbol, error: "Invalid response format" };
    }

    const quote = parseQuote(parsed.data);
    if (!quote) {
      return { symbol, error: "Failed to parse quote values" };
    }

    return { symbol, quote };
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof Error && error.name === "AbortError") {
      return { symbol, error: "Request timeout" };
    }
    return { symbol, error: "Network error" };
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbolsParam = searchParams.get("symbols");

    if (!symbolsParam) {
      return NextResponse.json(
        { error: "Missing symbols parameter" },
        { status: 400 }
      );
    }

    const parsed = requestSymbolsSchema.safeParse({ symbols: symbolsParam });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid symbols parameter" },
        { status: 400 }
      );
    }

    const symbols = parsed.data.symbols;
    if (symbols.length === 0) {
      return NextResponse.json({ quotes: {} });
    }

    if (symbols.length > 10) {
      return NextResponse.json(
        { error: "Maximum 10 symbols per request" },
        { status: 400 }
      );
    }

    const apiKey = getApiKey();
    const quotes: Record<string, unknown> = {};
    const errors: Record<string, string> = {};

    for (const symbol of symbols) {
      if (!checkRateLimit()) {
        errors[symbol] = "Rate limit exceeded, try again later";
        continue;
      }

      recordRequest();
      const result = await fetchSingleQuote(symbol, apiKey);

      if ("quote" in result && result.quote) {
        quotes[symbol] = result.quote;
      } else if ("error" in result && result.error) {
        errors[symbol] = result.error;
      }

      if (symbols.indexOf(symbol) < symbols.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    return NextResponse.json({
      quotes,
      errors: Object.keys(errors).length > 0 ? errors : undefined,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("API_KEY")) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
