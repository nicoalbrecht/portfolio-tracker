"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchBulkQuotes } from "@/lib/api";
import { Quote } from "@/types";
import { useStore } from "@/stores";

export function useQuotes(symbols: string[]) {
  const sortedKey = [...symbols].sort().join(",");
  
  return useQuery<Record<string, Quote>>({
    queryKey: ["quotes", sortedKey],
    queryFn: () => fetchBulkQuotes(symbols),
    enabled: symbols.length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function usePortfolioQuotes() {
  const portfolio = useStore((state) => {
    const active = state.portfolios.find((p) => p.id === state.activePortfolioId);
    return active;
  });

  const symbols = portfolio?.holdings.map((h) => h.symbol) ?? [];

  return useQuotes(symbols);
}
