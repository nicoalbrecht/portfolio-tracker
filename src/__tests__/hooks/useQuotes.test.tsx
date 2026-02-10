import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useQuotes, usePortfolioQuotes } from "@/hooks/useQuotes";

vi.mock("@/lib/api", () => ({
  fetchBulkQuotes: vi.fn(),
}));

vi.mock("@/hooks/useActivePortfolio", () => ({
  useActivePortfolio: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
}));

import { fetchBulkQuotes } from "@/lib/api";
import { useActivePortfolio } from "@/hooks/useActivePortfolio";

const mockFetchBulkQuotes = fetchBulkQuotes as ReturnType<typeof vi.fn>;
const mockUseActivePortfolio = useActivePortfolio as ReturnType<typeof vi.fn>;

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe("useQuotes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty data for empty symbols array", async () => {
    const { result } = renderHook(() => useQuotes([]), {
      wrapper: createWrapper(),
    });

    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
    expect(mockFetchBulkQuotes).not.toHaveBeenCalled();
  });

  it("fetches quotes for given symbols", async () => {
    const mockQuotes = {
      VTI: { symbol: "VTI", price: 250, change: 2.5, changePercent: 1.0, previousClose: 247.5 },
      SPY: { symbol: "SPY", price: 500, change: -1.0, changePercent: -0.2, previousClose: 501 },
    };

    mockFetchBulkQuotes.mockResolvedValueOnce(mockQuotes);

    const { result } = renderHook(() => useQuotes(["VTI", "SPY"]), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockQuotes);
    expect(mockFetchBulkQuotes).toHaveBeenCalledWith(["VTI", "SPY"]);
  });

  it("passes error to query result when fetch fails", async () => {
    mockFetchBulkQuotes.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useQuotes(["VTI"]), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    }, { timeout: 5000 });

    expect(result.current.error).toBeInstanceOf(Error);
    expect((result.current.error as Error).message).toBe("Network error");
  });

  it("normalizes symbols order for consistent cache keys", async () => {
    mockFetchBulkQuotes.mockResolvedValue({});

    const { result } = renderHook(() => useQuotes(["SPY", "VTI", "AGG"]), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isFetched).toBe(true);
    });

    expect(mockFetchBulkQuotes).toHaveBeenCalledWith(["SPY", "VTI", "AGG"]);
  });
});

describe("usePortfolioQuotes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty when no active portfolio", async () => {
    mockUseActivePortfolio.mockReturnValue(undefined);

    const { result } = renderHook(() => usePortfolioQuotes(), {
      wrapper: createWrapper(),
    });

    expect(result.current.data).toBeUndefined();
    expect(mockFetchBulkQuotes).not.toHaveBeenCalled();
  });

  it("fetches quotes for portfolio holdings", async () => {
    const mockPortfolio = {
      id: "portfolio-1",
      name: "My Portfolio",
      holdings: [
        { id: "h1", symbol: "VTI", shares: 100 },
        { id: "h2", symbol: "SPY", shares: 50 },
      ],
    };

    const mockQuotes = {
      VTI: { symbol: "VTI", price: 250 },
      SPY: { symbol: "SPY", price: 500 },
    };

    mockUseActivePortfolio.mockReturnValue(mockPortfolio);
    mockFetchBulkQuotes.mockResolvedValueOnce(mockQuotes);

    const { result } = renderHook(() => usePortfolioQuotes(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockQuotes);
    expect(mockFetchBulkQuotes).toHaveBeenCalledWith(["VTI", "SPY"]);
  });
});
