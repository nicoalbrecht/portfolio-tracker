import { useStore } from "@/stores";
import { useShallow } from "zustand/shallow";

export function useActivePortfolio() {
  const activePortfolioId = useStore((state) => state.activePortfolioId);
  const portfolio = useStore(
    useShallow((state) => {
      const p = state.portfolios.find((p) => p.id === activePortfolioId);
      if (!p) return undefined;
      return {
        id: p.id,
        name: p.name,
        currency: p.currency,
        createdAt: p.createdAt,
        holdings: p.holdings,
      };
    })
  );
  return portfolio;
}
