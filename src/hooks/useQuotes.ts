"use client";

import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchBulkQuotes } from "@/lib/api";
import { Quote } from "@/types";
import { toast } from "sonner";
import { useActivePortfolio } from "./useActivePortfolio";

/**
 * Fetches real-time quotes for an array of symbols.
 * Uses React Query with 60s stale time and automatic error toasts.
 * @param symbols - Array of stock/ETF symbols to fetch
 * @returns React Query result with quotes keyed by symbol
 */
export function useQuotes(symbols: string[]) {
  const sortedKey = useMemo(() => [...symbols].sort().join(","), [symbols]);
  
  const query = useQuery<Record<string, Quote>>({
    queryKey: ["quotes", sortedKey],
    queryFn: () => fetchBulkQuotes(symbols),
    enabled: symbols.length > 0,
    staleTime: 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 2,
  });

  useEffect(() => {
    if (query.error) {
      toast.error("Failed to fetch quotes", {
        description: query.error instanceof Error ? query.error.message : "Unknown error",
      });
    }
  }, [query.error]);

  return query;
}

/**
 * Fetches quotes for all holdings in the active portfolio.
 * Convenience wrapper around useQuotes that extracts symbols from holdings.
 * @returns React Query result with quotes for portfolio holdings
 */
export function usePortfolioQuotes() {
  const portfolio = useActivePortfolio();

  const symbols = portfolio?.holdings.map((h) => h.symbol) ?? [];

  return useQuotes(symbols);
}
