import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { fetchQuotes, fetchQuote, fetchBulkQuotes, searchSymbols } from "@/lib/api/alphaVantage";
import { ApiError } from "@/lib/api/errors";

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("alphaVantage API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(async () => {
    await vi.runAllTimersAsync();
    vi.useRealTimers();
  });

  describe("fetchQuotes", () => {
    it("returns empty quotes for empty symbols array", async () => {
      const result = await fetchQuotes([]);

      expect(result).toEqual({ quotes: {} });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("fetches quotes for given symbols", async () => {
      const mockResponse = {
        quotes: {
          VTI: {
            symbol: "VTI",
            price: 250.5,
            change: 2.5,
            changePercent: 1.0,
            previousClose: 248.0,
          },
          SPY: {
            symbol: "SPY",
            price: 500.0,
            change: -1.0,
            changePercent: -0.2,
            previousClose: 501.0,
          },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await fetchQuotes(["VTI", "SPY"]);

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/quotes?symbols=VTI,SPY",
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      );
      expect(result).toEqual(mockResponse);
    });

    it("throws ApiError on non-ok response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: "Invalid symbols" }),
      });

      await expect(fetchQuotes(["INVALID"])).rejects.toThrow(ApiError);
    });

    it("retries on 500 server error", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ quotes: { VTI: { symbol: "VTI", price: 250 } } }),
        });

      const promise = fetchQuotes(["VTI"]);

      // Fast-forward timers to allow retry
      await vi.advanceTimersByTimeAsync(1000);

      const result = await promise;

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result.quotes.VTI).toBeDefined();
    });

    it("retries on 429 rate limit", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ quotes: { VTI: { symbol: "VTI", price: 250 } } }),
        });

      const promise = fetchQuotes(["VTI"]);

      // Fast-forward timers to allow retry
      await vi.advanceTimersByTimeAsync(1000);

      const result = await promise;

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result.quotes.VTI).toBeDefined();
    });

    it("gives up after max retries exhausted", async () => {
      let callCount = 0;
      mockFetch.mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          ok: false,
          status: 500,
        });
      });

      let caughtError: Error | undefined;
      const promise = fetchQuotes(["VTI"]).catch((err) => {
        caughtError = err;
      });

      await vi.runAllTimersAsync();
      await promise;

      expect(caughtError).toBeInstanceOf(ApiError);
      expect(callCount).toBe(4);
    });
  });

  describe("fetchQuote", () => {
    it("returns quote for single symbol", async () => {
      const mockQuote = {
        symbol: "VTI",
        price: 250.5,
        change: 2.5,
        changePercent: 1.0,
        previousClose: 248.0,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ quotes: { VTI: mockQuote } }),
      });

      const result = await fetchQuote("VTI");

      expect(result).toEqual(mockQuote);
    });

    it("returns null when symbol not found", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ quotes: {} }),
      });

      const result = await fetchQuote("NOTFOUND");

      expect(result).toBeNull();
    });
  });

  describe("fetchBulkQuotes", () => {
    it("returns quotes map for given symbols", async () => {
      const mockQuotes = {
        VTI: { symbol: "VTI", price: 250 },
        SPY: { symbol: "SPY", price: 500 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ quotes: mockQuotes }),
      });

      const result = await fetchBulkQuotes(["VTI", "SPY"]);

      expect(result).toEqual(mockQuotes);
    });
  });

  describe("searchSymbols", () => {
    it("returns empty array for empty query", async () => {
      const result = await searchSymbols("");

      expect(result).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("returns empty array for whitespace-only query", async () => {
      const result = await searchSymbols("   ");

      expect(result).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("fetches search results for valid query", async () => {
      const mockResults = [
        {
          symbol: "VTI",
          name: "Vanguard Total Stock Market ETF",
          type: "ETF",
          region: "United States",
          currency: "USD",
        },
        {
          symbol: "VOO",
          name: "Vanguard S&P 500 ETF",
          type: "ETF",
          region: "United States",
          currency: "USD",
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ results: mockResults }),
      });

      const result = await searchSymbols("vanguard");

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/search?q=vanguard",
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      );
      expect(result).toEqual(mockResults);
    });

    it("encodes special characters in query", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ results: [] }),
      });

      await searchSymbols("S&P 500");

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/search?q=S%26P%20500",
        expect.any(Object)
      );
    });

    it("throws ApiError on non-ok response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: "Bad request" }),
      });

      await expect(searchSymbols("test")).rejects.toThrow(ApiError);
    });
  });
});

describe("ApiError", () => {
  describe("constructor", () => {
    it("creates error with code and message", () => {
      const error = new ApiError("Test error", "NETWORK_ERROR");

      expect(error.message).toBe("Test error");
      expect(error.code).toBe("NETWORK_ERROR");
      expect(error.name).toBe("ApiError");
    });

    it("sets retryable based on code", () => {
      expect(new ApiError("", "NETWORK_ERROR").retryable).toBe(true);
      expect(new ApiError("", "TIMEOUT").retryable).toBe(true);
      expect(new ApiError("", "RATE_LIMIT").retryable).toBe(true);
      expect(new ApiError("", "NOT_FOUND").retryable).toBe(false);
      expect(new ApiError("", "VALIDATION_ERROR").retryable).toBe(false);
    });

    it("allows override of retryable", () => {
      const error = new ApiError("", "NOT_FOUND", { retryable: true });
      expect(error.retryable).toBe(true);
    });
  });

  describe("fromResponse", () => {
    it("creates RATE_LIMIT error for 429", () => {
      const response = { status: 429 } as Response;
      const error = ApiError.fromResponse(response);

      expect(error.code).toBe("RATE_LIMIT");
      expect(error.statusCode).toBe(429);
      expect(error.retryable).toBe(true);
    });

    it("creates NOT_FOUND error for 404", () => {
      const response = { status: 404 } as Response;
      const error = ApiError.fromResponse(response);

      expect(error.code).toBe("NOT_FOUND");
      expect(error.statusCode).toBe(404);
      expect(error.retryable).toBe(false);
    });

    it("creates SERVER_ERROR for 5xx", () => {
      const response = { status: 503 } as Response;
      const error = ApiError.fromResponse(response);

      expect(error.code).toBe("SERVER_ERROR");
      expect(error.statusCode).toBe(503);
      expect(error.retryable).toBe(true);
    });

    it("creates VALIDATION_ERROR for 4xx", () => {
      const response = { status: 400 } as Response;
      const error = ApiError.fromResponse(response);

      expect(error.code).toBe("VALIDATION_ERROR");
      expect(error.statusCode).toBe(400);
      expect(error.retryable).toBe(false);
    });

    it("uses custom message when provided", () => {
      const response = { status: 400 } as Response;
      const error = ApiError.fromResponse(response, "Custom error message");

      expect(error.message).toBe("Custom error message");
    });
  });

  describe("static factory methods", () => {
    it("creates network error", () => {
      const error = ApiError.networkError("Connection failed");

      expect(error.code).toBe("NETWORK_ERROR");
      expect(error.message).toBe("Connection failed");
      expect(error.retryable).toBe(true);
    });

    it("creates timeout error", () => {
      const error = ApiError.timeout();

      expect(error.code).toBe("TIMEOUT");
      expect(error.message).toBe("Request timeout");
      expect(error.retryable).toBe(true);
    });
  });
});
