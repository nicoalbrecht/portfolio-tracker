import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const ALPHA_VANTAGE_BASE_URL = "https://www.alphavantage.co/query";

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
    if (errorCheck.success && (errorCheck.data.Note || errorCheck.data["Error Message"])) {
      return NextResponse.json(
        { error: errorCheck.data.Note || errorCheck.data["Error Message"] },
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
